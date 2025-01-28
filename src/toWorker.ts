import { Reactable, ActionMap, Action } from "@reactables/core";
import { Observable, ReplaySubject, Subscription } from "rxjs";
import {
  ToWorkerActionMessage,
  InitMessage,
  SourceMessage,
  ToWorkerMessageTypes,
  FromWorkerMessageTypes,
  ActionsSchema,
} from "./models";

export const toWorker = <
  State,
  Actions,
  Dependencies extends { [key: string]: unknown } // Props, Dependencies, Sources
>(
  RxFactory: (deps: Dependencies) => Reactable<State, Actions>,
  workerDependencies?: { [key: string]: unknown }
): void => {
  let reactable: Reactable<State, Actions>;
  let subscription: Subscription;

  /**
   * Subject to listen for source actions from the client and emit it to
   * the Worker Reactable here
   */
  const sources$ = new ReplaySubject<Action<unknown>>(1);

  onmessage = (
    event: MessageEvent<ToWorkerActionMessage | InitMessage | SourceMessage>
  ) => {
    switch (event.data.type) {
      /**
       * Initialization
       */
      case ToWorkerMessageTypes.Init:
        reactable = RxFactory({
          ...workerDependencies,
          ...event.data.props,
          sources: [sources$.asObservable()],
        } as Dependencies & { sources: Observable<Action<unknown>>[] });

        const [state$, actions, actions$] = reactable;

        /**
         * Create an actions schema to broadcast to the client -
         * so they can create an ActionMap.
         *
         * We will recursively loop through the ActionMap and assign all
         * leaves null so it can be serialized and sent to client.
         */

        const actionsSchema: ActionsSchema = {};

        const assignNull = (source: ActionMap, dest: ActionsSchema) => {
          for (let key in source) {
            if (
              typeof source[key] === "object" &&
              typeof source[key] !== "function"
            ) {
              dest[key] = source[key];
              assignNull(source[key] as ActionMap, dest[key]);
            } else {
              dest[key] = null;
            }
          }
        };

        assignNull(actions as ActionMap, actionsSchema);

        postMessage({
          type: FromWorkerMessageTypes.Initialized,
          actionsSchema,
        });

        subscription = state$.subscribe((state) => {
          console.log(state, "off the thread");
          postMessage({
            type: FromWorkerMessageTypes.State,
            state,
          });
        });

        if (actions$) {
          subscription.add(
            actions$.subscribe((action) => {
              postMessage({
                type: FromWorkerMessageTypes.Action,
                action,
              });
            })
          );
        }

        break;
      /**
       * Handling Client Actions
       * - find the corresponding action and invoke it
       */
      case ToWorkerMessageTypes.Action:
        const { type, payload } = event.data.action;
        const splitKey = (type as string).split("~");

        let action: any = reactable[1];

        try {
          for (let i = 0; i < splitKey.length; i++) {
            action = action[splitKey[i]];
          }
        } catch {}

        if (!action) {
          throw "Action not found";
        }

        action(payload);
        break;
      case ToWorkerMessageTypes.Source:
        sources$.next(event.data.action);
        break;
      default:
    }
  };
};

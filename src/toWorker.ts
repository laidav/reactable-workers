import { Reactable, ActionMap } from "@reactables/core";
import { Subscription } from "rxjs";

export enum ToWorkerMessageTypes {
  Init = "Init",
  Action = "Action",
}

export enum FromWorkerMessageTypes {
  Initialized = "Initialized",
  State = "State",
  Action = "Action",
}

// To Worker Messages
interface InitMessage {
  type: ToWorkerMessageTypes.Init;
  props: { [key: string]: unknown };
}

interface ActionMessage<Actions> {
  type: ToWorkerMessageTypes.Action;
  action: { type: keyof Actions; payload: unknown };
}

export interface ActionsSchema {
  [key: string]: null | ActionsSchema;
}

export const toWorker = <
  State,
  Actions,
  Dependencies extends { [key: string]: unknown } // Props and Deps
>(
  RxFactory: (deps: Dependencies) => Reactable<State, Actions>,
  workerDependencies?: { [key: string]: unknown }
): void => {
  let reactable: Reactable<State, Actions>;
  let subscription: Subscription;

  onmessage = (event: MessageEvent<ActionMessage<Actions> | InitMessage>) => {
    switch (event.data.type) {
      case ToWorkerMessageTypes.Init:
        reactable = RxFactory({
          ...workerDependencies,
          ...event.data.props,
        } as Dependencies);

        const [state$, actions, actions$] = reactable;

        /**
         * Create an actions schema to broadcast to the client -
         * so they can create an ActionMap.
         *
         * We will recursively loop throuugh the ActionMap and assign all
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
      default:
    }
  };
};

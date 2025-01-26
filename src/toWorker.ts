import { Reactable } from "@reactables/core";
import { Subscription } from "rxjs";

export enum ToWorkerMessageTypes {
  Init = "Init",
  Action = "Action",
}

export enum FromWorkerMessageTypes {
  State = "State",
  Action = "Action",
}

interface InitMessage {
  type: ToWorkerMessageTypes.Init;
  props: { [key: string]: unknown };
}

interface ActionMessage<Actions> {
  type: ToWorkerMessageTypes.Action;
  action: { type: keyof Actions; payload: unknown };
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

        const [state$, , actions$] = reactable;

        subscription = state$.subscribe((state) => {
          console.log("off the thread");
          postMessage({ type: FromWorkerMessageTypes.State, state });
        });

        if (actions$) {
          subscription.add(
            actions$.subscribe((action) => {
              postMessage({ type: "action", action });
            })
          );
        }

        break;
      case ToWorkerMessageTypes.Action:
        const [, actions] = reactable;
        const { type, payload } = event.data.action;
        (actions[type] as (payload?: unknown) => void)(payload);
        break;
      default:
    }
  };
};

import { Reactable, ActionMap } from "@reactables/core";
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

type ActionFunc = (payload?: unknown) => void;

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
          console.log(state, "off the thread");
          postMessage({ type: FromWorkerMessageTypes.State, state });
        });

        if (actions$) {
          subscription.add(
            actions$.subscribe((action) => {
              postMessage({ type: FromWorkerMessageTypes.Action, action });
            })
          );
        }

        break;
      case ToWorkerMessageTypes.Action:
        const [, actions] = reactable;
        const { type, payload } = event.data.action;
        const splitKey = (type as string).split("~");

        let action: any = actions;

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

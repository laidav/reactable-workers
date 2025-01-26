import { fromEvent } from "rxjs";
import { map, filter } from "rxjs/operators";
import { Reactable, Action } from "@reactables/core";
import { FromWorkerMessageTypes, ToWorkerMessageTypes } from "./toWorker";

interface StateChangeMessage<State> {
  type: FromWorkerMessageTypes.State;
  state: State;
}

interface ActionMessage {
  type: FromWorkerMessageTypes.Action;
  action: Action<unknown>;
}

type FromWorkerMessage<T> = StateChangeMessage<T> | ActionMessage;

export const fromWorker = <State, Actions>(worker: Worker) => {
  const state$ = fromEvent(worker, "message").pipe(
    filter(
      (event) =>
        (event as MessageEvent<FromWorkerMessage<State>>).data.type ===
        FromWorkerMessageTypes.State
    ),
    map(
      (event) => (event as MessageEvent<StateChangeMessage<State>>).data.state
    )
  );
  const actions$ = fromEvent(worker, "message").pipe(
    filter(
      (event) =>
        (event as MessageEvent<FromWorkerMessage<State>>).data.type ===
        FromWorkerMessageTypes.Action
    ),
    map((event) => (event as MessageEvent<ActionMessage>).data.action)
  );

  const actions = {
    toggle: (payload?: unknown) => {
      worker.postMessage({
        type: ToWorkerMessageTypes.Action,
        action: { type: "toggle", payload },
      });
    },
  } as Actions;

  worker.postMessage({ type: ToWorkerMessageTypes.Init });

  return [state$, actions, actions$] as Reactable<State, Actions>;
};

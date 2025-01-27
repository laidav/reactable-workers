import { fromEvent } from "rxjs";
import { map, filter, tap } from "rxjs/operators";
import { Reactable, Action } from "@reactables/core";
import {
  FromWorkerMessageTypes,
  ToWorkerMessageTypes,
  ActionsSchema,
} from "./toWorker";

interface StateChangeMessage<State> {
  type: FromWorkerMessageTypes.State;
  state: State;
}

interface ActionMessage {
  type: FromWorkerMessageTypes.Action;
  action: Action<unknown>;
}

interface InitializedMessage {
  type: FromWorkerMessageTypes.Initialized;
  actionSchema: ActionsSchema;
}

type FromWorkerMessage<T> = StateChangeMessage<T> | ActionMessage;

export const fromWorker = <State, Actions>(worker: Worker) => {
  const actions = {} as Actions;

  const state$ = fromEvent(worker, "message").pipe(
    tap((event) => {
      /**
       * Once the Reactable and Worker is initialized, it will broadcast back
       * the ActionMap schema so we can create an ActionMap here on the client side
       */

      if (
        (event as MessageEvent<InitializedMessage>).data.type ===
        FromWorkerMessageTypes.Initialized
      ) {
        console.log((event as MessageEvent<InitializedMessage>).data);
      }
    }),
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

  worker.postMessage({ type: ToWorkerMessageTypes.Init });

  return [state$, actions, actions$] as Reactable<State, Actions>;
};

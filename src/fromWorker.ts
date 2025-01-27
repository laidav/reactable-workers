import { fromEvent } from "rxjs";
import { map, filter, tap } from "rxjs/operators";
import { Reactable, Action, ActionMap } from "@reactables/core";
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
  actionsSchema: ActionsSchema;
}

type FromWorkerMessage<T> = StateChangeMessage<T> | ActionMessage;

export const fromWorker = <State, Actions>(worker: Worker) => {
  const actions = {} as Actions;

  const state$ = fromEvent(worker, "message").pipe(
    tap((event) => {
      /**
       * Using tap here to set up an ActionMap for the client side Reactable
       * Once the Reactable on the worker side is initialized, it will broadcast back
       * the ActionMap schema so we can create an ActionMap here on the client side
       */

      if (
        (event as MessageEvent<InitializedMessage>).data.type ===
        FromWorkerMessageTypes.Initialized
      ) {
        const { actionsSchema } = (event as MessageEvent<InitializedMessage>)
          .data;

        const assignActions = (
          source: ActionsSchema,
          dest: any,
          stack: string[] = []
        ) => {
          /**
           * Recursively go through the ActionsSchema
           */
          for (let key in source) {
            if (typeof source[key] === "object" && source[key] !== null) {
              dest[key] = source[key] as any;
              assignActions(
                source[key] as ActionsSchema,
                dest[key] as unknown as ActionMap,
                stack.concat(key)
              );
            } else {
              /**
               * Assigning the action function to the ActionMap
               */
              dest[key] = (payload?: unknown) => {
                worker.postMessage({
                  type: ToWorkerMessageTypes.Action,
                  action: {
                    type: stack.concat(key).join("~"),
                    payload,
                  },
                });
              };
            }
          }
        };

        assignActions(actionsSchema, actions);
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

  /**
   * Rebroadcasting Actions that were processed in the reactable
   */
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

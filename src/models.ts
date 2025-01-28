import { Reactable, Action } from "@reactables/core";
import { Observable } from "rxjs";

export interface RxFactoryConfig<T = undefined> {
  deps?: Record<string, unknown>;
  props?: Record<string, unknown>;
  sources?: Observable<Action<unknown>>[];
  reducers?: Record<string, (state: T, action?: Action<unknown>) => T>;
}
export type ReactableFactory<State, Actions> = (
  config?: RxFactoryConfig<State>
) => Reactable<State, Actions>;
/**
 * MESSAGES TO THE WORKER
 */
export enum ToWorkerMessageTypes {
  Init = "Init",
  Action = "Action",
  Source = "Source",
}

export type ToWorkerMessage =
  | ToWorkerInitMessage
  | ToWorkerActionMessage
  | ToWorkerSourceMessage;

export interface ToWorkerInitMessage {
  type: ToWorkerMessageTypes.Init;
  props: { [key: string]: unknown };
}

export interface ToWorkerActionMessage {
  type: ToWorkerMessageTypes.Action;
  action: { type: string; payload: unknown };
}

export interface ToWorkerSourceMessage {
  type: ToWorkerMessageTypes.Source;
  action: { type: string; payload: unknown };
}

/**
 * MESSAGES FROM WORKER
 */
export enum FromWorkerMessageTypes {
  Initialized = "Initialized",
  State = "State",
  Action = "Action",
}

export interface StateChangeMessage<State> {
  type: FromWorkerMessageTypes.State;
  state: State;
}

export type FromWorkerMessage<T> =
  | StateChangeMessage<T>
  | FromWorkerActionMessage
  | InitializedMessage;

export interface FromWorkerActionMessage {
  type: FromWorkerMessageTypes.Action;
  action: { type: string; payload: unknown };
}
export interface InitializedMessage {
  type: FromWorkerMessageTypes.Initialized;
  actionsSchema: ActionsSchema;
}

export interface ActionsSchema {
  [key: string]: null | ActionsSchema;
}

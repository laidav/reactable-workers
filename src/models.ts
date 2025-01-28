/**
 * Messages to the worker
 */
export enum ToWorkerMessageTypes {
  Init = "Init",
  Action = "Action",
  Source = "Source",
}
export interface InitMessage {
  type: ToWorkerMessageTypes.Init;
  props: { [key: string]: unknown };
}

export interface ToWorkerActionMessage {
  type: ToWorkerMessageTypes.Action;
  action: { type: string; payload: unknown };
}

export interface SourceMessage {
  type: ToWorkerMessageTypes.Source;
  action: { type: string; payload: unknown };
}

/**
 * Messages from worker
 */
export interface StateChangeMessage<State> {
  type: FromWorkerMessageTypes.State;
  state: State;
}

export type FromWorkerMessage<T> =
  | StateChangeMessage<T>
  | FromWorkerActionMessage;

export enum FromWorkerMessageTypes {
  Initialized = "Initialized",
  State = "State",
  Action = "Action",
}

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

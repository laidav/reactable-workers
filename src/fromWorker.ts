import { fromEvent } from "rxjs";
import { map } from "rxjs/operators";
import { ToggleState, ToggleActions } from "./RxToggle.ts";
import { Reactable } from "@reactables/core";

export const fromWorker = (worker: Worker) => {
  const state$ = fromEvent(worker, "message").pipe(
    map((event) => (event as MessageEvent<ToggleState>).data)
  );

  const actions: ToggleActions = {
    toggle: (payload?) => {
      worker.postMessage({ type: "toggle", payload });
    },
  };

  return [state$, actions] as Reactable<ToggleState, ToggleActions>;
};

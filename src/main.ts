import "./style.css";
import { of } from "rxjs";
import { delay } from "rxjs/operators";
import { Action } from "@reactables/core";
import { fromWorker } from "./fromWorker.ts";
import { RxToggle, ToggleState, ToggleActions } from "./RxToggle.ts";
import { setupCounter } from "./counter.ts";
import { Observable } from "rxjs";

const USE_WORKER = true;

const [state$, actions, actions$] = USE_WORKER
  ? fromWorker<ToggleState, ToggleActions>(
      new Worker(
        new URL("./Rxtoggle.worker.ts", import.meta.url),

        { type: "module" }
      ),
      {
        sources: [of({ type: "toggle" })],
      }
    )
  : RxToggle({ sources: [] });

state$.subscribe((state) => {
  document.querySelector<HTMLButtonElement>(
    "#toggle"
  )!.innerHTML = `Toggle is: ${state ? "on" : "off"}`;
});

(actions$ as Observable<Action<unknown>>).subscribe((action) => {
  console.log(action);
});

document
  .getElementById("toggle")
  ?.addEventListener("click", () => actions.toggle());

setupCounter(document.getElementById("counter") as HTMLButtonElement);

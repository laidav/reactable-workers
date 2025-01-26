import "./style.css";
import { Action } from "@reactables/core";
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { fromWorker } from "./fromWorker.ts";
import { RxToggle } from "./RxToggle.ts";
import { setupCounter } from "./counter.ts";
import { Observable } from "rxjs";

const USE_WORKER = true;

const [state$, actions, actions$] = USE_WORKER
  ? fromWorker(
      new Worker(
        new URL("./Rxtoggle.worker.ts", import.meta.url),

        { type: "module" }
      )
    )
  : RxToggle();

state$.subscribe((state) => {
  console.log(state);
});

(actions$ as Observable<Action<unknown>>).subscribe((action) => {
  console.log(action);
});

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://www.typescriptlang.org/" target="_blank">
      <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <h1>Vite + TypeScript</h1>
    <div class="card">
      <button id="toggle" type="button">Toggle</button>
    </div>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite and TypeScript logos to learn more
    </p>
  </div>
`;

document
  .getElementById("toggle")
  ?.addEventListener("click", () => actions.toggle());

setupCounter(document.getElementById("counter") as HTMLButtonElement);

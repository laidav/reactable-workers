import { RxToggle, ToggleState, ToggleActions } from "./RxToggle.ts";
// create a Reactable
export const [state$, actions] = RxToggle();

onmessage = (
  event: MessageEvent<{
    type: keyof ToggleActions;
    payload: ToggleState | undefined;
  }>
) => {
  const { type, payload } = event.data;

  actions[type](payload);
};

state$.subscribe((state) => {
  console.log("off the thread");
  postMessage(state);
});

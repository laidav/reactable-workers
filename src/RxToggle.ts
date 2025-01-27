import { Reactable, RxBuilder, Action } from "@reactables/core";
import { Observable } from "rxjs";
export type ToggleState = boolean;
export type ToggleActions = { toggle: (value?: boolean) => void };

export const RxToggle = ({
  sources,
}: {
  sources: Observable<Action<unknown>>[];
}): Reactable<ToggleState, ToggleActions> =>
  RxBuilder({
    initialState: false,
    sources,
    reducers: {
      toggle: (state, { payload }) =>
        payload === undefined ? !state : (payload as boolean),
    },
  });

import { RxBuilder } from "@reactables/core";
import { ReactableFactory } from "./models";
export type ToggleState = boolean;
export type ToggleActions = { toggle: (value?: boolean) => void };

export const RxToggle: ReactableFactory<ToggleState, ToggleActions> = (
  config
) =>
  RxBuilder({
    initialState: false,
    sources: config?.sources || [],
    reducers: {
      toggle: (state, { payload }) =>
        payload === undefined ? !state : (payload as boolean),
      ...config?.reducers,
    },
  });

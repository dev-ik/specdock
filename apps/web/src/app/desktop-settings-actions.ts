import type { DesktopRuntimeSettings, RequestState } from "@specdock/core";
import {
  desktopSettingsStorageKey,
  updateDesktopRuntimeSettings,
  withDefaultDesktopSettings
} from "./desktop-settings.js";
import { writeLocalJson } from "./local-storage.js";
import type { useSpecDockState } from "./useSpecDockState.js";

type State = ReturnType<typeof useSpecDockState>;

export const createDesktopSettingsActions = (state: State) => ({
  updateDefaultRequestMode: (mode: RequestState["requestMode"]) => {
    state.setDefaultRequestMode(mode);
    state.setRequestStates((current) => syncRequestMode(current, mode));
    state.storageAdapter.saveSettings({
      ...state.storageAdapter.getSettings(),
      defaultRequestMode: mode
    });
    state.setStatus(`Default request mode set to ${mode}`);
  },
  updateDesktopSettings: async (patch: Partial<DesktopRuntimeSettings>) => {
    const nextSettings = withDefaultDesktopSettings(state.desktopSettings, patch);

    state.setDesktopSettings(nextSettings);
    writeLocalJson(desktopSettingsStorageKey, nextSettings);
    try {
      const saved = await updateDesktopRuntimeSettings(nextSettings);

      state.setDesktopSettings(saved);
      writeLocalJson(desktopSettingsStorageKey, saved);
      await state.reloadAppConfig();
      state.setMockServerState({});
      state.setStatus("Desktop settings updated");
    } catch (error) {
      state.setStatus(
        error instanceof Error
          ? error.message
          : "Unable to update desktop settings."
      );
    }
  }
});

const syncRequestMode = (
  states: Record<string, RequestState>,
  requestMode: RequestState["requestMode"]
): Record<string, RequestState> =>
  Object.fromEntries(
    Object.entries(states).map(([key, value]) => [
      key,
      { ...value, requestMode }
    ])
  );

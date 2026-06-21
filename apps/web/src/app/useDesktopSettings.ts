import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { LIMITS, type DesktopRuntimeSettings } from "@specdock/core";
import {
  desktopSettingsStorageKey,
  isDesktopApp,
  readDesktopRuntimeSettings,
  updateDesktopRuntimeSettings
} from "./desktop-settings.js";
import { readLocalJson, writeLocalJson } from "./local-storage.js";

export const useDesktopSettings = (
  reloadAppConfig: () => Promise<unknown>
): {
  desktopSettings: DesktopRuntimeSettings;
  setDesktopSettings: Dispatch<SetStateAction<DesktopRuntimeSettings>>;
  desktopSettingsAvailable: boolean;
} => {
  const [desktopSettings, setDesktopSettings] = useState<DesktopRuntimeSettings>(() =>
    readLocalJson(desktopSettingsStorageKey, defaultDesktopSettings)
  );
  const [desktopSettingsAvailable, setDesktopSettingsAvailable] = useState(false);

  useEffect(() => {
    if (!isDesktopApp()) return;

    setDesktopSettingsAvailable(true);
    void updateDesktopRuntimeSettings(desktopSettings)
      .then((settings) => {
        setDesktopSettings((current) =>
          sameDesktopSettings(current, settings) ? current : settings
        );
        writeLocalJson(desktopSettingsStorageKey, settings);
        return reloadAppConfig();
      })
      .catch(() => {
        void readDesktopRuntimeSettings()
          .then((settings) => {
            setDesktopSettings((current) =>
              sameDesktopSettings(current, settings) ? current : settings
            );
            writeLocalJson(desktopSettingsStorageKey, settings);
          })
          .then(() => reloadAppConfig());
      });
  }, [desktopSettings, reloadAppConfig]);

  return {
    desktopSettings,
    setDesktopSettings,
    desktopSettingsAvailable
  };
};

const sameDesktopSettings = (
  left: DesktopRuntimeSettings,
  right: DesktopRuntimeSettings
): boolean =>
  left.mockServerEnabled === right.mockServerEnabled &&
  left.mockMaxResponseBytes === right.mockMaxResponseBytes &&
  left.proxyAllowPrivateTargets === right.proxyAllowPrivateTargets &&
  left.proxyAllowedHosts === right.proxyAllowedHosts &&
  left.proxyEnabled === right.proxyEnabled &&
  left.proxyMaxResponseBytes === right.proxyMaxResponseBytes &&
  left.proxyTimeoutMs === right.proxyTimeoutMs;

const defaultDesktopSettings: DesktopRuntimeSettings = {
  mockMaxResponseBytes: LIMITS.maxProxyResponseBodyBytes,
  mockServerEnabled: false,
  proxyAllowPrivateTargets: false,
  proxyAllowedHosts: "",
  proxyEnabled: false,
  proxyMaxResponseBytes: LIMITS.maxProxyResponseBodyBytes,
  proxyTimeoutMs: LIMITS.proxyTimeoutMs
};

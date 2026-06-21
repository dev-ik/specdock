import type {
  AppConfigResponse,
  DesktopRuntimeSettings,
  DesktopRuntimeSettingsPatch
} from "@specdock/core";
import { LIMITS } from "@specdock/core";
import { fetchAppConfig } from "./deployment-policy.js";

export const desktopSettingsStorageKey = "specdock:desktop:settings";

export const isDesktopApp = (): boolean =>
  typeof window !== "undefined" && Boolean(window.specdockDesktop);

export const readDesktopRuntimeSettings = async (): Promise<DesktopRuntimeSettings> => {
  const response = await fetch("/api/desktop/settings");

  if (!response.ok) {
    throw new Error("Unable to load desktop settings.");
  }

  return (await response.json()) as DesktopRuntimeSettings;
};

export const updateDesktopRuntimeSettings = async (
  patch: DesktopRuntimeSettingsPatch
): Promise<DesktopRuntimeSettings> => {
  const response = await fetch("/api/desktop/settings", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch)
  });

  if (!response.ok) {
    throw new Error("Unable to update desktop settings.");
  }

  return (await response.json()) as DesktopRuntimeSettings;
};

export const refreshAppConfig = async (): Promise<AppConfigResponse> =>
  fetchAppConfig();

export const withDefaultDesktopSettings = (
  current: DesktopRuntimeSettings,
  patch: DesktopRuntimeSettingsPatch
): DesktopRuntimeSettings => ({
  mockMaxResponseBytes:
    patch.mockMaxResponseBytes ??
    current.mockMaxResponseBytes ??
    LIMITS.maxProxyResponseBodyBytes,
  mockServerEnabled: patch.mockServerEnabled ?? current.mockServerEnabled ?? false,
  proxyAllowPrivateTargets:
    patch.proxyAllowPrivateTargets ?? current.proxyAllowPrivateTargets ?? false,
  proxyAllowedHosts: patch.proxyAllowedHosts ?? current.proxyAllowedHosts ?? "",
  proxyEnabled: patch.proxyEnabled ?? current.proxyEnabled ?? false,
  proxyMaxResponseBytes:
    patch.proxyMaxResponseBytes ??
    current.proxyMaxResponseBytes ??
    LIMITS.maxProxyResponseBodyBytes,
  proxyTimeoutMs:
    patch.proxyTimeoutMs ?? current.proxyTimeoutMs ?? LIMITS.proxyTimeoutMs
});

import { APP_VERSION, type AppConfigResponse, type RequestState } from "@specdock/core";

export const defaultAppConfig: AppConfigResponse = {
  version: APP_VERSION,
  publicDemo: false,
  directRequest: {
    restricted: false,
    allowedHosts: []
  }
};

export const fetchAppConfig = async (): Promise<AppConfigResponse> => {
  const response = await fetch("/api/config");

  if (!response.ok) {
    throw new Error("Unable to load deployment policy.");
  }

  return (await response.json()) as AppConfigResponse;
};

export const directRequestBlockReason = (
  config: AppConfigResponse,
  requestMode: RequestState["requestMode"] | undefined,
  targetUrl: string | undefined
): string | undefined => {
  if (requestMode !== "direct" || !config.directRequest.restricted) {
    return undefined;
  }

  const hostname = targetHostname(targetUrl);

  if (hostname && config.directRequest.allowedHosts.includes(hostname)) {
    return undefined;
  }

  return "Request execution is limited in the public demo. Run SpecDock locally to test custom APIs.";
};

const targetHostname = (targetUrl: string | undefined): string | undefined => {
  if (!targetUrl) return undefined;

  try {
    return new URL(targetUrl).hostname.toLowerCase();
  } catch {
    return undefined;
  }
};

import { useCallback, useEffect, useState } from "react";
import type { AppConfigResponse } from "@specdock/core";
import { defaultAppConfig, fetchAppConfig } from "./deployment-policy.js";

export const useAppConfig = (): {
  appConfig: AppConfigResponse;
  reloadAppConfig: () => Promise<AppConfigResponse>;
} => {
  const [appConfig, setAppConfig] = useState<AppConfigResponse>(defaultAppConfig);
  const reloadAppConfig = useCallback(async (): Promise<AppConfigResponse> => {
    try {
      const nextConfig = await fetchAppConfig();

      setAppConfig(nextConfig);
      return nextConfig;
    } catch {
      setAppConfig(defaultAppConfig);
      return defaultAppConfig;
    }
  }, []);

  useEffect(() => {
    void reloadAppConfig();
  }, [reloadAppConfig]);

  return { appConfig, reloadAppConfig };
};

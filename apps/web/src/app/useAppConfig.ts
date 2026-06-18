import { useEffect, useState } from "react";
import type { AppConfigResponse } from "@specdock/core";
import { defaultAppConfig, fetchAppConfig } from "./deployment-policy.js";

export const useAppConfig = (): AppConfigResponse => {
  const [appConfig, setAppConfig] = useState<AppConfigResponse>(defaultAppConfig);

  useEffect(() => {
    void fetchAppConfig()
      .then(setAppConfig)
      .catch(() => setAppConfig(defaultAppConfig));
  }, []);

  return appConfig;
};

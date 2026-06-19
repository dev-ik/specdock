import { APP_VERSION, type AppConfigResponse } from "@specdock/core";
import { resolveMockServerConfig } from "./mock-config.js";

const defaultDemoDirectAllowedHosts = [
  "dummyjson.com",
  "petstore3.swagger.io",
  "httpbin.org"
];

export const resolveAppConfigResponse = (
  env: NodeJS.ProcessEnv = process.env
): AppConfigResponse => {
  const publicDemo = env.PUBLIC_DEMO === "true";

  const mockConfig = resolveMockServerConfig(env);

  return {
    version: APP_VERSION,
    publicDemo,
    directRequest: {
      restricted: publicDemo,
      allowedHosts: publicDemo
        ? parseAllowedHosts(env.DEMO_DIRECT_ALLOWED_HOSTS) ??
          defaultDemoDirectAllowedHosts
        : []
    },
    mockServer: {
      enabled: mockConfig.enabled
    }
  };
};

const parseAllowedHosts = (value: string | undefined): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }

  return value
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
};

import type { AppConfigResponse } from "@specdock/core";

const defaultDemoDirectAllowedHosts = [
  "dummyjson.com",
  "petstore3.swagger.io",
  "httpbin.org"
];

export const resolveAppConfigResponse = (
  env: NodeJS.ProcessEnv = process.env
): AppConfigResponse => {
  const publicDemo = env.PUBLIC_DEMO === "true";

  return {
    publicDemo,
    directRequest: {
      restricted: publicDemo,
      allowedHosts: publicDemo
        ? parseAllowedHosts(env.DEMO_DIRECT_ALLOWED_HOSTS) ??
          defaultDemoDirectAllowedHosts
        : []
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

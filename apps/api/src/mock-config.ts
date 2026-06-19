import { LIMITS } from "@specdock/core";

export type MockServerConfig = {
  enabled: boolean;
  maxResponseBodyBytes: number;
};

export const resolveMockServerConfig = (
  env: NodeJS.ProcessEnv = process.env
): MockServerConfig => ({
  enabled: env.MOCK_SERVER_ENABLED === "true" && env.PUBLIC_DEMO !== "true",
  maxResponseBodyBytes: readLimitedInteger(
    env.MOCK_MAX_RESPONSE_BYTES,
    LIMITS.maxProxyResponseBodyBytes
  )
});

const readLimitedInteger = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, fallback);
};

import { LIMITS } from "@specdock/core";

export type ProxyConfig = {
  enabled: boolean;
  allowedHosts: string[];
  allowPrivateTargets: boolean;
  timeoutMs: number;
  maxRequestBodyBytes: number;
  maxResponseBodyBytes: number;
};

export const resolveProxyConfig = (env: NodeJS.ProcessEnv = process.env): ProxyConfig => {
  return {
    enabled: env.PROXY_ENABLED === "true",
    allowedHosts: parseAllowedHosts(env.PROXY_ALLOWED_HOSTS),
    allowPrivateTargets: env.PROXY_ALLOW_PRIVATE_TARGETS === "true",
    timeoutMs: readLimitedInteger(env.PROXY_TIMEOUT_MS, LIMITS.proxyTimeoutMs),
    maxRequestBodyBytes: readLimitedInteger(
      env.PROXY_MAX_REQUEST_BYTES,
      LIMITS.maxProxyRequestBodyBytes
    ),
    maxResponseBodyBytes: readLimitedInteger(
      env.PROXY_MAX_RESPONSE_BYTES,
      LIMITS.maxProxyResponseBodyBytes
    )
  };
};

const parseAllowedHosts = (value: string | undefined): string[] => {
  return (value ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
};

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

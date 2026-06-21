import type { FastifyInstance } from "fastify";
import {
  LIMITS,
  type DesktopRuntimeSettings,
  type DesktopRuntimeSettingsPatch
} from "@specdock/core";

export const desktopRuntimeDefaults = {
  mockMaxResponseBytes: LIMITS.maxProxyResponseBodyBytes,
  proxyMaxResponseBytes: LIMITS.maxProxyResponseBodyBytes,
  proxyTimeoutMs: LIMITS.proxyTimeoutMs
} as const;

export function createDesktopRuntimeEnv(): NodeJS.ProcessEnv {
  return {
    MOCK_MAX_RESPONSE_BYTES: String(desktopRuntimeDefaults.mockMaxResponseBytes),
    MOCK_SERVER_ENABLED: "false",
    PROXY_ALLOWED_HOSTS: "",
    PROXY_ALLOW_PRIVATE_TARGETS: "false",
    PROXY_ENABLED: "false",
    PROXY_MAX_REQUEST_BYTES: String(LIMITS.maxProxyRequestBodyBytes),
    PROXY_MAX_RESPONSE_BYTES: String(desktopRuntimeDefaults.proxyMaxResponseBytes),
    PROXY_TIMEOUT_MS: String(desktopRuntimeDefaults.proxyTimeoutMs)
  };
}

export function applyDesktopRuntimeEnv(env: NodeJS.ProcessEnv): void {
  process.env.MOCK_MAX_RESPONSE_BYTES = env.MOCK_MAX_RESPONSE_BYTES;
  process.env.MOCK_SERVER_ENABLED = env.MOCK_SERVER_ENABLED;
  process.env.PROXY_ALLOWED_HOSTS = env.PROXY_ALLOWED_HOSTS;
  process.env.PROXY_ALLOW_PRIVATE_TARGETS = env.PROXY_ALLOW_PRIVATE_TARGETS;
  process.env.PROXY_ENABLED = env.PROXY_ENABLED;
  process.env.PROXY_MAX_REQUEST_BYTES = env.PROXY_MAX_REQUEST_BYTES;
  process.env.PROXY_MAX_RESPONSE_BYTES = env.PROXY_MAX_RESPONSE_BYTES;
  process.env.PROXY_TIMEOUT_MS = env.PROXY_TIMEOUT_MS;
}

export function registerDesktopSettingsRoutes(server: FastifyInstance): void {
  server.get("/api/desktop/settings", async (): Promise<DesktopRuntimeSettings> =>
    readDesktopRuntimeSettings()
  );

  server.patch<{ Body: DesktopRuntimeSettingsPatch }>(
    "/api/desktop/settings",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            mockMaxResponseBytes: maxBytesSchema,
            mockServerEnabled: { type: "boolean" },
            proxyAllowPrivateTargets: { type: "boolean" },
            proxyAllowedHosts: { type: "string", maxLength: 2000 },
            proxyEnabled: { type: "boolean" },
            proxyMaxResponseBytes: maxBytesSchema,
            proxyTimeoutMs: {
              type: "integer",
              minimum: 1,
              maximum: LIMITS.proxyTimeoutMs
            }
          }
        }
      }
    },
    async (request): Promise<DesktopRuntimeSettings> => {
      applyDesktopSettingsPatch(request.body);
      return readDesktopRuntimeSettings();
    }
  );
}

function readDesktopRuntimeSettings(): DesktopRuntimeSettings {
  return {
    mockMaxResponseBytes: readLimitedInteger(
      process.env.MOCK_MAX_RESPONSE_BYTES,
      desktopRuntimeDefaults.mockMaxResponseBytes
    ),
    mockServerEnabled: process.env.MOCK_SERVER_ENABLED === "true",
    proxyAllowPrivateTargets: process.env.PROXY_ALLOW_PRIVATE_TARGETS === "true",
    proxyAllowedHosts: process.env.PROXY_ALLOWED_HOSTS ?? "",
    proxyEnabled: process.env.PROXY_ENABLED === "true",
    proxyMaxResponseBytes: readLimitedInteger(
      process.env.PROXY_MAX_RESPONSE_BYTES,
      desktopRuntimeDefaults.proxyMaxResponseBytes
    ),
    proxyTimeoutMs: readLimitedInteger(
      process.env.PROXY_TIMEOUT_MS,
      desktopRuntimeDefaults.proxyTimeoutMs
    )
  };
}

function applyDesktopSettingsPatch(patch: DesktopRuntimeSettingsPatch): void {
  if (typeof patch.mockMaxResponseBytes === "number") {
    process.env.MOCK_MAX_RESPONSE_BYTES = String(
      readLimitedInteger(String(patch.mockMaxResponseBytes), desktopRuntimeDefaults.mockMaxResponseBytes)
    );
  }
  if (typeof patch.mockServerEnabled === "boolean") {
    process.env.MOCK_SERVER_ENABLED = patch.mockServerEnabled ? "true" : "false";
  }
  if (typeof patch.proxyEnabled === "boolean") {
    process.env.PROXY_ENABLED = patch.proxyEnabled ? "true" : "false";
  }
  if (typeof patch.proxyAllowedHosts === "string") {
    process.env.PROXY_ALLOWED_HOSTS = sanitizeAllowedHosts(patch.proxyAllowedHosts);
  }
  if (typeof patch.proxyAllowPrivateTargets === "boolean") {
    process.env.PROXY_ALLOW_PRIVATE_TARGETS = patch.proxyAllowPrivateTargets ? "true" : "false";
  }
  if (typeof patch.proxyMaxResponseBytes === "number") {
    process.env.PROXY_MAX_RESPONSE_BYTES = String(
      readLimitedInteger(String(patch.proxyMaxResponseBytes), desktopRuntimeDefaults.proxyMaxResponseBytes)
    );
  }
  if (typeof patch.proxyTimeoutMs === "number") {
    process.env.PROXY_TIMEOUT_MS = String(
      readLimitedInteger(String(patch.proxyTimeoutMs), desktopRuntimeDefaults.proxyTimeoutMs)
    );
  }
}

function sanitizeAllowedHosts(value: string): string {
  return value
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean)
    .join(",");
}

function readLimitedInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return fallback;

  return Math.min(parsed, fallback);
}

const maxBytesSchema = {
  type: "integer",
  minimum: 1,
  maximum: LIMITS.maxProxyResponseBodyBytes
} as const;

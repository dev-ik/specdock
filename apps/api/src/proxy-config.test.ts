import { describe, expect, it } from "vitest";
import { LIMITS } from "@specdock/core";
import { resolveProxyConfig } from "./proxy-config.js";

describe("resolveProxyConfig", () => {
  it("reads proxy settings from env", () => {
    const config = resolveProxyConfig({
      PROXY_ENABLED: "true",
      PROXY_ALLOWED_HOSTS: "api.example.com, staging.example.com ",
      PROXY_ALLOW_PRIVATE_TARGETS: "true",
      PROXY_TIMEOUT_MS: "250",
      PROXY_MAX_REQUEST_BYTES: "512",
      PROXY_MAX_RESPONSE_BYTES: "1024"
    });

    expect(config).toEqual({
      enabled: true,
      allowedHosts: ["api.example.com", "staging.example.com"],
      allowPrivateTargets: true,
      timeoutMs: 250,
      maxRequestBodyBytes: 512,
      maxResponseBodyBytes: 1024
    });
  });

  it("falls back and caps values at safe limits", () => {
    const config = resolveProxyConfig({
      PROXY_TIMEOUT_MS: "999999",
      PROXY_MAX_REQUEST_BYTES: "999999999",
      PROXY_MAX_RESPONSE_BYTES: "not-a-number"
    });

    expect(config.timeoutMs).toBe(LIMITS.proxyTimeoutMs);
    expect(config.maxRequestBodyBytes).toBe(LIMITS.maxProxyRequestBodyBytes);
    expect(config.maxResponseBodyBytes).toBe(LIMITS.maxProxyResponseBodyBytes);
  });
});

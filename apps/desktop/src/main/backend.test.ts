import { LIMITS } from "@specdock/core";
import { describe, expect, it } from "vitest";
import { buildApp } from "../../../api/src/app.js";
import {
  createDesktopApiEnv,
  DESKTOP_API_HOST,
  formatDesktopApiBaseUrl,
  registerDesktopSettingsRoutes
} from "./backend.js";

describe("desktop backend", () => {
  it("forces the embedded local API to use loopback with proxy features disabled", () => {
    const env = createDesktopApiEnv(
      {
        APP_IP: "0.0.0.0",
        PROXY_ENABLED: "true",
        MOCK_SERVER_ENABLED: "true",
        TRUST_PROXY: "1"
      },
      43125,
      "/tmp/specdock-web-dist"
    );

    expect(env.APP_IP).toBe(DESKTOP_API_HOST);
    expect(env.HOST).toBe(DESKTOP_API_HOST);
    expect(env.APP_PORT).toBe("43125");
    expect(env.PORT).toBe("43125");
    expect(env.PROXY_ENABLED).toBe("false");
    expect(env.PROXY_ALLOWED_HOSTS).toBe("");
    expect(env.PROXY_ALLOW_PRIVATE_TARGETS).toBe("false");
    expect(env.PROXY_MAX_REQUEST_BYTES).toBe(String(LIMITS.maxProxyRequestBodyBytes));
    expect(env.PROXY_MAX_RESPONSE_BYTES).toBe(String(LIMITS.maxProxyResponseBodyBytes));
    expect(env.PROXY_TIMEOUT_MS).toBe(String(LIMITS.proxyTimeoutMs));
    expect(env.MOCK_MAX_RESPONSE_BYTES).toBe(String(LIMITS.maxProxyResponseBodyBytes));
    expect(env.MOCK_SERVER_ENABLED).toBe("false");
    expect(env.TRUST_PROXY).toBe("false");
    expect(env.WEB_DIST_DIR).toBe("/tmp/specdock-web-dist");
  });

  it("formats a loopback-only API base URL", () => {
    expect(formatDesktopApiBaseUrl(43126)).toBe("http://127.0.0.1:43126");
  });

  it("updates desktop mock server settings at runtime", async () => {
    process.env.MOCK_MAX_RESPONSE_BYTES = String(LIMITS.maxProxyResponseBodyBytes);
    process.env.MOCK_SERVER_ENABLED = "false";
    process.env.PROXY_ENABLED = "false";
    process.env.PROXY_ALLOWED_HOSTS = "";
    process.env.PROXY_ALLOW_PRIVATE_TARGETS = "false";
    process.env.PROXY_MAX_RESPONSE_BYTES = String(LIMITS.maxProxyResponseBodyBytes);
    process.env.PROXY_TIMEOUT_MS = String(LIMITS.proxyTimeoutMs);
    const app = buildApp({
      logger: false,
      mockRoutesMode: "runtime",
      webDistDir: null
    });
    registerDesktopSettingsRoutes(app);

    try {
      const initialSettings = await app.inject("/api/desktop/settings");
      const initialConfig = await app.inject("/api/config");
      const updatedSettings = await app.inject({
        url: "/api/desktop/settings",
        method: "PATCH",
        payload: {
          mockServerEnabled: true,
          mockMaxResponseBytes: 2048,
          proxyAllowPrivateTargets: true,
          proxyAllowedHosts: " Example.COM, api.example.com ",
          proxyEnabled: true,
          proxyMaxResponseBytes: 4096,
          proxyTimeoutMs: 750
        }
      });
      const updatedConfig = await app.inject("/api/config");

      expect(initialSettings.json()).toEqual({
        mockMaxResponseBytes: LIMITS.maxProxyResponseBodyBytes,
        mockServerEnabled: false,
        proxyAllowPrivateTargets: false,
        proxyAllowedHosts: "",
        proxyEnabled: false,
        proxyMaxResponseBytes: LIMITS.maxProxyResponseBodyBytes,
        proxyTimeoutMs: LIMITS.proxyTimeoutMs
      });
      expect(initialConfig.json()).toMatchObject({ mockServer: { enabled: false } });
      expect(updatedSettings.json()).toEqual({
        mockMaxResponseBytes: 2048,
        mockServerEnabled: true,
        proxyAllowPrivateTargets: true,
        proxyAllowedHosts: "example.com,api.example.com",
        proxyEnabled: true,
        proxyMaxResponseBytes: 4096,
        proxyTimeoutMs: 750
      });
      expect(updatedConfig.json()).toMatchObject({ mockServer: { enabled: true } });
      expect(process.env.MOCK_MAX_RESPONSE_BYTES).toBe("2048");
      expect(process.env.PROXY_ENABLED).toBe("true");
      expect(process.env.PROXY_ALLOWED_HOSTS).toBe("example.com,api.example.com");
      expect(process.env.PROXY_ALLOW_PRIVATE_TARGETS).toBe("true");
      expect(process.env.PROXY_MAX_RESPONSE_BYTES).toBe("4096");
      expect(process.env.PROXY_TIMEOUT_MS).toBe("750");
    } finally {
      process.env.MOCK_MAX_RESPONSE_BYTES = String(LIMITS.maxProxyResponseBodyBytes);
      process.env.MOCK_SERVER_ENABLED = "false";
      process.env.PROXY_ENABLED = "false";
      process.env.PROXY_ALLOWED_HOSTS = "";
      process.env.PROXY_ALLOW_PRIVATE_TARGETS = "false";
      process.env.PROXY_MAX_RESPONSE_BYTES = String(LIMITS.maxProxyResponseBodyBytes);
      process.env.PROXY_TIMEOUT_MS = String(LIMITS.proxyTimeoutMs);
      await app.close();
    }
  });
});

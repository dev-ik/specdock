import { describe, expect, it } from "vitest";
import {
  createDesktopApiEnv,
  DESKTOP_API_HOST,
  formatDesktopApiBaseUrl
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
    expect(env.MOCK_SERVER_ENABLED).toBe("false");
    expect(env.TRUST_PROXY).toBe("false");
    expect(env.WEB_DIST_DIR).toBe("/tmp/specdock-web-dist");
  });

  it("formats a loopback-only API base URL", () => {
    expect(formatDesktopApiBaseUrl(43126)).toBe("http://127.0.0.1:43126");
  });
});

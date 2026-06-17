import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "./app.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy response limits", () => {
  it("rejects oversized response content-length before reading the body", async () => {
    vi.stubEnv("PROXY_ENABLED", "true");
    vi.stubEnv("PROXY_ALLOWED_HOSTS", "93.184.216.34");
    vi.stubEnv("PROXY_MAX_RESPONSE_BYTES", "4");

    const app = buildApp({
      fetchImplementation: async () =>
        new Response(null, { headers: { "content-length": "5" } }),
      logger: false,
      webDistDir: null
    });

    try {
      const response = await app.inject({
        method: "POST",
        url: "/api/proxy/request",
        payload: {
          method: "GET",
          url: "https://93.184.216.34/users"
        }
      });

      expect(response.statusCode).toBe(413);
      expect(response.json()).toMatchObject({
        error: { code: "RESPONSE_TOO_LARGE" }
      });
    } finally {
      await app.close();
    }
  });
});

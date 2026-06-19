import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "./app.js";

const tempDirs: string[] = [];

afterEach(() => {
  vi.unstubAllEnvs();
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("app", () => {
  it("serves static app shell with security headers", async () => {
    const webDistDir = mkdtempSync(join(tmpdir(), "specdock-web-"));
    tempDirs.push(webDistDir);
    writeFileSync(
      join(webDistDir, "index.html"),
      "<!doctype html><html></html>"
    );
    const app = buildApp({ logger: false, webDistDir });

    try {
      const response = await app.inject({ method: "GET", url: "/" });

      expect(response.statusCode).toBe(200);
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
      expect(response.headers["content-security-policy"]).toContain(
        "script-src 'self'"
      );
    } finally {
      await app.close();
    }
  });

  it("serves public demo request execution policy", async () => {
    vi.stubEnv("PUBLIC_DEMO", "true");
    vi.stubEnv("DEMO_DIRECT_ALLOWED_HOSTS", "dummyjson.com,httpbin.org");
    const app = buildApp({ logger: false, webDistDir: null });

    try {
      const response = await app.inject({ method: "GET", url: "/api/config" });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({
        version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
        publicDemo: true,
        directRequest: {
          restricted: true,
          allowedHosts: ["dummyjson.com", "httpbin.org"]
        },
        mockServer: {
          enabled: false
        }
      });
    } finally {
      await app.close();
    }
  });

  it("does not serve disabled mock paths from the app shell", async () => {
    const webDistDir = mkdtempSync(join(tmpdir(), "specdock-web-"));
    tempDirs.push(webDistDir);
    writeFileSync(
      join(webDistDir, "index.html"),
      "<!doctype html><html></html>"
    );
    const app = buildApp({ logger: false, webDistDir });

    try {
      const response = await app.inject({ method: "GET", url: "/mock/users/1" });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Route not found."
        }
      });
    } finally {
      await app.close();
    }
  });
});

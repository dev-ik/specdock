import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

const tempDirs: string[] = [];

afterEach(() => {
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
});

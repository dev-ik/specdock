import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseGenerateCliArgs, runGenerateCli } from "./generate.js";

const spec = JSON.stringify({
  openapi: "3.1.0",
  info: { title: "CLI API", version: "1.0.0" },
  paths: {
    "/users": {
      get: {
        operationId: "listUsers",
        responses: { "200": { description: "OK" } }
      }
    }
  }
});

describe("sdk generate CLI", () => {
  it("parses generation options", () => {
    expect(parseGenerateCliArgs([
      "--input", "openapi.json",
      "--out", "sdk",
      "--language", "python",
      "--plan"
    ])).toMatchObject({
      inputPath: "openapi.json",
      outputPath: "sdk",
      planOnly: true,
      generateOptions: { language: "python", outputPath: "sdk" }
    });
  });

  it("writes generated files under the selected output root", () => {
    const cwd = mkdtempSync(path.join(tmpdir(), "specdock-generate-"));
    try {
      writeFileSync(path.join(cwd, "openapi.json"), spec);
      let output = "";

      runGenerateCli(["--input", "openapi.json", "--out", "sdk"], {
        cwd,
        stdout: { write: (value) => { output += value; } }
      });

      expect(JSON.parse(output)).toMatchObject({ outputRoot: "sdk", fileCount: 5 });
      expect(readFileSync(path.join(cwd, "sdk/client.ts"), "utf8")).toContain("listUsers");
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("prints a plan without writing files", () => {
    const cwd = mkdtempSync(path.join(tmpdir(), "specdock-generate-"));
    try {
      writeFileSync(path.join(cwd, "openapi.json"), spec);
      let output = "";

      runGenerateCli(["--input", "openapi.json", "--out", "sdk", "--plan"], {
        cwd,
        stdout: { write: (value) => { output += value; } }
      });

      expect(JSON.parse(output)).toMatchObject({ outputRoot: "sdk" });
      expect(() => readFileSync(path.join(cwd, "sdk/client.ts"), "utf8")).toThrow();
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});

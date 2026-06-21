import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { writeSdkOutputDirectory } from "./sdk-output.js";

const generatedFiles = [
  { path: "sdk/client.ts", content: "export const client = {};\n" },
  { path: "sdk/index.ts", content: "export * from './client';\n" }
];

describe("desktop SDK output", () => {
  it("writes generated files inside the selected directory", async () => {
    const directoryPath = await mkdtemp(join(tmpdir(), "specdock-sdk-"));

    try {
      const result = await writeSdkOutputDirectory({
        directoryPath,
        files: generatedFiles,
        outputRoot: "sdk"
      });

      await expect(readFile(join(directoryPath, "client.ts"), "utf8")).resolves.toContain(
        "client"
      );
      expect(result.fileCount).toBe(2);
    } finally {
      await rm(directoryPath, { force: true, recursive: true });
    }
  });

  it("rejects generated file paths that escape the output root", async () => {
    const directoryPath = await mkdtemp(join(tmpdir(), "specdock-sdk-"));

    try {
      await expect(
        writeSdkOutputDirectory({
          directoryPath,
          files: [{ path: "../client.ts", content: "" }],
          outputRoot: "sdk"
        })
      ).rejects.toThrow();
    } finally {
      await rm(directoryPath, { force: true, recursive: true });
    }
  });

  it("does not overwrite files unless explicitly requested", async () => {
    const directoryPath = await mkdtemp(join(tmpdir(), "specdock-sdk-"));

    try {
      await writeFile(join(directoryPath, "client.ts"), "existing", "utf8");

      await expect(
        writeSdkOutputDirectory({
          directoryPath,
          files: generatedFiles,
          outputRoot: "sdk"
        })
      ).rejects.toThrow();
      await expect(
        writeSdkOutputDirectory({
          directoryPath,
          files: generatedFiles,
          outputRoot: "sdk",
          overwrite: true
        })
      ).resolves.toEqual({ fileCount: 2, totalBytes: 52 });
    } finally {
      await rm(directoryPath, { force: true, recursive: true });
    }
  });
});

import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { readProjectFolder, writeProjectFolder } from "./project-folder.js";

const projectExport = JSON.stringify({
  format: "specdock.project",
  version: 2,
  exportedAt: "2026-06-21T00:00:00.000Z",
  redactionPolicyVersion: 1,
  project: {
    metadata: { name: "Folder API" },
    source: { type: "sample" },
    specFormat: "openapi3",
    spec: {
      openapi: "3.1.0",
      info: { title: "Folder API", version: "1.0.0" },
      paths: {}
    }
  },
  preferences: {
    requestStates: {},
    generateOptions: {}
  }
});

describe("desktop project folders", () => {
  it("writes and reopens a portable project folder", async () => {
    const directoryPath = await mkdtemp(join(tmpdir(), "specdock-folder-"));

    try {
      await writeProjectFolder(directoryPath, projectExport);
      const reopened = JSON.parse(await readProjectFolder(directoryPath)) as {
        project: { metadata: { name: string } };
      };

      expect(reopened.project.metadata.name).toBe("Folder API");
    } finally {
      await rm(directoryPath, { force: true, recursive: true });
    }
  });

  it("does not overwrite project folder files unless explicitly requested", async () => {
    const directoryPath = await mkdtemp(join(tmpdir(), "specdock-folder-"));

    try {
      await writeProjectFolder(directoryPath, projectExport);

      await expect(writeProjectFolder(directoryPath, projectExport)).rejects.toThrow();
      await expect(
        writeProjectFolder(directoryPath, projectExport, true)
      ).resolves.toBeUndefined();
    } finally {
      await rm(directoryPath, { force: true, recursive: true });
    }
  });
});

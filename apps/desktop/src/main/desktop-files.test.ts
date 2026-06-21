import { describe, expect, it } from "vitest";
import {
  validateProjectExportContent,
  validateProjectExportPath
} from "./desktop-files.js";

const validProjectExport = JSON.stringify({
  format: "specdock.project",
  version: 2,
  redactionPolicyVersion: 1,
  exportedAt: "2026-06-21T00:00:00.000Z",
  project: {
    metadata: { name: "SpecDock Demo" },
    source: { type: "sample" },
    specFormat: "openapi3",
    spec: {
      openapi: "3.1.0",
      info: { title: "SpecDock Demo", version: "1.0.0" },
      paths: {}
    }
  },
  preferences: {
    requestStates: {},
    generateOptions: {}
  }
});

describe("desktop project files", () => {
  it("accepts a valid portable SpecDock project export", () => {
    expect(() => validateProjectExportContent(validProjectExport)).not.toThrow();
  });

  it("rejects malformed project exports before native file writes", () => {
    expect(() =>
      validateProjectExportContent(JSON.stringify({ version: 2 }))
    ).toThrow();
  });

  it("requires JSON project export paths for native file access", () => {
    expect(() =>
      validateProjectExportPath("/tmp/project.specdock.json")
    ).not.toThrow();
    expect(() => validateProjectExportPath("/tmp/project.txt")).toThrow();
  });
});

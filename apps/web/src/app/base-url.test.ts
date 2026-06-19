import { describe, expect, it } from "vitest";
import type { OpenApiProject } from "@specdock/core";
import { applyProjectBaseUrl } from "./base-url.js";

const project = (url: string): OpenApiProject => ({
  id: "project-1",
  name: "API",
  source: { type: "raw" },
  spec: {},
  servers: url ? [{ url }] : [],
  tags: [],
  operations: [],
  schemas: [],
  createdAt: "2026-06-16T00:00:00.000Z",
  updatedAt: "2026-06-16T00:00:00.000Z"
});

describe("project base URL policy", () => {
  it("preserves saved project base URLs when opening existing projects", () => {
    expect(
      applyProjectBaseUrl(
        { "project-1": "https://staging.example.com" },
        project("https://api.example.com"),
        "preserve"
      )
    ).toEqual({ "project-1": "https://staging.example.com" });
  });

  it("resets stale base URLs when importing a replacement contract", () => {
    expect(
      applyProjectBaseUrl(
        { "project-1": "https://dummyjson.com" },
        project("https://api.example.com/v1"),
        "reset"
      )
    ).toEqual({ "project-1": "https://api.example.com/v1" });
  });
});

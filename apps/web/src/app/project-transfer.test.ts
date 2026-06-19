import { describe, expect, it } from "vitest";
import { defaultGenerateOptions, type OpenApiProject, type RequestState } from "@specdock/core";
import { createProjectExport, parseProjectExport } from "./project-transfer.js";

const project: OpenApiProject = {
  id: "project-1",
  name: "Transfer API",
  source: { type: "raw" },
  specFormat: "openapi3",
  spec: {
    openapi: "3.1.0",
    info: { title: "Transfer API", version: "1.0.0" },
    paths: {}
  },
  servers: [{ url: "https://api.example.com" }],
  tags: [],
  operations: [],
  schemas: [],
  createdAt: "2026-06-16T00:00:00.000Z",
  updatedAt: "2026-06-16T00:00:00.000Z"
};

const requestState: RequestState = {
  operationId: "listUsers",
  authProfileId: "auth-1",
  pathParams: { id: "123" },
  queryParams: { include: "profile" },
  headers: { Authorization: "Bearer secret" },
  body: '{"token":"secret"}',
  requestMode: "proxy"
};

describe("project transfer", () => {
  it("exports safe workspace data without request secrets", () => {
    const text = createProjectExport({
      project,
      baseUrl: "https://api.example.com",
      requestStates: { "project-1::listUsers": requestState },
      generateOptions: defaultGenerateOptions
    });

    expect(text).not.toContain("Bearer secret");
    expect(text).not.toContain("token");
    expect(text).not.toContain("Authorization");
    expect(parseProjectExport(text).preferences.requestStates.listUsers).toEqual({
      operationId: "listUsers",
      authProfileId: "auth-1",
      pathParams: { id: "123" },
      queryParams: { include: "profile" },
      headers: {},
      body: undefined,
      requestMode: "proxy"
    });
  });

  it("rejects files that are not SpecDock project exports", () => {
    expect(() => parseProjectExport('{"format":"other"}')).toThrow();
  });
});

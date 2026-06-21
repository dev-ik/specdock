import { describe, expect, it } from "vitest";
import {
  CURRENT_PROJECT_EXPORT_VERSION,
  CURRENT_REDACTION_POLICY_VERSION,
  createProjectExport,
  defaultGenerateOptions,
  parseProjectExport
} from "./index.js";
import type { OpenApiProject, RequestState } from "./types.js";

const project: OpenApiProject = {
  id: "project-1",
  name: "Workspace API",
  source: { type: "raw" },
  specFormat: "openapi3",
  spec: {
    openapi: "3.1.0",
    info: { title: "Workspace API", version: "1.0.0" },
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
  queryParams: {
    include: "profile",
    token: "secret-token"
  },
  headers: { Authorization: "Bearer secret" },
  body: '{"password":"secret"}',
  requestMode: "proxy"
};

describe("workspace manifest", () => {
  it("exports versioned manifests with redacted safe request preferences", () => {
    const text = createProjectExport({
      project,
      baseUrl: "https://api.example.com",
      requestStates: { "project-1::listUsers": requestState },
      generateOptions: defaultGenerateOptions
    });

    expect(text).not.toContain("Bearer secret");
    expect(text).not.toContain("secret-token");
    expect(text).not.toContain("password");

    const parsed = parseProjectExport(text);

    expect(parsed.version).toBe(CURRENT_PROJECT_EXPORT_VERSION);
    expect(parsed.redactionPolicyVersion).toBe(CURRENT_REDACTION_POLICY_VERSION);
    expect(parsed.project.name).toBe("Workspace API");
    expect(parsed.preferences.requestStates.listUsers).toEqual({
      operationId: "listUsers",
      authProfileId: "auth-1",
      pathParams: { id: "123" },
      queryParams: {
        include: "profile",
        token: ""
      },
      headers: {},
      body: undefined,
      requestMode: "proxy"
    });
  });

  it("imports existing version 1 project exports", () => {
    const parsed = parseProjectExport(JSON.stringify({
      format: "specdock.project",
      version: 1,
      exportedAt: "2026-06-16T00:00:00.000Z",
      project: {
        name: "Legacy API",
        source: { type: "raw" },
        specFormat: "openapi3",
        spec: project.spec
      },
      preferences: {
        requestStates: {},
        generateOptions: {}
      }
    }));

    expect(parsed.version).toBe(CURRENT_PROJECT_EXPORT_VERSION);
    expect(parsed.project.name).toBe("Legacy API");
  });

  it("rejects unsafe request state fields and unknown execution settings", () => {
    const unsafeExport = {
      format: "specdock.project",
      version: CURRENT_PROJECT_EXPORT_VERSION,
      exportedAt: "2026-06-16T00:00:00.000Z",
      redactionPolicyVersion: CURRENT_REDACTION_POLICY_VERSION,
      project: {
        metadata: { name: "Unsafe API" },
        source: { type: "raw" },
        specFormat: "openapi3",
        spec: project.spec
      },
      preferences: {
        requestStates: {
          listUsers: {
            operationId: "listUsers",
            pathParams: {},
            queryParams: {},
            requestMode: "proxy",
            headers: { Authorization: "Bearer secret" }
          }
        },
        generateOptions: {},
        executeOnImport: true
      }
    };

    expect(() => parseProjectExport(JSON.stringify(unsafeExport))).toThrow();
  });

  it("rejects future versions instead of guessing how to load them", () => {
    expect(() => parseProjectExport(JSON.stringify({
      format: "specdock.project",
      version: 99
    }))).toThrow();
  });
});

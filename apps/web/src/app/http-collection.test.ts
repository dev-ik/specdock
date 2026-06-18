import { describe, expect, it } from "vitest";
import type { OpenApiProject } from "@specdock/core";
import { createHttpCollection } from "./http-collection.js";
import { createOperationKey } from "./request-utils.js";

describe("createHttpCollection", () => {
  it("exports operations as .http requests", () => {
    const project = createProject();
    const collection = createHttpCollection({
      project,
      baseUrl: "https://api.example.com/",
      requestStates: {}
    });

    expect(collection).toContain("@baseUrl = https://api.example.com");
    expect(collection).toContain("### listUsers");
    expect(collection).toContain("GET {{baseUrl}}/users?page=1");
    expect(collection).toContain("### createUser");
    expect(collection).toContain("POST {{baseUrl}}/users");
    expect(collection).toContain("Content-Type: application/json");
    expect(collection).toContain('"name": "string"');
  });

  it("redacts sensitive headers, query params, and JSON body fields", () => {
    const project = createProject();
    const collection = createHttpCollection({
      project,
      baseUrl: "https://api.example.com",
      requestStates: {
        [createOperationKey(project.id, "listUsers")]: {
          operationId: "listUsers",
          pathParams: {},
          queryParams: { api_key: "real-query-secret" },
          headers: { Authorization: "Bearer real-token" },
          requestMode: "direct"
        }
      }
    });

    expect(collection).toContain("Authorization: [redacted]");
    expect(collection).toContain("api_key=%5Bredacted%5D");
    expect(collection).toContain('"password": "[redacted]"');
    expect(collection).not.toContain("real-token");
    expect(collection).not.toContain("real-query-secret");
    expect(collection).not.toContain("schema-password");
  });

  it("uses path variables when no path state exists", () => {
    const project = createProject({
      id: "getUser",
      operationId: "getUser",
      method: "GET",
      path: "/users/{id}",
      summary: "Get user",
      tags: ["Users"],
      parameters: [
        {
          name: "id",
          in: "path",
          required: true
        }
      ],
      responses: []
    });

    expect(
      createHttpCollection({ project, baseUrl: "", requestStates: {} })
    ).toContain("GET {{baseUrl}}/users/{{id}}");
  });

  it("keeps untrusted labels and headers on one line", () => {
    const project = createProject({
      id: "getUser\nInjected: yes",
      operationId: "getUser\nInjected: yes",
      method: "GET",
      path: "/users",
      summary: "Get user",
      tags: ["Users"],
      parameters: [
        {
          name: "X-Trace\nInjected",
          in: "header",
          required: true,
          example: "trace\nInjected: yes"
        }
      ],
      responses: []
    });
    const collection = createHttpCollection({
      project: { ...project, name: "Demo\nInjected: yes" },
      baseUrl: "https://api.example.com\nGET https://evil.example.com",
      requestStates: {}
    });

    expect(collection).toContain("@baseUrl = https://api.example.com GET https://evil.example.com");
    expect(collection).toContain("# Demo Injected: yes");
    expect(collection).toContain("### getUser Injected: yes");
    expect(collection).toContain("X-Trace Injected: trace Injected: yes");
  });
});

const createProject = (
  operationOverride?: OpenApiProject["operations"][number]
): OpenApiProject => ({
  id: "project-1",
  name: "Demo API",
  source: { type: "raw" },
  spec: {},
  servers: [{ url: "https://fallback.example.com" }],
  tags: [],
  operations: [
    operationOverride ?? {
      id: "listUsers",
      operationId: "listUsers",
      method: "GET",
      path: "/users",
      summary: "List users",
      tags: ["Users"],
      parameters: [
        {
          name: "page",
          in: "query",
          required: false,
          example: 1
        },
        {
          name: "api_key",
          in: "query",
          required: false,
          example: "schema-query-secret"
        },
        {
          name: "Authorization",
          in: "header",
          required: false,
          example: "Bearer schema-token"
        }
      ],
      responses: []
    },
    {
      id: "createUser",
      operationId: "createUser",
      method: "POST",
      path: "/users",
      summary: "Create user",
      tags: ["Users"],
      parameters: [],
      requestBody: {
        required: true,
        content: [
          {
            contentType: "application/json",
            schema: {
              type: "object",
              properties: {
                name: { type: "string" },
                password: { type: "string", example: "schema-password" }
              }
            }
          }
        ]
      },
      responses: []
    }
  ],
  schemas: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
});

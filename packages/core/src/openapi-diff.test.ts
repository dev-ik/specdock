import { describe, expect, it } from "vitest";
import type { OpenApiProject } from "./types.js";
import { diffOpenApiProjects } from "./openapi-diff.js";

describe("diffOpenApiProjects", () => {
  it("classifies operation and response changes", () => {
    const findings = diffOpenApiProjects(
      project([
        operation("GET", "/users", {
          responses: [
            response("200", "object", ["id"]),
            response("404", "object", ["message"])
          ]
        }),
        operation("DELETE", "/users/{id}")
      ]),
      project([
        operation("GET", "/users", {
          parameters: [
            { name: "tenant", in: "header", required: true }
          ],
          responses: [
            response("200", "object", ["id", "email"]),
            response("201", "object", ["id"])
          ]
        }),
        operation("POST", "/users")
      ])
    );

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: "breaking",
          code: "operation-removed",
          location: "DELETE /users/{id}"
        }),
        expect.objectContaining({
          severity: "non-breaking",
          code: "operation-added",
          location: "POST /users"
        }),
        expect.objectContaining({
          severity: "breaking",
          code: "required-parameter-added",
          location: "GET /users parameter header.tenant"
        }),
        expect.objectContaining({
          severity: "breaking",
          code: "response-status-removed",
          location: "GET /users response 404"
        }),
        expect.objectContaining({
          severity: "breaking",
          code: "response-schema-changed",
          location: "GET /users response 200"
        }),
        expect.objectContaining({
          severity: "info",
          code: "response-status-added",
          location: "GET /users response 201"
        })
      ])
    );
  });

  it("classifies request body becoming required", () => {
    expect(
      diffOpenApiProjects(
        project([operation("POST", "/users")]),
        project([
          operation("POST", "/users", {
            requestBodyRequired: true
          })
        ])
      )
    ).toContainEqual(
      expect.objectContaining({
        severity: "breaking",
        code: "request-body-required",
        location: "POST /users requestBody"
      })
    );
  });

  it("returns no findings without two projects", () => {
    expect(diffOpenApiProjects(undefined, project([]))).toEqual([]);
  });
});

const project = (
  operations: OpenApiProject["operations"]
): OpenApiProject => ({
  id: "project",
  name: "Demo",
  source: { type: "raw" },
  spec: {},
  servers: [],
  tags: [],
  operations,
  schemas: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
});

const operation = (
  method: OpenApiProject["operations"][number]["method"],
  path: string,
  options: {
    parameters?: OpenApiProject["operations"][number]["parameters"];
    responses?: OpenApiProject["operations"][number]["responses"];
    requestBodyRequired?: boolean;
  } = {}
): OpenApiProject["operations"][number] => ({
  id: `${method} ${path}`,
  method,
  path,
  tags: [],
  parameters: options.parameters ?? [],
  responses: options.responses ?? [response("200", "object", ["id"])],
  requestBody: options.requestBodyRequired
    ? {
        required: true,
        content: [
          {
            contentType: "application/json",
            schema: { type: "object" }
          }
        ]
      }
    : undefined
});

const response = (
  statusCode: string,
  type: string,
  properties: string[]
): OpenApiProject["operations"][number]["responses"][number] => ({
  statusCode,
  content: [
    {
      contentType: "application/json",
      schema: {
        type,
        properties: Object.fromEntries(
          properties.map((name) => [name, { type: "string" }])
        )
      }
    }
  ]
});

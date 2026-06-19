import { describe, expect, it } from "vitest";
import type { OpenApiProject } from "./types.js";
import { diffOpenApiProjects } from "./openapi-diff.js";
import { filterOpenApiDiffFindings } from "./openapi-diff-filter.js";
import {
  createOpenApiDiffReport,
  renderOpenApiDiffJson,
  renderOpenApiDiffMarkdown
} from "./openapi-diff-report.js";

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

  it("classifies required request and response property additions", () => {
    const findings = diffOpenApiProjects(
      project([
        operation("POST", "/users", {
          requestRequired: ["name"],
          responses: [response("200", "object", ["id"], ["id"])]
        })
      ]),
      project([
        operation("POST", "/users", {
          requestRequired: ["name", "email"],
          responses: [response("200", "object", ["id", "email"], ["id", "email"])]
        })
      ])
    );

    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "request-required-property-added",
          location: "POST /users requestBody.email"
        }),
        expect.objectContaining({
          code: "response-required-property-added",
          location: "POST /users response 200.email"
        })
      ])
    );
  });

  it("filters findings by severity, method, path, and tag", () => {
    const findings = diffOpenApiProjects(
      project([operation("GET", "/users", { tags: ["Users"] })]),
      project([
        operation("GET", "/users", { tags: ["Users"] }),
        operation("POST", "/teams", { tags: ["Teams"] })
      ])
    );

    expect(
      filterOpenApiDiffFindings(findings, {
        severity: "non-breaking",
        method: "POST",
        path: "/teams",
        tag: "Teams"
      })
    ).toHaveLength(1);
  });

  it("renders markdown and JSON reports without spec bodies", () => {
    const report = createOpenApiDiffReport(
      project([operation("GET", "/users")], { version: "1.0.0" }),
      project([operation("POST", "/users")], { version: "1.1.0" }),
      "2026-01-01T00:00:00.000Z"
    );

    expect(renderOpenApiDiffMarkdown(report)).toContain("| Breaking | 1 |");
    expect(JSON.parse(renderOpenApiDiffJson(report))).toMatchObject({
      previous: { version: "1.0.0" },
      current: { version: "1.1.0" },
      counts: { total: 2 }
    });
    expect(renderOpenApiDiffJson(report)).not.toContain("\"openapi\"");
  });

  it("returns no findings without two projects", () => {
    expect(diffOpenApiProjects(undefined, project([]))).toEqual([]);
  });
});

const project = (
  operations: OpenApiProject["operations"],
  options: { version?: string } = {}
): OpenApiProject => ({
  id: "project",
  name: "Demo",
  source: { type: "raw" },
  spec: { info: { title: "Demo", version: options.version } },
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
    requestRequired?: string[];
    tags?: string[];
  } = {}
): OpenApiProject["operations"][number] => ({
  id: `${method} ${path}`,
  method,
  path,
  tags: options.tags ?? [],
  parameters: options.parameters ?? [],
  responses: options.responses ?? [response("200", "object", ["id"])],
  requestBody: options.requestBodyRequired || options.requestRequired
    ? {
        required: Boolean(options.requestBodyRequired),
        content: [
          {
            contentType: "application/json",
            schema: {
              type: "object",
              required: options.requestRequired ?? []
            }
          }
        ]
      }
    : undefined
});

const response = (
  statusCode: string,
  type: string,
  properties: string[],
  required: string[] = []
): OpenApiProject["operations"][number]["responses"][number] => ({
  statusCode,
  content: [
    {
      contentType: "application/json",
      schema: {
        type,
        required,
        properties: Object.fromEntries(
          properties.map((name) => [name, { type: "string" }])
        )
      }
    }
  ]
});

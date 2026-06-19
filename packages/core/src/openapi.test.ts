import { describe, expect, it } from "vitest";
import { normalizeSpec, parseSpec, validateSpec } from "./openapi.js";

const validYaml = `openapi: 3.0.3
info:
  title: Test
  version: 1.0.0
servers:
  - url: https://api.example.com
tags:
  - name: users
paths:
  /users:
    get:
      operationId: listUsers
      tags:
        - users
      responses:
        "200":
          description: OK
components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
`;

describe("openapi", () => {
  it("parses YAML specs", () => {
    const spec = parseSpec(validYaml);

    expect(spec.openapi).toBe("3.0.3");
  });

  it("parses JSON specs", () => {
    const spec = parseSpec(JSON.stringify({
      openapi: "3.1.0",
      info: { title: "Test", version: "1.0.0" },
      paths: {}
    }));

    expect(spec.openapi).toBe("3.1.0");
  });

  it("rejects invalid YAML", () => {
    expect(() => parseSpec("openapi: [")).toThrow();
  });

  it("accepts OpenAPI 3.1", () => {
    expect(() =>
      validateSpec({
        openapi: "3.1.0",
        info: { title: "Test", version: "1.0.0" },
        paths: {}
      })
    ).not.toThrow();
  });

  it("normalizes servers, tags, operations and schemas", () => {
    const normalized = normalizeSpec(validYaml);

    expect(normalized.servers).toEqual([{ url: "https://api.example.com", description: undefined }]);
    expect(normalized.tags).toEqual([{ name: "users", description: undefined }]);
    expect(normalized.operations[0]?.operationId).toBe("listUsers");
    expect(normalized.schemas[0]?.name).toBe("User");
  });

  it("normalizes Swagger 2.0 specs through an OpenAPI 3 document", () => {
    const normalized = normalizeSpec({
      swagger: "2.0",
      info: { title: "Old", version: "1.0.0" },
      host: "api.example.com",
      basePath: "/v1",
      schemes: ["https"],
      consumes: ["application/json"],
      produces: ["application/json"],
      paths: {
        "/users/{id}": {
          get: {
            operationId: "getUser",
            tags: ["users"],
            parameters: [
              { name: "id", in: "path", required: true, type: "string" },
              { name: "include", in: "query", type: "array", items: { type: "string" }, collectionFormat: "multi" }
            ],
            responses: {
              "200": { description: "OK", schema: { $ref: "#/definitions/User" } }
            },
            security: [{ api_key: [] }]
          },
          post: {
            operationId: "uploadAvatar",
            consumes: ["multipart/form-data"],
            parameters: [
              { name: "avatar", in: "formData", required: true, type: "file" },
              { name: "label", in: "formData", type: "string" }
            ],
            responses: { "201": { description: "Created" } }
          }
        }
      },
      definitions: {
        User: { type: "object", properties: { id: { type: "string" } } }
      },
      securityDefinitions: {
        api_key: { type: "apiKey", name: "x-api-key", in: "header" }
      }
    });

    expect(normalized.specFormat).toBe("swagger2");
    expect(validateSpec(normalized.spec).openapi).toBe("3.0.3");
    expect(normalized.servers).toEqual([{ url: "https://api.example.com/v1", description: undefined }]);
    expect(normalized.operations[0]).toMatchObject({
      operationId: "getUser",
      parameters: [
        { name: "id", in: "path", required: true },
        { name: "include", in: "query", explode: true }
      ],
      responses: [{ statusCode: "200" }],
      security: [{ name: "api_key", scopes: [] }]
    });
    expect(normalized.operations[1]?.requestBody?.content[0]).toMatchObject({
      contentType: "multipart/form-data"
    });
    expect(normalized.schemas[0]?.name).toBe("User");
  });
});

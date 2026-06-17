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

  it("rejects Swagger 2.0", () => {
    expect(() =>
      validateSpec({
        swagger: "2.0",
        info: { title: "Old", version: "1.0.0" },
        paths: {}
      })
    ).toThrow("Swagger 2.0 is not supported");
  });
});

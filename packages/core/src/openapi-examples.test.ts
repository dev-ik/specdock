import { describe, expect, it } from "vitest";
import { generateRequestBodyExample, generateSchemaExample } from "./openapi-examples.js";
import { normalizeSpec } from "./openapi.js";

describe("openapi examples", () => {
  it("prefers explicit request body examples", () => {
    const operation = normalizeSpec({
      openapi: "3.1.0",
      info: { title: "Examples", version: "1.0.0" },
      paths: {
        "/users": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  example: { name: "Ada" },
                  schema: {
                    type: "object",
                    properties: { name: { type: "string" } }
                  }
                }
              }
            },
            responses: {
              default: { description: "Error" }
            }
          }
        }
      }
    }).operations[0];

    expect(operation ? generateRequestBodyExample(operation) : undefined).toBe('{\n  "name": "Ada"\n}');
  });

  it("uses named OpenAPI examples when example is absent", () => {
    const operation = normalizeSpec({
      openapi: "3.1.0",
      info: { title: "Examples", version: "1.0.0" },
      paths: {
        "/users": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  examples: {
                    default: { value: { email: "ada@example.com" } }
                  },
                  schema: { type: "object" }
                }
              }
            },
            responses: {
              default: { description: "Error" }
            }
          }
        }
      }
    }).operations[0];

    expect(operation ? generateRequestBodyExample(operation) : undefined).toBe(
      '{\n  "email": "ada@example.com"\n}'
    );
  });

  it("generates fallback examples from schemas", () => {
    expect(
      generateSchemaExample({
        type: "object",
        properties: {
          id: { type: "integer" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["admin", "viewer"] },
          enabled: { type: "boolean" },
          tags: { type: "array", items: { type: "string" } }
        }
      })
    ).toEqual({
      id: 1,
      email: "user@example.com",
      role: "admin",
      enabled: true,
      tags: ["string"]
    });
  });
});

import { describe, expect, it } from "vitest";
import { getRequestBodySchemaFields } from "./openapi-schema-fields.js";
import { normalizeSpec } from "./openapi.js";

describe("openapi schema fields", () => {
  it("extracts request body field metadata", () => {
    const project = normalizeSpec({
      openapi: "3.0.3",
      info: { title: "Forms", version: "1.0.0" },
      paths: {
        "/event": {
          post: {
            requestBody: {
              content: {
                "application/x-www-form-urlencoded": {
                  schema: {
                    type: "object",
                    required: ["includeMarkets"],
                    properties: {
                      includeMarkets: {
                        type: "boolean",
                        description: "Include markets in the response event."
                      }
                    }
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
    });

    expect(getRequestBodySchemaFields(project.operations[0]!, project.spec)).toEqual([
      {
        name: "includeMarkets",
        type: "boolean",
        required: true,
        description: "Include markets in the response event.",
        example: undefined,
        enumValues: undefined
      }
    ]);
  });

  it("resolves local request schema refs", () => {
    const project = normalizeSpec({
      openapi: "3.0.3",
      info: { title: "Refs", version: "1.0.0" },
      paths: {
        "/users": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CreateUser" }
                }
              }
            },
            responses: {
              default: { description: "Error" }
            }
          }
        }
      },
      components: {
        schemas: {
          CreateUser: {
            type: "object",
            properties: {
              email: { type: "string", format: "email" }
            }
          }
        }
      }
    });

    expect(getRequestBodySchemaFields(project.operations[0]!, project.spec)[0]).toMatchObject({
      name: "email",
      type: "string:email"
    });
  });
});

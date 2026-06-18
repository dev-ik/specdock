import { describe, expect, it } from "vitest";
import { analyzeOpenApiQuality } from "./openapi-quality.js";
import { normalizeSpec } from "./openapi.js";

describe("openapi quality", () => {
  it("reports missing operation metadata and examples", () => {
    const normalized = normalizeSpec({
      openapi: "3.1.0",
      info: { title: "Quality", version: "1.0.0" },
      paths: {
        "/users": {
          post: {
            requestBody: {
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: { email: { type: "string" } }
                  }
                }
              }
            },
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/json": {
                    schema: { type: "object" }
                  }
                }
              }
            }
          }
        }
      }
    });

    expect(analyzeOpenApiQuality(normalized)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-operation-id", severity: "warning" }),
        expect.objectContaining({ code: "operation-without-tags", severity: "warning" }),
        expect.objectContaining({ code: "missing-error-response", severity: "warning" }),
        expect.objectContaining({ code: "missing-request-example", severity: "info" }),
        expect.objectContaining({ code: "missing-response-example", severity: "info" })
      ])
    );
  });

  it("reports duplicate operation ids and undefined tags", () => {
    const normalized = normalizeSpec({
      openapi: "3.0.3",
      info: { title: "Quality", version: "1.0.0" },
      tags: [{ name: "declared" }],
      paths: {
        "/users": {
          get: {
            operationId: "list",
            tags: ["missing"],
            responses: {
              default: { description: "Error" }
            }
          }
        },
        "/teams": {
          get: {
            operationId: "list",
            tags: ["declared"],
            responses: {
              "404": { description: "Not found" }
            }
          }
        }
      }
    });

    const findings = analyzeOpenApiQuality(normalized);

    expect(findings.filter((finding) => finding.code === "duplicate-operation-id")).toHaveLength(2);
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "undefined-operation-tag",
          location: "paths./users.get.tags"
        })
      ])
    );
  });
});

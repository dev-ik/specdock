import { describe, expect, it } from "vitest";
import { LIMITS } from "@specdock/core";
import { generateSdk, generateSdkZip } from "./index.js";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Test",
    version: "1.0.0"
  },
  paths: {
    "/users": {
      post: {
        operationId: "createUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/User"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Created"
          }
        }
      }
    },
    "/users/{id}": {
      get: {
        operationId: "getUser",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "OK"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
          age: { type: "integer" }
        }
      }
    }
  }
};

describe("generateSdk", () => {
  it("generates TypeScript SDK files", () => {
    const files = generateSdk(spec);

    expect(files.map((file) => file.path)).toEqual([
      "generated/types.ts",
      "generated/client.ts",
      "generated/index.ts"
    ]);
    expect(files[0]?.content).toContain("export type User");
    expect(files[1]?.content).toContain("export const getUser");
  });

  it("honors output path and optional files", () => {
    const files = generateSdk(spec, {
      outputPath: "/sdk/",
      generateTypes: false,
      generateReactQuery: true,
      generateZod: true
    });

    expect(files.map((file) => file.path)).toEqual([
      "sdk/client.ts",
      "sdk/hooks.ts",
      "sdk/schemas.ts",
      "sdk/index.ts"
    ]);
    expect(files.find((file) => file.path === "sdk/index.ts")?.content).toBe(
      'export * from "./client";\nexport * from "./hooks";\nexport * from "./schemas";\n'
    );
  });

  it("generates React Query hooks and Zod schemas when enabled", () => {
    const files = generateSdk(spec, {
      generateReactQuery: true,
      generateZod: true
    });
    const hooks = files.find(
      (file) => file.path === "generated/hooks.ts"
    )?.content;
    const schemas = files.find(
      (file) => file.path === "generated/schemas.ts"
    )?.content;

    expect(hooks).toContain("useGetUserQuery");
    expect(hooks).toContain("useCreateUserMutation");
    expect(schemas).toContain('import { z } from "zod"');
    expect(schemas).toContain("export const UserSchema = z.object");
    expect(schemas).toContain('"age": z.number().int().optional()');
  });

  it("generates axios clients", () => {
    const client = generateSdk(spec, { client: "axios" }).find(
      (file) => file.path === "generated/client.ts"
    )?.content;

    expect(client).toContain("type AxiosLike");
    expect(client).toContain("axios.request");
  });

  it("falls back to method and path naming", () => {
    const files = generateSdk({
      ...spec,
      paths: {
        "/accounts/{accountId}/orders": {
          get: {
            parameters: [
              {
                name: "accountId",
                in: "path",
                required: true,
                schema: { type: "string" }
              }
            ],
            responses: {
              "200": {
                description: "OK"
              }
            }
          }
        }
      }
    });

    expect(
      files.find((file) => file.path === "generated/client.ts")?.content
    ).toContain("export const getAccountsAccountIdOrders");
  });

  it("generates query param support for clients and hooks", () => {
    const querySpec = {
      ...spec,
      paths: {
        "/posts": {
          get: {
            operationId: "listPosts",
            parameters: [
              {
                name: "userId",
                in: "query",
                required: false,
                schema: { type: "string" }
              }
            ],
            responses: {
              "200": {
                description: "OK"
              }
            }
          }
        }
      }
    };
    const files = generateSdk(querySpec, { generateReactQuery: true });
    const client = files.find(
      (file) => file.path === "generated/client.ts"
    )?.content;
    const hooks = files.find(
      (file) => file.path === "generated/hooks.ts"
    )?.content;

    expect(client).toContain("type QueryValue");
    expect(client).toContain('appendQuery("/posts", query)');
    expect(client).toContain("query?: Record<string, QueryValue>");
    expect(hooks).toContain(
      "query?: Record<string, string | number | boolean | undefined>"
    );
    expect(hooks).toContain('queryKey: ["listPosts", query]');
  });

  it("generates ZIP archives", async () => {
    const archive = await generateSdkZip(spec);

    expect(archive.byteLength).toBeGreaterThan(0);
  });

  it("escapes untrusted path literals in generated clients", () => {
    const files = generateSdk({
      ...spec,
      paths: {
        "/users/`${globalThis.alert(1)}`/{id}": {
          get: {
            operationId: "unsafePath",
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" }
              }
            ],
            responses: {
              "200": {
                description: "OK"
              }
            }
          }
        }
      }
    });
    const client = files.find(
      (file) => file.path === "generated/client.ts"
    )?.content;

    expect(client).toContain(
      '"/users/`${globalThis.alert(1)}`/" + encodeURIComponent(id)'
    );
    expect(client).not.toContain("`/users/`${globalThis.alert(1)}`/");
  });

  it("rejects specs above generation complexity limits", () => {
    const paths = Object.fromEntries(
      Array.from({ length: LIMITS.maxGenerateOperations + 1 }, (_, index) => [
        `/items-${index}`,
        {
          get: {
            responses: {
              "200": {
                description: "OK"
              }
            }
          }
        }
      ])
    );

    expect(() => generateSdk({ ...spec, paths })).toThrow(
      "Specification is too large to generate"
    );
  });
});

import { describe, expect, it } from "vitest";
import { generateSdk } from "./index.js";

const spec = {
  openapi: "3.1.0",
  info: { title: "Test", version: "1.0.0" },
  paths: {
    "/users": {
      post: {
        operationId: "createUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" }
            }
          }
        },
        responses: { "201": { description: "Created" } }
      }
    },
    "/users/{id}": {
      get: {
        operationId: "getUser",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: { "200": { description: "OK" } }
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

describe("TypeScript SDK output", () => {
  it("generates React Query hooks and Zod schemas when enabled", () => {
    const files = generateSdk(spec, { generateReactQuery: true, generateZod: true });
    const hooks = files.find((file) => file.path === "generated/hooks.ts")?.content;
    const schemas = files.find((file) => file.path === "generated/schemas.ts")?.content;

    expect(hooks).toContain("useGetUserQuery");
    expect(hooks).toContain("useCreateUserMutation");
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
    const files = generateSdk(specWithPath("/accounts/{accountId}/orders"));

    expect(files.find((file) => file.path === "generated/client.ts")?.content).toContain(
      "export const getAccountsAccountIdOrders"
    );
  });

  it("generates query param support for clients and hooks", () => {
    const files = generateSdk(specWithQuery(), { generateReactQuery: true });
    const client = files.find((file) => file.path === "generated/client.ts")?.content;
    const hooks = files.find((file) => file.path === "generated/hooks.ts")?.content;

    expect(client).toContain('appendQuery("/posts", query)');
    expect(client).toContain("query?: Record<string, QueryValue>");
    expect(hooks).toContain('queryKey: ["listPosts", query]');
  });

  it("escapes untrusted path literals in generated clients", () => {
    const files = generateSdk(specWithPath("/users/`${globalThis.alert(1)}`/{id}"));
    const client = files.find((file) => file.path === "generated/client.ts")?.content;

    expect(client).toContain(
      '"/users/`${globalThis.alert(1)}`/" + encodeURIComponent(id)'
    );
    expect(client).not.toContain("`/users/`${globalThis.alert(1)}`/");
  });

  it("uses safe identifiers for generated path parameter variables", () => {
    const files = generateSdk(specWithPath("/users/{user-id}", "getUserByDashedId"));
    const client = files.find((file) => file.path === "generated/client.ts")?.content;

    expect(client).toContain("user_id: string");
    expect(client).toContain('"/users/" + encodeURIComponent(user_id)');
  });
});

const specWithPath = (path: string, operationId?: string) => ({
  ...spec,
  paths: {
    [path]: {
      get: {
        operationId,
        parameters: [
          {
            name: path.includes("user-id") ? "user-id" : "id",
            in: "path",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: { "200": { description: "OK" } }
      }
    }
  }
});

const specWithQuery = () => ({
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
        responses: { "200": { description: "OK" } }
      }
    }
  }
});

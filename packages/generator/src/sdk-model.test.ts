import { describe, expect, it } from "vitest";
import type { ApiOperation, ApiSchema } from "@specdock/core";
import { defaultGenerateOptions } from "@specdock/core";
import { buildSdkModel } from "./sdk-model.js";

describe("buildSdkModel", () => {
  it("prepares operation names, parameters, and flags for renderers", () => {
    const operations: ApiOperation[] = [
      {
        id: "GET /users/{user-id}",
        method: "GET",
        path: "/users/{user-id}",
        operationId: "get-user",
        tags: [],
        parameters: [
          {
            name: "user-id",
            in: "path",
            required: true,
            schema: { type: "string" }
          },
          {
            name: "includePosts",
            in: "query",
            required: false,
            schema: { type: "boolean" }
          }
        ],
        responses: []
      }
    ];
    const schemas: ApiSchema[] = [{ name: "User", schema: { type: "object" } }];

    const model = buildSdkModel(operations, schemas, defaultGenerateOptions);

    expect(model.schemas).toBe(schemas);
    expect(model.operations).toEqual([
      expect.objectContaining({
        id: "GET /users/{user-id}",
        name: "get_user",
        typeName: "Get_user",
        method: "GET",
        path: "/users/{user-id}",
        hasQuery: true,
        hasBody: false,
        pathParameters: [
          expect.objectContaining({
            name: "user-id",
            safeName: "user_id",
            location: "path"
          })
        ],
        queryParameters: [
          expect.objectContaining({
            name: "includePosts",
            safeName: "includePosts",
            location: "query"
          })
        ]
      })
    ]);
  });
});

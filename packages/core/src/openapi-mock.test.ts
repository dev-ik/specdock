import { describe, expect, it } from "vitest";
import { createMockResponse } from "./openapi-mock.js";
import type { OpenApiProject } from "./types.js";

describe("createMockResponse", () => {
  it("generates JSON responses from schema examples", () => {
    const response = createMockResponse(project(), {
      method: "GET",
      path: "/users/123"
    });

    expect(response).toMatchObject({
      status: 200,
      contentType: "application/json",
      operationId: "getUser"
    });
    expect(JSON.parse(response?.body ?? "")).toEqual({
      id: "string",
      email: "user@example.com"
    });
  });

  it("prefers OpenAPI media examples", () => {
    const response = createMockResponse(project(), {
      method: "POST",
      path: "/users",
      statusCode: "201"
    });

    expect(JSON.parse(response?.body ?? "")).toEqual({ id: "created-user" });
  });

  it("uses described OpenAPI error response bodies", () => {
    const response = createMockResponse(project(), {
      method: "GET",
      path: "/users/123",
      statusCode: "400"
    });

    expect(response).toMatchObject({
      status: 400,
      contentType: "application/json"
    });
    expect(JSON.parse(response?.body ?? "")).toEqual({
      code: "bad_request",
      message: "string"
    });
  });

  it("generates fallback error bodies for missing selected statuses", () => {
    const response = createMockResponse(project(), {
      method: "GET",
      path: "/users/123",
      statusCode: "403"
    });

    expect(response).toMatchObject({
      status: 403,
      statusText: "Forbidden",
      contentType: "application/json"
    });
    expect(JSON.parse(response?.body ?? "")).toEqual({
      error: {
        code: "MOCK_403",
        message: "Forbidden"
      }
    });
  });

  it("does not fallback selected missing statuses to 2xx responses", () => {
    const response = createMockResponse(project(), {
      method: "GET",
      path: "/users/123",
      statusCode: "500"
    });

    expect(response?.status).toBe(500);
    expect(response?.body).toContain("MOCK_500");
  });

  it("returns undefined when route or method does not match", () => {
    expect(createMockResponse(project(), { method: "DELETE", path: "/users/1" })).toBeUndefined();
  });
});

const project = (): OpenApiProject => ({
  id: "project",
  name: "Demo",
  source: { type: "raw" },
  spec: {
    components: {
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: {
            code: { type: "string", example: "bad_request" },
            message: { type: "string" }
          }
        }
      }
    }
  },
  servers: [],
  tags: [],
  schemas: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  operations: [
    {
      id: "getUser",
      operationId: "getUser",
      method: "GET",
      path: "/users/{id}",
      tags: ["Users"],
      parameters: [],
      responses: [
        {
          statusCode: "200",
          description: "OK",
          content: [
            {
              contentType: "application/json",
              schema: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  email: { type: "string", format: "email" }
                }
              }
            }
          ]
        },
        {
          statusCode: "400",
          description: "Bad Request",
          content: [
            {
              contentType: "application/json",
              schema: {
                $ref: "#/components/schemas/ErrorResponse"
              }
            }
          ]
        }
      ]
    },
    {
      id: "createUser",
      operationId: "createUser",
      method: "POST",
      path: "/users",
      tags: ["Users"],
      parameters: [],
      responses: [
        {
          statusCode: "201",
          description: "Created",
          content: [
            {
              contentType: "application/json",
              example: { id: "created-user" }
            }
          ]
        }
      ]
    }
  ]
});

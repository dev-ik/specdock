import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "./app.js";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("mock routes", () => {
  it("does not register mock routes by default", async () => {
    const app = buildApp({ logger: false, webDistDir: null });

    try {
      const response = await app.inject(mockRequest());

      expect(response.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("keeps mock routes disabled in public demo", async () => {
    vi.stubEnv("PUBLIC_DEMO", "true");
    vi.stubEnv("MOCK_SERVER_ENABLED", "true");
    const app = buildApp({ logger: false, webDistDir: null });

    try {
      const response = await app.inject(mockRequest());

      expect(response.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });

  it("returns generated mock responses when enabled", async () => {
    vi.stubEnv("MOCK_SERVER_ENABLED", "true");
    const app = buildApp({ logger: false, webDistDir: null });

    try {
      const response = await app.inject(mockRequest());

      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        status: 200,
        contentType: "application/json",
        body: expect.stringContaining("user@example.com")
      });
    } finally {
      await app.close();
    }
  });

  it("serves saved live mock routes when enabled", async () => {
    vi.stubEnv("MOCK_SERVER_ENABLED", "true");
    const app = buildApp({ logger: false, webDistDir: null });

    try {
      const saved = await app.inject({
        method: "POST",
        url: "/api/mock/routes",
        payload: {
          method: "GET",
          path: "/users/{id}",
          status: 201,
          body: "{\"ok\":true}",
          contentType: "application/json",
          operationId: "getUser"
        }
      });
      const listed = await app.inject({
        method: "GET",
        url: "/api/mock/routes"
      });
      const response = await app.inject({
        method: "GET",
        url: "/mock/users/123"
      });
      const missing = await app.inject({
        method: "GET",
        url: "/mock/users/123/comments"
      });

      expect(saved.statusCode).toBe(200);
      expect(saved.json()).toEqual({
        route: {
          method: "GET",
          path: "/users/{id}",
          status: 201,
          contentType: "application/json",
          operationId: "getUser",
          url: "/mock/users/1"
        }
      });
      expect(listed.json()).toEqual({
        routes: [
          {
            method: "GET",
            path: "/users/{id}",
            status: 201,
            contentType: "application/json",
            operationId: "getUser",
            url: "/mock/users/1"
          }
        ]
      });
      expect(response.statusCode).toBe(201);
      expect(response.headers["content-type"]).toContain("application/json");
      expect(response.body).toBe("{\"ok\":true}");
      expect(missing.statusCode).toBe(404);
    } finally {
      await app.close();
    }
  });
});

const mockRequest = () => ({
  method: "POST" as const,
  url: "/api/mock/response",
  payload: {
    spec: {
      openapi: "3.1.0",
      info: { title: "Demo", version: "1.0.0" },
      paths: {
        "/users/{id}": {
          get: {
            operationId: "getUser",
            responses: {
              "200": {
                description: "OK",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        email: { type: "string", format: "email" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    method: "GET",
    path: "/users/123"
  }
});

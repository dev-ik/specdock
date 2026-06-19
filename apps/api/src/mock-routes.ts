import type { FastifyInstance } from "fastify";
import {
  createMockResponse,
  normalizeSpec,
  type HttpMethod,
  type MockRouteUpsertRequest,
  type MockResponseRequest,
  type OpenApiProject
} from "@specdock/core";
import { sendError } from "./errors.js";
import { resolveMockServerConfig } from "./mock-config.js";
import { createMockRouteRegistry, liveMockPath } from "./mock-registry.js";
import { createRateLimit } from "./rate-limit.js";
import {
  mockResponseRequestSchema,
  mockRouteUpsertSchema
} from "./route-schemas.js";

export const registerMockRoutes = (app: FastifyInstance): void => {
  const registry = createMockRouteRegistry();
  const mockRateLimit = createRateLimit("mock", {
    maxRequests: 120,
    windowMs: 60_000
  });

  app.post<{ Body: MockResponseRequest }>(
    "/api/mock/response",
    { schema: mockResponseRequestSchema, preHandler: mockRateLimit },
    async (request, reply) => {
      const config = resolveMockServerConfig();
      const project = buildMockProject(request.body.spec);
      const response = createMockResponse(project, request.body);

      if (!response) {
        return sendError(
          reply,
          404,
          "MOCK_ROUTE_NOT_FOUND",
          "No matching OpenAPI operation was found for this mock request."
        );
      }

      if (Buffer.byteLength(response.body, "utf8") > config.maxResponseBodyBytes) {
        return sendError(
          reply,
          413,
          "MOCK_RESPONSE_TOO_LARGE",
          "Mock response body exceeds the configured limit."
        );
      }

      return response;
    }
  );

  app.post<{ Body: MockRouteUpsertRequest }>(
    "/api/mock/routes",
    { schema: mockRouteUpsertSchema, preHandler: mockRateLimit },
    async (request, reply) => {
      const config = resolveMockServerConfig();

      if (Buffer.byteLength(request.body.body, "utf8") > config.maxResponseBodyBytes) {
        return sendError(
          reply,
          413,
          "MOCK_RESPONSE_TOO_LARGE",
          "Mock route response body exceeds the configured limit."
        );
      }

      return {
        route: registry.save(request.body)
      };
    }
  );

  app.get("/api/mock/routes", async () => ({
    routes: registry.list()
  }));

  app.all("/mock/*", async (request, reply) => {
    const route = registry.find(
      request.method.toUpperCase() as HttpMethod,
      liveMockPath(request.url)
    );

    if (!route) {
      return sendError(reply, 404, "MOCK_ROUTE_NOT_FOUND", "Mock route not found.");
    }

    if (route.contentType) {
      reply.header("content-type", route.contentType);
    }
    reply.code(route.status);
    return reply.send(route.body);
  });
};

const buildMockProject = (spec: unknown): OpenApiProject => {
  const normalized = normalizeSpec(spec);

  return {
    id: "mock",
    name: "Mock API",
    source: { type: "raw" },
    specFormat: normalized.specFormat,
    spec: normalized.spec,
    servers: normalized.servers,
    tags: normalized.tags,
    operations: normalized.operations,
    schemas: normalized.schemas,
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z"
  };
};

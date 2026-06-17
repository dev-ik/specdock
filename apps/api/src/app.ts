import { createReadStream } from "node:fs";
import Fastify from "fastify";
import { APP_VERSION, LIMITS, type HealthResponse } from "@specdock/core";
import { resolveTrustProxy } from "./app-config.js";
import { sendError } from "./errors.js";
import { registerGenerateRoutes } from "./generate-routes.js";
import type { GenerationRunner } from "./generation-runner.js";
import { registerProxyRoute } from "./proxy-route.js";
import {
  requestPathname,
  resolveStaticAsset,
  resolveWebDistDir,
  setStaticHeaders
} from "./static-assets.js";

export type AppOptions = {
  fetchImplementation?: typeof fetch;
  generationRunner?: GenerationRunner;
  logger?: boolean;
  webDistDir?: string | null;
};

const errorStatusCode = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "statusCode" in error &&
  typeof error.statusCode === "number"
    ? error.statusCode
    : 500;

export const buildApp = (options: AppOptions = {}) => {
  const app = Fastify({
    logger: options.logger ?? true,
    bodyLimit: LIMITS.maxSpecBytes,
    trustProxy: resolveTrustProxy()
  });
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const webDistDir =
    options.webDistDir === undefined ? resolveWebDistDir() : options.webDistDir;

  app.setErrorHandler((error, _request, reply) => {
    const statusCode = errorStatusCode(error);

    if (statusCode >= 400 && statusCode < 500) {
      return sendError(
        reply,
        statusCode,
        statusCode === 413 ? "PAYLOAD_TOO_LARGE" : "VALIDATION_ERROR",
        statusCode === 413
          ? "Request payload is too large."
          : "Request payload is invalid."
      );
    }

    app.log.error(error);
    sendError(reply, 500, "INTERNAL_SERVER_ERROR", "Unexpected server error.");
  });

  app.get("/api/health", async (): Promise<HealthResponse> => {
    return {
      status: "ok",
      version: APP_VERSION
    };
  });

  registerGenerateRoutes(app, options.generationRunner);
  registerProxyRoute(app, fetchImplementation);

  app.get("/*", async (request, reply) => {
    const pathname = requestPathname(request.url);

    if (pathname.startsWith("/api/")) {
      return sendError(reply, 404, "NOT_FOUND", "API route not found.");
    }

    if (!webDistDir) {
      return sendError(
        reply,
        404,
        "WEB_APP_NOT_BUILT",
        "Web app build is not available."
      );
    }

    const assetPath =
      resolveStaticAsset(webDistDir, pathname) ??
      resolveStaticAsset(webDistDir, "/index.html");

    if (!assetPath) {
      return sendError(
        reply,
        404,
        "WEB_APP_NOT_BUILT",
        "Web app index is not available."
      );
    }

    setStaticHeaders(reply, assetPath);
    return reply.send(createReadStream(assetPath));
  });

  return app;
};

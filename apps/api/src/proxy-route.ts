import type { FastifyInstance } from "fastify";
import { type ProxyRequest } from "@specdock/core";
import { sendError } from "./errors.js";
import {
  sanitizeForwardHeaders,
  sanitizeProxyResponseHeaders,
  validateProxyTarget
} from "./proxy.js";
import { resolveProxyConfig } from "./proxy-config.js";
import { createRateLimit } from "./rate-limit.js";
import { proxyRequestSchema } from "./route-schemas.js";
import {
  ProxyResponseTooLargeError,
  requestUpstream
} from "./proxy-upstream.js";

export const registerProxyRoute = (
  app: FastifyInstance,
  fetchImplementation: typeof fetch
): void => {
  const proxyRateLimit = createRateLimit("proxy", {
    maxRequests: 120,
    windowMs: 60_000
  });

  app.post<{ Body: ProxyRequest }>(
    "/api/proxy/request",
    { schema: proxyRequestSchema, preHandler: proxyRateLimit },
    async (request, reply) => {
      const config = resolveProxyConfig();

      if (!config.enabled) {
        return sendError(
          reply,
          403,
          "PROXY_DISABLED",
          "Proxy mode is disabled on this deployment. Use direct browser mode or self-host SpecDock."
        );
      }

      const startedAt = performance.now();
      const proxyRequest = request.body;
      const body = proxyRequest?.body;

      if (
        body &&
        Buffer.byteLength(body, "utf8") > config.maxRequestBodyBytes
      ) {
        return sendError(
          reply,
          413,
          "REQUEST_TOO_LARGE",
          "Proxy request body exceeds the configured limit."
        );
      }

      const target = await validateProxyTarget(proxyRequest?.url, config);
      if ("error" in target) {
        return sendError(
          reply,
          target.statusCode,
          target.error,
          target.message
        );
      }

      const requestTimeoutMs = Math.min(
        proxyRequest.timeoutMs ?? config.timeoutMs,
        config.timeoutMs
      );
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

      try {
        const upstream = await requestUpstream(
          target,
          proxyRequest,
          sanitizeForwardHeaders(proxyRequest.headers),
          config.maxResponseBodyBytes,
          controller.signal,
          fetchImplementation
        );

        return {
          status: upstream.status,
          statusText: upstream.statusText,
          headers: sanitizeProxyResponseHeaders(upstream.headers),
          body: upstream.body,
          contentType: upstream.headers.get("content-type") ?? undefined,
          durationMs: Math.round(performance.now() - startedAt)
        };
      } catch (error) {
        const isTimeout = error instanceof Error && error.name === "AbortError";
        if (error instanceof ProxyResponseTooLargeError) {
          return sendError(reply, 413, "RESPONSE_TOO_LARGE", error.message);
        }

        return sendError(
          reply,
          isTimeout ? 408 : 502,
          isTimeout ? "REQUEST_TIMEOUT" : "UPSTREAM_REQUEST_FAILED",
          isTimeout ? "Proxy request timed out." : "Upstream request failed."
        );
      } finally {
        clearTimeout(timeout);
      }
    }
  );
};

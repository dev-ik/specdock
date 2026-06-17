import { createReadStream } from "node:fs";
import Fastify from "fastify";
import {
  APP_VERSION,
  LIMITS,
  type GenerateRequest,
  type HealthResponse,
  type ProxyRequest
} from "@specdock/core";
import { generateSdk, generateSdkZip, GENERATOR_VERSION } from "@specdock/generator";
import { generationErrorCode, sendError } from "./errors.js";
import { resolveGenerateOptions } from "./generation.js";
import { sanitizeForwardHeaders, validateProxyTarget } from "./proxy.js";
import { resolveProxyConfig } from "./proxy-config.js";
import {
  requestPathname,
  resolveStaticAsset,
  resolveWebDistDir,
  setStaticHeaders
} from "./static-assets.js";

export type AppOptions = {
  fetchImplementation?: typeof fetch;
  logger?: boolean;
  webDistDir?: string | null;
};

export const buildApp = (options: AppOptions = {}) => {
  const app = Fastify({
    logger: options.logger ?? true,
    bodyLimit: LIMITS.maxSpecBytes
  });
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const webDistDir = options.webDistDir === undefined ? resolveWebDistDir() : options.webDistDir;

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    sendError(reply, 500, "INTERNAL_SERVER_ERROR", "Unexpected server error.");
  });

  app.get("/api/health", async (): Promise<HealthResponse> => {
    return {
      status: "ok",
      version: APP_VERSION
    };
  });

  app.post<{ Body: GenerateRequest }>("/api/generate", async (request, reply) => {
    try {
      const resolvedOptions = resolveGenerateOptions(request.body?.options);
      const files = generateSdk(request.body?.spec, resolvedOptions);

      return {
        files,
        meta: {
          fileCount: files.length,
          generatedAt: new Date().toISOString(),
          generatorVersion: GENERATOR_VERSION
        }
      };
    } catch (error) {
      return sendError(
        reply,
        400,
        generationErrorCode(error),
        error instanceof Error ? error.message : "SDK generation failed."
      );
    }
  });

  app.post<{ Body: GenerateRequest }>("/api/generate/zip", async (request, reply) => {
    try {
      const resolvedOptions = resolveGenerateOptions(request.body?.options);
      const archive = await generateSdkZip(request.body?.spec, resolvedOptions);

      if (archive.byteLength > LIMITS.maxGeneratedZipBytes) {
        return sendError(reply, 413, "ZIP_TOO_LARGE", "Generated ZIP exceeds the 20 MB limit.");
      }

      reply.header("content-type", "application/zip");
      reply.header("content-disposition", 'attachment; filename="specdock-generated.zip"');
      return reply.send(Buffer.from(archive));
    } catch (error) {
      return sendError(
        reply,
        400,
        generationErrorCode(error),
        error instanceof Error ? error.message : "SDK ZIP generation failed."
      );
    }
  });

  app.post<{ Body: ProxyRequest }>("/api/proxy/request", async (request, reply) => {
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

    if (body && Buffer.byteLength(body, "utf8") > config.maxRequestBodyBytes) {
      return sendError(reply, 413, "REQUEST_TOO_LARGE", "Proxy request body exceeds the configured limit.");
    }

    const target = await validateProxyTarget(proxyRequest?.url, config);
    if ("error" in target) {
      return sendError(reply, target.statusCode, target.error, target.message);
    }

    const requestTimeoutMs = Math.min(proxyRequest.timeoutMs ?? config.timeoutMs, config.timeoutMs);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

    try {
      const upstream = await fetchImplementation(target.url, {
        method: proxyRequest.method,
        headers: sanitizeForwardHeaders(proxyRequest.headers),
        body,
        redirect: "manual",
        signal: controller.signal
      });
      const responseBody = await upstream.text();

      if (Buffer.byteLength(responseBody, "utf8") > config.maxResponseBodyBytes) {
        return sendError(reply, 413, "RESPONSE_TOO_LARGE", "Proxy response body exceeds the configured limit.");
      }

      return {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: Object.fromEntries(upstream.headers.entries()),
        body: responseBody,
        contentType: upstream.headers.get("content-type") ?? undefined,
        durationMs: Math.round(performance.now() - startedAt)
      };
    } catch (error) {
      const isTimeout = error instanceof Error && error.name === "AbortError";
      return sendError(
        reply,
        isTimeout ? 408 : 502,
        isTimeout ? "REQUEST_TIMEOUT" : "UPSTREAM_REQUEST_FAILED",
        isTimeout ? "Proxy request timed out." : "Upstream request failed."
      );
    } finally {
      clearTimeout(timeout);
    }
  });

  app.get("/*", async (request, reply) => {
    const pathname = requestPathname(request.url);

    if (pathname.startsWith("/api/")) {
      return sendError(reply, 404, "NOT_FOUND", "API route not found.");
    }

    if (!webDistDir) {
      return sendError(reply, 404, "WEB_APP_NOT_BUILT", "Web app build is not available.");
    }

    const assetPath = resolveStaticAsset(webDistDir, pathname) ?? resolveStaticAsset(webDistDir, "/index.html");

    if (!assetPath) {
      return sendError(reply, 404, "WEB_APP_NOT_BUILT", "Web app index is not available.");
    }

    setStaticHeaders(reply, assetPath);
    return reply.send(createReadStream(assetPath));
  });

  return app;
};

import type { FastifyInstance } from "fastify";
import { LIMITS, type GenerateRequest } from "@specdock/core";
import { GENERATOR_VERSION } from "@specdock/generator";
import { generationErrorCode, sendError } from "./errors.js";
import { resolveGenerateOptions } from "./generation.js";
import {
  GeneratedOutputTooLargeError,
  GenerationTimeoutError,
  runGenerationJob,
  type GenerationRunner
} from "./generation-runner.js";
import { createRateLimit } from "./rate-limit.js";
import { generateRequestSchema } from "./route-schemas.js";

export const registerGenerateRoutes = (
  app: FastifyInstance,
  generationRunner?: GenerationRunner
): void => {
  const generateRateLimit = createRateLimit("generate", {
    maxRequests: 30,
    windowMs: 60_000
  });

  app.post<{ Body: GenerateRequest }>(
    "/api/generate",
    { schema: generateRequestSchema, preHandler: generateRateLimit },
    async (request, reply) => {
      try {
        const resolvedOptions = resolveGenerateOptions(request.body?.options);
        const result = await runGenerationJob(
          {
            kind: "files",
            spec: request.body?.spec,
            options: resolvedOptions
          },
          generationRunner
        );

        if (result.kind !== "files") {
          return sendError(
            reply,
            500,
            "GENERATION_FAILED",
            "SDK generation returned an unexpected result."
          );
        }

        if (generatedFilesByteLength(result.files) > LIMITS.maxGeneratedBytes) {
          return sendError(
            reply,
            413,
            "GENERATED_OUTPUT_TOO_LARGE",
            "Generated SDK output exceeds the 10 MB limit."
          );
        }

        return {
          files: result.files,
          meta: {
            fileCount: result.files.length,
            generatedAt: new Date().toISOString(),
            generatorVersion: GENERATOR_VERSION
          }
        };
      } catch (error) {
        return sendError(
          reply,
          generationStatusCode(error),
          generationErrorCode(error),
          error instanceof Error ? error.message : "SDK generation failed."
        );
      }
    }
  );

  app.post<{ Body: GenerateRequest }>(
    "/api/generate/zip",
    { schema: generateRequestSchema, preHandler: generateRateLimit },
    async (request, reply) => {
      try {
        const resolvedOptions = resolveGenerateOptions(request.body?.options);
        const result = await runGenerationJob(
          {
            kind: "zip",
            spec: request.body?.spec,
            options: resolvedOptions
          },
          generationRunner
        );

        if (result.kind !== "zip") {
          return sendError(
            reply,
            500,
            "GENERATION_FAILED",
            "SDK generation returned an unexpected result."
          );
        }

        const archive = result.archive;

        if (archive.byteLength > LIMITS.maxGeneratedZipBytes) {
          return sendError(
            reply,
            413,
            "ZIP_TOO_LARGE",
            "Generated ZIP exceeds the 20 MB limit."
          );
        }

        reply.header("content-type", "application/zip");
        reply.header(
          "content-disposition",
          'attachment; filename="specdock-generated.zip"'
        );
        return reply.send(Buffer.from(archive));
      } catch (error) {
        return sendError(
          reply,
          generationStatusCode(error),
          generationErrorCode(error),
          error instanceof Error ? error.message : "SDK ZIP generation failed."
        );
      }
    }
  );
};

const generationStatusCode = (error: unknown) => {
  if (error instanceof GenerationTimeoutError) {
    return 408;
  }

  if (error instanceof GeneratedOutputTooLargeError) {
    return 413;
  }

  if (
    error instanceof Error &&
    error.message.includes("too large to generate")
  ) {
    return 413;
  }

  return 400;
};

const generatedFilesByteLength = (files: { content: string }[]) => {
  return files.reduce(
    (total, file) => total + Buffer.byteLength(file.content, "utf8"),
    0
  );
};

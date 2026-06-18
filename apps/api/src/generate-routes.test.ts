import { describe, expect, it } from "vitest";
import {
  defaultGenerateOptions,
  LIMITS,
  type GenerateRequest
} from "@specdock/core";
import { buildApp } from "./app.js";
import {
  GeneratedOutputTooLargeError,
  GenerationTimeoutError
} from "./generation-runner.js";
import type { GenerationRunner } from "./generation-runner.js";

type ErrorPayload = {
  error: {
    code: string;
  };
};

const request: GenerateRequest = {
  options: defaultGenerateOptions,
  spec: {
    openapi: "3.1.0",
    info: { title: "Test", version: "1.0.0" },
    paths: {
      "/users": {
        get: {
          responses: {
            "200": { description: "OK" }
          }
        }
      }
    }
  }
};

describe("generate routes", () => {
  it("returns generated files from the configured runner", async () => {
    const response = await injectGenerate(async () => ({
      kind: "files",
      files: [{ path: "generated/client.ts", content: "export {};" }]
    }));

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      files: [{ path: "generated/client.ts" }],
      meta: { fileCount: 1 }
    });
  });

  it("rejects unsafe output paths before generation", async () => {
    const response = await injectGenerate(
      async () => {
        throw new Error("Runner should not be called.");
      },
      {
        ...request,
        options: {
          ...defaultGenerateOptions,
          outputPath: "../sdk"
        }
      }
    );

    expect(response.statusCode).toBe(400);
    expect(errorCode(response)).toBe("VALIDATION_ERROR");
  });

  it("accepts legacy generate options without an explicit language", async () => {
    const response = await injectGenerate(
      async (job) => ({
        kind: "files",
        files: [
          {
            path: "generated/client.ts",
            content: `language:${job.options.language}`
          }
        ]
      }),
      {
        ...request,
        options: {
          client: "fetch",
          generateTypes: true,
          generateReactQuery: false,
          generateZod: false,
          outputPath: "generated",
          namingStyle: "operationId"
        }
      }
    );

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      files: [{ content: "language:typescript" }]
    });
  });

  it("rejects unsupported SDK languages before generation", async () => {
    const response = await injectGenerate(
      async () => {
        throw new Error("Runner should not be called.");
      },
      {
        ...request,
        options: {
          ...defaultGenerateOptions,
          language: "ruby"
        } as never
      }
    );

    expect(response.statusCode).toBe(400);
    expect(errorCode(response)).toBe("VALIDATION_ERROR");
  });

  it("maps generation timeout errors", async () => {
    const response = await injectGenerate(async () => {
      throw new GenerationTimeoutError();
    });

    expect(response.statusCode).toBe(408);
    expect(errorCode(response)).toBe("GENERATION_TIMEOUT");
  });

  it("rejects oversized generated file responses", async () => {
    const response = await injectGenerate(async () => ({
      kind: "files",
      files: [
        {
          path: "generated/client.ts",
          content: "x".repeat(LIMITS.maxGeneratedBytes + 1)
        }
      ]
    }));

    expect(response.statusCode).toBe(413);
    expect(errorCode(response)).toBe("GENERATED_OUTPUT_TOO_LARGE");
  });

  it("maps child stdout size errors", async () => {
    const response = await injectGenerate(async () => {
      throw new GeneratedOutputTooLargeError();
    });

    expect(response.statusCode).toBe(413);
    expect(errorCode(response)).toBe("GENERATED_OUTPUT_TOO_LARGE");
  });

  it("maps generation complexity errors", async () => {
    const response = await injectGenerate(async () => {
      throw new Error("Specification is too large to generate.");
    });

    expect(response.statusCode).toBe(413);
    expect(errorCode(response)).toBe("GENERATION_TOO_COMPLEX");
  });
});

const injectGenerate = async (
  generationRunner: GenerationRunner,
  payload: GenerateRequest = request
) => {
  const app = buildApp({ generationRunner, logger: false, webDistDir: null });

  try {
    return await app.inject({
      method: "POST",
      url: "/api/generate",
      payload
    });
  } finally {
    await app.close();
  }
};

const errorCode = (response: Awaited<ReturnType<typeof injectGenerate>>) =>
  (response.json() as ErrorPayload).error.code;

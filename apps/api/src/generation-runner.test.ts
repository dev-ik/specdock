import { describe, expect, it, vi } from "vitest";
import { defaultGenerateOptions, LIMITS } from "@specdock/core";
import {
  createGenerationChildEnv,
  GenerationTimeoutError,
  runGenerationJob,
  type GenerationJob
} from "./generation-runner.js";

const job: GenerationJob = {
  kind: "files",
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

describe("generation runner", () => {
  it("runs generation jobs in an isolated process", async () => {
    const result = await runGenerationJob(job);

    expect(result.kind).toBe("files");
    if (result.kind === "files") {
      expect(result.files.map((file) => file.path)).toContain(
        "generated/client.ts"
      );
    }
  });

  it("times out hanging generation jobs", async () => {
    vi.useFakeTimers();

    try {
      const promise = runGenerationJob(job, () => new Promise(() => undefined));
      const assertion = expect(promise).rejects.toBeInstanceOf(
        GenerationTimeoutError
      );

      await vi.advanceTimersByTimeAsync(LIMITS.generateTimeoutMs);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not forward sensitive server environment variables", () => {
    const env = createGenerationChildEnv({
      AWS_SECRET_ACCESS_KEY: "secret",
      DATABASE_URL: "postgres://secret",
      GITLAB_TOKEN: "token",
      NODE_ENV: "test",
      PATH: "/usr/bin",
      TMPDIR: "/tmp"
    });

    expect(env).toEqual({
      NODE_ENV: "test",
      PATH: "/usr/bin",
      TMPDIR: "/tmp"
    });
  });
});

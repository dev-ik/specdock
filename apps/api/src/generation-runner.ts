import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  LIMITS,
  type GeneratedFile,
  type GenerateOptions
} from "@specdock/core";

export type GenerationJob = {
  kind: "files" | "zip";
  spec: unknown;
  options: GenerateOptions;
};

export type GenerationResult =
  | { kind: "files"; files: GeneratedFile[] }
  | { kind: "zip"; archive: Uint8Array };

export type GenerationRunner = (
  job: GenerationJob,
  signal: AbortSignal
) => Promise<GenerationResult>;

export class GenerationTimeoutError extends Error {
  constructor() {
    super("SDK generation timed out after 10 seconds.");
    this.name = "GenerationTimeoutError";
  }
}

export class GeneratedOutputTooLargeError extends Error {
  constructor() {
    super("Generated SDK output exceeds the configured size limit.");
    this.name = "GeneratedOutputTooLargeError";
  }
}

export const runGenerationJob = async (
  job: GenerationJob,
  runner: GenerationRunner = runGenerationInIsolatedProcess
): Promise<GenerationResult> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIMITS.generateTimeoutMs);

  try {
    return await Promise.race([
      runner(job, controller.signal),
      generationTimeout(controller.signal)
    ]);
  } finally {
    clearTimeout(timer);
  }
};

export const runGenerationInIsolatedProcess: GenerationRunner = (job, signal) =>
  new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new GenerationTimeoutError());
      return;
    }

    const child = spawn(process.execPath, generationProcessArgs(), {
      cwd: process.cwd(),
      env: createGenerationChildEnv(process.env),
      stdio: ["pipe", "pipe", "pipe"]
    });
    let settled = false;
    let stdout = "";
    let stderr = "";

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      signal.removeEventListener("abort", abort);
      callback();
    };
    const abort = () => {
      child.kill("SIGTERM");
      finish(() => reject(new GenerationTimeoutError()));
    };

    signal.addEventListener("abort", abort, { once: true });
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (Buffer.byteLength(stdout, "utf8") > generationStdoutLimit(job)) {
        child.kill("SIGTERM");
        finish(() => reject(new GeneratedOutputTooLargeError()));
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.once("error", (error) => finish(() => reject(error)));
    child.once("exit", (code, signalName) => {
      finish(() => {
        if (code !== 0) {
          reject(
            new Error(
              `Generator process failed with ${signalName ?? `code ${code}`}. ${stderr}`.trim()
            )
          );
          return;
        }

        resolve(readGenerationResponse(stdout));
      });
    });
    child.stdin.end(JSON.stringify(job));
  });

export const createGenerationChildEnv = (
  source: NodeJS.ProcessEnv
): NodeJS.ProcessEnv => {
  const allowedNames = [
    "NODE_ENV",
    "PATH",
    "SystemRoot",
    "TEMP",
    "TMP",
    "TMPDIR"
  ];
  const env: NodeJS.ProcessEnv = {};

  for (const name of allowedNames) {
    if (source[name] !== undefined) {
      env[name] = source[name];
    }
  }

  return env;
};

const generationTimeout = (signal: AbortSignal): Promise<never> =>
  new Promise((_resolve, reject) => {
    if (signal.aborted) {
      reject(new GenerationTimeoutError());
      return;
    }

    signal.addEventListener(
      "abort",
      () => reject(new GenerationTimeoutError()),
      { once: true }
    );
  });

const generationProcessArgs = () => [
  "--import",
  "tsx",
  fileURLToPath(new URL(generationChildFileName(), import.meta.url))
];

const generationChildFileName = () =>
  import.meta.url.endsWith(".ts")
    ? "./generation-child.ts"
    : "./generation-child.js";

const generationStdoutLimit = (job: GenerationJob): number => {
  if (job.kind === "zip") {
    return Math.ceil((LIMITS.maxGeneratedZipBytes * 4) / 3) + 1024 * 1024;
  }

  return LIMITS.maxGeneratedBytes + 1024 * 1024;
};

type GenerationChildMessage =
  | { ok: true; result: { kind: "files"; files: GeneratedFile[] } }
  | { ok: true; result: { kind: "zip"; archiveBase64: string } }
  | { ok: false; error: { name: string; message: string } };

const readGenerationResponse = (stdout: string): GenerationResult => {
  const message = JSON.parse(stdout) as GenerationChildMessage;

  if (!message.ok) {
    const error = new Error(message.error.message);
    error.name = message.error.name;
    throw error;
  }

  if (message.result.kind === "zip") {
    return {
      kind: "zip",
      archive: Buffer.from(message.result.archiveBase64, "base64")
    };
  }

  return message.result;
};

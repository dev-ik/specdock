import { createServer } from "node:net";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../../../api/src/app.js";
import {
  LIMITS,
  type GeneratedFile
} from "@specdock/core";
import {
  generateSdk,
  generateSdkZip
} from "@specdock/generator";
import type {
  GenerationJob,
  GenerationResult,
  GenerationRunner
} from "../../../api/src/generation-runner.js";
import {
  applyDesktopRuntimeEnv,
  createDesktopRuntimeEnv,
  registerDesktopSettingsRoutes
} from "./runtime-settings.js";

export { registerDesktopSettingsRoutes } from "./runtime-settings.js";

export const DESKTOP_API_HOST = "127.0.0.1";

export type DesktopApiProcess = {
  baseUrl: string;
  stop: () => void;
};

export type StartDesktopApiOptions = {
  env?: NodeJS.ProcessEnv;
  port?: number;
  webDistDir: string;
};

export function formatDesktopApiBaseUrl(port: number): string {
  return `http://${DESKTOP_API_HOST}:${port}`;
}

export function createDesktopApiEnv(
  baseEnv: NodeJS.ProcessEnv,
  port: number,
  webDistDir: string
): NodeJS.ProcessEnv {
  return {
    ...baseEnv,
    ...createDesktopRuntimeEnv(),
    APP_IP: DESKTOP_API_HOST,
    HOST: DESKTOP_API_HOST,
    APP_PORT: String(port),
    PORT: String(port),
    TRUST_PROXY: "false",
    WEB_DIST_DIR: webDistDir
  };
}

export async function findFreeLoopbackPort(): Promise<number> {
  return await new Promise((resolve, reject) => {
    const server = createServer();

    server.once("error", reject);
    server.listen(0, DESKTOP_API_HOST, () => {
      const address = server.address();

      server.close(() => {
        if (typeof address === "object" && address) {
          resolve(address.port);
          return;
        }

        reject(new Error("Unable to allocate desktop API port."));
      });
    });
  });
}

export async function startDesktopApi(
  options: StartDesktopApiOptions
): Promise<DesktopApiProcess> {
  const port = options.port ?? (await findFreeLoopbackPort());
  const baseUrl = formatDesktopApiBaseUrl(port);
  const env = createDesktopApiEnv(
    options.env ?? process.env,
    port,
    options.webDistDir
  );
  applyDesktopApiEnv(env);

  const server = buildApp({
    generationRunner: runDesktopGenerationJob,
    logger: false,
    mockRoutesMode: "runtime",
    webDistDir: options.webDistDir
  });
  registerDesktopSettingsRoutes(server);

  await server.listen({ port, host: DESKTOP_API_HOST });

  return {
    baseUrl,
    stop: () => stopServer(server)
  };
}

function applyDesktopApiEnv(env: NodeJS.ProcessEnv): void {
  process.env.APP_IP = env.APP_IP;
  process.env.HOST = env.HOST;
  process.env.APP_PORT = env.APP_PORT;
  process.env.PORT = env.PORT;
  applyDesktopRuntimeEnv(env);
  process.env.TRUST_PROXY = env.TRUST_PROXY;
  process.env.WEB_DIST_DIR = env.WEB_DIST_DIR;
}

function stopServer(server: FastifyInstance): void {
  void server.close();
}

const textEncoder = new TextEncoder();

const runDesktopGenerationJob: GenerationRunner = async (
  job: GenerationJob,
  signal: AbortSignal
): Promise<GenerationResult> => {
  if (signal.aborted) {
    throw new Error("SDK generation was aborted.");
  }

  if (job.kind === "zip") {
    const archive = await generateSdkZip(job.spec, job.options);

    if (archive.byteLength > LIMITS.maxGeneratedZipBytes) {
      throw new Error("Generated SDK ZIP exceeds the configured size limit.");
    }

    return { kind: "zip", archive };
  }

  const files = generateSdk(job.spec, job.options);
  assertGeneratedFilesSize(files);
  return { kind: "files", files };
};

function assertGeneratedFilesSize(files: GeneratedFile[]): void {
  const bytes = files.reduce(
    (total, file) => total + textEncoder.encode(file.content).byteLength,
    0
  );

  if (bytes > LIMITS.maxGeneratedBytes) {
    throw new Error("Generated SDK output exceeds the configured size limit.");
  }
}

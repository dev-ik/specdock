import type { HttpMethod } from "./openapi-types.js";

export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type HealthResponse = {
  status: "ok";
  version: string;
};

export type GenerateRequest = {
  spec: unknown;
  options: GenerateOptions;
};

export type GenerateResponse = {
  files: GeneratedFile[];
  meta: {
    fileCount: number;
    generatedAt: string;
    generatorVersion: string;
  };
};

export type ProxyRequest = {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
};

export type ProxyResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType?: string;
  durationMs: number;
};

export type GeneratedFile = {
  path: string;
  content: string;
};

export type GenerateOptions = {
  client: "fetch" | "axios";
  generateTypes: boolean;
  generateReactQuery: boolean;
  generateZod: boolean;
  outputPath: string;
  namingStyle: "operationId" | "camelCase";
};

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

export type AppConfigResponse = {
  version: string;
  publicDemo: boolean;
  directRequest: {
    restricted: boolean;
    allowedHosts: string[];
  };
  mockServer: {
    enabled: boolean;
  };
};

export type GenerateRequest = {
  spec: unknown;
  options?: Partial<GenerateOptions>;
};

export type GenerateResponse = {
  files: GeneratedFile[];
  meta: {
    fileCount: number;
    generatedAt: string;
    generatorVersion: string;
    outputPlan: GeneratedOutputPlan;
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

export type MockResponseRequest = {
  spec: unknown;
  method: HttpMethod;
  path: string;
  statusCode?: string;
};

export type MockResponseResult = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType?: string;
  operationId?: string;
};

export type MockRouteUpsertRequest = {
  method: HttpMethod;
  path: string;
  status: number;
  statusText?: string;
  body: string;
  contentType?: string;
  operationId?: string;
};

export type MockRouteSummary = {
  method: HttpMethod;
  path: string;
  status: number;
  contentType?: string;
  operationId?: string;
  url: string;
};

export type MockRouteUpsertResponse = {
  route: MockRouteSummary;
};

export type MockRoutesResponse = {
  routes: MockRouteSummary[];
};

export type GeneratedFile = {
  path: string;
  content: string;
};

export type GeneratedOutputPlanEntry = {
  path: string;
  relativePath: string;
  bytes: number;
};

export type GeneratedOutputPlan = {
  outputRoot: string;
  fileCount: number;
  totalBytes: number;
  pathPolicy: "relative-no-traversal";
  files: GeneratedOutputPlanEntry[];
};

export type GenerateLanguage =
  | "typescript"
  | "python"
  | "go"
  | "java"
  | "csharp"
  | "php";

export type GenerateClient = "fetch" | "axios";

export type GenerateOptions = {
  language: GenerateLanguage;
  client: GenerateClient;
  generateTypes: boolean;
  generateReactQuery: boolean;
  generateZod: boolean;
  outputPath: string;
  namingStyle: "operationId" | "camelCase";
  packageName: string;
  clientName: string;
  baseUrlStrategy: "constructor" | "perRequest";
};

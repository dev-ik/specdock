import type { GenerateOptions, UserSettings } from "./types.js";

export const APP_VERSION = "0.5.0";
export const CURRENT_STORAGE_VERSION = "1";

export const STORAGE_KEYS = {
  projects: "specdock:projects",
  environments: "specdock:environments",
  authProfiles: "specdock:authProfiles",
  history: "specdock:history",
  settings: "specdock:settings",
  activeProjectId: "specdock:activeProjectId",
  storageVersion: "specdock:storageVersion"
} as const;

export const LIMITS = {
  maxSpecBytes: 10 * 1024 * 1024,
  maxStoredProjects: 10,
  maxHistoryItems: 100,
  maxGeneratedFiles: 100,
  maxGeneratedBytes: 10 * 1024 * 1024,
  maxGeneratedZipBytes: 20 * 1024 * 1024,
  maxGeneratePaths: 2_000,
  maxGenerateOperations: 2_000,
  maxGenerateSchemas: 2_000,
  maxProxyRequestBodyBytes: 5 * 1024 * 1024,
  maxProxyResponseBodyBytes: 10 * 1024 * 1024,
  generateTimeoutMs: 10_000,
  proxyTimeoutMs: 15_000
} as const;

export const defaultGenerateOptions: GenerateOptions = {
  language: "typescript",
  client: "fetch",
  generateTypes: true,
  generateReactQuery: false,
  generateZod: false,
  outputPath: "generated",
  namingStyle: "operationId",
  packageName: "specdock-generated-client",
  clientName: "SpecDockClient",
  baseUrlStrategy: "constructor"
};

export const defaultSettings: UserSettings = {
  theme: "dark",
  defaultClient: "fetch",
  defaultRequestMode: "direct"
};

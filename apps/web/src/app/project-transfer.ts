import { z } from "zod";
import {
  defaultGenerateOptions,
  type GenerateOptions,
  type OpenApiProject,
  type RequestState
} from "@specdock/core";
import {
  hydrateStoredRequestStates,
  sanitizeRequestStatesForStorage
} from "./request-state-storage.js";

const requestStateSchema = z.object({
  operationId: z.string(),
  authProfileId: z.string().optional(),
  pathParams: z.record(z.string()),
  queryParams: z.record(z.string()),
  requestMode: z.enum(["direct", "proxy"])
});

const exportSchema = z.object({
  format: z.literal("specdock.project"),
  version: z.literal(1),
  exportedAt: z.string(),
  project: z.object({
    name: z.string(),
    source: z.unknown(),
    specFormat: z.enum(["openapi3", "swagger2"]).optional(),
    spec: z.unknown()
  }),
  preferences: z.object({
    baseUrl: z.string().optional(),
    requestStates: z.record(requestStateSchema).default({}),
    generateOptions: z.object({
      language: z.enum(["typescript", "python", "go", "java", "csharp", "php"]).default(defaultGenerateOptions.language),
      client: z.enum(["fetch", "axios"]).default(defaultGenerateOptions.client),
      generateTypes: z.boolean().default(defaultGenerateOptions.generateTypes),
      generateReactQuery: z.boolean().default(defaultGenerateOptions.generateReactQuery),
      generateZod: z.boolean().default(defaultGenerateOptions.generateZod),
      outputPath: z.string().default(defaultGenerateOptions.outputPath),
      namingStyle: z.enum(["operationId", "camelCase"]).default(defaultGenerateOptions.namingStyle),
      packageName: z.string().default(defaultGenerateOptions.packageName),
      clientName: z.string().default(defaultGenerateOptions.clientName),
      baseUrlStrategy: z.enum(["constructor", "perRequest"]).default(defaultGenerateOptions.baseUrlStrategy)
    }).partial().default({})
  })
});

export type ProjectImportPayload = z.infer<typeof exportSchema>;

export const createProjectExport = ({
  project,
  baseUrl,
  requestStates,
  generateOptions
}: {
  project: OpenApiProject;
  baseUrl?: string;
  requestStates: Record<string, RequestState>;
  generateOptions: GenerateOptions;
}): string => {
  const operationPrefix = `${project.id}::`;
  const safeRequestStates = Object.fromEntries(
    Object.entries(sanitizeRequestStatesForStorage(requestStates))
      .filter(([key]) => key.startsWith(operationPrefix))
      .map(([key, value]) => [key.slice(operationPrefix.length), value])
  );

  return JSON.stringify({
    format: "specdock.project",
    version: 1,
    exportedAt: new Date().toISOString(),
    project: {
      name: project.name,
      source: project.source,
      specFormat: project.specFormat,
      spec: project.spec
    },
    preferences: {
      baseUrl,
      requestStates: safeRequestStates,
      generateOptions
    }
  }, null, 2);
};

export const parseProjectExport = (text: string): ProjectImportPayload => {
  const parsed = exportSchema.parse(JSON.parse(text)) as ProjectImportPayload;
  return {
    ...parsed,
    preferences: {
      ...parsed.preferences,
      requestStates: hydrateStoredRequestStates(parsed.preferences.requestStates)
    }
  };
};

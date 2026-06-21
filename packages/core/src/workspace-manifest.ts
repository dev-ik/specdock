import { z } from "zod";
import { defaultGenerateOptions } from "./constants.js";
import { isSensitiveParameterName } from "./security.js";
import type { GenerateOptions, OpenApiProject, RequestState } from "./types.js";

export const PROJECT_EXPORT_FORMAT = "specdock.project";
export const CURRENT_PROJECT_EXPORT_VERSION = 2;
export const CURRENT_REDACTION_POLICY_VERSION = 1;

export type PersistedRequestState = Pick<
  RequestState,
  "operationId" | "authProfileId" | "pathParams" | "queryParams" | "requestMode"
>;

export type ProjectImportPayload = {
  format: typeof PROJECT_EXPORT_FORMAT;
  version: typeof CURRENT_PROJECT_EXPORT_VERSION;
  exportedAt: string;
  redactionPolicyVersion: typeof CURRENT_REDACTION_POLICY_VERSION;
  project: {
    name: string;
    source: unknown;
    specFormat?: "openapi3" | "swagger2";
    spec: unknown;
  };
  preferences: {
    baseUrl?: string;
    requestStates: Record<string, RequestState>;
    generateOptions: Partial<GenerateOptions>;
  };
};

const persistedRequestStateSchema = z.object({
  operationId: z.string().min(1),
  authProfileId: z.string().min(1).optional(),
  pathParams: z.record(z.string()).default({}),
  queryParams: z.record(z.string()).default({}),
  requestMode: z.enum(["direct", "proxy"])
}).strict();

const generateOptionsSchema = z.object({
  language: z.enum(["typescript", "python", "go", "java", "csharp", "php"]),
  client: z.enum(["fetch", "axios"]),
  generateTypes: z.boolean(),
  generateReactQuery: z.boolean(),
  generateZod: z.boolean(),
  outputPath: z.string(),
  namingStyle: z.enum(["operationId", "camelCase"]),
  packageName: z.string(),
  clientName: z.string(),
  baseUrlStrategy: z.enum(["constructor", "perRequest"])
}).partial().strict().default({});

const preferencesSchema = z.object({
  baseUrl: z.string().optional(),
  requestStates: z.record(persistedRequestStateSchema).default({}),
  generateOptions: generateOptionsSchema
}).strict();

const projectV1Schema = z.object({
  name: z.string().min(1),
  source: z.unknown(),
  specFormat: z.enum(["openapi3", "swagger2"]).optional(),
  spec: z.unknown()
}).strict();

const projectV2Schema = z.object({
  metadata: z.object({
    name: z.string().min(1)
  }).strict(),
  source: z.unknown(),
  specFormat: z.enum(["openapi3", "swagger2"]).optional(),
  spec: z.unknown()
}).strict();

const exportV1Schema = z.object({
  format: z.literal(PROJECT_EXPORT_FORMAT),
  version: z.literal(1),
  exportedAt: z.string(),
  project: projectV1Schema,
  preferences: preferencesSchema
}).strict();

const exportV2Schema = z.object({
  format: z.literal(PROJECT_EXPORT_FORMAT),
  version: z.literal(CURRENT_PROJECT_EXPORT_VERSION),
  exportedAt: z.string(),
  redactionPolicyVersion: z.literal(CURRENT_REDACTION_POLICY_VERSION),
  project: projectV2Schema,
  preferences: preferencesSchema
}).strict();

export const sanitizeRequestStatesForStorage = (
  requestStates: Record<string, RequestState>
): Record<string, PersistedRequestState> => {
  return Object.fromEntries(
    Object.entries(requestStates).map(([key, state]) => [key, sanitizeRequestStateForStorage(state)])
  );
};

export const hydrateStoredRequestStates = (
  requestStates: Partial<Record<string, Partial<RequestState>>>
): Record<string, RequestState> => {
  return Object.fromEntries(
    Object.entries(requestStates).flatMap(([key, state]) => {
      if (!state?.operationId) {
        return [];
      }

      return [
        [
          key,
          {
            operationId: state.operationId,
            authProfileId: typeof state.authProfileId === "string" ? state.authProfileId : undefined,
            pathParams: safeRecord(state.pathParams),
            queryParams: safeQueryParams(state.queryParams),
            headers: {},
            body: undefined,
            requestMode: state.requestMode === "proxy" ? "proxy" : "direct"
          }
        ]
      ];
    })
  );
};

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
    format: PROJECT_EXPORT_FORMAT,
    version: CURRENT_PROJECT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    redactionPolicyVersion: CURRENT_REDACTION_POLICY_VERSION,
    project: {
      metadata: { name: project.name },
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
  const parsed = JSON.parse(text) as unknown;
  const version = z.object({ version: z.union([z.literal(1), z.literal(2)]) })
    .passthrough()
    .parse(parsed).version;

  return version === 1
    ? normalizeV1Export(exportV1Schema.parse(parsed))
    : normalizeV2Export(exportV2Schema.parse(parsed));
};

const normalizeV1Export = (
  parsed: z.infer<typeof exportV1Schema>
): ProjectImportPayload => ({
  format: PROJECT_EXPORT_FORMAT,
  version: CURRENT_PROJECT_EXPORT_VERSION,
  exportedAt: parsed.exportedAt,
  redactionPolicyVersion: CURRENT_REDACTION_POLICY_VERSION,
  project: {
    name: parsed.project.name,
    source: parsed.project.source,
    specFormat: parsed.project.specFormat,
    spec: parsed.project.spec
  },
  preferences: normalizePreferences(parsed.preferences)
});

const normalizeV2Export = (
  parsed: z.infer<typeof exportV2Schema>
): ProjectImportPayload => ({
  format: PROJECT_EXPORT_FORMAT,
  version: CURRENT_PROJECT_EXPORT_VERSION,
  exportedAt: parsed.exportedAt,
  redactionPolicyVersion: CURRENT_REDACTION_POLICY_VERSION,
  project: {
    name: parsed.project.metadata.name,
    source: parsed.project.source,
    specFormat: parsed.project.specFormat,
    spec: parsed.project.spec
  },
  preferences: normalizePreferences(parsed.preferences)
});

const normalizePreferences = (
  preferences: z.infer<typeof preferencesSchema>
): ProjectImportPayload["preferences"] => ({
  baseUrl: preferences.baseUrl,
  requestStates: hydrateStoredRequestStates(preferences.requestStates),
  generateOptions: {
    ...defaultGenerateOptions,
    ...preferences.generateOptions
  }
});

const sanitizeRequestStateForStorage = (
  state: RequestState
): PersistedRequestState => ({
  operationId: state.operationId,
  authProfileId: state.authProfileId,
  pathParams: safeRecord(state.pathParams),
  queryParams: safeQueryParams(state.queryParams),
  requestMode: state.requestMode
});

const safeRecord = (values: Record<string, string> | undefined): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(values ?? {}).filter(([name, value]) => name.trim() && typeof value === "string")
  );
};

const safeQueryParams = (values: Record<string, string> | undefined): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(safeRecord(values)).map(([name, value]) => [
      name,
      isSensitiveParameterName(name) ? "" : value
    ])
  );
};

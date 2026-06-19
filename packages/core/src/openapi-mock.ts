import type { ApiMediaType, ApiOperation, OpenApiProject } from "./types.js";
import { generateSchemaExample } from "./openapi-examples.js";
import { isRecord } from "./openapi-utils.js";

export type MockRequestTarget = {
  method: ApiOperation["method"];
  path: string;
  statusCode?: string;
};

export type MockResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType?: string;
  operationId?: string;
};

export const createMockResponse = (
  project: OpenApiProject,
  target: MockRequestTarget
): MockResponse | undefined => {
  const operation = findMockOperation(project.operations, target);
  if (!operation) {
    return undefined;
  }

  const response = target.statusCode
    ? operation.responses.find((candidate) => candidate.statusCode === target.statusCode)
    : operation.responses.find((candidate) => candidate.statusCode.startsWith("2")) ??
      operation.responses[0];

  if (!response && target.statusCode) {
    return fallbackStatusResponse(Number(target.statusCode) || 500, operation.operationId);
  }

  if (!response) {
    return emptyResponse(204, operation.operationId);
  }

  const mediaType = selectMockMediaType(response.content);
  const contentType = mediaType?.contentType;
  const body = mediaType ? renderMockBody(mediaType, project.spec) : "";

  return {
    status: Number(response.statusCode) || 200,
    statusText: response.description ?? "Mock response",
    headers: contentType ? { "content-type": contentType } : {},
    body,
    contentType,
    operationId: operation.operationId
  };
};

const findMockOperation = (
  operations: ApiOperation[],
  target: MockRequestTarget
): ApiOperation | undefined =>
  operations.find(
    (operation) =>
      operation.method === target.method && operation.path === target.path
  ) ??
  operations.find(
    (operation) =>
      operation.method === target.method && pathTemplateMatches(operation.path, target.path)
  );

const pathTemplateMatches = (template: string, path: string): boolean => {
  const expression = template
    .split("/")
    .map((segment) =>
      segment.startsWith("{") && segment.endsWith("}")
        ? "[^/]+"
        : escapeRegExp(segment)
    )
    .join("/");

  return new RegExp(`^${expression}$`).test(path);
};

const selectMockMediaType = (
  content: ApiMediaType[]
): ApiMediaType | undefined =>
  content.find((mediaType) => mediaType.contentType.includes("application/json")) ??
  content[0];

const renderMockBody = (mediaType: ApiMediaType, spec: unknown): string => {
  const schema = resolveSchemaRefs(mediaType.schema, spec);
  const example = mediaType.example ?? generateSchemaExample(schema);

  if (example === undefined) {
    return "";
  }

  if (typeof example === "string" && !mediaType.contentType.includes("json")) {
    return example;
  }

  return typeof example === "string"
    ? example
    : JSON.stringify(example, null, 2);
};

const emptyResponse = (
  status: number,
  operationId: string | undefined
): MockResponse => ({
  status,
  statusText: "Mock response",
  headers: {},
  body: "",
  operationId
});

const fallbackStatusResponse = (
  status: number,
  operationId: string | undefined
): MockResponse => ({
  status,
  statusText: statusTextFor(status),
  headers: { "content-type": "application/json" },
  body: JSON.stringify(
    {
      error: {
        code: `MOCK_${status}`,
        message: statusTextFor(status)
      }
    },
    null,
    2
  ),
  contentType: "application/json",
  operationId
});

const statusTextFor = (status: number): string => {
  if (status === 400) return "Bad Request";
  if (status === 401) return "Unauthorized";
  if (status === 403) return "Forbidden";
  if (status === 404) return "Not Found";
  if (status === 409) return "Conflict";
  if (status === 422) return "Unprocessable Entity";
  if (status === 500) return "Internal Server Error";

  return status >= 400 ? "Mock error response" : "Mock response";
};

const resolveSchemaRefs = (
  schema: unknown,
  document: unknown,
  depth = 0
): unknown => {
  if (!isRecord(schema) || depth > 8) {
    return schema;
  }

  if (typeof schema.$ref === "string") {
    return resolveSchemaRefs(resolveJsonPointer(document, schema.$ref), document, depth + 1);
  }

  return Object.fromEntries(
    Object.entries(schema).map(([key, value]) => [
      key,
      Array.isArray(value)
        ? value.map((item) => resolveSchemaRefs(item, document, depth + 1))
        : resolveSchemaRefs(value, document, depth + 1)
    ])
  );
};

const resolveJsonPointer = (
  document: unknown,
  ref: string
): unknown => {
  if (!ref.startsWith("#/")) {
    return undefined;
  }

  return ref
    .slice(2)
    .split("/")
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>(
      (current, part) => isRecord(current) ? current[part] : undefined,
      document
    );
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

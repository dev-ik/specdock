import type { ApiMediaType, ApiOperation, ApiParameter, ApiResponse, OpenApiProject } from "./types.js";
import {
  diffRequiredRequestProperties,
  diffRequiredResponseProperties
} from "./openapi-diff-schema.js";

export type OpenApiDiffSeverity = "breaking" | "non-breaking" | "info";

export type OpenApiDiffCode =
  | "operation-added"
  | "operation-removed"
  | "request-required-property-added"
  | "response-required-property-added"
  | "required-parameter-added"
  | "request-body-required"
  | "response-status-added"
  | "response-status-removed"
  | "response-schema-changed";

export type OpenApiDiffFinding = {
  severity: OpenApiDiffSeverity;
  code: OpenApiDiffCode;
  message: string;
  method?: ApiOperation["method"];
  path?: string;
  tags?: string[];
  location: string;
};

export const diffOpenApiProjects = (
  previous: OpenApiProject | undefined,
  current: OpenApiProject | undefined
): OpenApiDiffFinding[] => {
  if (!previous || !current) {
    return [];
  }

  const previousOperations = operationMap(previous.operations);
  const currentOperations = operationMap(current.operations);
  const findings: OpenApiDiffFinding[] = [];

  for (const [key, operation] of previousOperations) {
    if (!currentOperations.has(key)) {
      findings.push(operationFinding("breaking", "operation-removed", operation));
    }
  }

  for (const [key, operation] of currentOperations) {
    const previousOperation = previousOperations.get(key);
    if (!previousOperation) {
      findings.push(operationFinding("non-breaking", "operation-added", operation));
      continue;
    }

    findings.push(...diffOperation(previousOperation, operation));
  }

  return findings;
};

const diffOperation = (
  previous: ApiOperation,
  current: ApiOperation
): OpenApiDiffFinding[] => [
  ...diffRequiredParameters(previous, current),
  ...diffRequiredRequestProperties(previous, current),
  ...diffRequestBody(previous, current),
  ...diffResponses(previous, current)
];

const diffRequiredParameters = (
  previous: ApiOperation,
  current: ApiOperation
): OpenApiDiffFinding[] => {
  const previousParams = parameterMap(previous.parameters);

  return current.parameters
    .filter((parameter) => parameter.required)
    .filter((parameter) => !previousParams.get(parameterKey(parameter))?.required)
    .map((parameter) => ({
      severity: "breaking",
      code: "required-parameter-added",
      method: current.method,
      path: current.path,
      tags: current.tags,
      location: `${current.method} ${current.path} parameter ${parameter.in}.${parameter.name}`,
      message: `Required ${parameter.in} parameter "${parameter.name}" was added.`
    }));
};

const diffRequestBody = (
  previous: ApiOperation,
  current: ApiOperation
): OpenApiDiffFinding[] => {
  if (!previous.requestBody?.required && current.requestBody?.required) {
    return [
      {
        severity: "breaking",
        code: "request-body-required",
        method: current.method,
        path: current.path,
        tags: current.tags,
        location: `${current.method} ${current.path} requestBody`,
        message: "Request body became required."
      }
    ];
  }

  return [];
};

const diffResponses = (
  previous: ApiOperation,
  current: ApiOperation
): OpenApiDiffFinding[] => {
  const previousResponses = responseMap(previous.responses);
  const currentResponses = responseMap(current.responses);
  const findings: OpenApiDiffFinding[] = [];

  for (const [statusCode, response] of previousResponses) {
    const currentResponse = currentResponses.get(statusCode);
    if (!currentResponse) {
      findings.push(responseFinding("breaking", "response-status-removed", current, statusCode));
      continue;
    }

    if (stableJson(response.content) !== stableJson(currentResponse.content)) {
      findings.push(
        ...diffRequiredResponseProperties(response, currentResponse, current, statusCode)
      );
      findings.push({
        severity: "breaking",
        code: "response-schema-changed",
        method: current.method,
        path: current.path,
        tags: current.tags,
        location: `${current.method} ${current.path} response ${statusCode}`,
        message: `Response ${statusCode} schema or content changed.`
      });
    }
  }

  for (const statusCode of currentResponses.keys()) {
    if (!previousResponses.has(statusCode)) {
      findings.push(responseFinding("info", "response-status-added", current, statusCode));
    }
  }

  return findings;
};

const operationFinding = (
  severity: OpenApiDiffSeverity,
  code: "operation-added" | "operation-removed",
  operation: ApiOperation
): OpenApiDiffFinding => ({
  severity,
  code,
  method: operation.method,
  path: operation.path,
  tags: operation.tags,
  location: `${operation.method} ${operation.path}`,
  message:
    code === "operation-added"
      ? `${operation.method} ${operation.path} was added.`
      : `${operation.method} ${operation.path} was removed.`
});

const responseFinding = (
  severity: OpenApiDiffSeverity,
  code: "response-status-added" | "response-status-removed",
  operation: ApiOperation,
  statusCode: string
): OpenApiDiffFinding => ({
  severity,
  code,
  method: operation.method,
  path: operation.path,
  tags: operation.tags,
  location: `${operation.method} ${operation.path} response ${statusCode}`,
  message:
    code === "response-status-added"
      ? `Response ${statusCode} was added.`
      : `Response ${statusCode} was removed.`
});

const operationMap = (
  operations: ApiOperation[]
): Map<string, ApiOperation> => new Map(operations.map((operation) => [
  `${operation.method} ${operation.path}`,
  operation
]));

const parameterMap = (
  parameters: ApiParameter[]
): Map<string, ApiParameter> =>
  new Map(parameters.map((parameter) => [parameterKey(parameter), parameter]));

const responseMap = (responses: ApiResponse[]): Map<string, ApiResponse> =>
  new Map(responses.map((response) => [response.statusCode, response]));

const parameterKey = (parameter: ApiParameter): string =>
  `${parameter.in}.${parameter.name}`;

const stableJson = (value: ApiMediaType[]): string =>
  JSON.stringify(sortValue(value));

const sortValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortValue(child)])
    );
  }

  return value;
};

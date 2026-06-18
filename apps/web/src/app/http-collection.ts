import {
  generateRequestBodyExample,
  isSensitiveHeaderName,
  isSensitiveParameterName,
  REDACTED_VALUE,
  type ApiOperation,
  type OpenApiProject,
  type RequestState
} from "@specdock/core";
import { createOperationKey } from "./request-utils.js";
import type { RequestStateMap } from "./types.js";

type HttpCollectionInput = {
  project: OpenApiProject;
  baseUrl: string;
  requestStates: RequestStateMap;
};

export const createHttpCollection = ({
  project,
  baseUrl,
  requestStates
}: HttpCollectionInput): string => {
  const resolvedBaseUrl =
    baseUrl.trim() || project.servers[0]?.url || "https://api.example.com";
  const lines = [
    `@baseUrl = ${singleLine(resolvedBaseUrl).replace(/\/+$/, "")}`,
    "",
    `# ${singleLine(project.name)}`,
    ""
  ];

  for (const operation of project.operations) {
    const requestState =
      requestStates[createOperationKey(project.id, operation.id)];
    lines.push(...formatOperation(operation, requestState), "");
  }

  return `${lines.join("\n").trimEnd()}\n`;
};

const formatOperation = (
  operation: ApiOperation,
  requestState: RequestState | undefined
): string[] => {
  const headers = createHeaderLines(operation, requestState);
  const body = safeRequestBodyExample(operation);
  const bodyContentType = selectRequestContentType(operation);
  const lines = [
    `### ${singleLine(operation.operationId ?? operation.id)}`,
    `${operation.method} {{baseUrl}}${createRequestPath(operation, requestState)}`
  ];

  if (body && bodyContentType && !headers.some((header) => /^content-type:/i.test(header))) {
    headers.unshift(`Content-Type: ${bodyContentType}`);
  }

  if (headers.length > 0) {
    lines.push(...headers);
  }

  if (body) {
    lines.push("", body);
  }

  return lines;
};

const createRequestPath = (
  operation: ApiOperation,
  requestState: RequestState | undefined
): string => {
  const path = operation.path.replace(/\{([^}]+)\}/g, (_match, name: string) =>
    formatPathValue(valueForParameter(name, requestState?.pathParams[name]))
  );
  const query = createQueryString(operation, requestState);

  return query ? `${singleLine(path)}?${query}` : singleLine(path);
};

const createQueryString = (
  operation: ApiOperation,
  requestState: RequestState | undefined
): string => {
  const values = new Map<string, string>();

  for (const parameter of operation.parameters.filter((item) => item.in === "query")) {
    const stateValue = requestState?.queryParams[parameter.name];
    const value =
      stateValue && stateValue.trim()
        ? stateValue
        : parameter.example !== undefined
          ? String(parameter.example)
          : parameter.required
            ? `{{${parameter.name}}}`
            : "";
    if (value) {
      values.set(parameter.name, value);
    }
  }

  for (const [name, value] of Object.entries(requestState?.queryParams ?? {})) {
    if (value.trim()) {
      values.set(name, value);
    }
  }

  return [...values.entries()]
    .map(([name, value]) => {
      const safeValue = isSensitiveParameterName(name) ? REDACTED_VALUE : value;
      return `${encodeURIComponent(name)}=${encodeURIComponent(safeValue)}`;
    })
    .join("&");
};

const createHeaderLines = (
  operation: ApiOperation,
  requestState: RequestState | undefined
): string[] => {
  const headers = new Map<string, string>();

  for (const parameter of operation.parameters.filter((item) => item.in === "header")) {
    const stateValue = requestState?.headers[parameter.name];
    const value =
      stateValue && stateValue.trim()
        ? stateValue
        : parameter.example !== undefined
          ? String(parameter.example)
          : parameter.required
            ? `{{${parameter.name}}}`
            : "";
    if (value) {
      headers.set(parameter.name, value);
    }
  }

  for (const [name, value] of Object.entries(requestState?.headers ?? {})) {
    if (name.trim() && value.trim()) {
      headers.set(name, value);
    }
  }

  return [...headers.entries()].map(([name, value]) =>
    `${singleLine(name)}: ${isSensitiveHeaderName(name) ? REDACTED_VALUE : singleLine(value)}`
  );
};

const safeRequestBodyExample = (
  operation: ApiOperation
): string | undefined => {
  const example = generateRequestBodyExample(operation);
  if (!example) {
    return undefined;
  }

  try {
    return JSON.stringify(redactSensitiveBodyFields(JSON.parse(example)), null, 2);
  } catch {
    return undefined;
  }
};

const redactSensitiveBodyFields = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveBodyFields);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([name, child]) => [
        name,
        isSensitiveParameterName(name)
          ? REDACTED_VALUE
          : redactSensitiveBodyFields(child)
      ])
    );
  }

  return value;
};

const selectRequestContentType = (operation: ApiOperation): string | undefined => {
  const content = operation.requestBody?.content ?? [];
  return (
    content.find((mediaType) => mediaType.contentType.includes("json")) ??
    content[0]
  )?.contentType;
};

const valueForParameter = (
  name: string,
  stateValue: string | undefined
): string => {
  if (isSensitiveParameterName(name)) {
    return REDACTED_VALUE;
  }

  return stateValue?.trim() ? stateValue : `{{${name}}}`;
};

const formatPathValue = (value: string): string => {
  if (value === REDACTED_VALUE || /^\{\{[^{}]+\}\}$/.test(value)) {
    return value;
  }

  return encodeURIComponent(value);
};

const singleLine = (value: string): string => {
  return value.replace(/[\r\n]+/g, " ").trim();
};

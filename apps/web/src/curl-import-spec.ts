import {
  isSensitiveHeaderName,
  isSensitiveParameterName,
  type HttpMethod
} from "@specdock/core";
import type { ParsedCurl } from "./curl-import-types.js";

export const createCurlImportSpec = (
  parsed: ParsedCurl,
  operationId: string,
  baseUrl: string,
  path: string
) => ({
  openapi: "3.0.3",
  info: {
    title: `cURL ${parsed.method} ${path}`,
    version: "1.0.0",
    description: "Generated from an imported cURL request."
  },
  servers: [{ url: baseUrl }],
  tags: [{ name: "Imported cURL" }],
  paths: {
    [path]: {
      [parsed.method.toLowerCase()]: {
        operationId,
        summary: `${parsed.method} ${path}`,
        tags: ["Imported cURL"],
        parameters: createParameters(parsed),
        ...(parsed.body
          ? { requestBody: createRequestBody(parsed.body, parsed.headers) }
          : {}),
        responses: {
          "200": {
            description: "Imported cURL response"
          }
        }
      }
    }
  }
});

export const createOperationId = (method: HttpMethod, path: string): string => {
  const suffix = path
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[^a-zA-Z0-9]+/g, " "))
    .flatMap((segment) => segment.split(" ").filter(Boolean))
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("");
  return `${method.toLowerCase()}${suffix || "Root"}`;
};

const createParameters = (parsed: ParsedCurl) => [
  ...Array.from(new Set(parsed.url.searchParams.keys())).map((name) => ({
    name,
    in: "query",
    required: false,
    schema: { type: "string" },
    ...(isSensitiveParameterName(name)
      ? {}
      : { example: parsed.url.searchParams.get(name) ?? undefined })
  })),
  ...Object.entries(parsed.headers)
    .filter(([name]) => name.toLowerCase() !== "content-type")
    .map(([name, value]) => ({
      name,
      in: "header",
      required: false,
      schema: { type: "string" },
      ...(isSensitiveHeaderName(name) ? {} : { example: value })
    }))
];

const createRequestBody = (body: string, headers: Record<string, string>) => {
  const contentType =
    findHeader(headers, "content-type") ?? guessContentType(body);
  return {
    required: true,
    content: {
      [contentType]: {
        schema: inferBodySchema(body, contentType)
      }
    }
  };
};

const findHeader = (
  headers: Record<string, string>,
  name: string
): string | undefined => {
  const entry = Object.entries(headers).find(
    ([headerName]) => headerName.toLowerCase() === name
  );
  return entry?.[1];
};

const guessContentType = (body: string): string => {
  const trimmed = body.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[")
    ? "application/json"
    : "application/x-www-form-urlencoded";
};

const parseJsonExample = (
  body: string,
  contentType: string
): unknown | undefined => {
  if (!contentType.includes("json")) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
};

const inferBodySchema = (
  body: string,
  contentType: string
): Record<string, unknown> => {
  const example = parseJsonExample(body, contentType);
  if (Array.isArray(example)) return { type: "array", items: {} };
  if (example && typeof example === "object")
    return { type: "object", additionalProperties: true };
  if (typeof example === "number") return { type: "number" };
  if (typeof example === "boolean") return { type: "boolean" };
  return { type: "string" };
};

import {
  generateRequestBodyExample,
  selectRequestMediaType,
  type ApiOperation,
  type HttpMethod,
  type RequestState
} from "@specdock/core";
import {
  appendSerializedQueryParams,
  serializePathTemplate
} from "./request-serialization.js";

export type ApiRequest = {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: BodyInit;
  bodyPreview?: string;
};

export type ResponseViewModel = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType?: string;
  durationMs: number;
  bodyFormat: "json" | "raw";
};

export const buildApiRequest = (
  operation: ApiOperation,
  requestState: RequestState,
  baseUrl: string,
  bodyFiles: Record<string, File> = {}
): ApiRequest => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
  const path = serializePathTemplate(operation.path, requestState.pathParams, operation.parameters);
  const url = new URL(`${normalizedBaseUrl}${path.startsWith("/") ? path : `/${path}`}`);

  appendSerializedQueryParams(url, requestState.queryParams, operation.parameters);

  const headers = Object.fromEntries(
    Object.entries(requestState.headers).filter(([name, value]) => name.trim() && value.trim())
  );
  const requestBody = createBody(operation, requestState, bodyFiles);
  const requestHeaders = addDefaultContentType(headers, requestBody.body, operation);

  return {
    url: url.toString(),
    method: operation.method,
    headers: requestHeaders,
    body: requestBody.body,
    bodyPreview: requestBody.preview
  };
};

export const generateCurl = (request: ApiRequest): string => {
  const parts = ["curl", "-X", shellQuote(request.method), shellQuote(request.url)];

  for (const [name, value] of Object.entries(request.headers)) {
    parts.push("-H", shellQuote(`${name}: ${value}`));
  }

  if (request.bodyPreview !== undefined) {
    parts.push(request.bodyPreview);
  } else if (typeof request.body === "string") {
    parts.push("--data", shellQuote(request.body));
  }

  return parts.join(" ");
};

export const executeBrowserRequest = async (request: ApiRequest): Promise<ResponseViewModel> => {
  const startedAt = performance.now();
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
  const body = await response.text();
  const contentType = response.headers.get("content-type") ?? undefined;
  const formatted = formatBody(body, contentType);

  return {
    status: response.status,
    statusText: response.statusText,
    headers: Object.fromEntries(response.headers.entries()),
    body: formatted.body,
    contentType,
    durationMs: Math.round(performance.now() - startedAt),
    bodyFormat: formatted.bodyFormat
  };
};

export const createRequestState = (
  operation: ApiOperation,
  requestMode: RequestState["requestMode"] = "direct"
): RequestState => ({
  operationId: operation.id,
  pathParams: Object.fromEntries(
    operation.parameters
      .filter((parameter) => parameter.in === "path")
      .map((parameter) => [parameter.name, parameter.example ? String(parameter.example) : ""])
  ),
  queryParams: Object.fromEntries(
    operation.parameters
      .filter((parameter) => parameter.in === "query")
      .map((parameter) => [parameter.name, parameter.example ? String(parameter.example) : ""])
  ),
  headers: Object.fromEntries(
    operation.parameters
      .filter((parameter) => parameter.in === "header")
      .map((parameter) => [parameter.name, parameter.example ? String(parameter.example) : ""])
  ),
  body: defaultBodyForOperation(operation),
  requestMode
});

export const responseViewerMessageForError = (error: unknown): string => {
  if (error instanceof TypeError) {
    return "CORS blocked this request. This public demo cannot proxy arbitrary API requests for security reasons. Run SpecDock locally or self-host it to use Proxy Mode.";
  }

  return error instanceof Error ? error.message : "Request failed.";
};

const formatBody = (
  body: string,
  contentType: string | undefined
): Pick<ResponseViewModel, "body" | "bodyFormat"> => {
  if (contentType?.includes("json") || looksLikeJson(body)) {
    try {
      return {
        body: JSON.stringify(JSON.parse(body), null, 2),
        bodyFormat: "json"
      };
    } catch {
      return {
        body,
        bodyFormat: "raw"
      };
    }
  }

  return {
    body,
    bodyFormat: "raw"
  };
};

const looksLikeJson = (body: string): boolean => {
  const trimmed = body.trim();
  return trimmed.startsWith("{") || trimmed.startsWith("[");
};

const defaultBodyForMethod = (method: HttpMethod): string | undefined => {
  return ["GET", "HEAD"].includes(method) ? undefined : "{}";
};

const defaultBodyForOperation = (operation: ApiOperation): string | undefined => {
  if (!operation.requestBody) {
    return defaultBodyForMethod(operation.method);
  }

  const example = generateRequestBodyExample(operation);
  if (example !== undefined) {
    return example;
  }

  const contentType = selectRequestMediaType(operation.requestBody.content)?.contentType;
  return contentType?.includes("json") ? "{\n  \n}" : "";
};

const createBody = (
  operation: ApiOperation,
  requestState: RequestState,
  bodyFiles: Record<string, File>
): { body?: BodyInit; preview?: string } => {
  if (["GET", "HEAD"].includes(operation.method)) return {};
  const contentType = selectRequestMediaType(operation.requestBody?.content)?.contentType;

  if (contentType?.includes("multipart/form-data")) {
    return createMultipartBody(requestState.body, bodyFiles);
  }

  if (contentType?.includes("application/octet-stream") && bodyFiles.__body) {
    return {
      body: bodyFiles.__body,
      preview: `--data-binary ${shellQuote(`@${bodyFiles.__body.name}`)}`
    };
  }

  const body = requestState.body?.trim() ? requestState.body : undefined;
  return { body };
};

const createMultipartBody = (
  body: string | undefined,
  bodyFiles: Record<string, File>
): { body?: FormData; preview?: string } => {
  const fields = parseBodyObject(body);
  const formData = new FormData();
  const previewParts: string[] = [];

  for (const [name, value] of Object.entries(fields)) {
    formData.append(name, stringifyBodyValue(value));
    previewParts.push("-F", shellQuote(`${name}=${stringifyBodyValue(value)}`));
  }

  for (const [name, file] of Object.entries(bodyFiles)) {
    if (!file || name === "__body") continue;
    formData.append(name, file);
    previewParts.push("-F", shellQuote(`${name}=@${file.name}`));
  }

  return previewParts.length ? { body: formData, preview: previewParts.join(" ") } : {};
};

const parseBodyObject = (body: string | undefined): Record<string, unknown> => {
  if (!body?.trim()) return {};
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return Object.fromEntries(new URLSearchParams(body).entries());
  }
};

const stringifyBodyValue = (value: unknown): string =>
  value && typeof value === "object" ? JSON.stringify(value) : String(value ?? "");

const addDefaultContentType = (
  headers: Record<string, string>,
  body: BodyInit | undefined,
  operation: ApiOperation
): Record<string, string> => {
  if (!body || hasHeader(headers, "content-type")) {
    return headers;
  }

  const contentType = selectRequestMediaType(operation.requestBody?.content)?.contentType;
  if (body instanceof FormData) {
    return headers;
  }
  if (contentType) {
    return { ...headers, "content-type": contentType };
  }

  return typeof body === "string" && looksLikeJson(body)
    ? { ...headers, "content-type": "application/json" }
    : headers;
};

const hasHeader = (headers: Record<string, string>, name: string): boolean => {
  return Object.keys(headers).some(
    (headerName) => headerName.toLowerCase() === name
  );
};

const shellQuote = (value: string): string => {
  return `'${value.replaceAll("'", "'\\''")}'`;
};

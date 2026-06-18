import {
  generateRequestBodyExample,
  selectRequestMediaType,
  type ApiOperation,
  type HttpMethod,
  type RequestState
} from "@specdock/core";

export type ApiRequest = {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
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
  baseUrl: string
): ApiRequest => {
  const normalizedBaseUrl = baseUrl.trim().replace(/\/+$/, "");
  const path = replacePathParams(operation.path, requestState.pathParams);
  const url = new URL(`${normalizedBaseUrl}${path.startsWith("/") ? path : `/${path}`}`);

  for (const [name, value] of Object.entries(requestState.queryParams)) {
    if (value !== "") {
      url.searchParams.set(name, value);
    }
  }

  const headers = Object.fromEntries(
    Object.entries(requestState.headers).filter(([name, value]) => name.trim() && value.trim())
  );
  const hasBody = !["GET", "HEAD"].includes(operation.method) && requestState.body?.trim();
  const requestBody = hasBody ? requestState.body : undefined;
  const requestHeaders = addDefaultContentType(headers, requestBody, operation);

  return {
    url: url.toString(),
    method: operation.method,
    headers: requestHeaders,
    body: requestBody
  };
};

export const generateCurl = (request: ApiRequest): string => {
  const parts = ["curl", "-X", shellQuote(request.method), shellQuote(request.url)];

  for (const [name, value] of Object.entries(request.headers)) {
    parts.push("-H", shellQuote(`${name}: ${value}`));
  }

  if (request.body !== undefined) {
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

const replacePathParams = (path: string, pathParams: Record<string, string>): string => {
  return path.replace(/\{([^}]+)\}/g, (_match, name: string) => encodeURIComponent(pathParams[name] ?? ""));
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

const addDefaultContentType = (
  headers: Record<string, string>,
  body: string | undefined,
  operation: ApiOperation
): Record<string, string> => {
  if (!body || hasHeader(headers, "content-type")) {
    return headers;
  }

  const contentType = selectRequestMediaType(operation.requestBody?.content)?.contentType;
  if (contentType) {
    return { ...headers, "content-type": contentType };
  }

  return looksLikeJson(body) ? { ...headers, "content-type": "application/json" } : headers;
};

const hasHeader = (headers: Record<string, string>, name: string): boolean => {
  return Object.keys(headers).some(
    (headerName) => headerName.toLowerCase() === name
  );
};

const shellQuote = (value: string): string => {
  return `'${value.replaceAll("'", "'\\''")}'`;
};

import type { ApiOperation, HttpMethod, RequestState } from "@specdock/core";

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

  return {
    url: url.toString(),
    method: operation.method,
    headers,
    body: hasBody ? requestState.body : undefined
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
  body: operation.requestBody ? "{\n  \n}" : undefined,
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

const shellQuote = (value: string): string => {
  return `'${value.replaceAll("'", "'\\''")}'`;
};

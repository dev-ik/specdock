import type { ApiRequest, ResponseViewModel } from "../request.js";
import type { ApiErrorResponse } from "./types.js";

export const executeProxyRequest = async (request: ApiRequest): Promise<ResponseViewModel> => {
  if (request.body !== undefined && typeof request.body !== "string") {
    throw new Error("Proxy Mode supports text request bodies only. Use Direct Browser Mode for file uploads.");
  }

  const response = await fetch("/api/proxy/request", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      url: request.url,
      method: request.method,
      headers: request.headers,
      body: request.body
    })
  });
  const text = await response.text();

  if (!response.ok) {
    const payload = parseApiError(text);

    if (payload) {
      throw new Error(proxyErrorMessage(payload));
    }

    throw new Error(
      text.trim() ||
        "SpecDock API proxy is unavailable. Start apps/api on port 3000 or check the Vite /api proxy target."
    );
  }

  const payload = parseProxyResponse(text);
  const formatted = formatResponseBody(payload.body, payload.contentType);

  return {
    ...payload,
    ...formatted
  };
};

export const uniqueHeaderName = (headers: Record<string, string>): string => {
  let index = Object.keys(headers).length + 1;
  let name = `x-header-${index}`;

  while (name in headers) {
    index += 1;
    name = `x-header-${index}`;
  }

  return name;
};

export const createRequestId = (): string => {
  return globalThis.crypto?.randomUUID?.() ?? `request-${Date.now().toString(36)}`;
};

export const createOperationKey = (projectId: string, operationId: string): string => {
  return `${projectId}::${operationId}`;
};

export const formatDateTime = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const parseApiError = (text: string): ApiErrorResponse | undefined => {
  try {
    const payload = JSON.parse(text) as Partial<ApiErrorResponse>;
    return payload.error?.message ? (payload as ApiErrorResponse) : undefined;
  } catch {
    return undefined;
  }
};

const parseProxyResponse = (text: string): Omit<ResponseViewModel, "bodyFormat"> => {
  try {
    return JSON.parse(text) as Omit<ResponseViewModel, "bodyFormat">;
  } catch {
    throw new Error("SpecDock API proxy returned an invalid response.");
  }
};

const proxyErrorMessage = (payload: ApiErrorResponse): string => {
  if (payload.error.code === "PROXY_DISABLED") {
    return `${payload.error.message} For local proxy mode, run apps/api with PROXY_ENABLED=true and PROXY_ALLOWED_HOSTS set to the target host.`;
  }

  return payload.error.message;
};

const formatResponseBody = (
  body: string,
  contentType?: string
): Pick<ResponseViewModel, "body" | "bodyFormat"> => {
  if (contentType?.includes("json") || body.trim().startsWith("{") || body.trim().startsWith("[")) {
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

import {
  isSensitiveHeaderName,
  isSensitiveParameterName,
  redactSensitiveUrl,
  REDACTED_VALUE,
  type AuthProfile
} from "@specdock/core";
import type { ApiRequest } from "../request.js";

export const createAuthProfile = (
  projectId: string,
  type: AuthProfile["type"]
): AuthProfile => {
  const now = new Date().toISOString();

  return {
    id: globalThis.crypto?.randomUUID?.() ?? `auth-${Date.now().toString(36)}`,
    projectId,
    name: defaultProfileName(type),
    type,
    values: defaultProfileValues(type),
    createdAt: now,
    updatedAt: now
  };
};

export const applyAuthProfileToRequest = (
  request: ApiRequest,
  profile: AuthProfile | undefined,
  options: { requestMode?: "direct" | "proxy" } = {}
): ApiRequest => {
  if (!profile || profile.type === "none") {
    return request;
  }

  if (profile.type === "bearer") {
    const token = profile.values.token?.trim();
    return token
      ? withHeader(request, "Authorization", `Bearer ${token}`)
      : request;
  }

  if (profile.type === "basic") {
    const username = profile.values.username ?? "";
    const password = profile.values.password ?? "";
    return username || password
      ? withHeader(request, "Authorization", `Basic ${btoa(`${username}:${password}`)}`)
      : request;
  }

  if (profile.type === "cookieCsrf") {
    return applyCookieCsrfProfile(request, profile, options.requestMode);
  }

  const name = profile.values.name?.trim();
  const value = profile.values.value?.trim();
  if (!name || !value) {
    return request;
  }

  return profile.values.placement === "query"
    ? withQueryParam(request, name, value)
    : withHeader(request, name, value);
};

export const redactRequestForPreview = (request: ApiRequest): ApiRequest => ({
  ...request,
  url: redactSensitiveUrl(request.url),
  body: typeof request.body === "string" ? redactRequestBody(request.body) : request.body,
  bodyPreview: redactMultipartPreview(request.bodyPreview),
  headers: Object.fromEntries(
    Object.entries(request.headers).map(([name, value]) => [
      name,
      isSensitiveHeaderName(name) ? REDACTED_VALUE : value
    ])
  )
});

const redactRequestBody = (body: string | undefined): string | undefined => {
  if (!body) {
    return body;
  }

  try {
    return JSON.stringify(redactSensitiveBodyFields(JSON.parse(body)));
  } catch {
    return body;
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

const redactMultipartPreview = (preview: string | undefined): string | undefined => {
  if (!preview) return preview;
  return preview.replace(/(-F\s+'?)([^='@\s]+)=([^'\s]+)/g, (_match, prefix: string, name: string, value: string) =>
    `${prefix}${name}=${isSensitiveParameterName(name) ? REDACTED_VALUE : value}`
  );
};

const withHeader = (
  request: ApiRequest,
  name: string,
  value: string
): ApiRequest => ({
  ...request,
  headers: {
    ...request.headers,
    [name]: value
  }
});

const withQueryParam = (
  request: ApiRequest,
  name: string,
  value: string
): ApiRequest => {
  const url = new URL(request.url);
  url.searchParams.set(name, value);

  return {
    ...request,
    url: url.toString()
  };
};

const applyCookieCsrfProfile = (
  request: ApiRequest,
  profile: AuthProfile,
  requestMode: "direct" | "proxy" | undefined
): ApiRequest => {
  let nextRequest = withCsrfBodyField(request, profile);

  if (requestMode !== "proxy") {
    return nextRequest;
  }

  const cookie = profile.values.cookie?.trim();
  const origin = profile.values.origin?.trim();
  const referer = profile.values.referer?.trim();

  if (cookie) {
    nextRequest = withHeader(nextRequest, "Cookie", cookie);
  }

  if (origin) {
    nextRequest = withHeader(nextRequest, "Origin", origin);
  }

  if (referer) {
    nextRequest = withHeader(nextRequest, "Referer", referer);
  }

  return nextRequest;
};

const withCsrfBodyField = (
  request: ApiRequest,
  profile: AuthProfile
): ApiRequest => {
  const token = profile.values.csrfToken?.trim();
  if (!token || typeof request.body !== "string" || !request.body.trim()) {
    return request;
  }

  try {
    const parsed = JSON.parse(request.body) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return request;
    }

    return {
      ...request,
      body: JSON.stringify({
        ...parsed,
        [profile.values.csrfFieldName?.trim() || "csrf_token"]: token
      })
    };
  } catch {
    return request;
  }
};

const defaultProfileName = (type: AuthProfile["type"]): string => {
  if (type === "bearer") return "Bearer token";
  if (type === "apiKey") return "API key";
  if (type === "basic") return "Basic auth";
  if (type === "cookieCsrf") return "Cookie + CSRF";

  return "No auth";
};

const defaultProfileValues = (
  type: AuthProfile["type"]
): Record<string, string> => {
  if (type === "apiKey") {
    return { placement: "header", name: "x-api-key", value: "" };
  }

  if (type === "basic") {
    return { username: "", password: "" };
  }

  if (type === "cookieCsrf") {
    return {
      cookie: "",
      csrfFieldName: "csrf_token",
      csrfToken: "",
      origin: "",
      referer: ""
    };
  }

  if (type === "bearer") {
    return { token: "" };
  }

  return {};
};

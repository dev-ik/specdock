import { describe, expect, it } from "vitest";
import type { AuthProfile } from "@specdock/core";
import {
  applyAuthProfileToRequest,
  redactRequestForPreview
} from "./auth-profiles.js";
import type { ApiRequest } from "../request.js";

const baseRequest: ApiRequest = {
  method: "GET",
  url: "https://api.example.com/users",
  headers: {},
  body: undefined
};

describe("auth profiles", () => {
  it("applies bearer tokens as Authorization headers", () => {
    expect(
      applyAuthProfileToRequest(baseRequest, profile("bearer", { token: "secret-token" }))
    ).toMatchObject({
      headers: { Authorization: "Bearer secret-token" }
    });
  });

  it("applies API keys to headers or query params", () => {
    const headerRequest = applyAuthProfileToRequest(
      baseRequest,
      profile("apiKey", { placement: "header", name: "x-api-key", value: "header-secret" })
    );
    const queryRequest = applyAuthProfileToRequest(
      baseRequest,
      profile("apiKey", { placement: "query", name: "api_key", value: "query-secret" })
    );

    expect(headerRequest.headers).toEqual({ "x-api-key": "header-secret" });
    expect(queryRequest.url).toBe("https://api.example.com/users?api_key=query-secret");
  });

  it("applies basic auth as a Basic Authorization header", () => {
    expect(
      applyAuthProfileToRequest(
        baseRequest,
        profile("basic", { username: "ada", password: "lovelace" })
      ).headers.Authorization
    ).toBe("Basic YWRhOmxvdmVsYWNl");
  });

  it("applies cookie CSRF profiles to JSON bodies and proxy-only headers", () => {
    const request = applyAuthProfileToRequest(
      {
        ...baseRequest,
        method: "POST",
        body: "{}"
      },
      profile("cookieCsrf", {
        cookie: "SID=session-secret",
        csrfFieldName: "csrf_token",
        csrfToken: "csrf-secret",
        origin: "https://exmo.me",
        referer: "https://exmo.me/wallet/deposit/RUB"
      }),
      { requestMode: "proxy" }
    );

    expect(request).toMatchObject({
      headers: {
        Cookie: "SID=session-secret",
        Origin: "https://exmo.me",
        Referer: "https://exmo.me/wallet/deposit/RUB"
      },
      body: '{"csrf_token":"csrf-secret"}'
    });
  });

  it("does not add cookie headers in direct mode", () => {
    const request = applyAuthProfileToRequest(
      {
        ...baseRequest,
        method: "POST",
        body: "{}"
      },
      profile("cookieCsrf", {
        cookie: "SID=session-secret",
        csrfToken: "csrf-secret"
      }),
      { requestMode: "direct" }
    );

    expect(request.headers).toEqual({});
    expect(request.body).toBe('{"csrf_token":"csrf-secret"}');
  });

  it("redacts sensitive headers and query params for previews", () => {
    const request = applyAuthProfileToRequest(
      {
        ...baseRequest,
        headers: { "x-request-id": "abc" }
      },
      profile("apiKey", { placement: "query", name: "api_key", value: "query-secret" })
    );
    const redacted = redactRequestForPreview({
      ...request,
      headers: { ...request.headers, Authorization: "Bearer secret-token" }
    });

    expect(redacted.url).toBe("https://api.example.com/users?api_key=%5Bredacted%5D");
    expect(redacted.headers).toEqual({
      "x-request-id": "abc",
      Authorization: "[redacted]"
    });
  });

  it("redacts cookie session headers for previews", () => {
    const redacted = redactRequestForPreview({
      ...baseRequest,
      method: "POST",
      headers: { Cookie: "SID=session-secret" },
      body: '{"csrf_token":"csrf-secret","name":"Ada"}'
    });

    expect(redacted.headers.Cookie).toBe("[redacted]");
    expect(redacted.body).toBe('{"csrf_token":"[redacted]","name":"Ada"}');
  });
});

const profile = (
  type: AuthProfile["type"],
  values: Record<string, string>
): AuthProfile => ({
  id: `auth-${type}`,
  projectId: "project-1",
  name: type,
  type,
  values,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z"
});

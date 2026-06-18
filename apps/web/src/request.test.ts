import { describe, expect, it } from "vitest";
import type { ApiOperation, RequestState } from "@specdock/core";
import { buildApiRequest, createRequestState, generateCurl } from "./request.js";

const operation: ApiOperation = {
  id: "getUser",
  operationId: "getUser",
  method: "GET",
  path: "/users/{id}",
  tags: ["users"],
  parameters: [
    { name: "id", in: "path", required: true },
    { name: "include", in: "query", required: false },
    { name: "x-request-id", in: "header", required: false }
  ],
  responses: []
};

const requestState: RequestState = {
  operationId: "getUser",
  pathParams: { id: "u 1" },
  queryParams: { include: "profile", empty: "" },
  headers: { "x-request-id": "abc", "": "ignored" },
  requestMode: "direct"
};

describe("request helpers", () => {
  it("builds a browser request from operation state", () => {
    expect(buildApiRequest(operation, requestState, "https://api.example.com/")).toEqual({
      url: "https://api.example.com/users/u%201?include=profile",
      method: "GET",
      headers: { "x-request-id": "abc" },
      body: undefined
    });
  });

  it("defaults POST requests without OpenAPI body to an empty JSON object", () => {
    const postOperation: ApiOperation = {
      ...operation,
      id: "action",
      method: "POST",
      path: "/action",
      parameters: []
    };
    const state = createRequestState(postOperation);

    expect(state.body).toBe("{}");
    expect(buildApiRequest(postOperation, state, "https://api.example.com")).toMatchObject({
      method: "POST",
      url: "https://api.example.com/action",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
  });

  it("does not overwrite explicit content-type headers", () => {
    const postOperation: ApiOperation = {
      ...operation,
      id: "action",
      method: "POST",
      path: "/action",
      parameters: []
    };
    const state = {
      ...createRequestState(postOperation),
      headers: { "Content-Type": "application/vnd.api+json" }
    };

    expect(
      buildApiRequest(postOperation, state, "https://api.example.com").headers
    ).toEqual({ "Content-Type": "application/vnd.api+json" });
  });

  it("creates form-urlencoded body defaults from request schema", () => {
    const formOperation: ApiOperation = {
      ...operation,
      id: "getEventBySlug",
      method: "POST",
      path: "/api/v1/prediction/event/by-slug",
      parameters: [],
      requestBody: {
        required: false,
        content: [
          {
            contentType: "application/x-www-form-urlencoded",
            schema: {
              type: "object",
              properties: {
                includeMarkets: { type: "boolean" }
              }
            }
          }
        ]
      }
    };
    const state = createRequestState(formOperation);

    expect(state.body).toBe("includeMarkets=true");
    expect(buildApiRequest(formOperation, state, "https://api.example.com")).toMatchObject({
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "includeMarkets=true"
    });
  });

  it("keeps GET requests bodyless by default", () => {
    expect(createRequestState(operation).body).toBeUndefined();
  });

  it("generates cURL with method, headers, body and URL", () => {
    const curl = generateCurl({
      url: "https://api.example.com/users",
      method: "POST",
      headers: { authorization: "Bearer token" },
      body: '{"name":"Ada"}'
    });

    expect(curl).toContain("curl -X 'POST'");
    expect(curl).toContain("'https://api.example.com/users'");
    expect(curl).toContain("-H 'authorization: Bearer token'");
    expect(curl).toContain("--data '{\"name\":\"Ada\"}'");
  });
});

import { describe, expect, it } from "vitest";
import type { ApiOperation, RequestState } from "@specdock/core";
import { buildApiRequest, generateCurl } from "./request.js";

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

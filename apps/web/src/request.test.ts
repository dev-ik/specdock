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

  it("serializes supported OpenAPI query parameter styles", () => {
    const styledOperation: ApiOperation = {
      ...operation,
      path: "/users",
      parameters: [
        {
          name: "tags",
          in: "query",
          required: false,
          schema: { type: "array", items: { type: "string" } },
          style: "pipeDelimited",
          explode: false
        },
        {
          name: "filter",
          in: "query",
          required: false,
          schema: { type: "object" },
          style: "deepObject",
          explode: true
        }
      ]
    };

    const request = buildApiRequest(
      styledOperation,
      {
        operationId: "getUser",
        pathParams: {},
        queryParams: { tags: "red,blue", filter: '{"status":"open","owner":"me"}' },
        headers: {},
        requestMode: "direct"
      },
      "https://api.example.com"
    );

    expect(request.url).toBe(
      "https://api.example.com/users?tags=red%7Cblue&filter%5Bstatus%5D=open&filter%5Bowner%5D=me"
    );
  });

  it("serializes path object parameters with simple explode", () => {
    const styledOperation: ApiOperation = {
      ...operation,
      path: "/users/{filter}",
      parameters: [
        {
          name: "filter",
          in: "path",
          required: true,
          schema: { type: "object" },
          style: "simple",
          explode: true
        }
      ]
    };

    const request = buildApiRequest(
      styledOperation,
      {
        operationId: "getUser",
        pathParams: { filter: '{"role":"admin","active":"true"}' },
        queryParams: {},
        headers: {},
        requestMode: "direct"
      },
      "https://api.example.com"
    );

    expect(request.url).toBe("https://api.example.com/users/role%3Dadmin%2Cactive%3Dtrue");
  });

  it("builds multipart browser bodies with cURL file placeholders", () => {
    const uploadOperation: ApiOperation = {
      ...operation,
      id: "uploadAvatar",
      method: "POST",
      path: "/avatar",
      parameters: [],
      requestBody: {
        required: true,
        content: [
          {
            contentType: "multipart/form-data",
            schema: {
              type: "object",
              properties: {
                label: { type: "string" },
                avatar: { type: "string", format: "binary" }
              }
            }
          }
        ]
      }
    };
    const file = new File(["image"], "avatar.png", { type: "image/png" });
    const request = buildApiRequest(
      uploadOperation,
      {
        operationId: "uploadAvatar",
        pathParams: {},
        queryParams: {},
        headers: {},
        body: '{"label":"Profile"}',
        requestMode: "direct"
      },
      "https://api.example.com",
      { avatar: file }
    );

    expect(request.body).toBeInstanceOf(FormData);
    expect(request.headers).toEqual({});
    expect(generateCurl(request)).toContain("-F 'avatar=@avatar.png'");
  });

  it("builds binary browser bodies from session files", () => {
    const binaryOperation: ApiOperation = {
      ...operation,
      id: "uploadBinary",
      method: "PUT",
      path: "/binary",
      parameters: [],
      requestBody: {
        required: true,
        content: [{ contentType: "application/octet-stream" }]
      }
    };
    const file = new File(["raw"], "payload.bin");
    const request = buildApiRequest(
      binaryOperation,
      {
        operationId: "uploadBinary",
        pathParams: {},
        queryParams: {},
        headers: {},
        body: "",
        requestMode: "direct"
      },
      "https://api.example.com",
      { __body: file }
    );

    expect(request.body).toBe(file);
    expect(request.headers).toEqual({ "content-type": "application/octet-stream" });
    expect(generateCurl(request)).toContain("--data-binary '@payload.bin'");
  });
});

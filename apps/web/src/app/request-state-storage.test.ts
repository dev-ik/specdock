import { describe, expect, it } from "vitest";
import {
  hydrateStoredRequestStates,
  sanitizeRequestStatesForStorage
} from "./request-state-storage.js";

describe("request state storage", () => {
  it("does not persist headers or request bodies", () => {
    const stored = sanitizeRequestStatesForStorage({
      "project:operation": {
        operationId: "operation",
        authProfileId: "auth-1",
        pathParams: { id: "123" },
        queryParams: { page: "1" },
        headers: { authorization: "Bearer token", "x-trace": "abc" },
        body: '{"password":"secret"}',
        requestMode: "proxy"
      }
    });

    expect(stored["project:operation"]).toEqual({
      operationId: "operation",
      authProfileId: "auth-1",
      pathParams: { id: "123" },
      queryParams: { page: "1" },
      requestMode: "proxy"
    });
  });

  it("sanitizes old localStorage values on hydration", () => {
    const hydrated = hydrateStoredRequestStates({
      "project:operation": {
        operationId: "operation",
        authProfileId: "auth-1",
        pathParams: { id: "123" },
        queryParams: { access_token: "secret", page: "1" },
        headers: { authorization: "Bearer token" },
        body: '{"secret":"value"}',
        requestMode: "proxy"
      }
    });

    expect(hydrated["project:operation"]).toEqual({
      operationId: "operation",
      authProfileId: "auth-1",
      pathParams: { id: "123" },
      queryParams: { access_token: "", page: "1" },
      headers: {},
      body: undefined,
      requestMode: "proxy"
    });
  });
});

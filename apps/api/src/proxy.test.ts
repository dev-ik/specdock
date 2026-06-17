import { afterEach, describe, expect, it, vi } from "vitest";
import { buildApp } from "./app.js";

type ErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};

type InjectResponse = {
  statusCode: number;
  json(): unknown;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("proxy route", () => {
  it("returns PROXY_DISABLED when proxy mode is off", async () => {
    vi.stubEnv("PROXY_ENABLED", "false");

    const response = await injectProxy({
      method: "GET",
      url: "https://203.0.113.10/users"
    });

    expect(response.statusCode).toBe(403);
    expect(errorCode(response)).toBe("PROXY_DISABLED");
  });

  it("enforces allowed hosts", async () => {
    vi.stubEnv("PROXY_ENABLED", "true");
    vi.stubEnv("PROXY_ALLOWED_HOSTS", "198.51.100.1");

    const response = await injectProxy({
      method: "GET",
      url: "https://203.0.113.10/users"
    });

    expect(response.statusCode).toBe(403);
    expect(errorCode(response)).toBe("HOST_NOT_ALLOWED");
  });

  it("blocks private targets unless explicitly allowed", async () => {
    vi.stubEnv("PROXY_ENABLED", "true");
    vi.stubEnv("PROXY_ALLOWED_HOSTS", "127.0.0.1");
    vi.stubEnv("PROXY_ALLOW_PRIVATE_TARGETS", "false");

    const response = await injectProxy({
      method: "GET",
      url: "http://127.0.0.1/internal"
    });

    expect(response.statusCode).toBe(403);
    expect(errorCode(response)).toBe("PRIVATE_IP_BLOCKED");
  });

  it("enforces configured request body size", async () => {
    vi.stubEnv("PROXY_ENABLED", "true");
    vi.stubEnv("PROXY_ALLOWED_HOSTS", "203.0.113.10");
    vi.stubEnv("PROXY_MAX_REQUEST_BYTES", "4");

    const response = await injectProxy({
      method: "POST",
      url: "https://203.0.113.10/users",
      body: "12345"
    });

    expect(response.statusCode).toBe(413);
    expect(errorCode(response)).toBe("REQUEST_TOO_LARGE");
  });

  it("enforces configured response body size", async () => {
    vi.stubEnv("PROXY_ENABLED", "true");
    vi.stubEnv("PROXY_ALLOWED_HOSTS", "203.0.113.10");
    vi.stubEnv("PROXY_MAX_RESPONSE_BYTES", "4");

    const response = await injectProxy(
      {
        method: "GET",
        url: "https://203.0.113.10/users"
      },
      async () => new Response("12345")
    );

    expect(response.statusCode).toBe(413);
    expect(errorCode(response)).toBe("RESPONSE_TOO_LARGE");
  });

  it("uses configured timeout", async () => {
    vi.stubEnv("PROXY_ENABLED", "true");
    vi.stubEnv("PROXY_ALLOWED_HOSTS", "203.0.113.10");
    vi.stubEnv("PROXY_TIMEOUT_MS", "5");

    const response = await injectProxy(
      {
        method: "GET",
        url: "https://203.0.113.10/slow"
      },
      abortingFetch
    );

    expect(response.statusCode).toBe(408);
    expect(errorCode(response)).toBe("REQUEST_TIMEOUT");
  });

  it("executes allowed proxy requests and strips blocked headers", async () => {
    vi.stubEnv("PROXY_ENABLED", "true");
    vi.stubEnv("PROXY_ALLOWED_HOSTS", "203.0.113.10");

    const fetcher = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => {
      void _input;
      void _init;
      return new Response("{\"ok\":true}", {
        status: 201,
        statusText: "Created",
        headers: { "content-type": "application/json" }
      });
    });

    const response = await injectProxy(
      {
        method: "POST",
        url: "https://203.0.113.10/users",
        headers: {
          host: "evil.example",
          "content-length": "999",
          authorization: "Bearer token"
        },
        body: "{\"name\":\"Ada\"}"
      },
      fetcher
    );

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 201,
      statusText: "Created",
      body: "{\"ok\":true}",
      contentType: "application/json"
    });
    const init = fetcher.mock.calls[0]?.[1];
    expect(init?.headers).toEqual({
      authorization: "Bearer token"
    });
  });
});

const injectProxy = async (
  payload: Record<string, unknown>,
  fetchImplementation: typeof fetch = async () => new Response("{}")
): Promise<InjectResponse> => {
  const app = buildApp({ fetchImplementation, logger: false, webDistDir: null });

  try {
    return await app.inject({
      method: "POST",
      url: "/api/proxy/request",
      payload
    }) as unknown as InjectResponse;
  } finally {
    await app.close();
  }
};

const errorCode = (response: InjectResponse): string => {
  return (response.json() as ErrorPayload).error.code;
};

const abortingFetch: typeof fetch = (_input, init) => {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener(
      "abort",
      () => reject(new DOMException("The operation was aborted.", "AbortError")),
      { once: true }
    );
  });
};

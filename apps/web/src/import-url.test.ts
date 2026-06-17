import { describe, expect, it, vi } from "vitest";
import { importOpenApiFromUrl, UrlImportError } from "./import-url.js";

describe("importOpenApiFromUrl", () => {
  it("fetches OpenAPI text from a URL", async () => {
    const fetcher = vi.fn(async () => new Response("openapi: 3.0.3", { status: 200 }));

    await expect(importOpenApiFromUrl("https://example.com/openapi.yaml", { fetcher })).resolves.toEqual({
      text: "openapi: 3.0.3",
      url: "https://example.com/openapi.yaml"
    });
  });

  it("rejects invalid URLs", async () => {
    await expect(importOpenApiFromUrl("ftp://example.com/openapi.yaml")).rejects.toMatchObject({
      code: "INVALID_URL"
    });
  });

  it("rejects oversized content-length before reading the body", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response("ignored", {
          status: 200,
          headers: {
            "content-length": "20"
          }
        })
    );

    await expect(
      importOpenApiFromUrl("https://example.com/openapi.yaml", { fetcher, maxBytes: 10 })
    ).rejects.toMatchObject({
      code: "SPEC_TOO_LARGE"
    });
  });

  it("maps aborts to timeout errors", async () => {
    const fetcher = vi.fn(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    });

    await expect(importOpenApiFromUrl("https://example.com/openapi.yaml", { fetcher })).rejects.toMatchObject({
      code: "IMPORT_TIMEOUT"
    });
  });

  it("maps browser network/CORS failures to a CORS message", async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(importOpenApiFromUrl("https://example.com/openapi.yaml", { fetcher })).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof UrlImportError &&
        error.code === "FETCH_FAILED" &&
        error.message.includes("CORS blocked")
    );
  });
});

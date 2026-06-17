import { LIMITS } from "@specdock/core";

export type UrlImportResult = {
  text: string;
  url: string;
};

export type UrlImportErrorCode =
  | "INVALID_URL"
  | "IMPORT_TIMEOUT"
  | "SPEC_TOO_LARGE"
  | "FETCH_FAILED";

export class UrlImportError extends Error {
  readonly code: UrlImportErrorCode;

  constructor(code: UrlImportErrorCode, message: string) {
    super(message);
    this.name = "UrlImportError";
    this.code = code;
  }
}

export type UrlImportOptions = {
  timeoutMs?: number;
  maxBytes?: number;
  fetcher?: typeof fetch;
};

export const importOpenApiFromUrl = async (
  rawUrl: string,
  options: UrlImportOptions = {}
): Promise<UrlImportResult> => {
  const url = normalizeUrl(rawUrl);
  const timeoutMs = options.timeoutMs ?? LIMITS.generateTimeoutMs;
  const maxBytes = options.maxBytes ?? LIMITS.maxSpecBytes;
  const fetcher = options.fetcher ?? fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(url, {
      headers: {
        accept: "application/yaml, application/json, text/yaml, text/plain, */*"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new UrlImportError("FETCH_FAILED", `Unable to fetch OpenAPI document (${response.status}).`);
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > maxBytes) {
      throw new UrlImportError("SPEC_TOO_LARGE", "The specification is too large. Maximum supported size is 10 MB.");
    }

    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) {
      throw new UrlImportError("SPEC_TOO_LARGE", "The specification is too large. Maximum supported size is 10 MB.");
    }

    return {
      text,
      url
    };
  } catch (error) {
    if (error instanceof UrlImportError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new UrlImportError("IMPORT_TIMEOUT", "OpenAPI URL import timed out after 10 seconds.");
    }

    throw new UrlImportError(
      "FETCH_FAILED",
      "CORS blocked this request. This public demo cannot proxy arbitrary API requests for security reasons."
    );
  } finally {
    clearTimeout(timeout);
  }
};

const normalizeUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl.trim());

    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Unsupported protocol.");
    }

    return url.toString();
  } catch {
    throw new UrlImportError("INVALID_URL", "Enter a valid HTTP(S) OpenAPI URL.");
  }
};

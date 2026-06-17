import type { HttpMethod, RequestState } from "@specdock/core";

export type CurlImportErrorCode =
  | "EMPTY_CURL"
  | "INVALID_CURL"
  | "INVALID_METHOD"
  | "INVALID_URL"
  | "UNSUPPORTED_MULTIPART";

export type ParsedCurl = {
  url: URL;
  method: HttpMethod;
  headers: Record<string, string>;
  body?: string;
};

export type CurlImportResult = {
  specText: string;
  baseUrl: string;
  operationId: string;
  requestState: RequestState;
};

export class CurlImportError extends Error {
  constructor(
    public readonly code: CurlImportErrorCode,
    message: string
  ) {
    super(message);
    this.name = "CurlImportError";
  }
}

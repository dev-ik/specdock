# API Endpoint Contracts

## GET /api/health

```ts
export type HealthResponse = {
  status: "ok";
  version: string;
};
```

Example:

```json
{
  "status": "ok",
  "version": "0.1.0"
}
```

## POST /api/generate

Generate SDK files from an OpenAPI document.

For MVP prefer JSON response first because it is easier to test. ZIP generation can be added through `/api/generate/zip`.

```ts
export type GenerateRequest = {
  spec: unknown;
  options?: Partial<GenerateOptions>;
};

export type GenerateOptions = {
  language: "typescript" | "python" | "go" | "java" | "csharp" | "php";
  client: "fetch" | "axios";
  generateTypes: boolean;
  generateReactQuery: boolean;
  generateZod: boolean;
  outputPath: string;
  namingStyle: "operationId" | "camelCase";
};

export type GenerateResponse = {
  files: GeneratedFile[];
  meta: {
    fileCount: number;
    generatedAt: string;
    generatorVersion: string;
  };
};
```

Default options:

```ts
export const defaultGenerateOptions: GenerateOptions = {
  language: "typescript",
  client: "fetch",
  generateTypes: true,
  generateReactQuery: false,
  generateZod: false,
  outputPath: "generated",
  namingStyle: "operationId"
};
```

Error codes:

```txt
INVALID_SPEC
UNSUPPORTED_OPENAPI_VERSION
GENERATION_FAILED
GENERATED_OUTPUT_TOO_LARGE
SPEC_TOO_LARGE
INVALID_GENERATE_OPTIONS
```

## POST /api/generate/zip

Optional endpoint for direct ZIP download.

Response:

```txt
Content-Type: application/zip
Content-Disposition: attachment; filename="specdock-generated.zip"
```

## POST /api/proxy/request

Available only when:

```env
PROXY_ENABLED=true
```

```ts
export type ProxyRequest = {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: string;
  timeoutMs?: number;
};

export type ProxyResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType?: string;
  durationMs: number;
};
```

Proxy error codes:

```txt
PROXY_DISABLED
INVALID_URL
UNSUPPORTED_PROTOCOL
HOST_NOT_ALLOWED
PRIVATE_IP_BLOCKED
REQUEST_TIMEOUT
REQUEST_TOO_LARGE
RESPONSE_TOO_LARGE
UPSTREAM_REQUEST_FAILED
```

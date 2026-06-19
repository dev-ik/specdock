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

## GET /api/config

Deployment policy consumed by the web app.

```ts
export type AppConfigResponse = {
  publicDemo: boolean;
  directRequest: {
    restricted: boolean;
    allowedHosts: string[];
  };
};
```

Public demo example:

```json
{
  "publicDemo": true,
  "directRequest": {
    "restricted": true,
    "allowedHosts": ["dummyjson.com", "petstore3.swagger.io", "httpbin.org"]
  }
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

## POST /api/mock/response

Registered only when:

```env
MOCK_SERVER_ENABLED=true
PUBLIC_DEMO=false
```

```ts
export type MockResponseRequest = {
  spec: unknown;
  method: HttpMethod;
  path: string;
  statusCode?: string;
};

export type MockResponseResult = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  contentType?: string;
  operationId?: string;
};
```

Mock responses are generated from OpenAPI media examples first, then schema
examples. The endpoint does not persist imported specs.

## POST /api/mock/routes

Registered only when:

```env
MOCK_SERVER_ENABLED=true
PUBLIC_DEMO=false
```

```ts
export type MockRouteUpsertRequest = {
  method: HttpMethod;
  path: string;
  status: number;
  statusText?: string;
  body: string;
  contentType?: string;
  operationId?: string;
};

export type MockRouteUpsertResponse = {
  route: MockRouteSummary;
};
```

Stores a generated mock response as an in-memory route for the current API
process. Routes are lost when the process restarts. OpenAPI path templates
such as `/users/{id}` are accepted.

## GET /api/mock/routes

Registered only when mock routes are enabled.

```ts
export type MockRouteSummary = {
  method: HttpMethod;
  path: string;
  status: number;
  contentType?: string;
  operationId?: string;
  url: string;
};

export type MockRoutesResponse = {
  routes: MockRouteSummary[];
};
```

## ALL /mock/*

Registered only when mock routes are enabled. A saved route such as
`GET /users/{id}` is shown as `GET /mock/users/1` and also matches concrete
requests such as `GET /mock/users/123`.

Mock error codes:

```txt
MOCK_ROUTE_NOT_FOUND
MOCK_RESPONSE_TOO_LARGE
```

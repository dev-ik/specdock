# Data Models

## OpenApiProject

```ts
export type OpenApiProject = {
  id: string;
  name: string;
  source: OpenApiSource;
  specFormat?: "openapi3" | "swagger2";
  spec: unknown;
  servers: ApiServer[];
  tags: ApiTag[];
  operations: ApiOperation[];
  schemas: ApiSchema[];
  createdAt: string;
  updatedAt: string;
};
```

## OpenApiSource

```ts
export type OpenApiSource =
  | { type: "url"; url: string }
  | { type: "file"; fileName: string }
  | { type: "raw" };
```

## ApiServer

```ts
export type ApiServer = {
  url: string;
  description?: string;
};
```

## ApiTag

```ts
export type ApiTag = {
  name: string;
  description?: string;
};
```

## ApiSchema

```ts
export type ApiSchema = {
  name: string;
  schema: unknown;
};
```

## ApiOperation

```ts
export type ApiOperation = {
  id: string;
  operationId?: string;
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  tags: string[];
  parameters: ApiParameter[];
  requestBody?: ApiRequestBody;
  responses: ApiResponse[];
  security?: ApiSecurityRequirement[];
};
```

## ApiParameter

```ts
export type ApiParameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required: boolean;
  description?: string;
  schema?: unknown;
  example?: unknown;
  style?: "simple" | "form" | "spaceDelimited" | "pipeDelimited" | "deepObject";
  explode?: boolean;
};
```

## ApiRequestBody

```ts
export type ApiRequestBody = {
  required: boolean;
  content: ApiMediaType[];
};
```

## ApiMediaType

```ts
export type ApiMediaType = {
  contentType: string;
  schema?: unknown;
  example?: unknown;
};
```

## ApiResponse

```ts
export type ApiResponse = {
  statusCode: string;
  description?: string;
  content: ApiMediaType[];
};
```

## RequestState

```ts
export type RequestState = {
  operationId: string;
  environmentId?: string;
  authProfileId?: string;
  pathParams: Record<string, string>;
  queryParams: Record<string, string>;
  headers: Record<string, string>;
  body?: string;
  requestMode: "direct" | "proxy";
};
```

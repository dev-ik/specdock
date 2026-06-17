export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export type OpenApiSource =
  | { type: "url"; url: string }
  | { type: "file"; fileName: string }
  | { type: "curl" }
  | { type: "raw" };

export type OpenApiProject = {
  id: string;
  name: string;
  source: OpenApiSource;
  spec: unknown;
  servers: ApiServer[];
  tags: ApiTag[];
  operations: ApiOperation[];
  schemas: ApiSchema[];
  createdAt: string;
  updatedAt: string;
};

export type ApiServer = {
  url: string;
  description?: string;
};

export type ApiTag = {
  name: string;
  description?: string;
};

export type ApiSchema = {
  name: string;
  schema: unknown;
};

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

export type ApiParameter = {
  name: string;
  in: "path" | "query" | "header" | "cookie";
  required: boolean;
  description?: string;
  schema?: unknown;
  example?: unknown;
};

export type ApiRequestBody = {
  required: boolean;
  content: ApiMediaType[];
};

export type ApiMediaType = {
  contentType: string;
  schema?: unknown;
  example?: unknown;
};

export type ApiResponse = {
  statusCode: string;
  description?: string;
  content: ApiMediaType[];
};

export type ApiSecurityRequirement = {
  name: string;
  scopes?: string[];
};

export type NormalizedOpenApi = {
  spec: Record<string, unknown>;
  servers: ApiServer[];
  tags: ApiTag[];
  operations: ApiOperation[];
  schemas: ApiSchema[];
};

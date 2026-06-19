import type { ApiMediaType, ApiOperation, ApiResponse } from "./types.js";
import type { OpenApiDiffFinding } from "./openapi-diff.js";

export const diffRequiredRequestProperties = (
  previous: ApiOperation,
  current: ApiOperation
): OpenApiDiffFinding[] => {
  const previousProperties = requiredSchemaProperties(previous.requestBody?.content);

  return requiredSchemaProperties(current.requestBody?.content)
    .filter((property) => !previousProperties.includes(property))
    .map((property) => ({
      severity: "breaking",
      code: "request-required-property-added",
      method: current.method,
      path: current.path,
      tags: current.tags,
      location: `${current.method} ${current.path} requestBody.${property}`,
      message: `Required request body property "${property}" was added.`
    }));
};

export const diffRequiredResponseProperties = (
  previous: ApiResponse,
  current: ApiResponse,
  operation: ApiOperation,
  statusCode: string
): OpenApiDiffFinding[] => {
  const previousProperties = requiredSchemaProperties(previous.content);

  return requiredSchemaProperties(current.content)
    .filter((property) => !previousProperties.includes(property))
    .map((property) => ({
      severity: "breaking",
      code: "response-required-property-added",
      method: operation.method,
      path: operation.path,
      tags: operation.tags,
      location: `${operation.method} ${operation.path} response ${statusCode}.${property}`,
      message: `Required response ${statusCode} property "${property}" was added.`
    }));
};

const requiredSchemaProperties = (content: ApiMediaType[] | undefined): string[] => {
  const schema = content?.find((mediaType) => mediaType.schema)?.schema;

  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return [];
  }

  const required = (schema as Record<string, unknown>).required;
  return Array.isArray(required)
    ? required.filter((property): property is string => typeof property === "string")
    : [];
};

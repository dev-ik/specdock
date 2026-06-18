import type { ApiOperation } from "./types.js";
import { isRecord } from "./openapi-utils.js";
import { selectRequestMediaType } from "./openapi-schema-fields.js";

const MAX_EXAMPLE_DEPTH = 6;

export const generateRequestBodyExample = (
  operation: Pick<ApiOperation, "requestBody">
): string | undefined => {
  const mediaType = selectRequestMediaType(operation.requestBody?.content);
  if (!mediaType) {
    return undefined;
  }

  const example = mediaType.example ?? generateSchemaExample(mediaType.schema);
  if (example === undefined) {
    return undefined;
  }

  return formatExample(example, mediaType.contentType);
};

export const generateSchemaExample = (
  schema: unknown,
  depth = 0
): unknown => {
  if (!isRecord(schema) || depth > MAX_EXAMPLE_DEPTH) {
    return undefined;
  }

  if ("example" in schema) {
    return schema.example;
  }

  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum[0];
  }

  const combinedSchema = firstRecord(schema.allOf) ?? firstRecord(schema.oneOf) ?? firstRecord(schema.anyOf);
  if (combinedSchema) {
    return generateSchemaExample(combinedSchema, depth + 1);
  }

  const type = inferSchemaType(schema);

  if (type === "object") {
    return generateObjectExample(schema, depth);
  }

  if (type === "array") {
    return [generateSchemaExample(schema.items, depth + 1) ?? "string"];
  }

  if (type === "integer") {
    return 1;
  }

  if (type === "number") {
    return 1.5;
  }

  if (type === "boolean") {
    return true;
  }

  if (type === "string") {
    return stringExampleForFormat(schema.format);
  }

  return undefined;
};

const formatExample = (example: unknown, contentType: string): string => {
  if (contentType.includes("application/x-www-form-urlencoded") && isRecord(example)) {
    return new URLSearchParams(
      Object.entries(example).map(([name, value]) => [name, String(value)])
    ).toString();
  }

  if (typeof example === "string") {
    return example;
  }

  return JSON.stringify(example, null, 2);
};

const inferSchemaType = (schema: Record<string, unknown>): string | undefined => {
  if (typeof schema.type === "string") {
    return schema.type;
  }

  if (isRecord(schema.properties)) {
    return "object";
  }

  if ("items" in schema) {
    return "array";
  }

  return undefined;
};

const generateObjectExample = (
  schema: Record<string, unknown>,
  depth: number
): Record<string, unknown> => {
  const properties = isRecord(schema.properties) ? schema.properties : {};

  return Object.fromEntries(
    Object.entries(properties).map(([name, propertySchema]) => [
      name,
      generateSchemaExample(propertySchema, depth + 1) ?? null
    ])
  );
};

const firstRecord = (schemas: unknown): Record<string, unknown> | undefined => {
  if (!Array.isArray(schemas)) {
    return undefined;
  }

  return schemas.find(isRecord);
};

const stringExampleForFormat = (format: unknown): string => {
  if (format === "email") return "user@example.com";
  if (format === "date") return "2026-01-01";
  if (format === "date-time") return "2026-01-01T00:00:00.000Z";
  if (format === "uuid") return "00000000-0000-4000-8000-000000000000";
  if (format === "uri" || format === "url") return "https://example.com";

  return "string";
};

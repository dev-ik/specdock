import type { ApiMediaType, ApiOperation } from "./types.js";
import { isRecord } from "./openapi-utils.js";

export type SchemaField = {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  example?: unknown;
  enumValues?: string[];
};

export const getRequestBodySchemaFields = (
  operation: Pick<ApiOperation, "requestBody">,
  spec?: unknown
): SchemaField[] => {
  const mediaType = selectRequestMediaType(operation.requestBody?.content);
  const schema = resolveSchema(mediaType?.schema, spec);

  if (!isRecord(schema)) {
    return [];
  }

  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required)
    ? schema.required.filter((name): name is string => typeof name === "string")
    : [];

  return Object.entries(properties).flatMap(([name, propertySchema]) => {
    const resolvedProperty = resolveSchema(propertySchema, spec);
    if (!isRecord(resolvedProperty)) {
      return [];
    }

    return [
      {
        name,
        type: schemaTypeLabel(resolvedProperty),
        required: required.includes(name),
        description:
          typeof resolvedProperty.description === "string"
            ? resolvedProperty.description
            : undefined,
        example: resolvedProperty.example,
        enumValues: enumLabels(resolvedProperty.enum)
      }
    ];
  });
};

export const selectRequestMediaType = (
  content: ApiMediaType[] | undefined
): ApiMediaType | undefined => {
  if (!content || content.length === 0) {
    return undefined;
  }

  return content.find((mediaType) => mediaType.contentType.includes("json")) ?? content[0];
};

const resolveSchema = (schema: unknown, spec: unknown): unknown => {
  if (!isRecord(schema) || typeof schema.$ref !== "string") {
    return schema;
  }

  if (!schema.$ref.startsWith("#/")) {
    return schema;
  }

  return schema.$ref
    .slice(2)
    .split("/")
    .reduce<unknown>((value, segment) => {
      if (!isRecord(value)) {
        return undefined;
      }

      return value[segment.replaceAll("~1", "/").replaceAll("~0", "~")];
    }, spec);
};

const schemaTypeLabel = (schema: Record<string, unknown>): string => {
  if (typeof schema.type === "string") {
    return schema.format ? `${schema.type}:${String(schema.format)}` : schema.type;
  }

  if (isRecord(schema.properties)) return "object";
  if ("items" in schema) return "array";
  if (Array.isArray(schema.enum)) return "enum";

  return "unknown";
};

const enumLabels = (values: unknown): string[] | undefined => {
  if (!Array.isArray(values)) {
    return undefined;
  }

  return values.map(String);
};

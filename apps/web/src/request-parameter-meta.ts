import type { ApiOperation } from "@specdock/core";
import { serializationHint } from "./request-serialization.js";

export type RequestFieldMeta = {
  type?: string;
  required?: boolean;
  description?: string;
  serialization?: string;
};

export const requestParameterMeta = (
  operation: ApiOperation,
  location: "path" | "query" | "header"
): Record<string, RequestFieldMeta> =>
  Object.fromEntries(
    operation.parameters
      .filter((parameter) => parameter.in === location)
      .map((parameter) => [
        parameter.name,
        {
          type: schemaType(parameter.schema),
          required: parameter.required,
          description: parameter.description,
          serialization: serializationHint(parameter)
        }
      ])
  );

const schemaType = (schema: unknown): string | undefined => {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return undefined;
  }

  const record = schema as Record<string, unknown>;
  return typeof record.type === "string"
    ? record.format
      ? `${record.type}:${String(record.format)}`
      : record.type
    : undefined;
};

import type { ApiSchema } from "@specdock/core";
import { sanitizeTypeName } from "./naming.js";
import { isRecord } from "./schema-utils.js";

export const generateTypesFile = (schemas: ApiSchema[]): string => {
  if (schemas.length === 0) {
    return "export type EmptySchema = Record<string, never>;\n";
  }

  return `${schemas.map(generateType).join("\n\n")}\n`;
};

const generateType = ({ name, schema }: ApiSchema): string => {
  return `export type ${sanitizeTypeName(name)} = ${schemaToType(schema)};`;
};

const schemaToType = (schema: unknown): string => {
  if (!isRecord(schema)) {
    return "unknown";
  }

  if ("$ref" in schema && typeof schema.$ref === "string") {
    return sanitizeTypeName(schema.$ref.split("/").at(-1) ?? "UnknownRef");
  }

  if (Array.isArray(schema.enum)) {
    return schema.enum.map((value) => JSON.stringify(value)).join(" | ");
  }

  switch (schema.type) {
    case "string":
      return "string";
    case "integer":
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "array":
      return `${schemaToType(schema.items)}[]`;
    case "object":
    default:
      return objectSchemaToType(schema);
  }
};

const objectSchemaToType = (schema: Record<string, unknown>): string => {
  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required)
    ? schema.required.filter((field): field is string => typeof field === "string")
    : [];
  const entries = Object.entries(properties);

  if (entries.length === 0) {
    return "Record<string, unknown>";
  }

  const fields = entries.map(([key, value]) => {
    const optional = required.includes(key) ? "" : "?";
    return `  ${JSON.stringify(key)}${optional}: ${schemaToType(value)};`;
  });

  return `{\n${fields.join("\n")}\n}`;
};

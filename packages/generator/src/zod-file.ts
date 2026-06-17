import type { ApiSchema } from "@specdock/core";
import { safeIdentifier, sanitizeTypeName } from "./naming.js";
import { isRecord } from "./schema-utils.js";

export const generateZodFile = (schemas: ApiSchema[]): string => {
  if (schemas.length === 0) {
    return 'import { z } from "zod";\n\nexport const emptySchema = z.record(z.never());\n';
  }

  return `import { z } from "zod";

${schemas.map(generateZodSchema).join("\n\n")}
`;
};

const generateZodSchema = ({ name, schema }: ApiSchema): string => {
  return `export const ${safeIdentifier(`${sanitizeTypeName(name)}Schema`)} = ${schemaToZod(schema)};`;
};

const schemaToZod = (schema: unknown): string => {
  if (!isRecord(schema)) {
    return "z.unknown()";
  }

  if ("$ref" in schema && typeof schema.$ref === "string") {
    return safeIdentifier(`${sanitizeTypeName(schema.$ref.split("/").at(-1) ?? "UnknownRef")}Schema`);
  }

  if (Array.isArray(schema.enum) && schema.enum.every((value) => typeof value === "string")) {
    return schema.enum.length === 0
      ? "z.never()"
      : `z.enum([${schema.enum.map((value) => JSON.stringify(value)).join(", ")}])`;
  }

  switch (schema.type) {
    case "string":
      return "z.string()";
    case "integer":
      return "z.number().int()";
    case "number":
      return "z.number()";
    case "boolean":
      return "z.boolean()";
    case "array":
      return `${schemaToZod(schema.items)}.array()`;
    case "object":
    default:
      return objectSchemaToZod(schema);
  }
};

const objectSchemaToZod = (schema: Record<string, unknown>): string => {
  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required)
    ? schema.required.filter((field): field is string => typeof field === "string")
    : [];
  const entries = Object.entries(properties);

  if (entries.length === 0) {
    return "z.record(z.unknown())";
  }

  const fields = entries.map(([key, value]) => {
    const fieldSchema = schemaToZod(value);
    const optional = required.includes(key) ? "" : ".optional()";
    return `  ${JSON.stringify(key)}: ${fieldSchema}${optional}`;
  });

  return `z.object({\n${fields.join(",\n")}\n})`;
};

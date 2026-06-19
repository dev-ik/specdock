import type { ApiOperation, SchemaField } from "@specdock/core";
import { selectRequestMediaType } from "@specdock/core";

export const requestBodyContentType = (operation: ApiOperation): string | undefined =>
  selectRequestMediaType(operation.requestBody?.content)?.contentType;

export const requestBodyTitle = (operation: ApiOperation): string => {
  const contentType = requestBodyContentType(operation);
  if (contentType?.includes("application/x-www-form-urlencoded")) {
    return "Form body";
  }
  if (contentType?.includes("multipart/form-data")) {
    return "Multipart body";
  }
  if (contentType?.includes("application/octet-stream")) {
    return "Binary body";
  }

  return "JSON body";
};

export const requestBodyFieldValues = (
  operation: ApiOperation,
  body: string | undefined,
  fields: SchemaField[]
): Record<string, string> => {
  const values = parseBodyValues(operation, body);

  return Object.fromEntries(
    fields.map((field) => [field.name, stringifyValue(values[field.name])])
  );
};

export const updateRequestBodyField = (
  operation: ApiOperation,
  body: string | undefined,
  field: SchemaField,
  value: string
): string => {
  const values = parseBodyValues(operation, body);
  const nextValues = {
    ...values,
    [field.name]: valueForField(field, value)
  };

  return isFormUrlEncoded(operation)
    ? new URLSearchParams(
        Object.entries(nextValues).map(([name, fieldValue]) => [
          name,
          stringifyValue(fieldValue)
        ])
      ).toString()
    : JSON.stringify(nextValues, null, 2);
};

const parseBodyValues = (
  operation: ApiOperation,
  body: string | undefined
): Record<string, unknown> => {
  if (!body?.trim()) {
    return {};
  }

  if (isFormUrlEncoded(operation)) {
    return Object.fromEntries(new URLSearchParams(body).entries());
  }

  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const valueForField = (field: SchemaField, value: string): unknown => {
  if (field.type === "boolean") {
    return value === "true";
  }

  if ((field.type === "number" || field.type.startsWith("integer")) && value.trim()) {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : value;
  }

  return value;
};

const stringifyValue = (value: unknown): string => {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
};

const isFormUrlEncoded = (operation: ApiOperation): boolean =>
  requestBodyContentType(operation)?.includes("application/x-www-form-urlencoded") ?? false;

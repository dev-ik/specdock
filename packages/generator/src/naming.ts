import type { ApiOperation, GenerateOptions } from "@specdock/core";

export const operationName = (operation: ApiOperation, options: GenerateOptions): string => {
  if (options.namingStyle === "operationId" && operation.operationId) {
    return safeIdentifier(operation.operationId);
  }

  const segments = operation.path
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.replace(/[{}]/g, ""))
    .map(capitalize);

  const suffix = segments.join("") || "Root";
  const prefix =
    operation.method === "GET"
      ? "get"
      : operation.method === "POST"
        ? "create"
        : operation.method === "PUT"
          ? "update"
          : operation.method.toLowerCase();

  return safeIdentifier(`${prefix}${suffix}`);
};

export const normalizeOutputPath = (outputPath: string): string => {
  return outputPath.replace(/^\/+|\/+$/g, "") || "generated";
};

export const sanitizeTypeName = (value: string): string => {
  const name = value.replace(/[^a-zA-Z0-9_$]/g, " ");
  return name
    .split(" ")
    .filter(Boolean)
    .map(capitalize)
    .join("");
};

export const safeIdentifier = (value: string): string => {
  const identifier = value.replace(/[^a-zA-Z0-9_$]/g, "_");
  return /^[a-zA-Z_$]/.test(identifier) ? identifier : `_${identifier}`;
};

const capitalize = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

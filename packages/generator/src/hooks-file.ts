import type { ApiOperation, GenerateOptions } from "@specdock/core";
import { operationName, safeIdentifier, sanitizeTypeName } from "./naming.js";

export const generateReactQueryFile = (
  operations: ApiOperation[],
  options: GenerateOptions
): string => {
  const hooks = operations.map((operation) => generateReactQueryHook(operation, options));
  const operationImports = operations.map((operation) => operationName(operation, options));
  const clientImport =
    operationImports.length > 0
      ? `import { createClient, ${operationImports.join(", ")} } from "./client";`
      : 'import { createClient } from "./client";';

  return `import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from "@tanstack/react-query";
${clientImport}

type SpecDockClient = ReturnType<typeof createClient>;

${hooks.join("\n\n")}
`;
};

const generateReactQueryHook = (operation: ApiOperation, options: GenerateOptions): string => {
  const name = operationName(operation, options);
  const hookName = `use${sanitizeTypeName(name)}${operation.method === "GET" ? "Query" : "Mutation"}`;
  const pathParams = operation.parameters.filter((parameter) => parameter.in === "path");
  const hasQuery = operation.parameters.some((parameter) => parameter.in === "query");
  const hasBody = operation.requestBody !== undefined;

  if (operation.method === "GET") {
    const params = pathParams.map((parameter) => `${safeIdentifier(parameter.name)}: string`);
    const signatureParams = [
      "client: SpecDockClient",
      ...params,
      hasQuery ? "query?: Record<string, string | number | boolean | undefined>" : undefined,
      "headers?: Record<string, string>"
    ].filter(Boolean);
    const callArgs = [
      "client",
      ...pathParams.map((parameter) => safeIdentifier(parameter.name)),
      hasQuery ? "query" : undefined,
      "headers"
    ].filter(Boolean);
    const queryKeyParts = [
      `"${name}"`,
      ...pathParams.map((parameter) => safeIdentifier(parameter.name)),
      hasQuery ? "query" : undefined
    ].filter(Boolean);

    return `export const ${hookName} = (${signatureParams.join(
      ", "
    )}, options?: Omit<UseQueryOptions<unknown, Error>, "queryKey" | "queryFn">) => {
  return useQuery({
    queryKey: [${queryKeyParts.join(", ")}],
    queryFn: () => ${name}(${callArgs.join(", ")}),
    ...options
  });
};`;
  }

  return generateMutationHook(name, hookName, pathParams, hasQuery, hasBody);
};

const generateMutationHook = (
  name: string,
  hookName: string,
  pathParams: ApiOperation["parameters"],
  hasQuery: boolean,
  hasBody: boolean
) => {
  const variablesTypeName = `${sanitizeTypeName(name)}Variables`;
  const variableFields = [
    ...pathParams.map((parameter) => `  ${safeIdentifier(parameter.name)}: string;`),
    hasQuery ? "  query?: Record<string, string | number | boolean | undefined>;" : undefined,
    hasBody ? "  body?: unknown;" : undefined,
    "  headers?: Record<string, string>;"
  ].filter(Boolean);
  const callArgs = [
    "client",
    ...pathParams.map((parameter) => `variables.${safeIdentifier(parameter.name)}`),
    hasQuery ? "variables.query" : undefined,
    hasBody ? "variables.body" : "undefined",
    "variables.headers"
  ].filter(Boolean);

  return `export type ${variablesTypeName} = {
${variableFields.join("\n")}
};

export const ${hookName} = (
  client: SpecDockClient,
  options?: UseMutationOptions<unknown, Error, ${variablesTypeName}>
) => {
  return useMutation({
    mutationFn: (variables) => ${name}(${callArgs.join(", ")}),
    ...options
  });
};`;
};

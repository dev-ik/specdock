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
  const hasBody = operation.requestBody !== undefined;

  if (operation.method === "GET") {
    const params = pathParams.map((parameter) => `${safeIdentifier(parameter.name)}: string`);
    const signatureParams = ["client: SpecDockClient", ...params, "headers?: Record<string, string>"];
    const callArgs = ["client", ...pathParams.map((parameter) => safeIdentifier(parameter.name)), "headers"];
    const queryKeyParts = [`"${name}"`, ...pathParams.map((parameter) => safeIdentifier(parameter.name))];

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

  return generateMutationHook(name, hookName, pathParams, hasBody);
};

const generateMutationHook = (
  name: string,
  hookName: string,
  pathParams: ApiOperation["parameters"],
  hasBody: boolean
) => {
  const variablesTypeName = `${sanitizeTypeName(name)}Variables`;
  const variableFields = [
    ...pathParams.map((parameter) => `  ${safeIdentifier(parameter.name)}: string;`),
    hasBody ? "  body?: unknown;" : undefined,
    "  headers?: Record<string, string>;"
  ].filter(Boolean);
  const callArgs = [
    "client",
    ...pathParams.map((parameter) => `variables.${safeIdentifier(parameter.name)}`),
    hasBody ? "variables.body" : "undefined",
    "variables.headers"
  ];

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

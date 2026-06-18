import type { SdkOperation, SdkParameter } from "./sdk-model.js";

export const generateReactQueryFile = (
  operations: SdkOperation[]
): string => {
  const hooks = operations.map((operation) => generateReactQueryHook(operation));
  const operationImports = operations.map((operation) => operation.name);
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

const generateReactQueryHook = (operation: SdkOperation): string => {
  const name = operation.name;
  const hookName = `use${operation.typeName}${operation.method === "GET" ? "Query" : "Mutation"}`;

  if (operation.method === "GET") {
    const params = operation.pathParameters.map((parameter) => `${parameter.safeName}: string`);
    const signatureParams = [
      "client: SpecDockClient",
      ...params,
      operation.hasQuery ? "query?: Record<string, string | number | boolean | undefined>" : undefined,
      "headers?: Record<string, string>"
    ].filter(Boolean);
    const callArgs = [
      "client",
      ...operation.pathParameters.map((parameter) => parameter.safeName),
      operation.hasQuery ? "query" : undefined,
      "headers"
    ].filter(Boolean);
    const queryKeyParts = [
      `"${name}"`,
      ...operation.pathParameters.map((parameter) => parameter.safeName),
      operation.hasQuery ? "query" : undefined
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

  return generateMutationHook(
    operation.name,
    hookName,
    operation.pathParameters,
    operation.hasQuery,
    operation.hasBody
  );
};

const generateMutationHook = (
  name: string,
  hookName: string,
  pathParams: SdkParameter[],
  hasQuery: boolean,
  hasBody: boolean
) => {
  const variablesTypeName = `${hookName.replace(/^use/, "").replace(/Mutation$/, "")}Variables`;
  const variableFields = [
    ...pathParams.map((parameter) => `  ${parameter.safeName}: string;`),
    hasQuery ? "  query?: Record<string, string | number | boolean | undefined>;" : undefined,
    hasBody ? "  body?: unknown;" : undefined,
    "  headers?: Record<string, string>;"
  ].filter(Boolean);
  const callArgs = [
    "client",
    ...pathParams.map((parameter) => `variables.${parameter.safeName}`),
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

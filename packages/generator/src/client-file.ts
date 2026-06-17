import type { ApiOperation, GenerateOptions } from "@specdock/core";
import { operationName, safeIdentifier } from "./naming.js";

export const generateClientFile = (
  operations: ApiOperation[],
  options: GenerateOptions
): string => {
  const requestHelper = options.client === "axios" ? axiosClientHelper : fetchClientHelper;
  const functions = operations.map((operation) => generateOperationFunction(operation, options));

  return `${requestHelper}\n${functions.join("\n\n")}\n`;
};

const fetchClientHelper = `export const createClient = (baseUrl = "") => ({
  request: async <T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> => {
    const response = await fetch(baseUrl + path, {
      method,
      headers: {
        "content-type": "application/json",
        ...headers
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(\`Request failed with status \${response.status}\`);
    }

    return response.json() as Promise<T>;
  }
});
`;

const axiosClientHelper = `type AxiosLike = { request<T>(config: { method: string; url: string; data?: unknown; headers?: Record<string, string> }): Promise<{ data: T }> };

export const createClient = (axios: AxiosLike, baseUrl = "") => ({
  request: async <T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> => {
    const response = await axios.request<T>({ method, url: baseUrl + path, data: body, headers });
    return response.data;
  }
});
`;

const generateOperationFunction = (operation: ApiOperation, options: GenerateOptions): string => {
  const name = operationName(operation, options);
  const hasBody = operation.requestBody !== undefined;
  const pathParams = operation.parameters.filter((parameter) => parameter.in === "path");
  const args = [
    ...pathParams.map((parameter) => `${safeIdentifier(parameter.name)}: string`),
    hasBody ? "body?: unknown" : undefined,
    "headers?: Record<string, string>"
  ].filter(Boolean);
  const path = pathParams.reduce(
    (nextPath, parameter) =>
      nextPath.replace(`{${parameter.name}}`, `\${encodeURIComponent(${safeIdentifier(parameter.name)})}`),
    operation.path
  );

  return `export const ${name} = async (client: ReturnType<typeof createClient>, ${args.join(
    ", "
  )}) => {\n  return client.request<unknown>("${operation.method}", \`${path}\`${hasBody ? ", body" : ", undefined"}, headers);\n};`;
};

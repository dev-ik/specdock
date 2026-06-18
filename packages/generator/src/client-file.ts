import type { GenerateOptions } from "@specdock/core";
import type { SdkOperation } from "./sdk-model.js";

export const generateClientFile = (
  operations: SdkOperation[],
  options: GenerateOptions
): string => {
  const requestHelper =
    options.client === "axios" ? axiosClientHelper : fetchClientHelper;
  const functions = operations.map((operation) =>
    generateOperationFunction(operation)
  );

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

type QueryValue = string | number | boolean | null | undefined;

const appendQuery = (path: string, query?: Record<string, QueryValue>) => {
  const entries = Object.entries(query ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (entries.length === 0) return path;

  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    search.set(key, String(value));
  }

  return \`\${path}\${path.includes("?") ? "&" : "?"}\${search.toString()}\`;
};
`;

const axiosClientHelper = `type AxiosLike = { request<T>(config: { method: string; url: string; data?: unknown; headers?: Record<string, string> }): Promise<{ data: T }> };

export const createClient = (axios: AxiosLike, baseUrl = "") => ({
  request: async <T>(method: string, path: string, body?: unknown, headers?: Record<string, string>): Promise<T> => {
    const response = await axios.request<T>({ method, url: baseUrl + path, data: body, headers });
    return response.data;
  }
});

type QueryValue = string | number | boolean | null | undefined;

const appendQuery = (path: string, query?: Record<string, QueryValue>) => {
  const entries = Object.entries(query ?? {}).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (entries.length === 0) return path;

  const search = new URLSearchParams();
  for (const [key, value] of entries) {
    search.set(key, String(value));
  }

  return \`\${path}\${path.includes("?") ? "&" : "?"}\${search.toString()}\`;
};
`;

const generateOperationFunction = (
  operation: SdkOperation
): string => {
  const name = operation.name;
  const args = [
    ...operation.pathParameters.map((parameter) => `${parameter.safeName}: string`),
    operation.hasQuery ? "query?: Record<string, QueryValue>" : undefined,
    operation.hasBody ? "body?: unknown" : undefined,
    "headers?: Record<string, string>"
  ].filter(Boolean);
  const path = operation.pathParameters.reduce(
    (nextPath, parameter) =>
      nextPath.replace(
        `{${parameter.name}}`,
        parameterPlaceholder(parameter.safeName)
      ),
    operation.path
  );
  const pathExpression = operation.hasQuery
    ? `appendQuery(${pathToExpression(path)}, query)`
    : pathToExpression(path);
  const bodyArg = operation.hasBody ? "body" : "undefined";

  return `export const ${name} = async (client: ReturnType<typeof createClient>, ${args.join(
    ", "
  )}) => {\n  return client.request<unknown>("${operation.method}", ${pathExpression}, ${bodyArg}, headers);\n};`;
};

const pathParameterMarker = "\u0000";

const parameterPlaceholder = (name: string): string =>
  `${pathParameterMarker}${name}${pathParameterMarker}`;

const pathToExpression = (path: string): string => {
  const parts: string[] = [];
  let cursor = 0;

  while (cursor < path.length) {
    const start = path.indexOf(pathParameterMarker, cursor);

    if (start === -1) {
      parts.push(path.slice(cursor));
      break;
    }

    const end = path.indexOf(pathParameterMarker, start + 1);

    if (end === -1) {
      parts.push(path.slice(cursor));
      break;
    }

    if (start > cursor) {
      parts.push(path.slice(cursor, start));
    }

    parts.push(path.slice(start, end + 1));
    cursor = end + 1;
  }

  if (parts.length === 0) {
    return JSON.stringify(path);
  }

  return parts
    .map((part) => {
      if (
        part.startsWith(pathParameterMarker) &&
        part.endsWith(pathParameterMarker)
      ) {
        return `encodeURIComponent(${part.slice(1, -1)})`;
      }

      return JSON.stringify(part);
    })
    .join(" + ");
};

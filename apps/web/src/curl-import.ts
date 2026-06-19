import type { RequestState } from "@specdock/core";
import { parseCurlCommand } from "./curl-import-parser.js";
import { createCurlImportSpec, createOperationId } from "./curl-import-spec.js";
import { CurlImportError, type CurlImportResult } from "./curl-import-types.js";

export { CurlImportError };

const OPENAPI_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;

export const importCurlCommand = (
  command: string,
  requestMode: RequestState["requestMode"] = "direct"
): CurlImportResult => {
  const parsed = parseCurlCommand(command);
  const baseUrl = parsed.url.origin;
  const path = parsed.url.pathname || "/";
  const operationId = createOperationId(parsed.method, path);
  const queryParams = Object.fromEntries(parsed.url.searchParams.entries());
  const spec = createCurlImportSpec(parsed, operationId, baseUrl, path);

  return {
    specText: JSON.stringify(spec, null, 2),
    baseUrl,
    operationId,
    requestState: {
      operationId,
      pathParams: {},
      queryParams,
      headers: parsed.headers,
      body: parsed.body,
      requestMode
    }
  };
};

export const appendCurlCommandToSpec = (
  spec: unknown,
  command: string,
  requestMode: RequestState["requestMode"] = "direct"
): CurlImportResult => {
  const imported = importCurlCommand(command, requestMode);
  const importedSpec = asRecord(JSON.parse(imported.specText));
  const operation = findImportedOperation(importedSpec);
  const baseSpec = asRecord(spec);
  const existingIds = collectOperationIds(baseSpec, operation);
  const operationId = uniqueOperationId(imported.operationId, existingIds);
  const nextOperation = {
    ...operation.value,
    operationId,
    summary: `${operation.method.toUpperCase()} ${operation.path}`
  };
  const nextPathItem = {
    ...asRecord(asRecord(baseSpec.paths)[operation.path]),
    ...asRecord(asRecord(importedSpec.paths)[operation.path]),
    [operation.method]: nextOperation
  };
  const mergedSpec = {
    ...baseSpec,
    openapi: typeof baseSpec.openapi === "string" ? baseSpec.openapi : "3.0.3",
    info: isRecord(baseSpec.info)
      ? baseSpec.info
      : (isRecord(importedSpec.info) ? importedSpec.info : { title: "Imported cURL", version: "1.0.0" }),
    servers: mergeServers(baseSpec.servers, importedSpec.servers),
    tags: mergeTags(baseSpec.tags, importedSpec.tags),
    paths: {
      ...asRecord(baseSpec.paths),
      [operation.path]: nextPathItem
    }
  };

  return {
    ...imported,
    operationId,
    specText: JSON.stringify(mergedSpec, null, 2),
    requestState: {
      ...imported.requestState,
      operationId
    }
  };
};

const findImportedOperation = (
  spec: Record<string, unknown>
): { path: string; method: typeof OPENAPI_METHODS[number]; value: Record<string, unknown> } => {
  const paths = asRecord(spec.paths);

  for (const [path, pathItem] of Object.entries(paths)) {
    const pathRecord = asRecord(pathItem);
    for (const method of OPENAPI_METHODS) {
      const operation = pathRecord[method];
      if (isRecord(operation)) {
        return { path, method, value: operation };
      }
    }
  }

  throw new CurlImportError("INVALID_CURL", "Imported cURL did not produce an operation.");
};

const collectOperationIds = (
  spec: Record<string, unknown>,
  imported: { path: string; method: string }
): Set<string> => {
  const ids = new Set<string>();

  for (const [path, pathItem] of Object.entries(asRecord(spec.paths))) {
    const pathRecord = asRecord(pathItem);
    for (const method of OPENAPI_METHODS) {
      if (path === imported.path && method === imported.method) continue;
      const operation = pathRecord[method];
      if (isRecord(operation) && typeof operation.operationId === "string") {
        ids.add(operation.operationId);
      }
    }
  }

  return ids;
};

const uniqueOperationId = (baseId: string, existingIds: Set<string>): string => {
  if (!existingIds.has(baseId)) return baseId;

  let index = 2;
  while (existingIds.has(`${baseId}${index}`)) {
    index += 1;
  }

  return `${baseId}${index}`;
};

const mergeServers = (current: unknown, imported: unknown): unknown[] => {
  const seen = new Set<string>();

  return [...asArray(current), ...asArray(imported)].filter((server) => {
    if (!isRecord(server) || typeof server.url !== "string" || seen.has(server.url)) {
      return false;
    }

    seen.add(server.url);
    return true;
  });
};

const mergeTags = (current: unknown, imported: unknown): unknown[] => {
  const seen = new Set<string>();

  return [...asArray(current), ...asArray(imported)].filter((tag) => {
    if (!isRecord(tag) || typeof tag.name !== "string" || seen.has(tag.name)) {
      return false;
    }

    seen.add(tag.name);
    return true;
  });
};

const asArray = (value: unknown): unknown[] => Array.isArray(value) ? value : [];

const asRecord = (value: unknown): Record<string, unknown> =>
  isRecord(value) ? value : {};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

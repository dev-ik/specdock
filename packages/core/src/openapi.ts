import { parse as parseYaml } from "yaml";
import type {
  ApiOperation,
  ApiSchema,
  ApiServer,
  ApiTag,
  NormalizedOpenApi
} from "./types.js";
import {
  HTTP_METHODS,
  extractParameters,
  extractRequestBody,
  extractResponses,
  extractSecurity
} from "./openapi-operation.js";
import { assertRecord, isRecord, type OpenApiRecord } from "./openapi-utils.js";
import { convertSwagger2ToOpenApi3, isSwagger2Spec } from "./swagger2.js";

export const parseSpec = (input: string | unknown): OpenApiRecord => {
  if (typeof input !== "string") {
    return assertRecord(input, "Specification must be an object.");
  }

  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error("Specification is empty.");
  }

  try {
    return assertRecord(JSON.parse(trimmed), "Specification must be an object.");
  } catch {
    return assertRecord(parseYaml(trimmed), "Specification must be an object.");
  }
};

export const validateSpec = (spec: unknown): OpenApiRecord => {
  const document = assertRecord(spec, "Specification must be an object.");
  const openapi = document.openapi;

  if (isSwagger2Spec(document)) {
    return convertSwagger2ToOpenApi3(document);
  }

  if (typeof openapi !== "string" || !/^3\.(0|1)\.\d+/.test(openapi)) {
    throw new Error("Only OpenAPI 3.0.x and 3.1.x are supported.");
  }

  if (!isRecord(document.paths)) {
    throw new Error("OpenAPI document must include a paths object.");
  }

  return document;
};

export const normalizeSpec = (input: string | unknown): NormalizedOpenApi => {
  const parsed = parseSpec(input);
  const specFormat = isSwagger2Spec(parsed) ? "swagger2" : "openapi3";
  const spec = validateSpec(parsed);

  return {
    spec,
    specFormat,
    servers: extractServers(spec),
    tags: extractTags(spec),
    operations: extractOperations(spec),
    schemas: extractSchemas(spec)
  };
};

export const extractServers = (spec: unknown): ApiServer[] => {
  const document = assertRecord(spec, "Specification must be an object.");
  const servers = Array.isArray(document.servers) ? document.servers : [];

  return servers.flatMap((server): ApiServer[] => {
    if (!isRecord(server) || typeof server.url !== "string") {
      return [];
    }

    return [
      {
        url: server.url,
        description: typeof server.description === "string" ? server.description : undefined
      }
    ];
  });
};

export const extractTags = (spec: unknown): ApiTag[] => {
  const document = assertRecord(spec, "Specification must be an object.");
  const tags = Array.isArray(document.tags) ? document.tags : [];

  return tags.flatMap((tag): ApiTag[] => {
    if (!isRecord(tag) || typeof tag.name !== "string") {
      return [];
    }

    return [
      {
        name: tag.name,
        description: typeof tag.description === "string" ? tag.description : undefined
      }
    ];
  });
};

export const extractOperations = (spec: unknown): ApiOperation[] => {
  const document = validateSpec(spec);
  const paths = assertRecord(document.paths, "OpenAPI document must include paths.");
  const operations: ApiOperation[] = [];

  for (const [path, pathItem] of Object.entries(paths)) {
    if (!isRecord(pathItem)) {
      continue;
    }

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method.toLowerCase()];

      if (!isRecord(operation)) {
        continue;
      }

      const operationId =
        typeof operation.operationId === "string" ? operation.operationId : undefined;

      operations.push({
        id: operationId ?? `${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]+/g, "_")}`,
        operationId,
        method,
        path,
        summary: typeof operation.summary === "string" ? operation.summary : undefined,
        description: typeof operation.description === "string" ? operation.description : undefined,
        tags: Array.isArray(operation.tags)
          ? operation.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
        parameters: extractParameters(operation.parameters, pathItem.parameters),
        requestBody: extractRequestBody(operation.requestBody),
        responses: extractResponses(operation.responses),
        security: extractSecurity(operation.security)
      });
    }
  }

  return operations;
};

export const extractSchemas = (spec: unknown): ApiSchema[] => {
  const document = assertRecord(spec, "Specification must be an object.");
  const components = isRecord(document.components) ? document.components : {};
  const schemas = isRecord(components.schemas) ? components.schemas : {};

  return Object.entries(schemas).map(([name, schema]) => ({ name, schema }));
};

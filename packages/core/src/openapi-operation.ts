import type {
  ApiMediaType,
  ApiOperation,
  ApiParameter,
  ApiResponse,
  ApiSecurityRequirement
} from "./types.js";
import { isRecord } from "./openapi-utils.js";

export const HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS"
] as const;

export const extractParameters = (
  operationParameters: unknown,
  pathParameters: unknown
): ApiParameter[] => {
  const params = [
    ...(Array.isArray(pathParameters) ? pathParameters : []),
    ...(Array.isArray(operationParameters) ? operationParameters : [])
  ];

  return params.flatMap((parameter): ApiParameter[] => {
    if (!isRecord(parameter) || "$ref" in parameter || typeof parameter.name !== "string") {
      return [];
    }

    const location = parameter.in;
    if (!["path", "query", "header", "cookie"].includes(String(location))) {
      return [];
    }

    return [
      {
        name: parameter.name,
        in: location as ApiParameter["in"],
        required: Boolean(parameter.required),
        description: typeof parameter.description === "string" ? parameter.description : undefined,
        schema: parameter.schema,
        example: parameter.example
      }
    ];
  });
};

export const extractRequestBody = (requestBody: unknown): ApiOperation["requestBody"] => {
  if (!isRecord(requestBody) || "$ref" in requestBody) {
    return undefined;
  }

  return {
    required: Boolean(requestBody.required),
    content: extractContent(requestBody.content)
  };
};

export const extractResponses = (responses: unknown): ApiResponse[] => {
  if (!isRecord(responses)) {
    return [];
  }

  return Object.entries(responses).map(([statusCode, response]) => {
    const responseRecord = isRecord(response) ? response : {};

    return {
      statusCode,
      description:
        typeof responseRecord.description === "string" ? responseRecord.description : undefined,
      content: extractContent(responseRecord.content)
    };
  });
};

export const extractSecurity = (security: unknown): ApiSecurityRequirement[] | undefined => {
  if (!Array.isArray(security)) {
    return undefined;
  }

  return security.flatMap((requirement): ApiSecurityRequirement[] => {
    if (!isRecord(requirement)) {
      return [];
    }

    return Object.entries(requirement).map(([name, scopes]) => ({
      name,
      scopes: Array.isArray(scopes)
        ? scopes.filter((scope): scope is string => typeof scope === "string")
        : undefined
    }));
  });
};

const extractContent = (content: unknown): ApiMediaType[] => {
  if (!isRecord(content)) {
    return [];
  }

  return Object.entries(content).map(([contentType, mediaType]) => {
    const mediaTypeRecord = isRecord(mediaType) ? mediaType : {};

    return {
      contentType,
      schema: mediaTypeRecord.schema,
      example: mediaTypeRecord.example
    };
  });
};

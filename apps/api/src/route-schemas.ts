import { LIMITS } from "@specdock/core";

const generateOptionsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    language: { type: "string", enum: ["typescript", "python", "go", "java", "csharp", "php"] },
    client: { type: "string", enum: ["fetch", "axios"] },
    generateTypes: { type: "boolean" },
    generateReactQuery: { type: "boolean" },
    generateZod: { type: "boolean" },
    outputPath: {
      type: "string",
      minLength: 1,
      maxLength: 160,
      pattern:
        "^/?(?!.*(?:^|/)\\.\\.?$)(?!.*(?:^|/)\\.\\.?/)(?!.*\\\\)[A-Za-z0-9._-]+(?:/[A-Za-z0-9._-]+)*/?$"
    },
    namingStyle: { type: "string", enum: ["operationId", "camelCase"] }
  }
} as const;

export const generateRequestSchema = {
  body: {
    type: "object",
    required: ["spec"],
    additionalProperties: false,
    properties: {
      spec: {},
      options: generateOptionsSchema
    }
  }
} as const;

export const proxyRequestSchema = {
  body: {
    type: "object",
    required: ["method", "url"],
    additionalProperties: false,
    properties: {
      method: {
        type: "string",
        enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]
      },
      url: {
        type: "string",
        minLength: 1,
        maxLength: 4096,
        pattern: "^https?://"
      },
      headers: {
        type: "object",
        maxProperties: 100,
        propertyNames: {
          type: "string",
          minLength: 1,
          maxLength: 128,
          pattern: "^[!#$%&'*+.^_`|~0-9A-Za-z-]+$"
        },
        additionalProperties: {
          type: "string",
          maxLength: 8192
        }
      },
      body: {
        type: "string",
        maxLength: LIMITS.maxProxyRequestBodyBytes
      },
      timeoutMs: {
        type: "integer",
        minimum: 1,
        maximum: LIMITS.proxyTimeoutMs
      }
    }
  }
} as const;

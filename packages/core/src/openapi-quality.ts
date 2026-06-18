import type {
  ApiMediaType,
  ApiOperation,
  NormalizedOpenApi,
  OpenApiQualityFinding,
  OpenApiQualitySeverity
} from "./types.js";

type OperationContext = {
  operation: ApiOperation;
  methodKey: string;
};

export const analyzeOpenApiQuality = (
  project: Pick<NormalizedOpenApi, "operations" | "tags">
): OpenApiQualityFinding[] => {
  const findings: OpenApiQualityFinding[] = [];
  const declaredTags = new Set(project.tags.map((tag) => tag.name));
  const duplicateOperationIds = getDuplicateOperationIds(project.operations);

  for (const operation of project.operations) {
    const context = {
      operation,
      methodKey: operation.method.toLowerCase()
    };

    if (operation.operationId && duplicateOperationIds.has(operation.operationId)) {
      findings.push(
        createOperationFinding(
          context,
          "error",
          "duplicate-operation-id",
          `Duplicate operationId "${operation.operationId}".`,
          "operationId"
        )
      );
    }

    if (!operation.operationId?.trim()) {
      findings.push(
        createOperationFinding(
          context,
          "warning",
          "missing-operation-id",
          "Operation is missing operationId.",
          "operationId"
        )
      );
    }

    if (!operation.summary?.trim()) {
      findings.push(
        createOperationFinding(
          context,
          "info",
          "missing-operation-summary",
          "Operation is missing a short summary.",
          "summary"
        )
      );
    }

    if (!operation.description?.trim()) {
      findings.push(
        createOperationFinding(
          context,
          "info",
          "missing-operation-description",
          "Operation is missing a detailed description.",
          "description"
        )
      );
    }

    if (operation.tags.length === 0) {
      findings.push(
        createOperationFinding(
          context,
          "warning",
          "operation-without-tags",
          "Operation is not assigned to a tag.",
          "tags"
        )
      );
    }

    for (const tag of operation.tags) {
      if (declaredTags.size > 0 && !declaredTags.has(tag)) {
        findings.push(
          createOperationFinding(
            context,
            "info",
            "undefined-operation-tag",
            `Tag "${tag}" is used but not declared in top-level tags.`,
            "tags"
          )
        );
      }
    }

    if (!hasErrorResponse(operation)) {
      findings.push(
        createOperationFinding(
          context,
          "warning",
          "missing-error-response",
          "Operation does not document a 4xx, 5xx, or default response.",
          "responses"
        )
      );
    }

    if (operation.requestBody?.content.some(hasSchemaWithoutExample)) {
      findings.push(
        createOperationFinding(
          context,
          "info",
          "missing-request-example",
          "Request body schema has no example.",
          "requestBody"
        )
      );
    }

    if (operation.responses.some((response) => response.content.some(hasSchemaWithoutExample))) {
      findings.push(
        createOperationFinding(
          context,
          "info",
          "missing-response-example",
          "Response schema has no example.",
          "responses"
        )
      );
    }
  }

  return findings;
};

const getDuplicateOperationIds = (operations: ApiOperation[]): Set<string> => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const operation of operations) {
    const operationId = operation.operationId?.trim();
    if (!operationId) continue;

    if (seen.has(operationId)) {
      duplicates.add(operationId);
    }

    seen.add(operationId);
  }

  return duplicates;
};

const hasErrorResponse = (operation: ApiOperation): boolean => {
  return operation.responses.some((response) => {
    if (response.statusCode === "default") return true;

    const statusCode = Number(response.statusCode);
    return Number.isInteger(statusCode) && statusCode >= 400;
  });
};

const hasSchemaWithoutExample = (mediaType: ApiMediaType): boolean => {
  return mediaType.schema !== undefined && mediaType.example === undefined;
};

const createOperationFinding = (
  context: OperationContext,
  severity: OpenApiQualitySeverity,
  code: OpenApiQualityFinding["code"],
  message: string,
  field: string
): OpenApiQualityFinding => {
  const { operation, methodKey } = context;

  return {
    severity,
    code,
    message,
    location: `paths.${operation.path}.${methodKey}.${field}`,
    operationId: operation.operationId,
    method: operation.method,
    path: operation.path
  };
};

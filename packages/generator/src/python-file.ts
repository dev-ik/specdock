import type { ApiSchema, GenerateOptions } from "@specdock/core";
import type { SdkModel, SdkOperation } from "./sdk-model.js";
import {
  parameterPlaceholder,
  pathToPythonExpression,
  pythonClassName,
  pythonFieldName,
  pythonIdentifier
} from "./python-naming.js";
import { isRecord } from "./schema-utils.js";

const DEFAULT_PACKAGE_NAME = "specdock_client";

export const generatePythonFiles = (model: SdkModel, outputPath: string, options: GenerateOptions) => {
  const packageName = pythonPackageName(options.packageName);

  return [
  {
    path: `${outputPath}/pyproject.toml`,
    content: generatePyprojectFile(options.packageName)
  },
  {
    path: `${outputPath}/${packageName}/__init__.py`,
    content: generatePythonInitFile(model.operations, model.schemas, options.clientName)
  },
  {
    path: `${outputPath}/${packageName}/client.py`,
    content: generatePythonClientFile(model.operations, options.clientName)
  },
  {
    path: `${outputPath}/${packageName}/models.py`,
    content: generatePythonModelsFile(model.schemas)
  }
  ];
};

const generatePyprojectFile = (packageName: string) => `[project]
name = "${packageName}"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
  "httpx>=0.27.0"
]
`;

const generatePythonInitFile = (
  operations: SdkOperation[],
  schemas: ApiSchema[],
  clientName: string
) => {
  const operationNames = operations.map((operation) => pythonIdentifier(operation.name));
  const schemaNames = schemas.map((schema) => pythonClassName(schema.name));
  const className = pythonClassName(clientName);
  const exports = [className, ...operationNames, ...schemaNames];

  return `from .client import ${className}${operationNames.length > 0 ? `, ${operationNames.join(", ")}` : ""}
from .models import ${schemaNames.length > 0 ? schemaNames.join(", ") : "JsonValue"}

__all__ = ${JSON.stringify(exports, null, 2)}
`;
};

const generatePythonClientFile = (operations: SdkOperation[], clientName: string) => `from __future__ import annotations

from typing import Any
from urllib.parse import quote

import httpx


class ${pythonClassName(clientName)}:
    def __init__(self, base_url: str = "", client: httpx.Client | None = None) -> None:
        self.base_url = base_url.rstrip("/")
        self._client = client or httpx.Client()
        self._owns_client = client is None

    def request(
        self,
        method: str,
        path: str,
        json: Any | None = None,
        headers: dict[str, str] | None = None,
        params: dict[str, Any] | None = None,
        base_url: str | None = None,
    ) -> Any:
        request_base_url = (base_url or self.base_url).rstrip("/")
        response = self._client.request(
            method,
            f"{request_base_url}{path}",
            json=json,
            headers=headers,
            params=_clean_params(params),
        )
        response.raise_for_status()
        if not response.content:
            return None
        return response.json()

    def close(self) -> None:
        if self._owns_client:
            self._client.close()

    def __enter__(self) -> "${pythonClassName(clientName)}":
        return self

    def __exit__(self, *args: object) -> None:
        self.close()


def _clean_params(params: dict[str, Any] | None) -> dict[str, Any] | None:
    if params is None:
        return None
    return {key: value for key, value in params.items() if value not in (None, "")}


${operations.map((operation) => generatePythonOperation(operation, clientName)).join("\n\n")}
`;

const pythonPackageName = (packageName: string): string => {
  if (packageName === "specdock-generated-client") return DEFAULT_PACKAGE_NAME;
  return pythonIdentifier(packageName.replaceAll("-", "_").replaceAll("/", "_"));
};

const generatePythonOperation = (operation: SdkOperation, clientName: string): string => {
  const name = pythonIdentifier(operation.name);
  const pathParams = operation.pathParameters.map(
    (parameter) => `${pythonIdentifier(parameter.safeName)}: str`
  );
  const args = [
    `client: ${pythonClassName(clientName)}`,
    ...pathParams,
    operation.baseUrlStrategy === "perRequest" ? "base_url: str" : undefined,
    operation.hasQuery ? "query: dict[str, Any] | None = None" : undefined,
    operation.hasBody ? "body: Any | None = None" : undefined,
    "headers: dict[str, str] | None = None"
  ].filter(Boolean);
  const path = operation.pathParameters.reduce(
    (nextPath, parameter) =>
      nextPath.replace(
        `{${parameter.name}}`,
        parameterPlaceholder(pythonIdentifier(parameter.safeName))
      ),
    operation.path
  );
  const bodyArg = operation.hasBody ? "body" : "None";
  const queryArg = operation.hasQuery ? "query" : "None";
  const baseUrlArg = operation.baseUrlStrategy === "perRequest" ? "base_url" : "None";

  return `def ${name}(${args.join(", ")}) -> Any:
    path = ${pathToPythonExpression(path)}
    return client.request("${operation.method}", path, json=${bodyArg}, headers=headers, params=${queryArg}, base_url=${baseUrlArg})`;
};

const generatePythonModelsFile = (schemas: ApiSchema[]) => {
  if (schemas.length === 0) {
    return `from __future__ import annotations

from typing import Any

JsonValue = Any
`;
  }

  return `from __future__ import annotations

from typing import Any, NotRequired, TypedDict

${schemas.map(generatePythonModel).join("\n\n")}
`;
};

const generatePythonModel = ({ name, schema }: ApiSchema): string => {
  const className = pythonClassName(name);

  if (!isRecord(schema) || schema.type !== "object") {
    return `${className} = ${schemaToPythonType(schema)}`;
  }

  const properties = isRecord(schema.properties) ? schema.properties : {};
  const required = Array.isArray(schema.required)
    ? schema.required.filter((field): field is string => typeof field === "string")
    : [];
  const fields = Object.entries(properties).map(([key, value]) => {
    const fieldType = schemaToPythonType(value);
    const typeExpression = required.includes(key)
      ? fieldType
      : `NotRequired[${fieldType}]`;

    return `    ${pythonFieldName(key)}: ${typeExpression}`;
  });

  return `class ${className}(TypedDict):
${fields.length > 0 ? fields.join("\n") : "    pass"}`;
};

const schemaToPythonType = (schema: unknown): string => {
  if (!isRecord(schema)) {
    return "Any";
  }

  if ("$ref" in schema && typeof schema.$ref === "string") {
    return pythonClassName(schema.$ref.split("/").at(-1) ?? "UnknownRef");
  }

  if (Array.isArray(schema.enum)) {
    return "str";
  }

  switch (schema.type) {
    case "string":
      return "str";
    case "integer":
      return "int";
    case "number":
      return "float";
    case "boolean":
      return "bool";
    case "array":
      return `list[${schemaToPythonType(schema.items)}]`;
    case "object":
      return "dict[str, Any]";
    default:
      return "Any";
  }
};

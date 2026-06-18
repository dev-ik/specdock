import type { ApiSchema } from "@specdock/core";
import type { SdkModel, SdkOperation } from "./sdk-model.js";
import {
  parameterPlaceholder,
  pathToPhpExpression,
  phpClassName,
  phpMethodName,
  phpStringLiteral,
  phpVariableName
} from "./php-naming.js";
import { isRecord } from "./schema-utils.js";

export const generatePhpFiles = (model: SdkModel, outputPath: string) => [
  { path: `${outputPath}/composer.json`, content: generateComposerFile() },
  { path: `${outputPath}/src/SpecDockClient.php`, content: generateClientFile(model.operations) },
  { path: `${outputPath}/src/Models.php`, content: generateModelsFile(model.schemas) }
];

const generateComposerFile = () => `{
  "name": "specdock/generated-client",
  "type": "library",
  "require": {
    "php": ">=8.1",
    "guzzlehttp/guzzle": "^7.0"
  },
  "autoload": {
    "psr-4": {
      "SpecDock\\\\Client\\\\": "src/"
    }
  }
}
`;

const generateClientFile = (operations: SdkOperation[]) => `<?php

declare(strict_types=1);

namespace SpecDock\\Client;

use GuzzleHttp\\Client;
use GuzzleHttp\\ClientInterface;

final class SpecDockClient
{
    private string $baseUrl;
    private ClientInterface $httpClient;

    public function __construct(string $baseUrl, ?ClientInterface $httpClient = null)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->httpClient = $httpClient ?? new Client();
    }

    public function request(string $method, string $path, array $query = [], mixed $body = null, array $headers = []): mixed
    {
        $options = ['headers' => $headers, 'query' => array_filter($query, static fn ($value): bool => $value !== null && $value !== '')];
        if ($body !== null) {
            $options['json'] = $body;
        }

        $response = $this->httpClient->request($method, $this->baseUrl . $path, $options);
        $contents = (string) $response->getBody();
        return $contents === '' ? null : json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
    }

${operations.map(generateOperation).join("\n\n")}
}
`;

const generateOperation = (operation: SdkOperation): string => {
  const pathParams = operation.pathParameters.map(
    (parameter) => `string $${phpVariableName(parameter.safeName)}`
  );
  const args = [
    ...pathParams,
    operation.hasQuery ? "array $query = []" : undefined,
    operation.hasBody ? "mixed $body = null" : undefined,
    "array $headers = []"
  ].filter(Boolean);
  const path = operation.pathParameters.reduce(
    (nextPath, parameter) =>
      nextPath.replace(
        `{${parameter.name}}`,
        parameterPlaceholder(phpVariableName(parameter.safeName))
      ),
    operation.path
  );
  const queryArg = operation.hasQuery ? "$query" : "[]";
  const bodyArg = operation.hasBody ? "$body" : "null";

  return `    public function ${phpMethodName(operation.name)}(${args.join(", ")}): mixed
    {
        $path = ${pathToPhpExpression(path)};
        return $this->request(${phpStringLiteral(operation.method)}, $path, ${queryArg}, ${bodyArg}, $headers);
    }`;
};

const generateModelsFile = (schemas: ApiSchema[]) => `<?php

declare(strict_types=1);

namespace SpecDock\\Client;

${schemas.length > 0 ? schemas.map(generateModel).join("\n\n") : "final class EmptySchema {}"}
`;

const generateModel = ({ name, schema }: ApiSchema): string => {
  const className = phpClassName(name);
  if (!isRecord(schema) || schema.type !== "object") {
    return `final class ${className}
{
    public function __construct(public mixed $value = null) {}
}`;
  }

  const properties = isRecord(schema.properties) ? Object.entries(schema.properties) : [];
  if (properties.length === 0) return `final class ${className} {}`;
  const constructorArgs = properties.map(([key, value]) => {
    return `        public ${schemaToPhpType(value)} $${phpVariableName(key)} = null`;
  });
  const toArrayEntries = properties.map(([key]) => {
    return `            ${phpStringLiteral(key)} => $this->${phpVariableName(key)}`;
  });

  return `final class ${className}
{
    public function __construct(
${constructorArgs.join(",\n")}
    ) {}

    public function toArray(): array
    {
        return [
${toArrayEntries.join(",\n")}
        ];
    }
}`;
};

const schemaToPhpType = (schema: unknown): string => {
  if (!isRecord(schema)) return "mixed";
  if ("$ref" in schema && typeof schema.$ref === "string") {
    return `?${phpClassName(schema.$ref.split("/").at(-1) ?? "UnknownRef")}`;
  }
  switch (schema.type) {
    case "string":
      return "?string";
    case "integer":
      return "?int";
    case "number":
      return "?float";
    case "boolean":
      return "?bool";
    case "array":
      return "?array";
    case "object":
      return "?array";
    default:
      return "mixed";
  }
};

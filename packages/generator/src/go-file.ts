import type { ApiSchema } from "@specdock/core";
import type { SdkModel, SdkOperation } from "./sdk-model.js";
import {
  goExportedName,
  goFieldName,
  goParamName,
  parameterPlaceholder,
  pathToGoExpression
} from "./go-naming.js";
import { isRecord } from "./schema-utils.js";

export const generateGoFiles = (model: SdkModel, outputPath: string) => [
  {
    path: `${outputPath}/go.mod`,
    content: generateGoModFile()
  },
  {
    path: `${outputPath}/client.go`,
    content: generateGoClientFile(model.operations)
  },
  {
    path: `${outputPath}/models.go`,
    content: generateGoModelsFile(model.schemas)
  }
];

const generateGoModFile = () => `module specdockclient

go 1.22
`;

const generateGoClientFile = (operations: SdkOperation[]) => `package specdockclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
)

type Client struct {
	BaseURL    string
	HTTPClient *http.Client
}

func NewClient(baseURL string) *Client {
	return &Client{
		BaseURL:    strings.TrimRight(baseURL, "/"),
		HTTPClient: http.DefaultClient,
	}
}

func (c *Client) Request(ctx context.Context, method string, path string, query map[string]string, body any, headers map[string]string) (any, error) {
	var requestBody io.Reader
	if body != nil {
		payload, err := json.Marshal(body)
		if err != nil {
			return nil, err
		}
		requestBody = bytes.NewReader(payload)
	}

	requestURL := c.BaseURL + path
	if len(query) > 0 {
		values := url.Values{}
		for key, value := range query {
			if value != "" {
				values.Set(key, value)
			}
		}
		if encoded := values.Encode(); encoded != "" {
			requestURL += "?" + encoded
		}
	}

	request, err := http.NewRequestWithContext(ctx, method, requestURL, requestBody)
	if err != nil {
		return nil, err
	}
	if body != nil {
		request.Header.Set("content-type", "application/json")
	}
	for key, value := range headers {
		request.Header.Set(key, value)
	}

	client := c.HTTPClient
	if client == nil {
		client = http.DefaultClient
	}
	response, err := client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return nil, fmt.Errorf("request failed with status %d", response.StatusCode)
	}
	if len(responseBody) == 0 {
		return nil, nil
	}
	var decoded any
	if err := json.Unmarshal(responseBody, &decoded); err != nil {
		return nil, err
	}
	return decoded, nil
}

${operations.map(generateGoOperation).join("\n\n")}
`;

const generateGoOperation = (operation: SdkOperation): string => {
  const name = goExportedName(operation.name, "Operation");
  const pathParams = operation.pathParameters.map(
    (parameter) => `${goParamName(parameter.safeName)} string`
  );
  const args = [
    "ctx context.Context",
    "client *Client",
    ...pathParams,
    operation.hasQuery ? "query map[string]string" : undefined,
    operation.hasBody ? "body any" : undefined,
    "headers map[string]string"
  ].filter(Boolean);
  const path = operation.pathParameters.reduce(
    (nextPath, parameter) =>
      nextPath.replace(
        `{${parameter.name}}`,
        parameterPlaceholder(goParamName(parameter.safeName))
      ),
    operation.path
  );
  const queryArg = operation.hasQuery ? "query" : "nil";
  const bodyArg = operation.hasBody ? "body" : "nil";

  return `func ${name}(${args.join(", ")}) (any, error) {
	path := ${pathToGoExpression(path)}
	return client.Request(ctx, "${operation.method}", path, ${queryArg}, ${bodyArg}, headers)
}`;
};

const generateGoModelsFile = (schemas: ApiSchema[]) => {
  if (schemas.length === 0) {
    return `package specdockclient

type EmptySchema map[string]any
`;
  }

  return `package specdockclient

${schemas.map(generateGoModel).join("\n\n")}
`;
};

const generateGoModel = ({ name, schema }: ApiSchema): string => {
  const typeName = goExportedName(name, "Model");

  if (!isRecord(schema) || schema.type !== "object") {
    return `type ${typeName} ${schemaToGoType(schema)}`;
  }

  const properties = isRecord(schema.properties) ? schema.properties : {};
  const entries = Object.entries(properties);

  if (entries.length === 0) {
    return `type ${typeName} map[string]any`;
  }

  const fields = entries.map(([key, value]) => {
    return `	${goFieldName(key)} ${schemaToGoType(value)}${goJsonTag(key)}`;
  });

  return `type ${typeName} struct {
${fields.join("\n")}
}`;
};

const goJsonTag = (fieldName: string): string => {
  return /^[^\s"`]+$/.test(fieldName) ? ` \`json:"${fieldName},omitempty"\`` : "";
};

const schemaToGoType = (schema: unknown): string => {
  if (!isRecord(schema)) return "any";
  if ("$ref" in schema && typeof schema.$ref === "string") {
    return goExportedName(schema.$ref.split("/").at(-1) ?? "UnknownRef", "Model");
  }
  switch (schema.type) {
    case "string":
      return "string";
    case "integer":
      return "int";
    case "number":
      return "float64";
    case "boolean":
      return "bool";
    case "array":
      return `[]${schemaToGoType(schema.items)}`;
    case "object":
      return "map[string]any";
    default:
      return "any";
  }
};

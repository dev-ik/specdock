import type { ApiSchema } from "@specdock/core";
import type { SdkModel, SdkOperation } from "./sdk-model.js";
import {
  javaClassName,
  javaFieldName,
  javaMethodName,
  parameterPlaceholder,
  pathToJavaExpression
} from "./java-naming.js";
import { isRecord } from "./schema-utils.js";

const PACKAGE_PATH = "src/main/java/com/specdock/client";

export const generateJavaFiles = (model: SdkModel, outputPath: string) => [
  {
    path: `${outputPath}/pom.xml`,
    content: generatePomFile()
  },
  {
    path: `${outputPath}/${PACKAGE_PATH}/SpecDockClient.java`,
    content: generateJavaClientFile(model.operations)
  },
  {
    path: `${outputPath}/${PACKAGE_PATH}/Models.java`,
    content: generateJavaModelsFile(model.schemas)
  }
];

const generatePomFile = () => `<project xmlns="http://maven.apache.org/POM/4.0.0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.specdock</groupId>
  <artifactId>specdock-generated-client</artifactId>
  <version>0.1.0</version>
  <properties>
    <maven.compiler.release>17</maven.compiler.release>
  </properties>
  <dependencies>
    <dependency>
      <groupId>com.fasterxml.jackson.core</groupId>
      <artifactId>jackson-databind</artifactId>
      <version>2.17.2</version>
    </dependency>
  </dependencies>
</project>
`;

const generateJavaClientFile = (operations: SdkOperation[]) => `package com.specdock.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public final class SpecDockClient {
  private final String baseUrl;
  private final HttpClient httpClient;
  private final ObjectMapper objectMapper;

  public SpecDockClient(String baseUrl) {
    this(baseUrl, HttpClient.newHttpClient(), new ObjectMapper());
  }

  public SpecDockClient(String baseUrl, HttpClient httpClient, ObjectMapper objectMapper) {
    this.baseUrl = trimTrailingSlash(baseUrl);
    this.httpClient = httpClient;
    this.objectMapper = objectMapper;
  }

  public JsonNode request(String method, String path, Map<String, String> query, Object body, Map<String, String> headers)
      throws IOException, InterruptedException {
    HttpRequest.Builder builder = HttpRequest.newBuilder(buildUri(path, query)).method(method, bodyPublisher(body));
    if (body != null) {
      builder.header("content-type", "application/json");
    }
    if (headers != null) {
      headers.forEach(builder::header);
    }
    HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    if (response.statusCode() < 200 || response.statusCode() >= 300) {
      throw new IOException("Request failed with status " + response.statusCode());
    }
    return response.body().isEmpty() ? null : objectMapper.readTree(response.body());
  }

${operations.map(generateJavaOperation).join("\n\n")}

  private URI buildUri(String path, Map<String, String> query) {
    StringBuilder uri = new StringBuilder(baseUrl).append(path);
    if (query != null && !query.isEmpty()) {
      StringBuilder search = new StringBuilder();
      query.forEach((key, value) -> {
        if (value != null && !value.isEmpty()) {
          if (search.length() > 0) search.append("&");
          search.append(encodeQuery(key)).append("=").append(encodeQuery(value));
        }
      });
      if (search.length() > 0) uri.append("?").append(search);
    }
    return URI.create(uri.toString());
  }

  private HttpRequest.BodyPublisher bodyPublisher(Object body) throws IOException {
    if (body == null) return HttpRequest.BodyPublishers.noBody();
    return HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body));
  }

  private static String encodePath(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
  }

  private static String encodeQuery(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private static String trimTrailingSlash(String value) {
    return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
  }
}
`;

const generateJavaOperation = (operation: SdkOperation): string => {
  const name = javaMethodName(operation.name);
  const pathParams = operation.pathParameters.map(
    (parameter) => `String ${javaFieldName(parameter.safeName)}`
  );
  const args = [
    ...pathParams,
    operation.hasQuery ? "Map<String, String> query" : undefined,
    operation.hasBody ? "Object body" : undefined,
    "Map<String, String> headers"
  ].filter(Boolean);
  const path = operation.pathParameters.reduce(
    (nextPath, parameter) =>
      nextPath.replace(
        `{${parameter.name}}`,
        parameterPlaceholder(javaFieldName(parameter.safeName))
      ),
    operation.path
  );
  const queryArg = operation.hasQuery ? "query" : "null";
  const bodyArg = operation.hasBody ? "body" : "null";

  return `  public JsonNode ${name}(${args.join(", ")}) throws IOException, InterruptedException {
    String path = ${pathToJavaExpression(path)};
    return request("${operation.method}", path, ${queryArg}, ${bodyArg}, headers);
  }`;
};

const generateJavaModelsFile = (schemas: ApiSchema[]) => `package com.specdock.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public final class Models {
  private Models() {}

${schemas.length > 0 ? schemas.map(generateJavaModel).join("\n\n") : "  public static final class EmptySchema {}"}
}
`;

const generateJavaModel = ({ name, schema }: ApiSchema): string => {
  const className = javaClassName(name);
  if (!isRecord(schema) || schema.type !== "object") {
    return `  public static final class ${className} {
    public ${schemaToJavaType(schema)} value;
  }`;
  }

  const properties = isRecord(schema.properties) ? schema.properties : {};
  const fields = Object.entries(properties).map(([key, value]) => {
    return `    @JsonProperty(${JSON.stringify(key)})
    public ${schemaToJavaType(value)} ${javaFieldName(key)};`;
  });

  return `  public static final class ${className} {
${fields.length > 0 ? fields.join("\n") : "    public Map<String, Object> additionalProperties;"}
  }`;
};

const schemaToJavaType = (schema: unknown): string => {
  if (!isRecord(schema)) return "Object";
  if ("$ref" in schema && typeof schema.$ref === "string") {
    return `Models.${javaClassName(schema.$ref.split("/").at(-1) ?? "UnknownRef")}`;
  }
  switch (schema.type) {
    case "string":
      return "String";
    case "integer":
      return "Integer";
    case "number":
      return "Double";
    case "boolean":
      return "Boolean";
    case "array":
      return `java.util.List<${schemaToJavaType(schema.items)}>`;
    case "object":
      return "Map<String, Object>";
    default:
      return "Object";
  }
};

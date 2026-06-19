import type { ApiSchema, GenerateOptions } from "@specdock/core";
import {
  csharpClassName,
  csharpMethodName,
  csharpParameterName,
  csharpPropertyName,
  parameterPlaceholder,
  pathToCsharpExpression
} from "./csharp-naming.js";
import type { SdkModel, SdkOperation } from "./sdk-model.js";
import { isRecord } from "./schema-utils.js";

export const generateCsharpFiles = (model: SdkModel, outputPath: string, options: GenerateOptions) => [
  { path: `${outputPath}/SpecDock.Client.csproj`, content: generateProjectFile() },
  { path: `${outputPath}/SpecDockClient.cs`, content: generateClientFile(model.operations, options.clientName) },
  { path: `${outputPath}/Models.cs`, content: generateModelsFile(model.schemas) }
];

const generateProjectFile = () => `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
  </PropertyGroup>
</Project>
`;

const generateClientFile = (operations: SdkOperation[], clientName: string) => `namespace SpecDock.Client;

using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;

public sealed class ${csharpClassName(clientName)}
{
  private readonly string baseUrl;
  private readonly HttpClient httpClient;
  private readonly JsonSerializerOptions jsonOptions;

  public ${csharpClassName(clientName)}(string baseUrl, HttpClient? httpClient = null, JsonSerializerOptions? jsonOptions = null)
  {
    this.baseUrl = baseUrl.TrimEnd('/');
    this.httpClient = httpClient ?? new HttpClient();
    this.jsonOptions = jsonOptions ?? new JsonSerializerOptions(JsonSerializerDefaults.Web);
  }

  public async Task<JsonElement?> RequestAsync(
    string method,
    string path,
    IReadOnlyDictionary<string, string?>? query = null,
    object? body = null,
    IReadOnlyDictionary<string, string>? headers = null,
    CancellationToken cancellationToken = default)
  {
    return await RequestWithBaseUrlAsync(baseUrl, method, path, query, body, headers, cancellationToken).ConfigureAwait(false);
  }

  public async Task<JsonElement?> RequestWithBaseUrlAsync(
    string requestBaseUrl,
    string method,
    string path,
    IReadOnlyDictionary<string, string?>? query = null,
    object? body = null,
    IReadOnlyDictionary<string, string>? headers = null,
    CancellationToken cancellationToken = default)
  {
    using var request = new HttpRequestMessage(new HttpMethod(method), BuildUri(requestBaseUrl, path, query));
    if (body is not null) {
      var json = JsonSerializer.Serialize(body, jsonOptions);
      request.Content = new StringContent(json, Encoding.UTF8, "application/json");
    }
    if (headers is not null) {
      foreach (var header in headers) request.Headers.Add(header.Key, header.Value);
    }

    using var response = await httpClient.SendAsync(request, cancellationToken).ConfigureAwait(false);
    if (!response.IsSuccessStatusCode) {
      throw new HttpRequestException($"Request failed with status {(int)response.StatusCode}");
    }
    var content = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
    if (string.IsNullOrWhiteSpace(content)) return null;
    using var document = JsonDocument.Parse(content);
    return document.RootElement.Clone();
  }

${operations.map(generateOperation).join("\n\n")}

  private Uri BuildUri(string requestBaseUrl, string path, IReadOnlyDictionary<string, string?>? query)
  {
    var builder = new StringBuilder(requestBaseUrl.TrimEnd('/')).Append(path);
    var pairs = query?.Where(pair => !string.IsNullOrEmpty(pair.Value)).ToArray();
    if (pairs is { Length: > 0 }) {
      builder.Append('?').Append(string.Join("&", pairs.Select(pair =>
        $"{WebUtility.UrlEncode(pair.Key)}={WebUtility.UrlEncode(pair.Value)}")));
    }
    return new Uri(builder.ToString(), UriKind.Absolute);
  }
}
`;

const generateOperation = (operation: SdkOperation): string => {
  const pathParams = operation.pathParameters.map(
    (parameter) => `string ${csharpParameterName(parameter.safeName)}`
  );
  const args = [
    ...pathParams,
    operation.baseUrlStrategy === "perRequest" ? "string baseUrl" : undefined,
    operation.hasQuery ? "IReadOnlyDictionary<string, string?>? query = null" : undefined,
    operation.hasBody ? "object? body = null" : undefined,
    "IReadOnlyDictionary<string, string>? headers = null",
    "CancellationToken cancellationToken = default"
  ].filter(Boolean);
  const path = operation.pathParameters.reduce(
    (nextPath, parameter) =>
      nextPath.replace(
        `{${parameter.name}}`,
        parameterPlaceholder(csharpParameterName(parameter.safeName))
      ),
    operation.path
  );
  const queryArg = operation.hasQuery ? "query" : "null";
  const bodyArg = operation.hasBody ? "body" : "null";
  const requestCall = operation.baseUrlStrategy === "perRequest"
    ? `RequestWithBaseUrlAsync(baseUrl, "${operation.method}", path, ${queryArg}, ${bodyArg}, headers, cancellationToken)`
    : `RequestAsync("${operation.method}", path, ${queryArg}, ${bodyArg}, headers, cancellationToken)`;

  return `  public Task<JsonElement?> ${csharpMethodName(operation.name)}(${args.join(", ")})
  {
    var path = ${pathToCsharpExpression(path)};
    return ${requestCall};
  }`;
};

const generateModelsFile = (schemas: ApiSchema[]) => `namespace SpecDock.Client;

using System.Text.Json.Serialization;

${schemas.length > 0 ? schemas.map(generateModel).join("\n\n") : "public sealed class EmptySchema {}"}
`;

const generateModel = ({ name, schema }: ApiSchema): string => {
  const className = csharpClassName(name);
  if (!isRecord(schema) || schema.type !== "object") {
    return `public sealed class ${className}
{
  public ${schemaToCsharpType(schema)}? Value { get; set; }
}`;
  }

  const properties = isRecord(schema.properties) ? Object.entries(schema.properties) : [];
  if (properties.length === 0) return `public sealed class ${className} : Dictionary<string, object?> {}`;
  const fields = properties.map(([key, value]) => {
    return `  [JsonPropertyName(${JSON.stringify(key)})]
  public ${schemaToCsharpType(value)}? ${csharpPropertyName(key)} { get; set; }`;
  });

  return `public sealed class ${className}
{
${fields.join("\n")}
}`;
};

const schemaToCsharpType = (schema: unknown): string => {
  if (!isRecord(schema)) return "object";
  if ("$ref" in schema && typeof schema.$ref === "string") {
    return csharpClassName(schema.$ref.split("/").at(-1) ?? "UnknownRef");
  }
  switch (schema.type) {
    case "string":
      return "string";
    case "integer":
      return "int";
    case "number":
      return "double";
    case "boolean":
      return "bool";
    case "array":
      return `List<${schemaToCsharpType(schema.items)}>`;
    case "object":
      return "Dictionary<string, object?>";
    default:
      return "object";
  }
};

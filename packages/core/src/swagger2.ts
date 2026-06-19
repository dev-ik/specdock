import { isRecord, type OpenApiRecord } from "./openapi-utils.js";

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;
type ParameterStyle = "spaceDelimited" | "pipeDelimited";

export const isSwagger2Spec = (document: OpenApiRecord): boolean =>
  typeof document.swagger === "string" && document.swagger.startsWith("2.");

export const convertSwagger2ToOpenApi3 = (document: OpenApiRecord): OpenApiRecord => {
  const paths = isRecord(document.paths) ? document.paths : undefined;
  if (!paths) {
    throw new Error("Swagger 2.0 document must include a paths object.");
  }

  return {
    openapi: "3.0.3",
    info: isRecord(document.info) ? document.info : { title: "Imported Swagger API", version: "1.0.0" },
    servers: buildServers(document),
    tags: Array.isArray(document.tags) ? document.tags : undefined,
    paths: convertPaths(paths, document),
    components: buildComponents(document),
    security: document.security
  };
};

const buildServers = (document: OpenApiRecord): OpenApiRecord[] => {
  const host = typeof document.host === "string" ? document.host : "";
  const basePath = typeof document.basePath === "string" ? document.basePath : "";
  const schemes = stringArray(document.schemes);

  if (!host) {
    return basePath ? [{ url: basePath }] : [];
  }

  return (schemes.length ? schemes : ["https"]).map((scheme) => ({ url: `${scheme}://${host}${basePath}` }));
};

const buildComponents = (document: OpenApiRecord): OpenApiRecord => ({
  schemas: isRecord(document.definitions) ? document.definitions : {},
  parameters: convertNamedParameters(document.parameters, document),
  responses: convertNamedResponses(document.responses, document),
  securitySchemes: convertSecuritySchemes(document.securityDefinitions)
});

const convertPaths = (paths: OpenApiRecord, document: OpenApiRecord): OpenApiRecord =>
  Object.fromEntries(
    Object.entries(paths).flatMap(([path, pathItem]) => {
      if (!isRecord(pathItem)) return [];
      const pathParameters = convertParameters(pathItem.parameters, document);
      const nextPathItem: OpenApiRecord = {};

      if (pathParameters.length) nextPathItem.parameters = pathParameters;

      for (const method of HTTP_METHODS) {
        const operation = pathItem[method];
        if (isRecord(operation)) nextPathItem[method] = convertOperation(operation, document);
      }

      return [[path, nextPathItem]];
    })
  );

const convertOperation = (operation: OpenApiRecord, document: OpenApiRecord): OpenApiRecord => {
  const parameters = convertParameters(operation.parameters, document);
  const bodyParameter = parameters.find((parameter) => parameter.in === "body");
  const formParameters = parameters.filter((parameter) => parameter.in === "formData");
  const requestBody = bodyParameter
    ? bodyParameterToRequestBody(bodyParameter, operation, document)
    : formParametersToRequestBody(formParameters, operation, document);
  const nonBodyParameters = parameters.filter((parameter) => parameter.in !== "body" && parameter.in !== "formData");

  return omitUndefined({
    operationId: operation.operationId,
    summary: operation.summary,
    description: operation.description,
    tags: operation.tags,
    parameters: nonBodyParameters.length ? nonBodyParameters : undefined,
    requestBody,
    responses: convertResponses(operation.responses, document),
    security: operation.security
  });
};

const convertParameters = (parameters: unknown, document: OpenApiRecord): OpenApiRecord[] => {
  if (!Array.isArray(parameters)) return [];
  return parameters.flatMap((parameter) => {
    const resolved = resolveLocalRef(parameter, "parameters", document);
    if (!isRecord(resolved)) return [];
    return [convertParameter(resolved)];
  });
};

const convertNamedParameters = (parameters: unknown, document: OpenApiRecord): OpenApiRecord =>
  mapRecord(parameters, (parameter) => convertParameter(resolveLocalRef(parameter, "parameters", document)));

const convertParameter = (parameter: unknown): OpenApiRecord => {
  if (!isRecord(parameter)) return {};
  if (parameter.in === "body") return { ...parameter, schema: convertSchemaRef(parameter.schema) };

  return omitUndefined({
    name: parameter.name,
    in: parameter.in,
    required: parameter.in === "path" ? true : parameter.required,
    description: parameter.description,
    schema: schemaFromParameter(parameter),
    example: parameter.example,
    style: styleFromCollectionFormat(parameter.collectionFormat),
    explode: explodeFromCollectionFormat(parameter.collectionFormat)
  });
};

const schemaFromParameter = (parameter: OpenApiRecord): OpenApiRecord =>
  omitUndefined({
    type: parameter.type,
    format: parameter.format,
    items: convertSchemaRef(parameter.items),
    enum: parameter.enum,
    default: parameter.default
  });

const bodyParameterToRequestBody = (parameter: OpenApiRecord, operation: OpenApiRecord, document: OpenApiRecord): OpenApiRecord => ({
  required: Boolean(parameter.required),
  content: contentForMediaTypes(mediaTypes(operation.consumes, document.consumes, "application/json"), {
    schema: convertSchemaRef(parameter.schema)
  })
});

const formParametersToRequestBody = (
  parameters: OpenApiRecord[],
  operation: OpenApiRecord,
  document: OpenApiRecord
): OpenApiRecord | undefined => {
  if (parameters.length === 0) return undefined;
  const hasFile = parameters.some((parameter) => parameter.type === "file");
  const contentType = mediaTypes(
    operation.consumes,
    document.consumes,
    hasFile ? "multipart/form-data" : "application/x-www-form-urlencoded"
  )[0] ?? "multipart/form-data";

  return {
    required: parameters.some((parameter) => parameter.required === true),
    content: {
      [contentType]: {
        schema: {
          type: "object",
          required: parameters.filter((parameter) => parameter.required === true && typeof parameter.name === "string")
            .map((parameter) => parameter.name),
          properties: Object.fromEntries(parameters
            .filter((parameter) => typeof parameter.name === "string")
            .map((parameter) => [parameter.name, schemaFromFormParameter(parameter)]))
        }
      }
    }
  };
};

const schemaFromFormParameter = (parameter: OpenApiRecord): OpenApiRecord =>
  parameter.type === "file"
    ? { type: "string", format: "binary", description: parameter.description }
    : { ...schemaFromParameter(parameter), description: parameter.description };

const convertResponses = (responses: unknown, document: OpenApiRecord): OpenApiRecord =>
  mapRecord(responses, (response) => convertResponse(resolveLocalRef(response, "responses", document), document));

const convertNamedResponses = (responses: unknown, document: OpenApiRecord): OpenApiRecord =>
  mapRecord(responses, (response) => convertResponse(response, document));

const convertResponse = (response: unknown, document: OpenApiRecord): OpenApiRecord => {
  if (!isRecord(response)) return {};
  const schema = response.schema ? convertSchemaRef(response.schema) : undefined;

  return omitUndefined({
    description: response.description ?? "",
    headers: response.headers,
    content: schema
      ? contentForMediaTypes(mediaTypes(undefined, document.produces, "application/json"), { schema })
      : undefined
  });
};

const convertSecuritySchemes = (definitions: unknown): OpenApiRecord =>
  mapRecord(definitions, (definition) => {
    if (!isRecord(definition)) return {};
    if (definition.type === "basic") return { ...definition, type: "http", scheme: "basic" };
    if (definition.type === "apiKey") return definition;
    if (definition.type === "oauth2") {
      return omitUndefined({
        type: "oauth2",
        flows: {
          implicit: definition.flow === "implicit" ? oauthFlow(definition) : undefined,
          password: definition.flow === "password" ? oauthFlow(definition) : undefined,
          clientCredentials: definition.flow === "application" ? oauthFlow(definition) : undefined,
          authorizationCode: definition.flow === "accessCode" ? oauthFlow(definition) : undefined
        }
      });
    }
    return definition;
  });

const oauthFlow = (definition: OpenApiRecord): OpenApiRecord =>
  omitUndefined({
    authorizationUrl: definition.authorizationUrl,
    tokenUrl: definition.tokenUrl,
    scopes: isRecord(definition.scopes) ? definition.scopes : {}
  });

const convertSchemaRef = (schema: unknown): unknown => {
  if (isRecord(schema) && typeof schema.$ref === "string") {
    return { ...schema, $ref: schema.$ref.replace("#/definitions/", "#/components/schemas/") };
  }
  return schema;
};

const resolveLocalRef = (value: unknown, section: string, document: OpenApiRecord): unknown => {
  if (!isRecord(value) || typeof value.$ref !== "string" || !value.$ref.startsWith(`#/${section}/`)) {
    return value;
  }
  const name = value.$ref.slice(section.length + 3);
  const collection = document[section];
  return isRecord(collection) ? collection[name] : value;
};

const contentForMediaTypes = (types: string[], mediaType: OpenApiRecord): OpenApiRecord =>
  Object.fromEntries(types.map((type) => [type, mediaType]));

const mediaTypes = (local: unknown, global: unknown, fallback: string): string[] => {
  const localValues = stringArray(local);
  const globalValues = stringArray(global);
  return localValues.length ? localValues : globalValues.length ? globalValues : [fallback];
};

const styleFromCollectionFormat = (format: unknown): ParameterStyle | undefined => {
  if (format === "ssv") return "spaceDelimited";
  if (format === "pipes") return "pipeDelimited";
  return undefined;
};

const explodeFromCollectionFormat = (format: unknown): boolean | undefined => format === "multi" ? true : undefined;

const mapRecord = (value: unknown, mapper: (child: unknown) => OpenApiRecord): OpenApiRecord => isRecord(value)
  ? Object.fromEntries(Object.entries(value).map(([name, child]) => [name, mapper(child)]))
  : {};

const omitUndefined = (value: OpenApiRecord): OpenApiRecord =>
  Object.fromEntries(Object.entries(value).filter(([, child]) => child !== undefined));

const stringArray = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((child): child is string => typeof child === "string" && child.trim() !== "")
  : [];

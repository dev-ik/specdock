import type {
  ApiOperation,
  ApiParameter,
  ApiSchema,
  GenerateOptions,
  HttpMethod
} from "@specdock/core";
import { operationName, safeIdentifier, sanitizeTypeName } from "./naming.js";

export type SdkParameterLocation = ApiParameter["in"];

export type SdkParameter = {
  name: string;
  safeName: string;
  location: SdkParameterLocation;
  required: boolean;
};

export type SdkOperation = {
  id: string;
  name: string;
  typeName: string;
  method: HttpMethod;
  path: string;
  parameters: SdkParameter[];
  pathParameters: SdkParameter[];
  queryParameters: SdkParameter[];
  headerParameters: SdkParameter[];
  cookieParameters: SdkParameter[];
  hasQuery: boolean;
  hasBody: boolean;
  baseUrlStrategy: GenerateOptions["baseUrlStrategy"];
};

export type SdkModel = {
  operations: SdkOperation[];
  schemas: ApiSchema[];
};

export const buildSdkModel = (
  operations: ApiOperation[],
  schemas: ApiSchema[],
  options: GenerateOptions
): SdkModel => ({
  operations: operations.map((operation) => toSdkOperation(operation, options)),
  schemas
});

const toSdkOperation = (
  operation: ApiOperation,
  options: GenerateOptions
): SdkOperation => {
  const name = operationName(operation, options);
  const parameters = operation.parameters.map(toSdkParameter);
  const pathParameters = parameters.filter((parameter) => parameter.location === "path");
  const queryParameters = parameters.filter((parameter) => parameter.location === "query");
  const headerParameters = parameters.filter((parameter) => parameter.location === "header");
  const cookieParameters = parameters.filter((parameter) => parameter.location === "cookie");

  return {
    id: operation.id,
    name,
    typeName: sanitizeTypeName(name),
    method: operation.method,
    path: operation.path,
    parameters,
    pathParameters,
    queryParameters,
    headerParameters,
    cookieParameters,
    hasQuery: queryParameters.length > 0,
    hasBody: operation.requestBody !== undefined,
    baseUrlStrategy: options.baseUrlStrategy
  };
};

const toSdkParameter = (parameter: ApiParameter): SdkParameter => ({
  name: parameter.name,
  safeName: safeIdentifier(parameter.name),
  location: parameter.in,
  required: parameter.required
});

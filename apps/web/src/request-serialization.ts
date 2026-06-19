import type { ApiParameter } from "@specdock/core";

type ParsedValue = string | string[] | Record<string, string>;

export const serializePathTemplate = (
  path: string,
  pathParams: Record<string, string>,
  parameters: ApiParameter[]
): string => {
  const byName = parametersByName(parameters, "path");
  return path.replace(/\{([^}]+)\}/g, (_match, name: string) =>
    encodeURIComponent(serializePathValue(byName[name], pathParams[name] ?? ""))
  );
};

export const appendSerializedQueryParams = (
  url: URL,
  queryParams: Record<string, string>,
  parameters: ApiParameter[]
): void => {
  const byName = parametersByName(parameters, "query");

  for (const [name, rawValue] of Object.entries(queryParams)) {
    if (rawValue === "") continue;
    appendQueryValue(url, name, rawValue, byName[name]);
  }
};

export const serializationHint = (parameter: ApiParameter): string | undefined => {
  const style = parameter.style ?? defaultStyle(parameter);
  const explode = parameter.explode ?? defaultExplode(parameter);
  if (style === "form" && explode) return undefined;
  return `${style}${explode ? ", explode" : ""}`;
};

const appendQueryValue = (
  url: URL,
  name: string,
  rawValue: string,
  parameter: ApiParameter | undefined
): void => {
  const style = parameter?.style ?? "form";
  const explode = parameter?.explode ?? true;
  const parsed = parseValue(parameter, rawValue);

  if (style === "deepObject" && isObjectValue(parsed)) {
    for (const [key, value] of Object.entries(parsed)) {
      url.searchParams.append(`${name}[${key}]`, value);
    }
    return;
  }

  if (Array.isArray(parsed)) {
    if (style === "form" && explode) {
      parsed.forEach((item) => url.searchParams.append(name, item));
      return;
    }
    url.searchParams.set(name, parsed.join(delimiterForStyle(style)));
    return;
  }

  if (isObjectValue(parsed)) {
    if (style === "form" && explode) {
      Object.entries(parsed).forEach(([key, value]) => url.searchParams.append(key, value));
      return;
    }
    url.searchParams.set(name, flattenObject(parsed, delimiterForStyle(style)));
    return;
  }

  url.searchParams.set(name, parsed);
};

const serializePathValue = (parameter: ApiParameter | undefined, rawValue: string): string => {
  const style = parameter?.style ?? "simple";
  const explode = parameter?.explode ?? false;
  const parsed = parseValue(parameter, rawValue);

  if (Array.isArray(parsed)) return parsed.join(delimiterForStyle(style));
  if (isObjectValue(parsed)) {
    return explode
      ? Object.entries(parsed).map(([key, value]) => `${key}=${value}`).join(delimiterForStyle(style))
      : flattenObject(parsed, delimiterForStyle(style));
  }
  return parsed;
};

const parseValue = (parameter: ApiParameter | undefined, rawValue: string): ParsedValue => {
  const type = schemaType(parameter?.schema);
  if (type === "array") return parseArray(rawValue);
  if (type === "object") return parseObject(rawValue);
  return rawValue;
};

const parseArray = (rawValue: string): string[] => {
  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // Fall back to compact text entry formats.
  }
  return rawValue.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
};

const parseObject = (rawValue: string): Record<string, string> => {
  try {
    const parsed = JSON.parse(rawValue);
    if (isObjectValue(parsed)) {
      return Object.fromEntries(Object.entries(parsed).map(([key, value]) => [key, String(value)]));
    }
  } catch {
    // Fall back to key=value pairs.
  }
  return Object.fromEntries(
    rawValue.split(/[,&\n]/).flatMap((part) => {
      const [key, ...rest] = part.split("=");
      return key?.trim() ? [[key.trim(), rest.join("=").trim()]] : [];
    })
  );
};

const parametersByName = (
  parameters: ApiParameter[],
  location: ApiParameter["in"]
): Record<string, ApiParameter> =>
  Object.fromEntries(parameters.filter((parameter) => parameter.in === location).map((parameter) => [parameter.name, parameter]));

const schemaType = (schema: unknown): string | undefined =>
  schema && typeof schema === "object" && !Array.isArray(schema)
    ? typeof (schema as Record<string, unknown>).type === "string"
      ? String((schema as Record<string, unknown>).type)
      : undefined
    : undefined;

const defaultStyle = (parameter: ApiParameter): string => parameter.in === "path" ? "simple" : "form";
const defaultExplode = (parameter: ApiParameter): boolean => parameter.in === "query";
const delimiterForStyle = (style: string): string => style === "spaceDelimited" ? " " : style === "pipeDelimited" ? "|" : ",";
const flattenObject = (value: Record<string, string>, delimiter: string): string =>
  Object.entries(value).flatMap(([key, child]) => [key, child]).join(delimiter);
const isObjectValue = (value: unknown): value is Record<string, string> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

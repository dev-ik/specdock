import type { HttpMethod } from "@specdock/core";
import { tokenizeCurl } from "./curl-tokenizer.js";
import { CurlImportError, type ParsedCurl } from "./curl-import-types.js";

const METHODS = new Set<HttpMethod>(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
const DATA_FLAGS = new Set(["-d", "--data", "--data-raw", "--data-binary", "--data-ascii", "--data-urlencode"]);
const HEADER_FLAGS = new Set(["-H", "--header"]);
const FORM_FLAGS = new Set(["-F", "--form", "--form-string"]);
const IGNORED_VALUE_FLAGS = new Set([
  "-A",
  "-e",
  "-o",
  "-u",
  "--connect-timeout",
  "--max-time",
  "--output",
  "--proxy",
  "--referer",
  "--user",
  "--user-agent"
]);

export const parseCurlCommand = (command: string): ParsedCurl => {
  const tokens = tokenizeCurl(command.replace(/\\\r?\n/g, " "));
  if (tokens.length === 0) {
    throw new CurlImportError("EMPTY_CURL", "Paste a cURL command to import.");
  }

  if (tokens[0] !== "curl") {
    throw new CurlImportError("INVALID_CURL", "Command must start with curl.");
  }

  let urlValue: string | undefined;
  let method: HttpMethod | undefined;
  const headers: Record<string, string> = {};
  const dataParts: string[] = [];
  let dataAsQuery = false;

  for (let index = 1; index < tokens.length; index += 1) {
    const token = tokens[index] ?? "";

    if (token === "--") continue;

    if (token === "-G" || token === "--get") {
      dataAsQuery = true;
      continue;
    }

    if (token === "-I" || token === "--head") {
      method = "HEAD";
      continue;
    }

    if (FORM_FLAGS.has(flagName(token))) {
      throw new CurlImportError("UNSUPPORTED_MULTIPART", "Multipart cURL import is not supported yet.");
    }

    if (token === "--url" || token.startsWith("--url=")) {
      const read = readOptionValue(tokens, index);
      urlValue = read.value;
      index = read.index;
      continue;
    }

    if (token === "-X" || token.startsWith("-X") || token === "--request" || token.startsWith("--request=")) {
      const read = readOptionValue(tokens, index, "-X");
      method = normalizeMethod(read.value);
      index = read.index;
      continue;
    }

    if (HEADER_FLAGS.has(flagName(token)) || token.startsWith("-H")) {
      const read = readOptionValue(tokens, index, "-H");
      addHeader(headers, read.value);
      index = read.index;
      continue;
    }

    if (DATA_FLAGS.has(flagName(token)) || token.startsWith("-d")) {
      const read = readOptionValue(tokens, index, "-d");
      dataParts.push(read.value);
      index = read.index;
      continue;
    }

    if (token === "-b" || token === "--cookie" || token.startsWith("--cookie=")) {
      const read = readOptionValue(tokens, index, "-b");
      if (read.value.trim()) {
        headers.Cookie = read.value;
      }
      index = read.index;
      continue;
    }

    if (IGNORED_VALUE_FLAGS.has(flagName(token))) {
      index = readOptionValue(tokens, index).index;
      continue;
    }

    if (token.startsWith("-")) continue;

    urlValue ??= token;
  }

  const url = parseHttpUrl(urlValue);
  const body = dataParts.length > 0 && !dataAsQuery ? dataParts.join("&") : undefined;
  if (dataAsQuery) {
    appendDataPartsToQuery(url, dataParts);
  }

  return {
    url,
    method: method ?? (body ? "POST" : "GET"),
    headers,
    body
  };
};

const readOptionValue = (
  tokens: string[],
  index: number,
  compactPrefix?: string
): { value: string; index: number } => {
  const token = tokens[index] ?? "";
  const equalsIndex = token.indexOf("=");
  if (token.startsWith("--") && equalsIndex > -1) {
    return { value: token.slice(equalsIndex + 1), index };
  }

  if (compactPrefix && token.startsWith(compactPrefix) && token.length > compactPrefix.length) {
    return { value: token.slice(compactPrefix.length), index };
  }

  const value = tokens[index + 1];
  if (value === undefined) {
    throw new CurlImportError("INVALID_CURL", `Missing value for ${token}.`);
  }

  return { value, index: index + 1 };
};

const flagName = (token: string): string => token.split("=")[0] ?? token;

const normalizeMethod = (method: string): HttpMethod => {
  const upper = method.toUpperCase();
  if (!METHODS.has(upper as HttpMethod)) {
    throw new CurlImportError("INVALID_METHOD", `Unsupported HTTP method: ${method}.`);
  }
  return upper as HttpMethod;
};

const parseHttpUrl = (value: string | undefined): URL => {
  try {
    const url = new URL(value ?? "");
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid protocol.");
    }
    return url;
  } catch {
    throw new CurlImportError("INVALID_URL", "cURL command must include an HTTP(S) URL.");
  }
};

const addHeader = (headers: Record<string, string>, rawHeader: string): void => {
  const separator = rawHeader.indexOf(":");
  if (separator <= 0) return;
  const name = rawHeader.slice(0, separator).trim();
  headers[name] = rawHeader.slice(separator + 1).trim();
};

const appendDataPartsToQuery = (url: URL, dataParts: string[]): void => {
  for (const part of dataParts) {
    for (const [name, value] of new URLSearchParams(part).entries()) {
      url.searchParams.set(name, value);
    }
  }
};

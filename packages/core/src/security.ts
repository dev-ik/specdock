const SENSITIVE_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "proxy-authorization",
  "set-cookie",
  "x-api-key",
  "x-auth-token"
]);

const SENSITIVE_PARAMETER_NAMES = new Set([
  "access_token",
  "api_key",
  "apikey",
  "auth",
  "authorization",
  "client_secret",
  "password",
  "secret",
  "token"
]);

export const REDACTED_VALUE = "[redacted]";

export const isSensitiveHeaderName = (name: string): boolean => {
  const normalized = name.trim().toLowerCase();
  return (
    SENSITIVE_HEADER_NAMES.has(normalized) || normalized.endsWith("-api-key")
  );
};

export const isSensitiveParameterName = (name: string): boolean => {
  const normalized = name.trim().toLowerCase();
  return (
    SENSITIVE_PARAMETER_NAMES.has(normalized) ||
    normalized.endsWith("_token") ||
    normalized.endsWith("-token") ||
    normalized.endsWith("_secret") ||
    normalized.endsWith("-secret")
  );
};

export const redactSensitiveHeaders = (
  headers: Record<string, string>
): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [
      name,
      isSensitiveHeaderName(name) ? REDACTED_VALUE : value
    ])
  );
};

export const redactSensitiveUrl = (rawUrl: string): string => {
  try {
    const url = new URL(rawUrl);

    for (const name of Array.from(url.searchParams.keys())) {
      if (isSensitiveParameterName(name)) {
        url.searchParams.set(name, REDACTED_VALUE);
      }
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
};

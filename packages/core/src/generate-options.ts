import { defaultGenerateOptions } from "./constants.js";
import type { GenerateClient, GenerateLanguage, GenerateOptions } from "./types.js";

export const supportedGenerateLanguages = [
  "typescript",
  "python",
  "go",
  "java",
  "csharp",
  "php"
] as const satisfies readonly GenerateLanguage[];

export const supportedGenerateClients = ["fetch", "axios"] as const satisfies readonly GenerateClient[];

export const resolveGenerateOptions = (
  options: Partial<GenerateOptions> | undefined
): GenerateOptions => {
  const resolvedOptions = {
    ...defaultGenerateOptions,
    ...options
  };

  assertSupportedGenerateOptions(resolvedOptions);
  return resolvedOptions;
};

export const assertSupportedGenerateOptions = (options: GenerateOptions): void => {
  const language = String(options.language);
  const client = String(options.client);
  const packageName = String(options.packageName);
  const clientName = String(options.clientName);

  if (!isSupportedGenerateLanguage(language)) {
    throw new Error(`Unsupported SDK language: ${language}`);
  }

  if (!isSupportedGenerateClient(client)) {
    throw new Error(`Unsupported TypeScript client: ${client}`);
  }

  if (!/^[a-z0-9][a-z0-9._/-]{0,159}$/i.test(packageName) || packageName.includes("..")) {
    throw new Error("Unsupported SDK package name.");
  }

  if (!/^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(clientName)) {
    throw new Error("Unsupported SDK client name.");
  }

  if (options.baseUrlStrategy !== "constructor" && options.baseUrlStrategy !== "perRequest") {
    throw new Error(`Unsupported SDK base URL strategy: ${String(options.baseUrlStrategy)}`);
  }
};

export const isSupportedGenerateLanguage = (
  language: string
): language is GenerateLanguage => {
  return (supportedGenerateLanguages as readonly string[]).includes(language);
};

export const isSupportedGenerateClient = (client: string): client is GenerateClient => {
  return (supportedGenerateClients as readonly string[]).includes(client);
};

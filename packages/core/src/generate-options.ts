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

  if (!isSupportedGenerateLanguage(language)) {
    throw new Error(`Unsupported SDK language: ${language}`);
  }

  if (!isSupportedGenerateClient(client)) {
    throw new Error(`Unsupported TypeScript client: ${client}`);
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

import {
  defaultGenerateOptions,
  resolveGenerateOptions,
  type GenerateOptions
} from "@specdock/core";

export const hydrateGenerateOptions = (
  defaultClient: GenerateOptions["client"],
  storedOptions: Partial<GenerateOptions>
): GenerateOptions => {
  const defaultOptions = {
    ...defaultGenerateOptions,
    client: defaultClient
  };

  try {
    return resolveGenerateOptions({
      ...defaultOptions,
      ...storedOptions
    });
  } catch {
    return defaultOptions;
  }
};

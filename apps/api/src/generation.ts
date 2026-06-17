import { defaultGenerateOptions, type GenerateOptions } from "@specdock/core";

export const resolveGenerateOptions = (options: GenerateOptions | undefined): GenerateOptions => {
  return {
    ...defaultGenerateOptions,
    ...options
  };
};

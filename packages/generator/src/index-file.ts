import type { GenerateOptions } from "@specdock/core";

export const generateIndexFile = (options: GenerateOptions): string => {
  return [
    options.generateTypes ? 'export * from "./types";' : undefined,
    'export * from "./client";',
    options.generateReactQuery ? 'export * from "./hooks";' : undefined,
    options.generateZod ? 'export * from "./schemas";' : undefined
  ]
    .filter(Boolean)
    .join("\n")
    .concat("\n");
};

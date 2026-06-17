import JSZip from "jszip";
import {
  defaultGenerateOptions,
  extractOperations,
  extractSchemas,
  LIMITS,
  parseSpec,
  type GeneratedFile,
  type GenerateOptions,
  validateSpec
} from "@specdock/core";
import { generateClientFile } from "./client-file.js";
import { generateReactQueryFile } from "./hooks-file.js";
import { generateIndexFile } from "./index-file.js";
import { normalizeOutputPath } from "./naming.js";
import { generateTypesFile } from "./types-file.js";
import { generateZodFile } from "./zod-file.js";

export const GENERATOR_VERSION = "0.1.0";

export const generateSdk = (
  spec: unknown,
  options: Partial<GenerateOptions> = {}
): GeneratedFile[] => {
  const resolvedOptions: GenerateOptions = {
    ...defaultGenerateOptions,
    ...options
  };
  const document = validateSpec(parseSpec(spec));
  const outputPath = normalizeOutputPath(resolvedOptions.outputPath);
  const operations = extractOperations(document);
  const schemas = extractSchemas(document);
  assertGenerateComplexity(document, operations.length, schemas.length);
  const files: GeneratedFile[] = [];

  if (resolvedOptions.generateTypes) {
    files.push({
      path: `${outputPath}/types.ts`,
      content: generateTypesFile(schemas)
    });
  }

  files.push({
    path: `${outputPath}/client.ts`,
    content: generateClientFile(operations, resolvedOptions)
  });

  if (resolvedOptions.generateReactQuery) {
    files.push({
      path: `${outputPath}/hooks.ts`,
      content: generateReactQueryFile(operations, resolvedOptions)
    });
  }

  if (resolvedOptions.generateZod) {
    files.push({
      path: `${outputPath}/schemas.ts`,
      content: generateZodFile(schemas)
    });
  }

  files.push({
    path: `${outputPath}/index.ts`,
    content: generateIndexFile(resolvedOptions)
  });

  return files;
};

const assertGenerateComplexity = (
  document: Record<string, unknown>,
  operationCount: number,
  schemaCount: number
) => {
  const pathCount =
    typeof document.paths === "object" && document.paths !== null
      ? Object.keys(document.paths).length
      : 0;

  if (
    pathCount > LIMITS.maxGeneratePaths ||
    operationCount > LIMITS.maxGenerateOperations ||
    schemaCount > LIMITS.maxGenerateSchemas
  ) {
    throw new Error(
      `Specification is too large to generate. Limits: ${LIMITS.maxGeneratePaths} paths, ${LIMITS.maxGenerateOperations} operations, ${LIMITS.maxGenerateSchemas} schemas.`
    );
  }
};

export const generateSdkZip = async (
  spec: unknown,
  options: Partial<GenerateOptions> = {}
): Promise<Uint8Array> => {
  const zip = new JSZip();

  for (const file of generateSdk(spec, options)) {
    zip.file(file.path, file.content);
  }

  return zip.generateAsync({ type: "uint8array" });
};

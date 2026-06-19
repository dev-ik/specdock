import JSZip from "jszip";
import {
  extractOperations,
  extractSchemas,
  LIMITS,
  parseSpec,
  resolveGenerateOptions,
  type GeneratedFile,
  type GenerateOptions,
  validateSpec
} from "@specdock/core";
import { generateClientFile } from "./client-file.js";
import { generateCsharpFiles } from "./csharp-file.js";
import { generateReactQueryFile } from "./hooks-file.js";
import { generateIndexFile } from "./index-file.js";
import { generateGoFiles } from "./go-file.js";
import { generateJavaFiles } from "./java-file.js";
import { appendMetadataFiles } from "./metadata-files.js";
import { normalizeOutputPath } from "./naming.js";
import { generatePhpFiles } from "./php-file.js";
import { generatePythonFiles } from "./python-file.js";
import { buildSdkModel } from "./sdk-model.js";
import { generateTypesFile } from "./types-file.js";
import { generateZodFile } from "./zod-file.js";

export const GENERATOR_VERSION = "0.5.0";

export const generateSdk = (
  spec: unknown,
  options: Partial<GenerateOptions> = {}
): GeneratedFile[] => {
  const resolvedOptions = resolveGenerateOptions(options);
  const document = validateSpec(parseSpec(spec));
  const outputPath = normalizeOutputPath(resolvedOptions.outputPath);
  const operations = extractOperations(document);
  const schemas = extractSchemas(document);
  assertGenerateComplexity(document, operations.length, schemas.length);
  const model = buildSdkModel(operations, schemas, resolvedOptions);
  const files: GeneratedFile[] = [];

  if (resolvedOptions.language === "go") {
    return appendMetadataFiles(
      generateGoFiles(model, outputPath, resolvedOptions),
      outputPath,
      resolvedOptions,
      GENERATOR_VERSION
    );
  }

  if (resolvedOptions.language === "java") {
    return appendMetadataFiles(
      generateJavaFiles(model, outputPath, resolvedOptions),
      outputPath,
      resolvedOptions,
      GENERATOR_VERSION
    );
  }

  if (resolvedOptions.language === "csharp") {
    return appendMetadataFiles(
      generateCsharpFiles(model, outputPath, resolvedOptions),
      outputPath,
      resolvedOptions,
      GENERATOR_VERSION
    );
  }

  if (resolvedOptions.language === "php") {
    return appendMetadataFiles(
      generatePhpFiles(model, outputPath, resolvedOptions),
      outputPath,
      resolvedOptions,
      GENERATOR_VERSION
    );
  }

  if (resolvedOptions.language === "python") {
    return appendMetadataFiles(
      generatePythonFiles(model, outputPath, resolvedOptions),
      outputPath,
      resolvedOptions,
      GENERATOR_VERSION
    );
  }

  if (resolvedOptions.generateTypes) {
    files.push({
      path: `${outputPath}/types.ts`,
      content: generateTypesFile(model.schemas)
    });
  }

  files.push({
    path: `${outputPath}/client.ts`,
    content: generateClientFile(model.operations, resolvedOptions)
  });

  if (resolvedOptions.generateReactQuery) {
    files.push({
      path: `${outputPath}/hooks.ts`,
      content: generateReactQueryFile(model.operations)
    });
  }

  if (resolvedOptions.generateZod) {
    files.push({
      path: `${outputPath}/schemas.ts`,
      content: generateZodFile(model.schemas)
    });
  }

  files.push({
    path: `${outputPath}/index.ts`,
    content: generateIndexFile(resolvedOptions)
  });

  return appendMetadataFiles(files, outputPath, resolvedOptions, GENERATOR_VERSION);
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

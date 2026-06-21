#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { defaultGenerateOptions, type GenerateOptions } from "@specdock/core";
import { createGeneratedOutputPlan, generateSdk } from "../index.js";

export type GenerateCliOptions = {
  inputPath?: string;
  outputPath: string;
  planOnly: boolean;
  generateOptions: Partial<GenerateOptions>;
};

export const parseGenerateCliArgs = (args: string[]): GenerateCliOptions => {
  const options: GenerateCliOptions = {
    outputPath: defaultGenerateOptions.outputPath,
    planOnly: false,
    generateOptions: {}
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) continue;

    if (arg === "--input") {
      options.inputPath = requireValue(args, index, arg);
      index += 1;
    } else if (arg === "--out") {
      options.outputPath = requireValue(args, index, arg);
      options.generateOptions.outputPath = options.outputPath;
      index += 1;
    } else if (arg === "--language") {
      options.generateOptions.language = requireValue(args, index, arg) as GenerateOptions["language"];
      index += 1;
    } else if (arg === "--client") {
      options.generateOptions.client = requireValue(args, index, arg) as GenerateOptions["client"];
      index += 1;
    } else if (arg === "--package-name") {
      options.generateOptions.packageName = requireValue(args, index, arg);
      index += 1;
    } else if (arg === "--client-name") {
      options.generateOptions.clientName = requireValue(args, index, arg);
      index += 1;
    } else if (arg === "--base-url-strategy") {
      options.generateOptions.baseUrlStrategy = requireValue(args, index, arg) as GenerateOptions["baseUrlStrategy"];
      index += 1;
    } else if (arg === "--naming") {
      options.generateOptions.namingStyle = requireValue(args, index, arg) as GenerateOptions["namingStyle"];
      index += 1;
    } else if (arg === "--react-query") {
      options.generateOptions.generateReactQuery = true;
    } else if (arg === "--zod") {
      options.generateOptions.generateZod = true;
    } else if (arg === "--no-types") {
      options.generateOptions.generateTypes = false;
    } else if (arg === "--plan") {
      options.planOnly = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
};

export const runGenerateCli = (
  args: string[],
  io: { cwd?: string; stdout?: { write(value: string): void } } = {}
): void => {
  const options = parseGenerateCliArgs(args);

  if (!options.inputPath) {
    printUsage();
    throw new Error("Missing --input.");
  }

  const cwd = io.cwd ?? process.cwd();
  const spec = readFileSync(path.resolve(cwd, options.inputPath), "utf8");
  const generateOptions = { ...options.generateOptions, outputPath: options.outputPath };
  const files = generateSdk(spec, generateOptions);
  const resolvedOptions = { ...defaultGenerateOptions, ...generateOptions };
  const plan = createGeneratedOutputPlan(files, resolvedOptions);

  if (!options.planOnly) {
    writeGeneratedFiles(cwd, files, plan.outputRoot);
  }

  (io.stdout ?? process.stdout).write(`${JSON.stringify(plan, null, 2)}\n`);
};

const writeGeneratedFiles = (
  cwd: string,
  files: ReturnType<typeof generateSdk>,
  outputRoot: string
): void => {
  const root = path.resolve(cwd, outputRoot);

  for (const file of files) {
    const target = path.resolve(cwd, file.path);
    if (!isPathInsideRoot(target, root)) {
      throw new Error("Generated file path escapes the output root.");
    }

    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, file.content, "utf8");
  }
};

const isPathInsideRoot = (target: string, root: string): boolean =>
  target === root || target.startsWith(`${root}${path.sep}`);

const requireValue = (args: string[], index: number, option: string): string => {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${option} requires a value.`);
  }
  return value;
};

const printUsage = () => {
  process.stderr.write(
    "Usage: npm run sdk:generate -- --input openapi.yaml [--out generated] [--plan] [--language typescript|python|go|java|csharp|php]\n"
  );
};

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    runGenerateCli(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : "SDK generation failed."}\n`);
    process.exitCode = 1;
  }
}

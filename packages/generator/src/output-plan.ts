import type { GeneratedFile, GeneratedOutputPlan, GenerateOptions } from "@specdock/core";
import { normalizeOutputPath } from "./naming.js";

const textEncoder = new TextEncoder();

export const createGeneratedOutputPlan = (
  files: GeneratedFile[],
  options: GenerateOptions
): GeneratedOutputPlan => {
  const outputRoot = normalizeOutputPath(options.outputPath);
  const entries = files.map((file) => createPlanEntry(file, outputRoot));

  return {
    outputRoot,
    fileCount: entries.length,
    totalBytes: entries.reduce((total, entry) => total + entry.bytes, 0),
    pathPolicy: "relative-no-traversal",
    files: entries.sort((left, right) => left.path.localeCompare(right.path))
  };
};

const createPlanEntry = (
  file: GeneratedFile,
  outputRoot: string
): GeneratedOutputPlan["files"][number] => {
  assertGeneratedFilePath(file.path, outputRoot);
  return {
    path: file.path,
    relativePath: file.path.slice(outputRoot.length + 1),
    bytes: textEncoder.encode(file.content).byteLength
  };
};

const assertGeneratedFilePath = (path: string, outputRoot: string): void => {
  const segments = path.split("/");

  if (
    path.startsWith("/") ||
    path.includes("\\") ||
    /^[A-Za-z]:/.test(path) ||
    !path.startsWith(`${outputRoot}/`) ||
    segments.some((segment) => segment === "" || segment === "." || segment === "..")
  ) {
    throw new Error("Generated file path escapes the output root.");
  }
};

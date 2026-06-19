#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  createOpenApiDiffReport,
  normalizeSpec,
  renderOpenApiDiffJson,
  renderOpenApiDiffMarkdown
} from "../index.js";
import type { OpenApiProject } from "../types.js";

type CliOptions = {
  previousPath?: string;
  currentPath?: string;
  format: "markdown" | "json";
  failOnBreaking: boolean;
};

const main = () => {
  const options = parseArgs(process.argv.slice(2));

  if (!options.previousPath || !options.currentPath) {
    printUsage();
    process.exitCode = 2;
    return;
  }

  const previous = projectFromFile(options.previousPath);
  const current = projectFromFile(options.currentPath);
  const report = createOpenApiDiffReport(previous, current);
  const output =
    options.format === "json"
      ? renderOpenApiDiffJson(report)
      : renderOpenApiDiffMarkdown(report);

  process.stdout.write(`${output}\n`);

  if (options.failOnBreaking && report.counts.breaking > 0) {
    process.exitCode = 1;
  }
};

const parseArgs = (args: string[]): CliOptions => {
  const options: CliOptions = {
    format: "markdown",
    failOnBreaking: false
  };
  const paths: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg) {
      continue;
    }

    if (arg === "--format") {
      const format = args[index + 1];
      if (format !== "markdown" && format !== "json") {
        throw new Error("--format must be markdown or json");
      }
      options.format = format;
      index += 1;
      continue;
    }

    if (arg === "--fail-on-breaking") {
      options.failOnBreaking = true;
      continue;
    }

    paths.push(arg);
  }

  return {
    ...options,
    previousPath: paths[0],
    currentPath: paths[1]
  };
};

const projectFromFile = (filePath: string): OpenApiProject => {
  const normalized = normalizeSpec(readFileSync(filePath, "utf8"));
  const name = readInfoString(normalized.spec, "title") ?? filePath;
  const version = readInfoString(normalized.spec, "version");

  return {
    id: filePath,
    name,
    source: { type: "file", fileName: filePath },
    specFormat: normalized.specFormat,
    spec: { info: { title: name, version } },
    servers: normalized.servers,
    tags: normalized.tags,
    operations: normalized.operations,
    schemas: normalized.schemas,
    createdAt: "1970-01-01T00:00:00.000Z",
    updatedAt: "1970-01-01T00:00:00.000Z"
  };
};

const readInfoString = (spec: unknown, key: string): string | undefined => {
  const info =
    spec && typeof spec === "object" && !Array.isArray(spec)
      ? (spec as Record<string, unknown>).info
      : undefined;
  const value =
    info && typeof info === "object" && !Array.isArray(info)
      ? (info as Record<string, unknown>)[key]
      : undefined;

  return typeof value === "string" ? value : undefined;
};

const printUsage = () => {
  process.stderr.write(
    "Usage: npm run contract:diff -- [--format markdown|json] [--fail-on-breaking] old.yaml new.yaml\n"
  );
};

try {
  main();
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : "Contract diff failed."}\n`);
  process.exitCode = 1;
}

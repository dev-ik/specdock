import type { GeneratedFile, GenerateOptions } from "@specdock/core";

export const appendMetadataFiles = (
  files: GeneratedFile[],
  outputPath: string,
  options: GenerateOptions,
  generatorVersion: string
): GeneratedFile[] => {
  const readme: GeneratedFile = {
    path: `${outputPath}/README.md`,
    content: generateReadmeFile(options, files, outputPath)
  };
  const manifest: GeneratedFile = {
    path: `${outputPath}/specdock.manifest.json`,
    content: generateManifestFile(options, [...files, readme], outputPath, generatorVersion)
  };

  return [...files, readme, manifest];
};

const generateReadmeFile = (
  options: GenerateOptions,
  files: GeneratedFile[],
  outputPath: string
): string => `# SpecDock Generated SDK

Language: ${languageLabel(options.language)}

Runtime target: ${runtimeTarget(options.language).target}

Package name: ${options.packageName}

Client name: ${options.clientName}

Base URL strategy: ${options.baseUrlStrategy}

${dependencyLine(options.language)}

## Files

${files.map((file) => `- \`${relativePath(file.path, outputPath)}\``).join("\n")}

## Usage

${usageExample(options)}

## Notes

- Generated from an OpenAPI contract.
- Review authentication, base URL, and runtime error handling before production use.
- Regenerate this SDK when the source contract changes.
`;

const generateManifestFile = (
  options: GenerateOptions,
  files: GeneratedFile[],
  outputPath: string,
  generatorVersion: string
): string => `${JSON.stringify(
  {
    generator: "specdock",
    generatorVersion,
    language: options.language,
    runtimeTarget: runtimeTarget(options.language),
    namingStyle: options.namingStyle,
    packageName: options.packageName,
    clientName: options.clientName,
    baseUrlStrategy: options.baseUrlStrategy,
    preset: {
      packageName: options.packageName,
      clientName: options.clientName,
      baseUrlStrategy: options.baseUrlStrategy
    },
    files: files.map((file) => file.path.slice(outputPath.length + 1))
  },
  null,
  2
)}
`;

const relativePath = (path: string, outputPath: string): string => {
  const normalizedOutputPath = outputPath.replace(/^\/+|\/+$/g, "");
  return path.startsWith(`${normalizedOutputPath}/`)
    ? path.slice(normalizedOutputPath.length + 1)
    : path;
};

const languageLabel = (language: GenerateOptions["language"]): string => {
  const labels: Record<GenerateOptions["language"], string> = {
    typescript: "TypeScript",
    python: "Python",
    go: "Go",
    java: "Java",
    csharp: "C#",
    php: "PHP"
  };
  return labels[language];
};

const runtimeTarget = (
  language: GenerateOptions["language"]
): { name: string; target: string; dependencies?: Record<string, string> } => {
  switch (language) {
    case "typescript":
      return { name: "TypeScript", target: "TypeScript 5.x, Node.js 20+ or modern browsers" };
    case "python":
      return { name: "Python", target: "Python >=3.11", dependencies: { httpx: ">=0.27.0" } };
    case "go":
      return { name: "Go", target: "Go 1.22" };
    case "java":
      return { name: "Java", target: "Java 17", dependencies: { jacksonDatabind: "2.17.2" } };
    case "csharp":
      return { name: "C#", target: ".NET 8.0" };
    case "php":
      return { name: "PHP", target: "PHP >=8.1", dependencies: { guzzle: "^7.0" } };
  }
};

const dependencyLine = (language: GenerateOptions["language"]): string => {
  const dependencies = runtimeTarget(language).dependencies;
  if (!dependencies) return "";
  const summary = Object.entries(dependencies)
    .map(([name, version]) => `${name} ${version}`)
    .join(", ");
  return `Runtime dependencies: ${summary}\n`;
};

const usageExample = (options: GenerateOptions): string => {
  switch (options.language) {
    case "python":
      return "Install with `pip install -e .` and import from `specdock_client`.";
    case "go":
      return "Run `go test ./...` and call generated functions with `context.Context`.";
    case "java":
      return "Run `mvn test` and instantiate `com.specdock.client.SpecDockClient`.";
    case "csharp":
      return "Run `dotnet build` and instantiate `SpecDock.Client.SpecDockClient`.";
    case "php":
      return "Run `composer install` and instantiate `SpecDock\\Client\\SpecDockClient`.";
    case "typescript":
      return "Import generated functions from `./client` or `./index` in your app.";
  }
};

import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import type { GenerateLanguage } from "@specdock/core";
import { generateSdk } from "./index.js";

const spec = {
  openapi: "3.1.0",
  info: { title: "SpecDock Smoke API", version: "1.0.0" },
  paths: {
    "/users/{id}": {
      get: {
        operationId: "getUser",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "include", in: "query", required: false, schema: { type: "string" } },
          { name: "x-request-id", in: "header", required: false, schema: { type: "string" } }
        ],
        responses: { "200": { description: "OK" } }
      }
    },
    "/users": {
      post: {
        operationId: "createUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/User" }
            }
          }
        },
        responses: { "201": { description: "Created" } }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id", "email"],
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          age: { type: "integer" },
          active: { type: "boolean" }
        }
      }
    }
  }
};

const languages = {
  typescript: {
    required: ["client.ts", "types.ts", "index.ts"],
    target: "TypeScript 5.x",
    label: "TypeScript"
  },
  python: {
    required: [
      "pyproject.toml",
      "specdock_client/__init__.py",
      "specdock_client/client.py",
      "specdock_client/models.py"
    ],
    target: "Python >=3.11",
    label: "Python"
  },
  go: {
    required: ["go.mod", "client.go", "models.go"],
    target: "Go 1.22",
    label: "Go"
  },
  java: {
    required: [
      "pom.xml",
      "src/main/java/com/specdock/client/SpecDockClient.java",
      "src/main/java/com/specdock/client/Models.java"
    ],
    target: "Java 17",
    label: "Java"
  },
  csharp: {
    required: ["SpecDock.Client.csproj", "SpecDockClient.cs", "Models.cs"],
    target: ".NET 8.0",
    label: "C#"
  },
  php: {
    required: ["composer.json", "src/SpecDockClient.php", "src/Models.php"],
    target: "PHP >=8.1",
    label: "PHP"
  }
} as const;

type LanguageProfile = (typeof languages)[keyof typeof languages];

describe("generated SDK smoke checks", () => {
  it("generates valid release artifacts for every supported language", () => {
    const root = mkdtempSync(join(tmpdir(), "specdock-sdk-smoke-"));

    try {
      for (const [language, profile] of Object.entries(languages) as [
        GenerateLanguage,
        LanguageProfile
      ][]) {
        const files = generateSdk(spec, { language, outputPath: "generated" });
        const paths = files.map((file) => file.path);

        for (const requiredPath of profile.required) {
          expect(paths).toContain(`generated/${requiredPath}`);
        }
        expect(paths).toContain("generated/README.md");
        expect(paths).toContain("generated/specdock.manifest.json");

        for (const file of files) {
          expect(file.path).toMatch(/^generated\//);
          expect(file.path).not.toContain("..");
          expect(file.content.trim()).not.toHaveLength(0);
        }

        const readme = contentOf(files, "generated/README.md");
        expect(readme).toContain(`Language: ${profile.label}`);
        expect(readme).toContain(profile.target);

        const manifest = JSON.parse(contentOf(files, "generated/specdock.manifest.json"));
        expect(manifest).toMatchObject({
          generator: "specdock",
          language
        });
        expect(manifest.files).toEqual(expect.arrayContaining([...profile.required]));

        const outputDir = join(root, language, "generated");
        writeGeneratedFiles(outputDir, files);
        runToolchainChecks(language, outputDir);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

const writeGeneratedFiles = (
  outputDir: string,
  files: { path: string; content: string }[]
) => {
  for (const file of files) {
    const relativePath = file.path.slice("generated/".length);
    const destination = join(outputDir, relativePath);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, file.content);
  }
};

const runToolchainChecks = (language: string, outputDir: string) => {
  if (language === "typescript") {
    run(
      "node",
      [
        join(process.cwd(), "../../node_modules/typescript/bin/tsc"),
        "--noEmit",
        "--target",
        "ES2022",
        "--module",
        "ESNext",
        "--moduleResolution",
        "Bundler",
        "--lib",
        "ES2022,DOM",
        "--strict",
        "--skipLibCheck",
        "types.ts",
        "client.ts",
        "index.ts"
      ],
      outputDir
    );
    return;
  }

  if (language === "python" && commandExists("python3")) {
    run("python3", ["-m", "compileall", "-q", "specdock_client"], outputDir);
  }
  if (language === "go" && commandExists("go")) {
    run("go", ["test", "./..."], outputDir);
  }
  if (language === "java" && commandExists("mvn")) {
    run("mvn", ["-q", "test"], outputDir);
  }
  if (language === "csharp" && commandExists("dotnet")) {
    run("dotnet", ["build", "--nologo"], outputDir);
  }
  if (language === "php" && commandExists("php")) {
    run("php", ["-l", "src/SpecDockClient.php"], outputDir);
    run("php", ["-l", "src/Models.php"], outputDir);
  }
  if (language === "php" && commandExists("composer")) {
    run("composer", ["validate", "--no-check-publish", "--strict"], outputDir);
  }
};

const commandExists = (command: string) => {
  return spawnSync(command, ["--version"], { stdio: "ignore" }).status === 0;
};

const run = (command: string, args: string[], cwd: string) => {
  const result = spawnSync(command, args, {
    cwd,
    env: {
      ...process.env,
      GOCACHE: join(cwd, ".gocache"),
      GOPATH: join(cwd, ".gopath"),
      PYTHONPYCACHEPREFIX: join(cwd, ".pycache")
    },
    stdio: "inherit"
  });
  expect(result.status, [command, ...args].join(" ")).toBe(0);
};

const contentOf = (files: { path: string; content: string }[], path: string) => {
  const file = files.find((entry) => entry.path === path);
  expect(file, path).toBeDefined();
  return file?.content ?? "";
};

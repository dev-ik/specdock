import { describe, expect, it } from "vitest";
import { LIMITS } from "@specdock/core";
import { generateSdk, generateSdkZip } from "./index.js";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Test",
    version: "1.0.0"
  },
  paths: {
    "/users": {
      post: {
        operationId: "createUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/User"
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Created"
          }
        }
      }
    },
    "/users/{id}": {
      get: {
        operationId: "getUser",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } }
        ],
        responses: {
          "200": {
            description: "OK"
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
          age: { type: "integer" }
        }
      }
    }
  }
};

describe("generateSdk", () => {
  it("generates TypeScript SDK files", () => {
    const files = generateSdk(spec);

    expect(pathsWithoutMetadata(files)).toEqual([
      "generated/types.ts",
      "generated/client.ts",
      "generated/index.ts"
    ]);
    expect(files[0]?.content).toContain("export type User");
    expect(files[1]?.content).toContain("export const getUser");
  });

  it("accepts explicit TypeScript language options", () => {
    const files = generateSdk(spec, { language: "typescript" });

    expect(files.map((file) => file.path)).toContain("generated/client.ts");
  });

  it("rejects unsupported language values at runtime", () => {
    expect(() =>
      generateSdk(spec, { language: "ruby" } as never)
    ).toThrow("Unsupported SDK language: ruby");
  });

  it("rejects unsupported TypeScript client values at runtime", () => {
    expect(() =>
      generateSdk(spec, { client: "httpx" } as never)
    ).toThrow("Unsupported TypeScript client: httpx");
  });

  it("honors output path and optional files", () => {
    const files = generateSdk(spec, {
      outputPath: "/sdk/",
      generateTypes: false,
      generateReactQuery: true,
      generateZod: true
    });

    expect(pathsWithoutMetadata(files)).toEqual([
      "sdk/client.ts",
      "sdk/hooks.ts",
      "sdk/schemas.ts",
      "sdk/index.ts"
    ]);
    expect(files.find((file) => file.path === "sdk/index.ts")?.content).toBe(
      'export * from "./client";\nexport * from "./hooks";\nexport * from "./schemas";\n'
    );
  });

  it("generates ZIP archives", async () => {
    const archive = await generateSdkZip(spec);

    expect(archive.byteLength).toBeGreaterThan(0);
  });

  it("adds SDK README and manifest metadata", () => {
    const files = generateSdk(spec);
    const readme = files.find((file) => file.path === "generated/README.md");
    const manifest = files.find((file) => file.path === "generated/specdock.manifest.json");

    expect(readme?.content).toContain("Language: TypeScript");
    expect(readme?.content).toContain(
      "Runtime target: TypeScript 5.x, Node.js 20+ or modern browsers"
    );
    expect(readme?.content).toContain("- `client.ts`");
    expect(JSON.parse(manifest?.content ?? "{}")).toMatchObject({
      generator: "specdock",
      language: "typescript",
      runtimeTarget: {
        name: "TypeScript",
        target: "TypeScript 5.x, Node.js 20+ or modern browsers"
      },
      packageName: "specdock-generated-client",
      clientName: "SpecDockClient",
      baseUrlStrategy: "constructor",
      files: expect.arrayContaining(["client.ts", "README.md"])
    });
  });

  it("includes SDK preset metadata and applies Python package names", () => {
    const files = generateSdk(spec, {
      language: "python",
      packageName: "acme-api-client",
      clientName: "AcmeClient",
      baseUrlStrategy: "perRequest"
    });
    const manifest = JSON.parse(
      files.find((file) => file.path === "generated/specdock.manifest.json")?.content ?? "{}"
    );

    expect(files.map((file) => file.path)).toContain("generated/acme_api_client/client.py");
    expect(files.find((file) => file.path === "generated/acme_api_client/client.py")?.content).toContain(
      "class AcmeClient"
    );
    expect(manifest.preset).toEqual({
      packageName: "acme-api-client",
      clientName: "AcmeClient",
      baseUrlStrategy: "perRequest"
    });
  });

  it("generates per-request base URL operation helpers", () => {
    const tsFiles = generateSdk(spec, { baseUrlStrategy: "perRequest" });
    const goFiles = generateSdk(spec, { language: "go", baseUrlStrategy: "perRequest" });
    const javaFiles = generateSdk(spec, { language: "java", baseUrlStrategy: "perRequest" });
    const csharpFiles = generateSdk(spec, { language: "csharp", baseUrlStrategy: "perRequest" });
    const phpFiles = generateSdk(spec, { language: "php", baseUrlStrategy: "perRequest" });
    const pythonFiles = generateSdk(spec, {
      language: "python",
      baseUrlStrategy: "perRequest",
      clientName: "AcmeClient"
    });

    expect(tsFiles.find((file) => file.path === "generated/client.ts")?.content).toContain(
      "baseUrl: string"
    );
    expect(goFiles.find((file) => file.path === "generated/client.go")?.content).toContain(
      "RequestWithBaseURL(ctx, baseURL"
    );
    expect(javaFiles.find((file) => file.path.endsWith("SpecDockClient.java"))?.content).toContain(
      "requestWithBaseUrl(baseUrl"
    );
    expect(csharpFiles.find((file) => file.path === "generated/SpecDockClient.cs")?.content).toContain(
      "RequestWithBaseUrlAsync(baseUrl"
    );
    expect(phpFiles.find((file) => file.path === "generated/src/SpecDockClient.php")?.content).toContain(
      "requestWithBaseUrl($baseUrl"
    );
    expect(pythonFiles.find((file) => file.path === "generated/specdock_client/client.py")?.content).toContain(
      "base_url: str"
    );
  });

  it("rejects specs above generation complexity limits", () => {
    const paths = Object.fromEntries(
      Array.from({ length: LIMITS.maxGenerateOperations + 1 }, (_, index) => [
        `/items-${index}`,
        {
          get: {
            responses: {
              "200": {
                description: "OK"
              }
            }
          }
        }
      ])
    );

    expect(() => generateSdk({ ...spec, paths })).toThrow(
      "Specification is too large to generate"
    );
  });
});

const pathsWithoutMetadata = (files: { path: string }[]) =>
  files
    .map((file) => file.path)
    .filter((path) => !path.endsWith("/README.md") && !path.endsWith("/specdock.manifest.json"));

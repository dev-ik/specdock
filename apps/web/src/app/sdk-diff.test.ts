import { describe, expect, it } from "vitest";
import {
  canDiffGeneratedFiles,
  createGeneratedFileManifest,
  diffGeneratedFiles,
  generatedFilesTargetFromOptions
} from "./sdk-diff.js";

describe("sdk diff", () => {
  it("creates stable manifests sorted by path", () => {
    expect(
      createGeneratedFileManifest([
        { path: "sdk/z.ts", content: "z" },
        { path: "sdk/a.ts", content: "a" }
      ])
    ).toEqual([
      { path: "sdk/a.ts", hash: "e40c292c" },
      { path: "sdk/z.ts", hash: "ff0c53ad" }
    ]);
  });

  it("classifies added, changed, removed, and unchanged files", () => {
    expect(
      diffGeneratedFiles(
        [
          { path: "sdk/client.ts", content: "old client" },
          { path: "sdk/types.ts", content: "same" },
          { path: "sdk/hooks.ts", content: "removed" }
        ],
        [
          { path: "sdk/client.ts", content: "new client" },
          { path: "sdk/types.ts", content: "same" },
          { path: "sdk/index.ts", content: "added" }
        ]
      )
    ).toEqual({
      entries: [
        {
          path: "sdk/client.ts",
          status: "changed",
          previousContent: "old client",
          currentContent: "new client"
        },
        {
          path: "sdk/hooks.ts",
          status: "removed",
          previousContent: "removed"
        },
        {
          path: "sdk/index.ts",
          status: "added",
          currentContent: "added"
        },
        {
          path: "sdk/types.ts",
          status: "unchanged",
          previousContent: "same",
          currentContent: "same"
        }
      ],
      summary: {
        added: 1,
        changed: 1,
        removed: 1,
        unchanged: 1
      }
    });
  });

  it("does not diff generated files across SDK languages", () => {
    const baseOptions = {
      language: "typescript",
      client: "fetch",
      generateTypes: true,
      generateReactQuery: false,
      generateZod: false,
      outputPath: "generated",
      namingStyle: "operationId",
      packageName: "specdock-generated-client",
      clientName: "SpecDockClient",
      baseUrlStrategy: "constructor"
    } as const;
    const typescriptTarget = generatedFilesTargetFromOptions(baseOptions);
    const javaTarget = generatedFilesTargetFromOptions({
      ...baseOptions,
      language: "java"
    });

    expect(canDiffGeneratedFiles(typescriptTarget, typescriptTarget)).toBe(true);
    expect(canDiffGeneratedFiles(typescriptTarget, javaTarget)).toBe(false);
  });
});

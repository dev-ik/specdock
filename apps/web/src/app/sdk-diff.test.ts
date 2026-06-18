import { describe, expect, it } from "vitest";
import { createGeneratedFileManifest, diffGeneratedFiles } from "./sdk-diff.js";

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
});

import { describe, expect, it } from "vitest";
import { defaultGenerateOptions } from "@specdock/core";
import { createGeneratedOutputPlan } from "./output-plan.js";

describe("generated output plan", () => {
  it("summarizes generated files under the output root", () => {
    const plan = createGeneratedOutputPlan(
      [
        { path: "sdk/client.ts", content: "export {};" },
        { path: "sdk/README.md", content: "# SDK" }
      ],
      { ...defaultGenerateOptions, outputPath: "/sdk/" }
    );

    expect(plan).toEqual({
      outputRoot: "sdk",
      fileCount: 2,
      totalBytes: 15,
      pathPolicy: "relative-no-traversal",
      files: [
        { path: "sdk/client.ts", relativePath: "client.ts", bytes: 10 },
        { path: "sdk/README.md", relativePath: "README.md", bytes: 5 }
      ]
    });
  });

  it("rejects paths that escape the output root", () => {
    expect(() =>
      createGeneratedOutputPlan(
        [{ path: "sdk/../secret.ts", content: "" }],
        { ...defaultGenerateOptions, outputPath: "sdk" }
      )
    ).toThrow("Generated file path escapes the output root.");
  });
});

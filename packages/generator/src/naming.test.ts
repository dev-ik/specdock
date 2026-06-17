import { describe, expect, it } from "vitest";
import { normalizeOutputPath } from "./naming.js";

describe("normalizeOutputPath", () => {
  it("allows simple relative output paths", () => {
    expect(normalizeOutputPath("/sdk/client/")).toBe("sdk/client");
    expect(normalizeOutputPath("")).toBe("generated");
  });

  it("rejects traversal output paths for ZIP-safe generated files", () => {
    for (const outputPath of ["../sdk", "sdk/../out", "sdk/./out", "C:/sdk"]) {
      expect(() => normalizeOutputPath(outputPath)).toThrow(
        "Invalid output path"
      );
    }
  });
});

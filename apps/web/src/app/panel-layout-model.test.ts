import { describe, expect, it } from "vitest";
import {
  insertInColumn,
  readStoredPanelLayout,
  reorderInColumn,
  type PanelLayout
} from "./panel-layout-model.js";

describe("panel layout model", () => {
  it("preserves panels saved in a different column", () => {
    const savedLayout: Partial<PanelLayout> = {
      import: ["local-projects", "request"],
      explorer: ["quality", "endpoints"],
      workspace: ["import"]
    };

    expect(readStoredPanelLayout({ layout: savedLayout }).layout).toEqual({
      import: ["local-projects", "request"],
      explorer: ["quality", "endpoints", "contract-diff", "operation"],
      workspace: ["import", "response", "generate", "generated-files"]
    });
  });

  it("reorders and inserts panels around a target", () => {
    expect(reorderInColumn(["request", "response", "generate"], "generate", "request", "before")).toEqual([
      "generate",
      "request",
      "response"
    ]);
    expect(insertInColumn(["quality", "endpoints"], "request", "endpoints", "after")).toEqual([
      "quality",
      "endpoints",
      "request"
    ]);
  });
});

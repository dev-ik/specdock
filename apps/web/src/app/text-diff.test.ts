import { describe, expect, it } from "vitest";
import { diffTextLines } from "./text-diff.js";

describe("text diff", () => {
  it("marks added, removed, and unchanged lines", () => {
    expect(diffTextLines("one\ntwo\nthree", "one\nchanged\nthree\nfour")).toEqual([
      { kind: "unchanged", value: "one" },
      { kind: "removed", value: "two" },
      { kind: "added", value: "changed" },
      { kind: "unchanged", value: "three" },
      { kind: "added", value: "four" }
    ]);
  });
});

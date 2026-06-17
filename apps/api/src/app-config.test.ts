import { describe, expect, it } from "vitest";
import { resolveTrustProxy } from "./app-config.js";

describe("resolveTrustProxy", () => {
  it("keeps proxy headers untrusted by default", () => {
    expect(resolveTrustProxy(undefined)).toBe(false);
    expect(resolveTrustProxy("true")).toBe(false);
  });

  it("allows explicit trusted proxy topology values", () => {
    expect(resolveTrustProxy("loopback")).toBe("loopback");
    expect(resolveTrustProxy("2")).toBe(2);
  });
});

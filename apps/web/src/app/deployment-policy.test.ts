import { APP_VERSION } from "@specdock/core";
import { describe, expect, it } from "vitest";
import { directRequestBlockReason } from "./deployment-policy.js";

const publicDemoConfig = {
  version: APP_VERSION,
  publicDemo: true,
  directRequest: {
    restricted: true,
    allowedHosts: ["dummyjson.com"]
  },
  mockServer: {
    enabled: false
  }
};

describe("directRequestBlockReason", () => {
  it("allows unrestricted self-hosted direct requests", () => {
    expect(
      directRequestBlockReason(
        {
          version: APP_VERSION,
          publicDemo: false,
          directRequest: { restricted: false, allowedHosts: [] },
          mockServer: { enabled: false }
        },
        "direct",
        "https://api.example.com/users"
      )
    ).toBeUndefined();
  });

  it("allows public demo direct requests to configured hosts", () => {
    expect(
      directRequestBlockReason(
        publicDemoConfig,
        "direct",
        "https://dummyjson.com/posts"
      )
    ).toBeUndefined();
  });

  it("blocks public demo direct requests to custom hosts", () => {
    expect(
      directRequestBlockReason(
        publicDemoConfig,
        "direct",
        "https://api.example.com/users"
      )
    ).toContain("public demo");
  });

  it("does not block proxy mode because backend proxy policy handles it", () => {
    expect(
      directRequestBlockReason(
        publicDemoConfig,
        "proxy",
        "https://api.example.com/users"
      )
    ).toBeUndefined();
  });
});

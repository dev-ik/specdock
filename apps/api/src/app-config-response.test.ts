import { describe, expect, it } from "vitest";
import { resolveAppConfigResponse } from "./app-config-response.js";

describe("resolveAppConfigResponse", () => {
  it("keeps direct requests unrestricted outside public demo mode", () => {
    expect(resolveAppConfigResponse({ PUBLIC_DEMO: "false" })).toEqual({
      version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
      publicDemo: false,
      directRequest: {
        restricted: false,
        allowedHosts: []
      },
      mockServer: {
        enabled: false
      }
    });
  });

  it("restricts direct requests to default demo hosts in public demo mode", () => {
    expect(resolveAppConfigResponse({ PUBLIC_DEMO: "true" })).toMatchObject({
      version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
      publicDemo: true,
      directRequest: {
        restricted: true,
        allowedHosts: ["dummyjson.com", "petstore3.swagger.io", "httpbin.org"]
      },
      mockServer: {
        enabled: false
      }
    });
  });

  it("reports mock server availability only for self-hosted enabled mode", () => {
    expect(
      resolveAppConfigResponse({
        PUBLIC_DEMO: "false",
        MOCK_SERVER_ENABLED: "true"
      }).mockServer.enabled
    ).toBe(true);
    expect(
      resolveAppConfigResponse({
        PUBLIC_DEMO: "true",
        MOCK_SERVER_ENABLED: "true"
      }).mockServer.enabled
    ).toBe(false);
  });

  it("reads demo direct request hosts from env", () => {
    expect(
      resolveAppConfigResponse({
        PUBLIC_DEMO: "true",
        DEMO_DIRECT_ALLOWED_HOSTS: "Api.Example.com, demo.example.com "
      }).directRequest.allowedHosts
    ).toEqual(["api.example.com", "demo.example.com"]);
  });
});

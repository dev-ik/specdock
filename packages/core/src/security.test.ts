import { describe, expect, it } from "vitest";
import {
  REDACTED_VALUE,
  isSensitiveHeaderName,
  redactSensitiveHeaders,
  redactSensitiveUrl
} from "./security.js";

describe("security helpers", () => {
  it("detects and redacts sensitive headers", () => {
    expect(isSensitiveHeaderName("Authorization")).toBe(true);
    expect(isSensitiveHeaderName("X-Client-Api-Key")).toBe(true);
    expect(isSensitiveHeaderName("Content-Type")).toBe(false);
    expect(
      redactSensitiveHeaders({
        Authorization: "Bearer token",
        Cookie: "sid=123",
        Accept: "application/json"
      })
    ).toEqual({
      Authorization: REDACTED_VALUE,
      Cookie: REDACTED_VALUE,
      Accept: "application/json"
    });
  });

  it("redacts sensitive URL query values", () => {
    expect(
      redactSensitiveUrl(
        "https://api.example.com/users?api_key=123&page=1&access_token=abc"
      )
    ).toBe(
      `https://api.example.com/users?api_key=${encodeURIComponent(REDACTED_VALUE)}&page=1&access_token=${encodeURIComponent(REDACTED_VALUE)}`
    );
  });
});

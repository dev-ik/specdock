import { describe, expect, it } from "vitest";
import { createDesktopWindowOptions } from "./window-options.js";

describe("desktop window options", () => {
  it("keeps the renderer isolated from Node.js APIs", () => {
    const options = createDesktopWindowOptions("/tmp/preload.js");

    expect(options.webPreferences).toMatchObject({
      preload: "/tmp/preload.js",
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    });
  });
});

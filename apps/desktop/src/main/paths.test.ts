import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { resolveDesktopPaths } from "./paths.js";

describe("desktop paths", () => {
  it("resolves repo, web dist, and preload paths from compiled main output", () => {
    const moduleUrl = pathToFileURL(
      "/repo/apps/desktop/dist/main/main.js"
    ).href;

    expect(resolveDesktopPaths(moduleUrl)).toEqual({
      preloadPath: "/repo/apps/desktop/dist/preload/preload.cjs",
      repoRoot: "/repo",
      webDistDir: "/repo/apps/desktop/dist/web"
    });
  });

  it("uses a file URL-compatible module path", () => {
    const paths = resolveDesktopPaths(import.meta.url);

    expect(fileURLToPath(pathToFileURL(paths.preloadPath))).toBe(
      paths.preloadPath
    );
  });
});

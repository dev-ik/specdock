import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type DesktopPaths = {
  preloadPath: string;
  repoRoot: string;
  webDistDir: string;
};

export function resolveDesktopPaths(
  moduleUrl = import.meta.url
): DesktopPaths {
  const moduleDir = dirname(fileURLToPath(moduleUrl));
  const desktopRoot = resolve(moduleDir, "..", "..");
  const repoRoot = resolve(desktopRoot, "..", "..");

  return {
    preloadPath: join(desktopRoot, "dist", "preload", "preload.cjs"),
    repoRoot,
    webDistDir: join(desktopRoot, "dist", "web")
  };
}

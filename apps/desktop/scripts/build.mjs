import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const desktopRoot = resolve(scriptDir, "..");
const repoRoot = resolve(desktopRoot, "..", "..");
const distDir = join(desktopRoot, "dist");
const webDistDir = join(repoRoot, "apps", "web", "dist");

rmSync(distDir, { force: true, recursive: true });
mkdirSync(distDir, { recursive: true });

const sharedOptions = {
  bundle: true,
  external: ["electron"],
  logLevel: "warning",
  platform: "node",
  sourcemap: true,
  target: "node20.19"
};

await build({
  ...sharedOptions,
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);'
  },
  entryPoints: [join(desktopRoot, "src", "main", "main.ts")],
  format: "esm",
  outfile: join(distDir, "main", "main.js")
});

await build({
  ...sharedOptions,
  entryPoints: [join(desktopRoot, "src", "preload", "preload.ts")],
  format: "cjs",
  outfile: join(distDir, "preload", "preload.cjs")
});

if (existsSync(webDistDir)) {
  cpSync(webDistDir, join(distDir, "web"), { recursive: true });
}

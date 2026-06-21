import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

const targetDir = resolve(process.argv[2] ?? "apps/desktop/release/desktop");
const outputFile = resolve(targetDir, "SHA256SUMS.txt");
const entries = readdirSync(targetDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name !== basename(outputFile))
  .map((entry) => join(targetDir, entry.name))
  .filter((filePath) => filePath !== outputFile)
  .map((filePath) => {
    const digest = createHash("sha256").update(readFileSync(filePath)).digest("hex");
    return `${digest}  ${basename(filePath)}`;
  })
  .sort();

if (entries.length === 0) {
  throw new Error(`No release files found in ${targetDir}`);
}

writeFileSync(outputFile, `${entries.join("\n")}\n`, "utf8");
console.log(`Wrote ${basename(outputFile)} with ${entries.length} entries.`);

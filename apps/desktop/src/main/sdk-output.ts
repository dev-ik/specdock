import { lstat, mkdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { createGeneratedOutputPlan } from "@specdock/generator";
import { defaultGenerateOptions, type GeneratedFile } from "@specdock/core";

export type DesktopSdkOutputResult =
  | { canceled: true }
  | {
      canceled: false;
      directoryPath: string;
      fileCount: number;
      totalBytes: number;
    };

export type DesktopSdkOutputSummary = {
  fileCount: number;
  totalBytes: number;
};

export async function writeSdkOutputDirectory({
  directoryPath,
  files,
  outputRoot,
  overwrite = false
}: {
  directoryPath: string;
  files: GeneratedFile[];
  outputRoot: string;
  overwrite?: boolean;
}): Promise<DesktopSdkOutputSummary> {
  const root = resolve(directoryPath);
  const plan = createGeneratedOutputPlan(files, {
    ...defaultGenerateOptions,
    outputPath: outputRoot
  });

  await mkdir(root, { recursive: true });

  for (const entry of plan.files) {
    const file = files.find((candidate) => candidate.path === entry.path);

    if (!file) {
      throw new Error("Generated output plan references a missing file.");
    }

    const target = resolve(root, entry.relativePath);
    assertWithinDirectory(root, target);
    await assertNoSymlinkParents(root, entry.relativePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, file.content, {
      encoding: "utf8",
      flag: overwrite ? "w" : "wx"
    });
  }

  return {
    fileCount: plan.fileCount,
    totalBytes: plan.totalBytes
  };
}

function assertWithinDirectory(root: string, target: string): void {
  const targetRelativeToRoot = relative(root, target);

  if (
    targetRelativeToRoot.startsWith("..") ||
    targetRelativeToRoot.includes(`..${sep}`) ||
    targetRelativeToRoot === "" ||
    /^[A-Za-z]:/.test(targetRelativeToRoot)
  ) {
    throw new Error("Generated SDK output escapes the selected directory.");
  }
}

async function assertNoSymlinkParents(
  root: string,
  relativePath: string
): Promise<void> {
  const segments = relativePath.split("/");
  let current = root;

  for (const segment of segments.slice(0, -1)) {
    current = join(current, segment);

    try {
      if ((await lstat(current)).isSymbolicLink()) {
        throw new Error("Generated SDK output parent path is a symlink.");
      }
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }

      throw error;
    }
  }
}

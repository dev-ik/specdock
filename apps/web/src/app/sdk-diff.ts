import type { GeneratedFile, GenerateOptions } from "@specdock/core";

export type GeneratedFileDiffStatus = "added" | "changed" | "removed" | "unchanged";

export type GeneratedFileManifestEntry = {
  path: string;
  hash: string;
};

export type GeneratedFileDiffEntry = {
  path: string;
  status: GeneratedFileDiffStatus;
  currentContent?: string;
  previousContent?: string;
};

export type GeneratedFilesDiff = {
  entries: GeneratedFileDiffEntry[];
  summary: Record<GeneratedFileDiffStatus, number>;
};

export type GeneratedFilesTarget = {
  language: GenerateOptions["language"];
};

export const generatedFilesTargetFromOptions = (
  options: GenerateOptions
): GeneratedFilesTarget => ({
  language: options.language
});

export const canDiffGeneratedFiles = (
  previousTarget: GeneratedFilesTarget | undefined,
  currentTarget: GeneratedFilesTarget
): boolean => {
  return previousTarget?.language === currentTarget.language;
};

export const createGeneratedFileManifest = (
  files: GeneratedFile[]
): GeneratedFileManifestEntry[] => {
  return files
    .map((file) => ({
      path: file.path,
      hash: stableHash(file.content)
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
};

export const diffGeneratedFiles = (
  previousFiles: GeneratedFile[],
  currentFiles: GeneratedFile[]
): GeneratedFilesDiff => {
  const previousByPath = mapFilesByPath(previousFiles);
  const currentByPath = mapFilesByPath(currentFiles);
  const paths = [...new Set([...previousByPath.keys(), ...currentByPath.keys()])].sort();
  const entries = paths.map((path): GeneratedFileDiffEntry => {
    const previous = previousByPath.get(path);
    const current = currentByPath.get(path);

    if (!previous && current) {
      return { path, status: "added", currentContent: current.content };
    }

    if (previous && !current) {
      return { path, status: "removed", previousContent: previous.content };
    }

    if (previous && current && previous.content !== current.content) {
      return {
        path,
        status: "changed",
        previousContent: previous.content,
        currentContent: current.content
      };
    }

    return {
      path,
      status: "unchanged",
      previousContent: previous?.content,
      currentContent: current?.content
    };
  });

  return {
    entries,
    summary: countEntries(entries)
  };
};

const mapFilesByPath = (files: GeneratedFile[]): Map<string, GeneratedFile> => {
  return new Map(files.map((file) => [file.path, file]));
};

const countEntries = (
  entries: GeneratedFileDiffEntry[]
): Record<GeneratedFileDiffStatus, number> => {
  return entries.reduce(
    (summary, entry) => ({
      ...summary,
      [entry.status]: summary[entry.status] + 1
    }),
    { added: 0, changed: 0, removed: 0, unchanged: 0 }
  );
};

const stableHash = (content: string): string => {
  let hash = 2166136261;

  for (let index = 0; index < content.length; index += 1) {
    hash ^= content.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
};

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  CURRENT_PROJECT_EXPORT_VERSION,
  CURRENT_REDACTION_POLICY_VERSION,
  PROJECT_EXPORT_FORMAT,
  parseProjectExport
} from "@specdock/core";

const PROJECT_FOLDER_FORMAT = "specdock.folder";
const PROJECT_FOLDER_VERSION = 1;
const PROJECT_MANIFEST_FILE = "specdock.project.json";
const PROJECT_SPEC_FILE = "openapi.json";

type ProjectFolderManifest = {
  format: typeof PROJECT_FOLDER_FORMAT;
  version: typeof PROJECT_FOLDER_VERSION;
  savedAt: string;
  project: {
    name: string;
    source: unknown;
    specFile: typeof PROJECT_SPEC_FILE;
    specFormat?: "openapi3" | "swagger2";
  };
  preferences: ReturnType<typeof parseProjectExport>["preferences"];
};

export type DesktopProjectFolderResult =
  | { canceled: true }
  | {
      canceled: false;
      content: string;
      directoryPath: string;
    };

export type DesktopSaveProjectFolderResult =
  | { canceled: true }
  | {
      canceled: false;
      directoryPath: string;
    };

export async function writeProjectFolder(
  directoryPath: string,
  exportContent: string,
  overwrite = false
): Promise<void> {
  const parsed = parseProjectExport(exportContent);
  const manifest: ProjectFolderManifest = {
    format: PROJECT_FOLDER_FORMAT,
    version: PROJECT_FOLDER_VERSION,
    savedAt: new Date().toISOString(),
    project: {
      name: parsed.project.name,
      source: parsed.project.source,
      specFile: PROJECT_SPEC_FILE,
      specFormat: parsed.project.specFormat
    },
    preferences: parsed.preferences
  };

  await mkdir(directoryPath, { recursive: true });
  await writeProjectFolderFile(
    join(directoryPath, PROJECT_MANIFEST_FILE),
    JSON.stringify(manifest, null, 2),
    overwrite
  );
  await writeProjectFolderFile(
    join(directoryPath, PROJECT_SPEC_FILE),
    JSON.stringify(parsed.project.spec, null, 2),
    overwrite
  );
}

export async function readProjectFolder(directoryPath: string): Promise<string> {
  const manifest = parseProjectFolderManifest(
    await readFile(join(directoryPath, PROJECT_MANIFEST_FILE), "utf8")
  );
  const spec = JSON.parse(
    await readFile(join(directoryPath, manifest.project.specFile), "utf8")
  ) as unknown;
  const exportContent = JSON.stringify({
    format: PROJECT_EXPORT_FORMAT,
    version: CURRENT_PROJECT_EXPORT_VERSION,
    exportedAt: manifest.savedAt,
    redactionPolicyVersion: CURRENT_REDACTION_POLICY_VERSION,
    project: {
      metadata: { name: manifest.project.name },
      source: manifest.project.source,
      specFormat: manifest.project.specFormat,
      spec
    },
    preferences: manifest.preferences
  });

  parseProjectExport(exportContent);
  return exportContent;
}

function parseProjectFolderManifest(text: string): ProjectFolderManifest {
  const manifest = JSON.parse(text) as Partial<ProjectFolderManifest>;

  if (
    manifest.format !== PROJECT_FOLDER_FORMAT ||
    manifest.version !== PROJECT_FOLDER_VERSION ||
    typeof manifest.savedAt !== "string" ||
    !manifest.project ||
    typeof manifest.project.name !== "string" ||
    manifest.project.specFile !== PROJECT_SPEC_FILE ||
    !manifest.preferences
  ) {
    throw new Error("Invalid SpecDock project folder manifest.");
  }

  return manifest as ProjectFolderManifest;
}

async function writeProjectFolderFile(
  filePath: string,
  content: string,
  overwrite: boolean
): Promise<void> {
  await writeFile(filePath, content, {
    encoding: "utf8",
    flag: overwrite ? "w" : "wx"
  });
}

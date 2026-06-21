import { readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";
import { parseProjectExport } from "@specdock/core";

const MAX_DESKTOP_PROJECT_BYTES = 5 * 1024 * 1024;

export type DesktopOpenProjectResult =
  | { canceled: true }
  | {
      canceled: false;
      content: string;
      filePath: string;
    };

export type DesktopSaveProjectResult =
  | { canceled: true }
  | {
      canceled: false;
      filePath: string;
    };

export async function readProjectExportFile(
  filePath: string
): Promise<string> {
  validateProjectExportPath(filePath);
  const content = await readFile(filePath, "utf8");
  validateProjectExportContent(content);
  return content;
}

export async function writeProjectExportFile(
  filePath: string,
  content: string
): Promise<void> {
  validateProjectExportPath(filePath);
  validateProjectExportContent(content);
  await writeFile(filePath, content, "utf8");
}

export function validateProjectExportPath(filePath: string): void {
  if (extname(filePath).toLowerCase() !== ".json") {
    throw new Error("SpecDock project export file must use a .json extension.");
  }
}

export function validateProjectExportContent(content: string): void {
  if (Buffer.byteLength(content, "utf8") > MAX_DESKTOP_PROJECT_BYTES) {
    throw new Error("SpecDock project export is too large.");
  }

  parseProjectExport(content);
}

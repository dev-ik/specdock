import electron from "electron/main";
import type { GeneratedFile } from "@specdock/core";
import {
  readProjectExportFile,
  writeProjectExportFile,
  type DesktopOpenProjectResult,
  type DesktopSaveProjectResult
} from "./desktop-files.js";
import {
  readProjectFolder,
  writeProjectFolder,
  type DesktopProjectFolderResult,
  type DesktopSaveProjectFolderResult
} from "./project-folder.js";
import {
  writeSdkOutputDirectory,
  type DesktopSdkOutputResult
} from "./sdk-output.js";

const { app, dialog, ipcMain } = electron;

export function registerIpcHandlers(getApiBaseUrl: () => string | undefined): void {
  ipcMain.handle("specdock:getInfo", () => ({
    apiBaseUrl: getApiBaseUrl(),
    version: app.getVersion()
  }));

  ipcMain.handle(
    "specdock:openProjectFile",
    async (): Promise<DesktopOpenProjectResult> => {
      const result = await dialog.showOpenDialog({
        filters: [{ name: "SpecDock project", extensions: ["json"] }],
        properties: ["openFile"]
      });
      const [filePath] = result.filePaths;

      if (result.canceled || !filePath) {
        return { canceled: true };
      }

      return {
        canceled: false,
        filePath,
        content: await readProjectExportFile(filePath)
      };
    }
  );

  ipcMain.handle(
    "specdock:saveProjectFile",
    async (_event, input: unknown): Promise<DesktopSaveProjectResult> => {
      const content = readString(input, "content", "SpecDock project export content is required.");
      const result = await dialog.showSaveDialog({
        defaultPath: readOptionalString(input, "defaultFileName") ?? "specdock-project.specdock.json",
        filters: [{ name: "SpecDock project", extensions: ["json"] }]
      });

      if (result.canceled || !result.filePath) {
        return { canceled: true };
      }

      await writeProjectExportFile(result.filePath, content);

      return {
        canceled: false,
        filePath: result.filePath
      };
    }
  );

  ipcMain.handle(
    "specdock:openProjectFolder",
    async (): Promise<DesktopProjectFolderResult> => {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"]
      });
      const [directoryPath] = result.filePaths;

      if (result.canceled || !directoryPath) {
        return { canceled: true };
      }

      return {
        canceled: false,
        directoryPath,
        content: await readProjectFolder(directoryPath)
      };
    }
  );

  ipcMain.handle(
    "specdock:saveProjectFolder",
    async (_event, input: unknown): Promise<DesktopSaveProjectFolderResult> => {
      const content = readString(input, "content", "SpecDock project export content is required.");
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory", "createDirectory"]
      });
      const [directoryPath] = result.filePaths;

      if (result.canceled || !directoryPath) {
        return { canceled: true };
      }

      await writeProjectFolder(directoryPath, content, readBoolean(input, "overwrite"));

      return {
        canceled: false,
        directoryPath
      };
    }
  );

  ipcMain.handle(
    "specdock:writeSdkOutput",
    async (_event, input: unknown): Promise<DesktopSdkOutputResult> => {
      const files = readGeneratedFiles(input);
      const outputRoot = readString(input, "outputRoot");
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory", "createDirectory"]
      });
      const [directoryPath] = result.filePaths;

      if (result.canceled || !directoryPath) {
        return { canceled: true };
      }

      const summary = await writeSdkOutputDirectory({
        directoryPath,
        files,
        outputRoot,
        overwrite: readBoolean(input, "overwrite")
      });

      return {
        canceled: false,
        directoryPath,
        ...summary
      };
    }
  );
}

function readGeneratedFiles(input: unknown): GeneratedFile[] {
  if (typeof input !== "object" || input === null || !("files" in input)) {
    throw new Error("Generated SDK files are required.");
  }

  if (!Array.isArray(input.files)) {
    throw new Error("Generated SDK files must be an array.");
  }

  return input.files.map((file) => {
    if (
      typeof file !== "object" ||
      file === null ||
      !("path" in file) ||
      !("content" in file) ||
      typeof file.path !== "string" ||
      typeof file.content !== "string"
    ) {
      throw new Error("Generated SDK file entries must include path and content.");
    }

    return {
      path: file.path,
      content: file.content
    };
  });
}

function readString(input: unknown, key: string, message?: string): string {
  const value = readOptionalString(input, key);

  if (value === undefined) {
    throw new Error(message ?? `Desktop IPC string field is required: ${key}.`);
  }

  return value;
}

function readOptionalString(input: unknown, key: string): string | undefined {
  if (
    typeof input !== "object" ||
    input === null ||
    !(key in input) ||
    typeof input[key as keyof typeof input] !== "string"
  ) {
    return undefined;
  }

  return input[key as keyof typeof input];
}

function readBoolean(input: unknown, key: string): boolean {
  return (
    typeof input === "object" &&
    input !== null &&
    key in input &&
    input[key as keyof typeof input] === true
  );
}

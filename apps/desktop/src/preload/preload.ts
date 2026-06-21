import { contextBridge, ipcRenderer } from "electron";

const desktopBridge = {
  getInfo: () => ipcRenderer.invoke("specdock:getInfo"),
  openProjectFile: () => ipcRenderer.invoke("specdock:openProjectFile"),
  openProjectFolder: () => ipcRenderer.invoke("specdock:openProjectFolder"),
  saveProjectFile: (defaultFileName: string, content: string) =>
    ipcRenderer.invoke("specdock:saveProjectFile", {
      content,
      defaultFileName
    }),
  saveProjectFolder: (content: string, overwrite = false) =>
    ipcRenderer.invoke("specdock:saveProjectFolder", {
      content,
      overwrite
    }),
  writeSdkOutput: (
    files: Array<{ path: string; content: string }>,
    outputRoot: string,
    overwrite = false
  ) =>
    ipcRenderer.invoke("specdock:writeSdkOutput", {
      files,
      outputRoot,
      overwrite
    })
};

contextBridge.exposeInMainWorld("specdockDesktop", desktopBridge);

export type SpecDockDesktopBridge = typeof desktopBridge;

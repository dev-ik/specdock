import type { BrowserWindowConstructorOptions } from "electron";

export function createDesktopWindowOptions(
  preloadPath: string
): BrowserWindowConstructorOptions {
  return {
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false
    }
  };
}

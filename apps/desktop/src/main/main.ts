import electron from "electron/main";
import { registerIpcHandlers } from "./ipc-handlers.js";
import { resolveDesktopPaths } from "./paths.js";
import { startDesktopApi, type DesktopApiProcess } from "./backend.js";
import { createDesktopWindowOptions } from "./window-options.js";

const { app, BrowserWindow } = electron;

let apiProcess: DesktopApiProcess | undefined;

async function createMainWindow(): Promise<void> {
  const paths = resolveDesktopPaths();

  apiProcess = await startDesktopApi({
    webDistDir: paths.webDistDir
  });

  const window = new BrowserWindow(
    createDesktopWindowOptions(paths.preloadPath)
  );

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(apiProcess?.baseUrl ?? "")) {
      event.preventDefault();
    }
  });
  window.once("ready-to-show", () => window.show());

  await window.loadURL(apiProcess.baseUrl);
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  apiProcess?.stop();
});

registerIpcHandlers(() => apiProcess?.baseUrl);
void app.whenReady().then(createMainWindow);

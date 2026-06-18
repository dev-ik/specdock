import { Moon, SlidersHorizontal, Sun } from "lucide-react";
import { useState } from "react";
import { SettingsDialog } from "./components/SettingsDialog.js";
import { WorkspaceColumns } from "./components/WorkspaceColumns.js";
import { WorkspaceJumpNav } from "./components/WorkspaceJumpNav.js";
import { type PanelId, usePanelLayout } from "./app/usePanelLayout.js";
import { useSpecDockController } from "./app/useSpecDockController.js";

export const App = () => {
  const app = useSpecDockController();
  const panelLayout = usePanelLayout();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const getPanelReorderProps = (panelId: PanelId) => ({
    isDragging: panelLayout.draggingPanelId === panelId,
    onDragStart: () => panelLayout.startDragging(panelId),
    onDragEnd: panelLayout.stopDragging,
    onDrop: (position: "before" | "after") => panelLayout.dropPanel(panelId, position),
    onMove: (direction: -1 | 1) => panelLayout.movePanel(panelId, direction)
  });

  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="min-w-0">
            <h1 className="app-title">SpecDock</h1>
            <p className="app-subtitle">API contract workspace</p>
          </div>
          <div className="app-header-actions">
            <div className="status-pill" title={app.status}>
              {app.status}
            </div>
            <button
              className="button button-ghost theme-toggle"
              type="button"
              aria-label={app.themeMode === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => app.setThemeMode((current) => current === "dark" ? "light" : "dark")}
            >
              {app.themeMode === "dark" ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
              <span>{app.themeMode === "dark" ? "Light" : "Dark"}</span>
            </button>
            <button
              className="button button-ghost theme-toggle"
              type="button"
              aria-label="Open settings"
              onClick={() => setIsSettingsOpen(true)}
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              <span>Settings</span>
            </button>
          </div>
        </div>
        <WorkspaceJumpNav />
      </header>

      <WorkspaceColumns
        app={app}
        layout={panelLayout.visibleLayout}
        getPanelReorderProps={getPanelReorderProps}
        onColumnDrop={panelLayout.dropPanelToColumn}
      />
      <SettingsDialog
        open={isSettingsOpen}
        activeProjectId={app.activeProject?.id}
        projectCount={app.projects.length}
        historyCount={app.historyCount}
        authProfiles={app.projectAuthProfiles}
        hiddenPanelIds={panelLayout.hiddenPanelIds}
        onClose={() => setIsSettingsOpen(false)}
        onClearHistory={app.clearRequestHistory}
        onPanelVisibilityChange={panelLayout.setPanelVisibility}
        onHiddenPanelsChange={panelLayout.setHiddenPanels}
        onAddAuthProfile={app.addAuthProfile}
        onUpdateAuthProfile={app.updateAuthProfile}
        onDeleteAuthProfile={app.deleteAuthProfile}
      />
    </main>
  );
};

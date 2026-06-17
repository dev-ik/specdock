import { Moon, SlidersHorizontal, Sun } from "lucide-react";
import { useState } from "react";
import { ExplorerPanel } from "./components/ExplorerPanel.js";
import { GeneratePanel } from "./components/GeneratePanel.js";
import { GeneratedFilesPanel } from "./components/GeneratedFilesPanel.js";
import { ProjectsImportPanel } from "./components/ProjectsImportPanel.js";
import { RequestPanel } from "./components/RequestPanel.js";
import { ResponsePanel } from "./components/ResponsePanel.js";
import { SettingsDialog } from "./components/SettingsDialog.js";
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

      <section className="workspace-grid">
        <ProjectsImportPanel
          projects={app.projects}
          activeProjectId={app.activeProjectId}
          specText={app.specText}
          urlInput={app.urlInput}
          curlInput={app.curlInput}
          isImportingUrl={app.isImportingUrl}
          onOpenProject={app.openProject}
          onCloseProject={app.closeProject}
          onDeleteProject={app.deleteProject}
          onSpecTextChange={app.setSpecTextAsRaw}
          onUrlInputChange={app.setUrlInput}
          onCurlInputChange={app.setCurlInput}
          onUrlImport={() => void app.importFromUrl()}
          onCurlImport={app.importCurl}
          onRawImport={app.importRawSpec}
          onUpload={app.uploadSpec}
          panelOrder={panelLayout.layout.import}
          getPanelReorderProps={getPanelReorderProps}
        />
        <ExplorerPanel
          operationCount={app.activeProject?.operations.length ?? 0}
          operationGroups={app.operationGroups}
          selectedOperation={app.selectedOperation}
          searchQuery={app.searchQuery}
          hasProject={Boolean(app.activeProject)}
          onSearchChange={app.setSearchQuery}
          onSelectOperation={app.setSelectedOperationId}
          panelOrder={panelLayout.layout.explorer}
          getPanelReorderProps={getPanelReorderProps}
        />
        <section className="panel-stack">
          {panelLayout.layout.workspace.map((panelId) => {
            if (panelId === "request") {
              return (
                <div key={panelId} id="request" className="scroll-target">
                  <RequestPanel
                    historyCount={app.historyCount}
                    activeProjectId={app.activeProject?.id}
                    operation={app.selectedOperation}
                    operationKey={app.operationKey}
                    requestState={app.requestState}
                    baseUrl={app.selectedBaseUrl}
                    curlPreview={app.curlPreview}
                    isExecuting={app.isExecuting}
                    onBaseUrlChange={app.updateProjectBaseUrl}
                    onRequestStateChange={app.updateRequestState}
                    onRecordFieldChange={app.updateRecordField}
                    onRecordFieldRename={app.renameRecordField}
                    onRecordFieldRemove={app.removeRecordField}
                    onAddHeader={app.addHeader}
                    onExecute={() => void app.executeRequest()}
                    reorder={getPanelReorderProps(panelId)}
                  />
                </div>
              );
            }

            if (panelId === "response") {
              return (
                <ResponsePanel
                  key={panelId}
                  exchange={app.displayedExchange}
                  context={app.displayedContext}
                  responseScope={app.responseScope}
                  onResponseScopeChange={app.setResponseScope}
                  onCopyText={(label, value) => void app.copyText(label, value)}
                  reorder={getPanelReorderProps(panelId)}
                />
              );
            }

            if (panelId === "generate") {
              return (
                <div key={panelId} id="generate" className="scroll-target">
                  <GeneratePanel
                    options={app.generateOptions}
                    meta={app.generateMeta}
                    fileCount={app.files.length}
                    isGenerating={app.isGenerating}
                    isDownloadingZip={app.isDownloadingZip}
                    onOptionsChange={app.updateGenerateOptions}
                    onGenerate={() => void app.generate()}
                    onDownloadZip={() => void app.downloadZip()}
                    reorder={getPanelReorderProps(panelId)}
                  />
                </div>
              );
            }

            return (
              <div key={panelId} id="generated-files" className="scroll-target">
                <GeneratedFilesPanel
                  files={app.files}
                  selectedFile={app.selectedFile}
                  onSelectPath={app.setSelectedPath}
                  reorder={getPanelReorderProps(panelId)}
                />
              </div>
            );
          })}
        </section>
      </section>
      <SettingsDialog
        open={isSettingsOpen}
        projectCount={app.projects.length}
        historyCount={app.historyCount}
        onClose={() => setIsSettingsOpen(false)}
        onClearHistory={app.clearRequestHistory}
      />
    </main>
  );
};

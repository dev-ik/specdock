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
import { useSpecDockController } from "./app/useSpecDockController.js";

export const App = () => {
  const app = useSpecDockController();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
          isImportingUrl={app.isImportingUrl}
          onOpenProject={app.openProject}
          onSpecTextChange={app.setSpecTextAsRaw}
          onUrlInputChange={app.setUrlInput}
          onUrlImport={() => void app.importFromUrl()}
          onRawImport={app.importRawSpec}
          onUpload={app.uploadSpec}
        />
        <ExplorerPanel
          operationCount={app.activeProject?.operations.length ?? 0}
          operationGroups={app.operationGroups}
          selectedOperation={app.selectedOperation}
          searchQuery={app.searchQuery}
          hasProject={Boolean(app.activeProject)}
          onSearchChange={app.setSearchQuery}
          onSelectOperation={app.setSelectedOperationId}
        />
        <section className="panel-stack">
          <div id="request" className="scroll-target">
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
              onAddHeader={app.addHeader}
              onExecute={() => void app.executeRequest()}
            />
          </div>
          <ResponsePanel
            exchange={app.displayedExchange}
            context={app.displayedContext}
            responseScope={app.responseScope}
            onResponseScopeChange={app.setResponseScope}
            onCopyText={(label, value) => void app.copyText(label, value)}
          />
          <div id="generate" className="scroll-target">
            <GeneratePanel
              options={app.generateOptions}
              meta={app.generateMeta}
              fileCount={app.files.length}
              isGenerating={app.isGenerating}
              isDownloadingZip={app.isDownloadingZip}
              onOptionsChange={app.updateGenerateOptions}
              onGenerate={() => void app.generate()}
              onDownloadZip={() => void app.downloadZip()}
            />
          </div>
          <div id="generated-files" className="scroll-target">
            <GeneratedFilesPanel
              files={app.files}
              selectedFile={app.selectedFile}
              onSelectPath={app.setSelectedPath}
            />
          </div>
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

import { useState } from "react";
import type React from "react";
import type { PanelColumnId, PanelId, PanelLayout } from "../app/usePanelLayout.js";
import type { useSpecDockController } from "../app/useSpecDockController.js";
import {
  type ExplorerPanelCardsProps,
  renderExplorerPanelCard
} from "./ExplorerPanelCards.js";
import {
  type ImportPanelCardsProps,
  renderImportPanelCard
} from "./ImportPanelCards.js";
import type { PanelReorderProps } from "./common.js";
import { renderWorkspacePanelCard } from "./WorkspacePanelCards.js";

type SpecDockController = ReturnType<typeof useSpecDockController>;

export const WorkspaceColumns = ({
  app,
  layout,
  getPanelReorderProps,
  onColumnDrop
}: {
  app: SpecDockController;
  layout: PanelLayout;
  getPanelReorderProps(panelId: PanelId): PanelReorderProps;
  onColumnDrop(columnId: PanelColumnId): void;
}) => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const importProps: ImportPanelCardsProps = {
    projects: app.projects,
    activeProjectId: app.activeProjectId,
    specText: app.specText,
    urlInput: app.urlInput,
    curlInput: app.curlInput,
    isImportingUrl: app.isImportingUrl,
    onOpenProject: app.openProject,
    onExportProject: app.exportProject,
    onDeleteProject: app.deleteProject,
    onSpecTextChange: app.setSpecTextAsRaw,
    onUrlInputChange: app.setUrlInput,
    onCurlInputChange: app.setCurlInput,
    onUrlImport: () => void app.importFromUrl(),
    onCurlImport: app.importCurl,
    onCurlAppend: app.appendCurlToActiveProject,
    onRawImport: app.importRawSpec,
    onUpload: app.uploadSpec,
    getPanelReorderProps
  };

  const explorerProps: ExplorerPanelCardsProps = {
    operationCount: app.activeProject?.operations.length ?? 0,
    projects: app.projects,
    activeProject: app.activeProject,
    operationGroups: app.operationGroups,
    qualityFindings: app.qualityFindings,
    contractDiffReport: app.contractDiffReport,
    requestBodyFields: app.requestBodyFields,
    selectedOperation: app.selectedOperation,
    searchQuery: app.searchQuery,
    hasProject: Boolean(app.activeProject),
    collapsedGroups,
    onSearchChange: app.setSearchQuery,
    onCompareContractDiff: app.compareContractDiff,
    onExportContractDiff: app.exportContractDiff,
    onSelectOperation: app.setSelectedOperationId,
    onCollapsedGroupsChange: setCollapsedGroups,
    getPanelReorderProps
  };

  const renderPanel = (panelId: PanelId) =>
    renderImportPanelCard(panelId, importProps) ??
    renderExplorerPanelCard(panelId, explorerProps) ??
    renderWorkspacePanelCard(panelId, { app, getPanelReorderProps });

  return (
    <section className="workspace-grid">
      <PanelStack columnId="import" element="aside" id="import" onColumnDrop={onColumnDrop}>
        {layout.import.map(renderPanel)}
      </PanelStack>
      <PanelStack columnId="explorer" id="endpoints" onColumnDrop={onColumnDrop}>
        {layout.explorer.map(renderPanel)}
      </PanelStack>
      <PanelStack columnId="workspace" onColumnDrop={onColumnDrop}>
        {layout.workspace.map(renderPanel)}
      </PanelStack>
    </section>
  );
};

const PanelStack = ({
  columnId,
  element = "section",
  id,
  onColumnDrop,
  children
}: {
  columnId: PanelColumnId;
  element?: "aside" | "section";
  id?: string;
  onColumnDrop(columnId: PanelColumnId): void;
  children: React.ReactNode;
}) => {
  const Tag = element;

  return (
    <Tag
      id={id}
      className="panel-stack scroll-target"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        onColumnDrop(columnId);
      }}
    >
      {children}
    </Tag>
  );
};

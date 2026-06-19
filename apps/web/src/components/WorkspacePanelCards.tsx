import type React from "react";
import type { PanelId } from "../app/usePanelLayout.js";
import type { useSpecDockController } from "../app/useSpecDockController.js";
import { GeneratePanel } from "./GeneratePanel.js";
import { GeneratedFilesPanel } from "./GeneratedFilesPanel.js";
import { MockServerPanel } from "./MockServerPanel.js";
import { RequestPanel } from "./RequestPanel.js";
import { ResponsePanel } from "./ResponsePanel.js";
import type { PanelReorderProps } from "./common.js";

type SpecDockController = ReturnType<typeof useSpecDockController>;

export type WorkspacePanelCardsProps = {
  app: SpecDockController;
  getPanelReorderProps(panelId: PanelId): PanelReorderProps;
};

export const renderWorkspacePanelCard = (
  panelId: PanelId,
  { app, getPanelReorderProps }: WorkspacePanelCardsProps
): React.ReactNode | undefined => {
  if (panelId === "request") {
    return (
      <div key={panelId} id="request" className="scroll-target">
        <RequestPanel
          historyCount={app.historyCount}
          activeProjectId={app.activeProject?.id}
          operation={app.selectedOperation}
          operationKey={app.operationKey}
          requestState={app.requestState}
          authProfiles={app.projectAuthProfiles}
          baseUrl={app.selectedBaseUrl}
          curlPreview={app.curlPreview}
          requestBodyExample={app.requestBodyExample}
          requestBodyFields={app.requestBodyFields}
          requestBodyFiles={app.requestBodyFiles}
          isExecuting={app.isExecuting}
          executionBlockReason={app.requestExecutionBlockReason}
          onBaseUrlChange={app.updateProjectBaseUrl}
          onRequestStateChange={app.updateRequestState}
          onRecordFieldChange={app.updateRecordField}
          onRecordFieldRename={app.renameRecordField}
          onRecordFieldRemove={app.removeRecordField}
          onAddHeader={app.addHeader}
          onFillRequestBodyExample={app.fillRequestBodyExample}
          onRequestBodyFileChange={app.updateRequestBodyFile}
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

  if (panelId === "mock-server") {
    return (
      <MockServerPanel
        key={panelId}
        project={app.activeProject}
        enabled={app.appConfig.mockServer.enabled}
        selectedOperationId={app.mockServerState.operationId}
        selectedStatusCode={app.mockServerState.statusCode}
        response={app.mockServerState.response}
        route={app.mockServerState.route}
        onStateChange={app.updateMockServerState}
        onGenerate={() => void app.runMockResponse()}
        onSaveRoute={() => void app.saveCurrentMockRoute()}
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
          canExportHttp={Boolean(app.activeProject)}
          isGenerating={app.isGenerating}
          isDownloadingZip={app.isDownloadingZip}
          onOptionsChange={app.updateGenerateOptions}
          onGenerate={() => void app.generate()}
          onExportHttp={app.exportHttpCollection}
          onDownloadZip={() => void app.downloadZip()}
          reorder={getPanelReorderProps(panelId)}
        />
      </div>
    );
  }

  if (panelId === "generated-files") {
    return (
      <div key={panelId} id="generated-files" className="scroll-target">
        <GeneratedFilesPanel
          files={app.files}
          selectedFile={app.selectedFile}
          selectedPath={app.selectedPath}
          diff={app.generatedDiff}
          onSelectPath={app.setSelectedPath}
          reorder={getPanelReorderProps(panelId)}
        />
      </div>
    );
  }

  return undefined;
};

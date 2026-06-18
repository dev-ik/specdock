import { ChevronRight, Search } from "lucide-react";
import type React from "react";
import type {
  ApiOperation,
  OpenApiDiffFinding,
  OpenApiQualityFinding,
  SchemaField
} from "@specdock/core";
import type { PanelId } from "../app/usePanelLayout.js";
import type { OperationGroup } from "../app/types.js";
import { EmptyState, MethodBadge, Panel, type PanelReorderProps } from "./common.js";
import { ContractDiffPanel } from "./ContractDiffPanel.js";
import { OperationFacts } from "./OperationFacts.js";
import { QualityPanel } from "./QualityPanel.js";

export type ExplorerPanelCardsProps = {
  operationCount: number;
  operationGroups: OperationGroup[];
  qualityFindings: OpenApiQualityFinding[];
  diffFindings: OpenApiDiffFinding[];
  comparisonProjectName?: string;
  requestBodyFields: SchemaField[];
  selectedOperation?: ApiOperation;
  searchQuery: string;
  hasProject: boolean;
  collapsedGroups: Record<string, boolean>;
  onSearchChange(value: string): void;
  onSelectOperation(operationId: string): void;
  onCollapsedGroupsChange(updater: (current: Record<string, boolean>) => Record<string, boolean>): void;
  getPanelReorderProps(panelId: PanelId): PanelReorderProps;
};

export const renderExplorerPanelCard = (
  panelId: PanelId,
  props: ExplorerPanelCardsProps
): React.ReactNode | undefined => {
  if (panelId === "quality") {
    return (
      <QualityPanel
        key={panelId}
        findings={props.qualityFindings}
        hasProject={props.hasProject}
        reorder={props.getPanelReorderProps(panelId)}
      />
    );
  }

  if (panelId === "contract-diff") {
    return (
      <ContractDiffPanel
        key={panelId}
        findings={props.diffFindings}
        hasComparison={Boolean(props.comparisonProjectName)}
        comparisonName={props.comparisonProjectName}
        reorder={props.getPanelReorderProps(panelId)}
      />
    );
  }

  if (panelId === "endpoints") return <EndpointsPanel key={panelId} {...props} />;
  if (panelId === "operation") return <OperationPanel key={panelId} {...props} />;

  return undefined;
};

const EndpointsPanel = ({
  operationCount,
  operationGroups,
  selectedOperation,
  searchQuery,
  hasProject,
  collapsedGroups,
  onSearchChange,
  onSelectOperation,
  onCollapsedGroupsChange,
  getPanelReorderProps
}: ExplorerPanelCardsProps) => (
  <Panel
    title="Endpoints"
    panelId="endpoints"
    reorder={getPanelReorderProps("endpoints")}
    action={<span className="meta-text">{operationCount} operations</span>}
  >
    <div className="panel-toolbar">
      <div className="search-field">
        <Search size={16} aria-hidden="true" />
        <input
          className="min-w-0 flex-1 bg-transparent outline-none"
          placeholder="Search endpoints"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </div>
    <div className="endpoint-scroll">
      {!hasProject ? (
        <EmptyState>Import a spec to browse endpoints</EmptyState>
      ) : operationGroups.length === 0 ? (
        <EmptyState>No endpoints match search</EmptyState>
      ) : (
        operationGroups.map(([tag, operations]) => {
          const isOpen = Boolean(searchQuery.trim()) || !collapsedGroups[tag];

          return (
            <div key={tag} className="endpoint-group">
              <button
                className="endpoint-group-toggle"
                type="button"
                aria-expanded={isOpen}
                onClick={() =>
                  onCollapsedGroupsChange((current) => ({
                    ...current,
                    [tag]: !current[tag]
                  }))
                }
              >
                <ChevronRight className={isOpen ? "is-open" : ""} size={16} aria-hidden="true" />
                <span className="endpoint-group-title">{tag}</span>
                <span className="endpoint-group-count">{operations.length}</span>
              </button>
              {isOpen ? (
                <div className="endpoint-items">
                  {operations.map((operation) => (
                    <button
                      key={`${tag}-${operation.id}`}
                      className={`endpoint-item ${selectedOperation?.id === operation.id ? "is-active" : ""}`}
                      type="button"
                      title={`${operation.method} ${operation.path}`}
                      onClick={() => onSelectOperation(operation.id)}
                    >
                      <span className="endpoint-main">
                        <MethodBadge method={operation.method} />
                        <span className="endpoint-path">{operation.path}</span>
                      </span>
                      <span className="endpoint-summary">
                        {operation.operationId ?? operation.summary ?? operation.id}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  </Panel>
);

const OperationPanel = ({
  selectedOperation,
  requestBodyFields,
  getPanelReorderProps
}: ExplorerPanelCardsProps) => (
  <Panel title="Operation" panelId="operation" reorder={getPanelReorderProps("operation")}>
    {selectedOperation ? (
      <div className="panel-body">
        <div>
          <div className="operation-route">
            <MethodBadge method={selectedOperation.method} />
            <span>{selectedOperation.path}</span>
          </div>
          <div className="operation-summary">{selectedOperation.summary ?? "No summary"}</div>
          {selectedOperation.description ? (
            <p className="operation-description">{selectedOperation.description}</p>
          ) : null}
        </div>
        <OperationFacts operation={selectedOperation} requestBodyFields={requestBodyFields} />
      </div>
    ) : (
      <EmptyState>Select an endpoint</EmptyState>
    )}
  </Panel>
);

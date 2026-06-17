import { Search } from "lucide-react";
import type { ApiOperation } from "@specdock/core";
import type { OperationGroup } from "../app/types.js";
import { EmptyState, MethodBadge, Panel } from "./common.js";
import { OperationFacts } from "./OperationFacts.js";

export const ExplorerPanel = ({
  operationCount,
  operationGroups,
  selectedOperation,
  searchQuery,
  hasProject,
  onSearchChange,
  onSelectOperation
}: {
  operationCount: number;
  operationGroups: OperationGroup[];
  selectedOperation?: ApiOperation;
  searchQuery: string;
  hasProject: boolean;
  onSearchChange(value: string): void;
  onSelectOperation(operationId: string): void;
}) => (
  <section id="endpoints" className="panel-stack scroll-target">
    <Panel title="Endpoints" action={<span className="meta-text">{operationCount} operations</span>}>
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
          operationGroups.map(([tag, operations]) => (
            <div key={tag} className="endpoint-group">
              <div className="endpoint-group-title">{tag}</div>
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
            </div>
          ))
        )}
      </div>
    </Panel>

    <Panel title="Operation">
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
          <OperationFacts operation={selectedOperation} />
        </div>
      ) : (
        <EmptyState>Select an endpoint</EmptyState>
      )}
    </Panel>
  </section>
);

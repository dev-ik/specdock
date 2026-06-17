import { Copy, Play } from "lucide-react";
import type { ApiOperation, RequestState } from "@specdock/core";
import { EmptyState, Panel } from "./common.js";
import { RequestFields } from "./RequestFields.js";

export const RequestPanel = ({
  historyCount,
  activeProjectId,
  operation,
  operationKey,
  requestState,
  baseUrl,
  curlPreview,
  isExecuting,
  onBaseUrlChange,
  onRequestStateChange,
  onRecordFieldChange,
  onRecordFieldRename,
  onAddHeader,
  onExecute
}: {
  historyCount: number;
  activeProjectId?: string;
  operation?: ApiOperation;
  operationKey?: string;
  requestState?: RequestState;
  baseUrl: string;
  curlPreview: string;
  isExecuting: boolean;
  onBaseUrlChange(projectId: string, value: string): void;
  onRequestStateChange(operationKey: string, operation: ApiOperation, patch: Partial<RequestState>): void;
  onRecordFieldChange(section: "pathParams" | "queryParams" | "headers", name: string, value: string): void;
  onRecordFieldRename(section: "pathParams" | "queryParams" | "headers", oldName: string, newName: string): void;
  onAddHeader(): void;
  onExecute(): void;
}) => (
  <Panel title="Request" action={<span className="meta-text">{historyCount} history items</span>}>
    {activeProjectId && operation && operationKey && requestState ? (
      <div className="panel-body">
        <div className="request-topline">
          <label className="block">
            <span className="field-label">Base URL</span>
            <input
              className="field w-full"
              value={baseUrl}
              onChange={(event) => onBaseUrlChange(activeProjectId, event.target.value)}
            />
          </label>
          <div>
            <span className="field-label">Mode</span>
            <div className="segmented-control">
              {(["direct", "proxy"] as const).map((mode) => (
                <button
                  key={mode}
                  className={requestState.requestMode === mode ? "is-active" : ""}
                  type="button"
                  onClick={() => onRequestStateChange(operationKey, operation, { requestMode: mode })}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        <RequestFields
          title="Path params"
          values={requestState.pathParams}
          onChange={(name, value) => onRecordFieldChange("pathParams", name, value)}
        />
        <RequestFields
          title="Query params"
          values={requestState.queryParams}
          onChange={(name, value) => onRecordFieldChange("queryParams", name, value)}
        />
        <RequestFields
          title="Headers"
          values={requestState.headers}
          onChange={(name, value) => onRecordFieldChange("headers", name, value)}
          onRename={(oldName, newName) => onRecordFieldRename("headers", oldName, newName)}
          onAdd={onAddHeader}
        />

        {operation.requestBody ? (
          <label className="block">
            <span className="field-label">JSON body</span>
            <textarea
              className="field code-field min-h-28"
              value={requestState.body ?? ""}
              onChange={(event) => onRequestStateChange(operationKey, operation, { body: event.target.value })}
            />
          </label>
        ) : null}

        <div className="notice">
          Auth Profiles are coming later. Add Authorization or API key headers manually for now.
        </div>

        <div>
          <div className="section-label-row">
            <span className="field-label">cURL</span>
            <button
              className="button button-small button-secondary"
              type="button"
              onClick={() => void navigator.clipboard.writeText(curlPreview)}
            >
              <Copy size={14} aria-hidden="true" />
              Copy
            </button>
          </div>
          <pre className="code-block code-block-compact">
            <code>{curlPreview || "Complete request fields to generate cURL."}</code>
          </pre>
        </div>

        <div className="request-actions">
          <button className="button button-primary" type="button" disabled={isExecuting} onClick={onExecute}>
            <Play size={16} aria-hidden="true" />
            Send
          </button>
        </div>
      </div>
    ) : (
      <EmptyState>Select an endpoint to build a request</EmptyState>
    )}
  </Panel>
);

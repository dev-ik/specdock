import { Copy, Play, WandSparkles } from "lucide-react";
import type { ApiOperation, AuthProfile, RequestState, SchemaField } from "@specdock/core";
import {
  requestBodyFieldValues,
  requestBodyTitle,
  updateRequestBodyField
} from "../request-body-fields.js";
import { requestParameterMeta } from "../request-parameter-meta.js";
import { EmptyState, Panel, type PanelReorderProps } from "./common.js";
import { RequestBodyFields } from "./RequestBodyFields.js";
import { RequestFields } from "./RequestFields.js";

export const RequestPanel = ({
  historyCount,
  activeProjectId,
  operation,
  operationKey,
  requestState,
  authProfiles,
  baseUrl,
  curlPreview,
  requestBodyExample,
  requestBodyFields,
  isExecuting,
  executionBlockReason,
  onBaseUrlChange,
  onRequestStateChange,
  onRecordFieldChange,
  onRecordFieldRename,
  onRecordFieldRemove,
  onAddHeader,
  onFillRequestBodyExample,
  onExecute,
  reorder
}: {
  historyCount: number;
  activeProjectId?: string;
  operation?: ApiOperation;
  operationKey?: string;
  requestState?: RequestState;
  authProfiles: AuthProfile[];
  baseUrl: string;
  curlPreview: string;
  requestBodyExample?: string;
  requestBodyFields: SchemaField[];
  isExecuting: boolean;
  executionBlockReason?: string;
  onBaseUrlChange(projectId: string, value: string): void;
  onRequestStateChange(operationKey: string, operation: ApiOperation, patch: Partial<RequestState>): void;
  onRecordFieldChange(section: "pathParams" | "queryParams" | "headers", name: string, value: string): void;
  onRecordFieldRename(section: "pathParams" | "queryParams" | "headers", oldName: string, newName: string): void;
  onRecordFieldRemove(section: "pathParams" | "queryParams" | "headers", name: string): void;
  onAddHeader(): void;
  onFillRequestBodyExample(): void;
  onExecute(): void;
  reorder?: PanelReorderProps;
}) => {
  const bodyTitle = operation ? requestBodyTitle(operation) : "JSON body";
  const bodyFieldValues =
    operation && requestState
      ? requestBodyFieldValues(operation, requestState.body, requestBodyFields)
      : {};
  const pathParamMeta = operation ? requestParameterMeta(operation, "path") : {};
  const queryParamMeta = operation ? requestParameterMeta(operation, "query") : {};
  const headerParamMeta = operation ? requestParameterMeta(operation, "header") : {};
  const hasRequestBodyFields = requestBodyFields.length > 0;

  return (
  <Panel
    title="Request"
    panelId="request"
    reorder={reorder}
    action={<span className="meta-text">{historyCount} history items</span>}
  >
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
            <span className="field-label">Auth</span>
            <select
              className="field w-full"
              value={
                authProfiles.some((profile) => profile.id === requestState.authProfileId)
                  ? requestState.authProfileId
                  : ""
              }
              onChange={(event) =>
                onRequestStateChange(operationKey, operation, {
                  authProfileId: event.target.value || undefined
                })
              }
            >
              <option value="">No auth</option>
              {authProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
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
          metadata={pathParamMeta}
          onChange={(name, value) => onRecordFieldChange("pathParams", name, value)}
        />
        <RequestFields
          title="Query params"
          values={requestState.queryParams}
          metadata={queryParamMeta}
          onChange={(name, value) => onRecordFieldChange("queryParams", name, value)}
        />
        <RequestFields
          title="Headers"
          values={requestState.headers}
          metadata={headerParamMeta}
          onChange={(name, value) => onRecordFieldChange("headers", name, value)}
          onRename={(oldName, newName) => onRecordFieldRename("headers", oldName, newName)}
          onRemove={(name) => onRecordFieldRemove("headers", name)}
          onAdd={onAddHeader}
        />

        {requestState.body !== undefined ? (
          <div className="block">
            <div className="section-label-row">
              <span className="field-label">{bodyTitle}</span>
              {!hasRequestBodyFields ? (
                <button
                  className="button button-small button-secondary"
                  type="button"
                  disabled={!requestBodyExample}
                  title={requestBodyExample ? "Fill request body example" : "No request body example available"}
                  onClick={onFillRequestBodyExample}
                >
                  <WandSparkles size={14} aria-hidden="true" />
                  Fill body example
                </button>
              ) : null}
            </div>
            <RequestBodyFields
              fields={requestBodyFields}
              values={bodyFieldValues}
              onChange={(field, value) =>
                onRequestStateChange(operationKey, operation, {
                  body: updateRequestBodyField(operation, requestState.body, field, value)
                })
              }
            />
            <textarea
              aria-label={bodyTitle}
              className={`field code-field min-h-28 ${hasRequestBodyFields ? "body-editor-with-fields" : ""}`}
              value={requestState.body ?? ""}
              onChange={(event) => onRequestStateChange(operationKey, operation, { body: event.target.value })}
            />
          </div>
        ) : (
          <div>
            <div className="section-label-row">
              <span className="field-label">Request body</span>
              <button className="button button-small button-secondary" type="button" disabled>
                <WandSparkles size={14} aria-hidden="true" />
                No body example
              </button>
            </div>
            <div className="empty-field">This operation does not define a request body</div>
          </div>
        )}

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
          {executionBlockReason ? (
            <div className="empty-field">{executionBlockReason}</div>
          ) : null}
          <button
            className="button button-primary"
            type="button"
            disabled={isExecuting || Boolean(executionBlockReason)}
            title={executionBlockReason}
            onClick={onExecute}
          >
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
};

import { Copy, Play } from "lucide-react";
import type { MockResponseResult, MockRouteSummary, OpenApiProject } from "@specdock/core";
import { EmptyState, MethodBadge, Panel, type PanelReorderProps } from "./common.js";

export const MockServerPanel = ({
  project,
  enabled,
  selectedOperationId,
  selectedStatusCode,
  response,
  route,
  onStateChange,
  onGenerate,
  onSaveRoute,
  onCopyText,
  reorder
}: {
  project?: OpenApiProject;
  enabled: boolean;
  selectedOperationId?: string;
  selectedStatusCode?: string;
  response?: MockResponseResult;
  route?: MockRouteSummary;
  onStateChange(patch: {
    operationId?: string;
    statusCode?: string;
    response?: MockResponseResult;
    route?: undefined;
  }): void;
  onGenerate(): void;
  onSaveRoute(): void;
  onCopyText(label: string, value: string): void;
  reorder?: PanelReorderProps;
}) => {
  const operation =
    project?.operations.find((candidate) => candidate.id === selectedOperationId) ??
    project?.operations[0];
  const statusCodes = uniqueStatusCodes([
    ...(operation?.responses.map((candidate) => candidate.statusCode) ?? []),
    "400",
    "403",
    "500"
  ]);
  const liveUrl = route ? new URL(route.url, window.location.origin).href : "";
  const liveCurl = route
    ? `curl -i -sS -X ${route.method} '${escapeSingleQuoted(liveUrl)}'`
    : "";

  return (
    <Panel
      title="Mock server"
      panelId="mock-server"
      reorder={reorder}
      action={<span className="meta-text">{enabled ? "enabled" : "disabled"}</span>}
    >
      {!project ? (
        <EmptyState>Import a spec to generate mock responses</EmptyState>
      ) : !enabled ? (
        <EmptyState>Mock server is disabled for this deployment</EmptyState>
      ) : (
        <div className="panel-body">
          <div className="request-topline">
            <label className="block">
              <span className="field-label">Endpoint</span>
              <select
                className="field w-full"
                value={operation?.id ?? ""}
                onChange={(event) =>
                  onStateChange({
                    operationId: event.target.value,
                    statusCode: undefined
                  })
                }
              >
                {project.operations.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.method} {candidate.path}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="field-label">Status</span>
              <select
                className="field w-full"
                value={selectedStatusCode ?? ""}
                onChange={(event) =>
                  onStateChange({
                    statusCode: event.target.value || undefined
                  })
                }
              >
                <option value="">First 2xx</option>
                {statusCodes.map((statusCode) => (
                  <option key={statusCode} value={statusCode}>
                    {statusCode}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {operation ? (
            <div className="operation-route">
              <MethodBadge method={operation.method} />
              <span>{operation.path}</span>
            </div>
          ) : null}

          <div className="request-actions">
            <button className="button button-primary" type="button" onClick={onGenerate}>
              <Play size={16} aria-hidden="true" />
              Generate mock
            </button>
            <button className="button button-secondary" type="button" disabled={!response} onClick={() => onCopyText("Mock response body", response?.body ?? "")}>
              <Copy size={14} aria-hidden="true" />
              Body
            </button>
            <button className="button button-secondary" type="button" disabled={!liveCurl} onClick={() => onCopyText("Mock route cURL", liveCurl)}>
              <Copy size={14} aria-hidden="true" />
              cURL
            </button>
            <button className="button button-secondary" type="button" disabled={!response} onClick={onSaveRoute}>
              Save route
            </button>
          </div>

          {route ? (
            <div className="empty-field mock-live-url">
              <div className="mock-live-url-content">
                <span>Live URL</span>
                <code>{liveUrl}</code>
              </div>
              <div className="mock-live-url-actions">
                <button className="button button-small button-secondary" type="button" onClick={() => onCopyText("Mock URL", liveUrl)}>
                  <Copy size={14} aria-hidden="true" />
                  Copy URL
                </button>
              </div>
            </div>
          ) : null}

          {response ? (
            <label className="block">
              <span className="field-label">Response body</span>
              <textarea
                className="field code-textarea"
                value={response.body}
                placeholder="Empty response body"
                rows={6}
                onChange={(event) =>
                  onStateChange({
                    response: {
                      ...response,
                      body: event.target.value
                    },
                    route: undefined
                  })
                }
              />
            </label>
          ) : null}

          <pre className="code-block code-block-compact">
            <code>{response ? JSON.stringify(response, null, 2) : "Generate a mock response to preview the envelope."}</code>
          </pre>
        </div>
      )}
    </Panel>
  );
};

const escapeSingleQuoted = (value: string): string =>
  value.replaceAll("'", "'\\''");

const uniqueStatusCodes = (statusCodes: string[]): string[] =>
  [...new Set(statusCodes)];

import { Copy } from "lucide-react";
import type { ExchangeContext, ResponseScope, StoredExchange } from "../app/types.js";
import { formatDateTime } from "../app/request-utils.js";
import { EmptyState, MethodBadge, Panel, type PanelReorderProps } from "./common.js";

export const ResponsePanel = ({
  exchange,
  context,
  responseScope,
  onResponseScopeChange,
  onCopyText,
  reorder
}: {
  exchange?: StoredExchange;
  context?: ExchangeContext;
  responseScope: ResponseScope;
  onResponseScopeChange(scope: ResponseScope): void;
  onCopyText(label: string, value: string): void;
  reorder?: PanelReorderProps;
}) => (
  <Panel
    title="Response"
    panelId="response"
    reorder={reorder}
    action={
      <div className="segmented-control response-scope-toggle" aria-label="Response scope">
        {(["operation", "latest"] as const).map((scope) => (
          <button
            key={scope}
            className={responseScope === scope ? "is-active" : ""}
            type="button"
            onClick={() => onResponseScopeChange(scope)}
          >
            {scope === "operation" ? "Endpoint" : "Latest"}
          </button>
        ))}
      </div>
    }
  >
    {exchange ? (
      <div className="panel-body">
        <div className="exchange-context">
          <span className="field-label">Saved exchange</span>
          <div className="exchange-title">{context?.operationLabel}</div>
          <div className="exchange-meta">
            {context?.projectName} - {formatDateTime(exchange.createdAt)}
          </div>
        </div>

        <ExchangeRequest exchange={exchange} onCopyText={onCopyText} />
        <ExchangeResponse exchange={exchange} onCopyText={onCopyText} />
      </div>
    ) : (
      <EmptyState>
        {responseScope === "operation"
          ? "Run this endpoint to inspect its saved request and response"
          : "Run a request to inspect the latest saved exchange"}
      </EmptyState>
    )}
  </Panel>
);

const ExchangeRequest = ({
  exchange,
  onCopyText
}: {
  exchange: StoredExchange;
  onCopyText(label: string, value: string): void;
}) => (
  <>
    <div>
      <div className="section-label-row">
        <span className="field-label">Request</span>
        <CopyButton label="Copy URL" onClick={() => onCopyText("Request URL", exchange.request.url)} />
      </div>
      <div className="request-line">
        <MethodBadge method={exchange.request.method} />
        <span>{exchange.request.url}</span>
      </div>
    </div>
    <JsonDetails
      title="Request headers"
      value={exchange.request.headers}
      onCopy={() => onCopyText("Request headers", JSON.stringify(exchange.request.headers, null, 2))}
    />
    {exchange.request.body ? (
      <CodeBlock
        title="Request body"
        value={exchange.request.body}
        onCopy={() => onCopyText("Request body", exchange.request.body ?? "")}
      />
    ) : null}
  </>
);

const ExchangeResponse = ({
  exchange,
  onCopyText
}: {
  exchange: StoredExchange;
  onCopyText(label: string, value: string): void;
}) => (
  <>
    <div className="response-meta">
      <span className="response-status">
        {exchange.response.status || "ERR"} {exchange.response.statusText}
      </span>
      <span>{exchange.response.durationMs} ms</span>
      {exchange.response.contentType ? <span>{exchange.response.contentType}</span> : null}
    </div>
    <JsonDetails
      title="Response headers"
      value={exchange.response.headers}
      onCopy={() => onCopyText("Response headers", JSON.stringify(exchange.response.headers, null, 2))}
    />
    <CodeBlock
      title="Response body"
      value={exchange.response.body}
      onCopy={() => onCopyText("Response body", exchange.response.body)}
      className="response-body"
    />
  </>
);

const JsonDetails = ({ title, value, onCopy }: { title: string; value: unknown; onCopy(): void }) => (
  <>
    <div className="section-label-row">
      <span className="field-label">{title}</span>
      <CopyButton label="Copy" onClick={onCopy} />
    </div>
    <details className="details-card">
      <summary>{title}</summary>
      <pre className="mt-3 overflow-auto text-xs">
        <code>{JSON.stringify(value, null, 2)}</code>
      </pre>
    </details>
  </>
);

const CodeBlock = ({
  title,
  value,
  onCopy,
  className = "code-block-compact"
}: {
  title: string;
  value: string;
  onCopy(): void;
  className?: string;
}) => (
  <div>
    <div className="section-label-row">
      <span className="field-label">{title}</span>
      <CopyButton label="Copy" onClick={onCopy} />
    </div>
    <pre className={`code-block ${className}`}>
      <code>{value}</code>
    </pre>
  </div>
);

const CopyButton = ({ label, onClick }: { label: string; onClick(): void }) => (
  <button className="button button-small button-secondary" type="button" onClick={onClick}>
    <Copy size={14} aria-hidden="true" />
    {label}
  </button>
);

import { Trash2 } from "lucide-react";
import type { RequestFieldMeta } from "../request-parameter-meta.js";

export const RequestFields = ({
  title,
  values,
  metadata = {},
  onChange,
  onRename,
  onRemove,
  onAdd
}: {
  title: string;
  values: Record<string, string>;
  metadata?: Record<string, RequestFieldMeta>;
  onChange(name: string, value: string): void;
  onRename?: (oldName: string, newName: string) => void;
  onRemove?: (name: string) => void;
  onAdd?: () => void;
}) => (
  <div>
    <div className="section-label-row">
      <span className="field-label">{title}</span>
      {onAdd ? (
        <button className="button button-small button-secondary" type="button" onClick={onAdd}>
          Add
        </button>
      ) : null}
    </div>
    {Object.keys(values).length === 0 ? (
      <div className="empty-field">None</div>
    ) : (
      <div className="field-list">
        {Object.entries(values).map(([name, value]) => {
          const meta = metadata[name];

          return (
            <div key={name} className={`request-field-row ${onRemove ? "has-remove" : ""}`}>
              {onRename ? (
                <span className="request-field-name-cell">
                  <input
                    className="field field-name"
                    defaultValue={name}
                    onBlur={(event) => onRename(name, event.target.value)}
                  />
                  {meta?.type || meta?.required || meta?.description ? (
                    <span>
                      <span className="request-field-title">
                        {meta.type ? <span className="schema-type">{meta.type}</span> : null}
                        {meta.required ? <span className="required-label">required</span> : null}
                      </span>
                      {meta.description ? (
                        <span className="schema-input-description">{meta.description}</span>
                      ) : null}
                    </span>
                  ) : null}
                </span>
              ) : (
                <span className="field-name-readonly">
                  <span className="request-field-title">
                    <span>{name}</span>
                    {meta?.type ? <span className="schema-type">{meta.type}</span> : null}
                    {meta?.required ? <span className="required-label">required</span> : null}
                  </span>
                  {meta?.description ? (
                    <span className="schema-input-description">{meta.description}</span>
                  ) : null}
                </span>
              )}
              <input
                className="field"
                value={value}
                onChange={(event) => onChange(name, event.target.value)}
              />
              {onRemove ? (
                <button
                  className="field-remove-button"
                  type="button"
                  aria-label={`Remove ${name}`}
                  title={`Remove ${name}`}
                  onClick={() => onRemove(name)}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    )}
  </div>
);

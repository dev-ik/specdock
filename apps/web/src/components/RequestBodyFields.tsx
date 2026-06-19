import type { SchemaField } from "@specdock/core";

export const RequestBodyFields = ({
  fields,
  values,
  fileValues = {},
  onFileChange,
  onChange
}: {
  fields: SchemaField[];
  values: Record<string, string>;
  fileValues?: Record<string, File>;
  onFileChange?: (field: SchemaField, file: File | undefined) => void;
  onChange(field: SchemaField, value: string): void;
}) => {
  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="schema-input-list">
      {fields.map((field) => (
        <label key={field.name} className="schema-input-row">
          <span>
            <span className="schema-input-heading">
              <span className="schema-input-name">{field.name}</span>
              <span className="schema-type">{field.type}</span>
              {field.required ? <span className="required-label">required</span> : null}
            </span>
            {field.description ? (
              <span className="schema-input-description">{field.description}</span>
            ) : null}
          </span>
          {field.type === "string:binary" ? (
            <input
              className="field"
              type="file"
              onChange={(event) => onFileChange?.(field, event.currentTarget.files?.[0])}
            />
          ) : field.enumValues?.length ? (
            <select
              className="field"
              value={values[field.name] ?? ""}
              onChange={(event) => onChange(field, event.target.value)}
            >
              <option value="">Select value</option>
              {field.enumValues.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          ) : field.type === "boolean" ? (
            <input
              checked={values[field.name] === "true"}
              type="checkbox"
              onChange={(event) => onChange(field, String(event.target.checked))}
            />
          ) : (
            <input
              className="field"
              type={field.type === "number" || field.type.startsWith("integer") ? "number" : "text"}
              value={values[field.name] ?? ""}
              onChange={(event) => onChange(field, event.target.value)}
            />
          )}
          {field.type === "string:binary" && fileValues[field.name] ? (
            <span className="field-hint">{fileValues[field.name]?.name}</span>
          ) : null}
        </label>
      ))}
    </div>
  );
};

import type { SchemaField } from "@specdock/core";

export const SchemaFieldsSummary = ({
  fields
}: {
  fields: SchemaField[];
}) => {
  if (fields.length === 0) {
    return <div className="empty-inline">No schema fields</div>;
  }

  return (
    <div className="schema-field-list">
      {fields.map((field) => (
        <div key={field.name} className="schema-field-card">
          <div className="schema-field-title">
            <span>{field.name}</span>
            <span className="schema-type">{field.type}</span>
            {field.required ? <span className="required-label">required</span> : null}
          </div>
          {field.description ? (
            <div className="schema-field-description">{field.description}</div>
          ) : null}
          {field.enumValues?.length ? (
            <div className="schema-field-description">
              Values: {field.enumValues.join(", ")}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

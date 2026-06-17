export const RequestFields = ({
  title,
  values,
  onChange,
  onRename,
  onAdd
}: {
  title: string;
  values: Record<string, string>;
  onChange(name: string, value: string): void;
  onRename?: (oldName: string, newName: string) => void;
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
        {Object.entries(values).map(([name, value]) => (
          <label key={name} className="request-field-row">
            {onRename ? (
              <input
                className="field field-name"
                defaultValue={name}
                onBlur={(event) => onRename(name, event.target.value)}
              />
            ) : (
              <span className="field-name-readonly">{name}</span>
            )}
            <input
              className="field"
              value={value}
              onChange={(event) => onChange(name, event.target.value)}
            />
          </label>
        ))}
      </div>
    )}
  </div>
);

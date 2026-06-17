import type { ApiOperation } from "@specdock/core";

export const OperationFacts = ({ operation }: { operation: ApiOperation }) => {
  const parametersByType = ["path", "query", "header"].map((type) => ({
    type,
    parameters: operation.parameters.filter((parameter) => parameter.in === type)
  }));

  return (
    <div className="operation-facts">
      {parametersByType.map(({ type, parameters }) => (
        <div key={type}>
          <div className="fact-label">{type} params</div>
          {parameters.length === 0 ? (
            <div className="empty-inline">None</div>
          ) : (
            <div className="fact-list">
              {parameters.map((parameter) => (
                <div key={`${type}-${parameter.name}`} className="fact-chip">
                  <span>{parameter.name}</span>
                  {parameter.required ? <span className="required-label">required</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div>
        <div className="fact-label">Request body</div>
        <div className="fact-text">
          {operation.requestBody?.content.map((content) => content.contentType).join(", ") || "None"}
        </div>
      </div>
      <div>
        <div className="fact-label">Responses</div>
        <div className="response-chips">
          {operation.responses.map((response) => (
            <span key={response.statusCode} className="fact-chip">
              {response.statusCode} {response.description}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

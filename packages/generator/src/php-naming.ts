const phpKeywords = new Set(
  "abstract and array as break callable case catch class clone const continue declare default die do echo else elseif empty enddeclare endfor endforeach endif endswitch endwhile enum eval exit extends final finally fn for foreach function global goto if implements include include_once instanceof insteadof interface isset list match namespace new or print private protected public readonly require require_once return static switch throw trait try unset use var while xor yield".split(
    " "
  )
);
const pathParameterMarker = "\u0000";

export const phpClassName = (value: string, fallback = "Model"): string => {
  const words = value.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const name = words.length > 0 ? words.map(capitalize).join("") : fallback;
  const safeName = /^[A-Z]/.test(name) ? name : `${fallback}${name}`;
  return phpKeywords.has(safeName.toLowerCase()) ? `${safeName}Value` : safeName;
};

export const phpMethodName = (value: string): string => {
  const className = phpClassName(value, "operation");
  const name = className.charAt(0).toLowerCase() + className.slice(1);
  return phpKeywords.has(name) ? `${name}Value` : name;
};

export const phpVariableName = (value: string): string => {
  const className = phpClassName(value, "value");
  const name = className.charAt(0).toLowerCase() + className.slice(1);
  return phpKeywords.has(name) ? `${name}Value` : name;
};

export const phpStringLiteral = (value: string): string => {
  return `'${value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
};

export const parameterPlaceholder = (name: string): string =>
  `${pathParameterMarker}${name}${pathParameterMarker}`;

export const pathToPhpExpression = (path: string): string => {
  const parts: string[] = [];
  let cursor = 0;

  while (cursor < path.length) {
    const start = path.indexOf(pathParameterMarker, cursor);
    if (start === -1) {
      parts.push(phpStringLiteral(path.slice(cursor)));
      break;
    }
    const end = path.indexOf(pathParameterMarker, start + 1);
    if (end === -1) {
      parts.push(phpStringLiteral(path.slice(cursor)));
      break;
    }
    if (start > cursor) parts.push(phpStringLiteral(path.slice(cursor, start)));
    parts.push(`rawurlencode((string) $${path.slice(start + 1, end)})`);
    cursor = end + 1;
  }

  return parts.length > 0 ? parts.join(" . ") : phpStringLiteral(path);
};

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

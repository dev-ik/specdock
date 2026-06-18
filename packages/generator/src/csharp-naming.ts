const csharpKeywords = new Set(
  "abstract as base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in int interface internal is lock long namespace new null object operator out override params private protected public readonly ref return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using virtual void volatile while".split(
    " "
  )
);
const pathParameterMarker = "\u0000";

export const csharpClassName = (value: string, fallback = "Model"): string => {
  const words = value.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const name = words.length > 0 ? words.map(capitalize).join("") : fallback;
  const safeName = /^[A-Z]/.test(name) ? name : `${fallback}${name}`;
  return csharpKeywords.has(safeName.toLowerCase()) ? `${safeName}Value` : safeName;
};

export const csharpMethodName = (value: string): string => {
  const name = csharpClassName(value, "Operation");
  return name.endsWith("Async") ? name : `${name}Async`;
};

export const csharpPropertyName = (value: string): string => csharpClassName(value, "Property");

export const csharpParameterName = (value: string): string => {
  const name = csharpClassName(value, "parameter");
  const parameter = name.charAt(0).toLowerCase() + name.slice(1);
  return csharpKeywords.has(parameter) ? `${parameter}Value` : parameter;
};

export const parameterPlaceholder = (name: string): string =>
  `${pathParameterMarker}${name}${pathParameterMarker}`;

export const pathToCsharpExpression = (path: string): string => {
  const parts: string[] = [];
  let cursor = 0;

  while (cursor < path.length) {
    const start = path.indexOf(pathParameterMarker, cursor);
    if (start === -1) {
      parts.push(JSON.stringify(path.slice(cursor)));
      break;
    }
    const end = path.indexOf(pathParameterMarker, start + 1);
    if (end === -1) {
      parts.push(JSON.stringify(path.slice(cursor)));
      break;
    }
    if (start > cursor) parts.push(JSON.stringify(path.slice(cursor, start)));
    parts.push(`Uri.EscapeDataString(${path.slice(start + 1, end)})`);
    cursor = end + 1;
  }

  return parts.length > 0 ? parts.join(" + ") : JSON.stringify(path);
};

const capitalize = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

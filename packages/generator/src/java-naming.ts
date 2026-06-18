const javaKeywords = new Set(
  "abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for goto if implements import instanceof int interface long native new package private protected public return short static strictfp super switch synchronized this throw throws transient try void volatile while".split(
    " "
  )
);
const pathParameterMarker = "\u0000";

export const javaClassName = (value: string, fallback = "Model"): string => {
  const words = value.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const name = words.length > 0 ? words.map(capitalize).join("") : fallback;
  const safeName = /^[A-Z]/.test(name) ? name : `${fallback}${name}`;
  return javaKeywords.has(safeName.toLowerCase()) ? `${safeName}Value` : safeName;
};

export const javaMethodName = (value: string): string => {
  const className = javaClassName(value, "operation");
  const name = className.charAt(0).toLowerCase() + className.slice(1);
  return javaKeywords.has(name) ? `${name}Value` : name;
};

export const javaFieldName = (value: string): string => {
  const className = javaClassName(value, "field");
  const name = className.charAt(0).toLowerCase() + className.slice(1);
  return javaKeywords.has(name) ? `${name}Value` : name;
};

export const parameterPlaceholder = (name: string): string =>
  `${pathParameterMarker}${name}${pathParameterMarker}`;

export const pathToJavaExpression = (path: string): string => {
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
    if (start > cursor) {
      parts.push(JSON.stringify(path.slice(cursor, start)));
    }
    parts.push(`encodePath(${path.slice(start + 1, end)})`);
    cursor = end + 1;
  }

  return parts.length > 0 ? parts.join(" + ") : JSON.stringify(path);
};

const capitalize = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

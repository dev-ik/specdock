const pathParameterMarker = "\u0000";
const pythonKeywords = new Set(
  "False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield".split(
    " "
  )
);

export const pythonClassName = (value: string): string => {
  const words = value.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/);
  const name = words.map(capitalize).join("");
  return /^[A-Z]/.test(name) ? name : `Model${name}`;
};

export const pythonIdentifier = (value: string): string => {
  const identifier = value.replace(/[^a-zA-Z0-9_]/g, "_");
  const safeIdentifier = /^[a-zA-Z_]/.test(identifier) ? identifier : `_${identifier}`;
  return pythonKeywords.has(safeIdentifier) ? `${safeIdentifier}_` : safeIdentifier;
};

export const pythonFieldName = (value: string): string => {
  return pythonIdentifier(value);
};

export const parameterPlaceholder = (name: string): string =>
  `${pathParameterMarker}${name}${pathParameterMarker}`;

export const pathToPythonExpression = (path: string): string => {
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
    parts.push(`quote(str(${path.slice(start + 1, end)}), safe='')`);
    cursor = end + 1;
  }

  return parts.length > 0 ? parts.join(" + ") : JSON.stringify(path);
};

const capitalize = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

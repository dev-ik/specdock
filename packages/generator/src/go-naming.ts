const goKeywords = new Set(
  "break default func interface select case defer go map struct chan else goto package switch const fallthrough if range type continue for import return var".split(
    " "
  )
);
const pathParameterMarker = "\u0000";

export const goExportedName = (value: string, fallback = "Value"): string => {
  const words = value.replace(/[^a-zA-Z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
  const name = words.length > 0 ? words.map(capitalize).join("") : fallback;
  const safeName = /^[A-Z]/.test(name) ? name : `${fallback}${name}`;
  return goKeywords.has(safeName.toLowerCase()) ? `${safeName}Value` : safeName;
};

export const goFieldName = (value: string): string => {
  return goExportedName(value, "Field");
};

export const goParamName = (value: string): string => {
  const exported = goExportedName(value, "param");
  const name = exported.charAt(0).toLowerCase() + exported.slice(1);
  return goKeywords.has(name) ? `${name}Value` : name;
};

export const parameterPlaceholder = (name: string): string =>
  `${pathParameterMarker}${name}${pathParameterMarker}`;

export const pathToGoExpression = (path: string): string => {
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
    parts.push(`url.PathEscape(${path.slice(start + 1, end)})`);
    cursor = end + 1;
  }

  return parts.length > 0 ? parts.join(" + ") : JSON.stringify(path);
};

const capitalize = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

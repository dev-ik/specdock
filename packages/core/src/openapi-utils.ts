export type OpenApiRecord = Record<string, unknown>;

export const assertRecord = (value: unknown, message: string): OpenApiRecord => {
  if (!isRecord(value)) {
    throw new Error(message);
  }

  return value;
};

export const isRecord = (value: unknown): value is OpenApiRecord => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

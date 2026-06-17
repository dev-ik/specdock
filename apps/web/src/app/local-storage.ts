export const readLocalJson = <T>(key: string, fallback: T): T => {
  const storage = getLocalStorage();

  if (!storage) {
    return fallback;
  }

  try {
    const value = storage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeLocalJson = (key: string, value: unknown) => {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can fail in private mode or when payloads exceed quota.
  }
};

export const readLocalString = (key: string): string | undefined => {
  const storage = getLocalStorage();

  if (!storage) {
    return undefined;
  }

  try {
    return storage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

export const writeLocalString = (key: string, value: string | undefined) => {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    if (value === undefined) {
      storage.removeItem(key);
      return;
    }

    storage.setItem(key, value);
  } catch {
    // Ignore storage failures; in-memory state remains usable.
  }
};

export const removeLocalValue = (key: string) => {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(key);
  } catch {
    // Ignore storage failures; in-memory state remains usable.
  }
};

const getLocalStorage = (): Storage | undefined => {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
};

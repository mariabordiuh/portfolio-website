const CACHE_PREFIX = 'maria-portfolio:v3:';

export const readSessionCache = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.sessionStorage.getItem(`${CACHE_PREFIX}${key}`);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
};

export const writeSessionCache = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;

  try {
    window.sessionStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Cache writes are best-effort; Firestore remains the source of truth.
  }
};

export const clearSessionCache = (keys?: string[]) => {
  if (typeof window === 'undefined') return;

  try {
    if (keys?.length) {
      keys.forEach((key) => {
        window.sessionStorage.removeItem(`${CACHE_PREFIX}${key}`);
      });
      return;
    }

    const removals: string[] = [];
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const key = window.sessionStorage.key(index);
      if (key?.startsWith(CACHE_PREFIX)) {
        removals.push(key);
      }
    }

    removals.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Cache clears are best-effort only.
  }
};

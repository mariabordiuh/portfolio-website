const CACHE_PREFIX = 'maria-portfolio:v2:';

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

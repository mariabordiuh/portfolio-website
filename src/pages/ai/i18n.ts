import { useCallback, useEffect, useState } from 'react';

export type Lang = 'en' | 'de';

/** A bilingual string. Every piece of visible copy on /ai uses this shape. */
export type Copy = { en: string; de: string };

const STORAGE_KEY = 'mb-ai-lang';

// German is the default — the target market is DACH. ?lang=en or the
// visible toggle switches; the choice persists in localStorage.
const readInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'de';
  const param = new URLSearchParams(window.location.search).get('lang');
  if (param === 'de' || param === 'en') return param;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'de' || stored === 'en') return stored;
  return 'de';
};

export const useLang = () => {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* private mode etc. — non-fatal */
    }
    document.documentElement.lang = lang;
    return () => {
      document.documentElement.lang = 'en';
    };
  }, [lang]);

  const tx = useCallback((copy: Copy) => copy[lang], [lang]);
  const setLang = useCallback((next: Lang) => setLangState(next), []);

  return { lang, setLang, tx };
};

/** Convenience for inline copy definitions. */
export const c = (en: string, de: string): Copy => ({ en, de });

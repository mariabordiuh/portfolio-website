import { useCallback, useEffect, useState } from 'react';

export type Lang = 'en' | 'de';

/** A bilingual string. Every piece of visible copy on /ai uses this shape. */
export type Copy = { en: string; de: string };

const STORAGE_KEY = 'mb-ai-lang';

// German is the fallback — the target market is DACH. ?lang=en or the
// visible toggle switches; the choice persists in localStorage.
// Exported (read-only, no side effects) so other components sharing this
// page — e.g. the global cookie banner — can match the visitor's language
// without touching `document.documentElement.lang` themselves; only
// `useLang` below (used by the page itself) should own that side effect.
//
// Auto-detection uses the browser's own reported language (navigator.language),
// not IP geolocation: it's instant, needs no network call or third-party data
// sharing, and needs no CSP/Datenschutz changes. Trade-off: a DACH visitor
// whose OS is set to English sees English until they toggle manually.
const detectBrowserLang = (): Lang => {
  const candidates = window.navigator.languages?.length ? window.navigator.languages : [window.navigator.language];
  const isGerman = candidates.some((tag) => tag?.toLowerCase().startsWith('de'));
  return isGerman ? 'de' : 'en';
};

export const readInitialLang = (): Lang => {
  if (typeof window === 'undefined') return 'de';
  const param = new URLSearchParams(window.location.search).get('lang');
  if (param === 'de' || param === 'en') return param;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'de' || stored === 'en') return stored;
  return detectBrowserLang();
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

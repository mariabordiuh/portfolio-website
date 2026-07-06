const DEFAULT_GA_MEASUREMENT_ID = 'G-FPDWFLWWFB';
const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || DEFAULT_GA_MEASUREMENT_ID;

let hasInjectedScript = false;
let hasConfiguredTag = false;
let loadScriptPromise: Promise<boolean> | null = null;

export type AnalyticsConsentChoice = 'accepted' | 'rejected';

export const ANALYTICS_CONSENT_STORAGE_KEY = 'maria-analytics-consent-v1';
export const ANALYTICS_CONSENT_OPEN_EVENT = 'maria-analytics-consent-open';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const DEFAULT_CONSENT = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'granted',
  security_storage: 'granted',
};

const ACCEPTED_CONSENT = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'granted',
  functionality_storage: 'granted',
  security_storage: 'granted',
};

const REJECTED_CONSENT = DEFAULT_CONSENT;

const GTAG_SCRIPT_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

const ensureDataLayer = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  if (!window.gtag) {
    window.gtag = (...args: unknown[]) => {
      window.dataLayer?.push(args);
    };
  }
};

export const isGoogleAnalyticsEnabled = () => Boolean(GA_MEASUREMENT_ID);

export const getStoredAnalyticsConsent = (): AnalyticsConsentChoice | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = window.localStorage.getItem(ANALYTICS_CONSENT_STORAGE_KEY);
  if (value === 'accepted' || value === 'rejected') {
    return value;
  }

  return null;
};

export const hasGrantedAnalyticsConsent = () => getStoredAnalyticsConsent() === 'accepted';

const configureGoogleAnalytics = () => {
  if (!isGoogleAnalyticsEnabled()) {
    return false;
  }

  ensureDataLayer();
  window.gtag?.('consent', 'default', DEFAULT_CONSENT);

  if (!hasConfiguredTag) {
    window.gtag?.('js', new Date());
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
    });
    hasConfiguredTag = true;
  }

  return true;
};

export const loadGoogleAnalytics = async () => {
  if (!isGoogleAnalyticsEnabled() || typeof document === 'undefined') {
    return false;
  }

  ensureDataLayer();

  if (hasInjectedScript) {
    return configureGoogleAnalytics();
  }

  if (!loadScriptPromise) {
    loadScriptPromise = new Promise<boolean>((resolve) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${GTAG_SCRIPT_SRC}"]`);

      if (existingScript) {
        hasInjectedScript = true;
        resolve(configureGoogleAnalytics());
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = GTAG_SCRIPT_SRC;
      script.onload = () => {
        hasInjectedScript = true;
        resolve(configureGoogleAnalytics());
      };
      script.onerror = () => {
        loadScriptPromise = null;
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }

  return loadScriptPromise;
};

type PageViewPayload = {
  pageLocation: string;
  pagePath: string;
  pageTitle: string;
};

export const trackPageView = ({ pageLocation, pagePath, pageTitle }: PageViewPayload) => {
  if (!hasGrantedAnalyticsConsent() || !hasConfiguredTag) {
    return;
  }

  window.gtag?.('config', GA_MEASUREMENT_ID, {
    page_location: pageLocation,
    page_path: pagePath,
    page_title: pageTitle,
  });
};

export const trackGoogleEvent = (
  eventName: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
) => {
  if (!hasGrantedAnalyticsConsent() || !hasConfiguredTag) {
    return;
  }

  window.gtag?.('event', eventName, params);
};

export const grantAnalyticsConsent = async () => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'accepted');
  }

  const loaded = await loadGoogleAnalytics();

  if (!loaded) {
    return false;
  }

  window.gtag?.('consent', 'update', ACCEPTED_CONSENT);
  return true;
};

export const denyAnalyticsConsent = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, 'rejected');
  }

  if (!hasConfiguredTag) {
    return false;
  }

  window.gtag?.('consent', 'update', REJECTED_CONSENT);
  return true;
};

export const reopenAnalyticsConsent = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
  }

  if (hasConfiguredTag) {
    window.gtag?.('consent', 'update', DEFAULT_CONSENT);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ANALYTICS_CONSENT_OPEN_EVENT));
  }
};

export const initializeAnalyticsFromStoredConsent = async () => {
  if (!hasGrantedAnalyticsConsent()) {
    return false;
  }

  return grantAnalyticsConsent();
};

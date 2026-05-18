const DEFAULT_GA_MEASUREMENT_ID = 'G-FPDWFLWWFB';
const GA_MEASUREMENT_ID =
  import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || DEFAULT_GA_MEASUREMENT_ID;

let hasInjectedScript = false;
let hasConfiguredTag = false;

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

export const initGoogleAnalytics = () => {
  if (!isGoogleAnalyticsEnabled() || typeof document === 'undefined') {
    return false;
  }

  ensureDataLayer();

  if (!hasInjectedScript) {
    const existingScript = document.querySelector<HTMLScriptElement>(
      `script[src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`,
    );

    if (!existingScript) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);
    }

    hasInjectedScript = true;
  }

  if (!hasConfiguredTag) {
    const storedConsent = getStoredAnalyticsConsent();

    window.gtag?.('consent', 'default', DEFAULT_CONSENT);

    if (storedConsent === 'accepted') {
      window.gtag?.('consent', 'update', ACCEPTED_CONSENT);
    } else if (storedConsent === 'rejected') {
      window.gtag?.('consent', 'update', REJECTED_CONSENT);
    }

    window.gtag?.('js', new Date());
    window.gtag?.('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
    });
    hasConfiguredTag = true;
  }

  return true;
};

type PageViewPayload = {
  pageLocation: string;
  pagePath: string;
  pageTitle: string;
};

export const trackPageView = ({ pageLocation, pagePath, pageTitle }: PageViewPayload) => {
  if (!hasGrantedAnalyticsConsent() || !initGoogleAnalytics()) {
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
  if (!hasGrantedAnalyticsConsent() || !initGoogleAnalytics()) {
    return;
  }

  window.gtag?.('event', eventName, params);
};

export const updateAnalyticsConsent = (choice: AnalyticsConsentChoice) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, choice);
  }

  if (!initGoogleAnalytics()) {
    return;
  }

  window.gtag?.(
    'consent',
    'update',
    choice === 'accepted' ? ACCEPTED_CONSENT : REJECTED_CONSENT,
  );
};

export const resetAnalyticsConsent = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ANALYTICS_CONSENT_STORAGE_KEY);
  }

  if (!initGoogleAnalytics()) {
    return;
  }

  window.gtag?.('consent', 'update', DEFAULT_CONSENT);
};

export const reopenAnalyticsConsent = () => {
  resetAnalyticsConsent();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ANALYTICS_CONSENT_OPEN_EVENT));
  }
};

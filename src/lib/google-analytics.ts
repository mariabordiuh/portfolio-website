const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() ?? '';

let hasInjectedScript = false;
let hasConfiguredTag = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

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
  if (!initGoogleAnalytics()) {
    return;
  }

  window.gtag?.('event', 'page_view', {
    page_location: pageLocation,
    page_path: pagePath,
    page_title: pageTitle,
  });
};

export const trackGoogleEvent = (
  eventName: string,
  params: Record<string, string | number | boolean | null | undefined> = {},
) => {
  if (!initGoogleAnalytics()) {
    return;
  }

  window.gtag?.('event', eventName, params);
};

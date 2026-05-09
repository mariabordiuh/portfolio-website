import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  getStoredAnalyticsConsent,
  initGoogleAnalytics,
  isGoogleAnalyticsEnabled,
  trackPageView,
  updateAnalyticsConsent,
  type AnalyticsConsentChoice,
} from '../lib/google-analytics';

export const AnalyticsConsentBanner = () => {
  const location = useLocation();
  const [consentChoice, setConsentChoice] = useState<AnalyticsConsentChoice | null>(null);

  useEffect(() => {
    setConsentChoice(getStoredAnalyticsConsent());
  }, []);

  if (!isGoogleAnalyticsEnabled() || consentChoice) {
    return null;
  }

  const handleChoice = (choice: AnalyticsConsentChoice) => {
    setConsentChoice(choice);
    updateAnalyticsConsent(choice);

    if (choice === 'accepted') {
      initGoogleAnalytics();
      trackPageView({
        pageLocation: window.location.href,
        pagePath: `${location.pathname}${location.search}`,
        pageTitle: document.title,
      });
    }
  };

  return (
    <div className="fixed inset-x-4 bottom-4 z-[140] md:inset-x-auto md:bottom-6 md:right-6 md:max-w-[24rem]">
      <div className="relative overflow-hidden rounded-[1.35rem] border border-white/12 bg-black/78 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/45 to-transparent" />
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-brand-accent">
          Cookies for the coffee?
        </p>
        <h2 className="mt-2 text-[0.98rem] font-semibold leading-tight text-white">
          I use simple analytics to learn what people actually open on the site. That’s all.
        </h2>
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => handleChoice('accepted')}
            className="btn-gradient-shift px-4 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.22em]"
          >
            Okidoki
          </button>
          <button
            type="button"
            onClick={() => handleChoice('rejected')}
            className="rounded-full border border-white/12 px-4 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.22em] text-white/68 transition-colors hover:border-white/24 hover:text-white"
          >
            Nope
          </button>
        </div>
      </div>
    </div>
  );
};

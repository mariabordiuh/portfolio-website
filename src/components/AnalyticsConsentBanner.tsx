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
    <div className="fixed inset-x-4 bottom-4 z-[140] md:inset-x-auto md:bottom-6 md:right-6 md:max-w-[30rem]">
      <div className="overflow-hidden rounded-[1.65rem] border border-white/12 bg-black/78 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/45 to-transparent" />
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-brand-accent">
          Analytics
        </p>
        <h2 className="mt-3 text-lg font-semibold leading-tight text-white">
          Can I use Google Analytics to see what’s actually working?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/68">
          Only anonymous visit stats. No ads, no creepy stuff. It mostly helps me understand what
          people open, whether OMR traffic lands here, and what pages are useful.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => handleChoice('accepted')}
            className="btn-gradient-shift px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.22em]"
          >
            Allow analytics
          </button>
          <button
            type="button"
            onClick={() => handleChoice('rejected')}
            className="rounded-full border border-white/12 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-white/72 transition-colors hover:border-white/24 hover:text-white"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
};

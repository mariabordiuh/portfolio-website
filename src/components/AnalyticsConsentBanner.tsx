import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PrefetchLink } from './PrefetchLink';
import {
  getStoredAnalyticsConsent,
  initGoogleAnalytics,
  isGoogleAnalyticsEnabled,
  resetAnalyticsConsent,
  trackPageView,
  updateAnalyticsConsent,
  type AnalyticsConsentChoice,
} from '../lib/google-analytics';

export const AnalyticsConsentBanner = () => {
  const location = useLocation();
  const [consentChoice, setConsentChoice] = useState<AnalyticsConsentChoice | null>(null);
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    setConsentChoice(getStoredAnalyticsConsent());
  }, []);

  if (!isGoogleAnalyticsEnabled()) {
    return null;
  }

  if (consentChoice) {
    return (
      <div className="fixed bottom-4 left-4 z-[120] md:bottom-6 md:left-6">
        <button
          type="button"
          onClick={() => {
            resetAnalyticsConsent();
            setConsentChoice(null);
          }}
          className="rounded-full border border-white/10 bg-black/55 px-3 py-2 font-mono text-[9px] font-black uppercase tracking-[0.24em] text-white/68 backdrop-blur-md transition-colors hover:border-white/18 hover:text-white"
        >
          Cookies
        </button>
      </div>
    );
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
    <div
      className={`fixed inset-x-4 bottom-4 z-[140] md:inset-x-auto md:bottom-6 md:max-w-[24rem] ${
        isHomePage ? 'md:left-6 md:right-auto' : 'md:right-6'
      }`}
    >
      <div className="relative overflow-hidden rounded-[1.35rem] border border-brand-accent/45 bg-[linear-gradient(145deg,rgba(255,87,112,0.98)_0%,rgba(255,87,112,0.94)_58%,rgba(10,10,10,0.92)_140%)] p-4 shadow-[0_26px_90px_rgba(255,87,112,0.24)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_44%),radial-gradient(circle_at_bottom_left,rgba(10,10,10,0.28),transparent_42%)]" />
        <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        <p className="relative font-mono text-[9px] uppercase tracking-[0.3em] text-black/72">
          Cookies for the coffee?
        </p>
        <h2 className="relative mt-2 text-[0.98rem] font-semibold leading-tight text-black">
          I use simple analytics to learn what people actually open on the site. That’s all.
        </h2>
        <p className="relative mt-3 text-[12px] leading-relaxed text-black/72">
          Details live in{' '}
          <PrefetchLink to="/datenschutz" className="font-medium underline underline-offset-4">
            Datenschutz
          </PrefetchLink>
          .
        </p>
        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => handleChoice('accepted')}
            className="rounded-full border border-black/16 bg-black px-4 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.22em] text-white transition-colors hover:bg-black/90"
          >
            Okidoki
          </button>
          <button
            type="button"
            onClick={() => handleChoice('rejected')}
            className="rounded-full border border-black/14 bg-white/12 px-4 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.22em] text-black/72 transition-colors hover:border-black/24 hover:bg-white/18 hover:text-black"
          >
            Nope
          </button>
        </div>
      </div>
    </div>
  );
};

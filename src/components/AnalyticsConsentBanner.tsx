import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PrefetchLink } from './PrefetchLink';
import { PUBLIC_SHELL_CLASS } from '../lib/layout';
import {
  ANALYTICS_CONSENT_OPEN_EVENT,
  denyAnalyticsConsent,
  grantAnalyticsConsent,
  getStoredAnalyticsConsent,
  isGoogleAnalyticsEnabled,
  trackPageView,
  type AnalyticsConsentChoice,
} from '../lib/google-analytics';

export const AnalyticsConsentBanner = () => {
  const location = useLocation();
  const [consentChoice, setConsentChoice] = useState<AnalyticsConsentChoice | null>(null);
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    setConsentChoice(getStoredAnalyticsConsent());
  }, []);

  useEffect(() => {
    const openBanner = () => {
      setConsentChoice(null);
    };

    window.addEventListener(ANALYTICS_CONSENT_OPEN_EVENT, openBanner);

    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_OPEN_EVENT, openBanner);
    };
  }, []);

  if (!isGoogleAnalyticsEnabled()) {
    return null;
  }

  if (consentChoice) {
    return null;
  }

  const handleChoice = async (choice: AnalyticsConsentChoice) => {
    setConsentChoice(choice);

    if (choice === 'accepted') {
      const loaded = await grantAnalyticsConsent();
      if (!loaded) {
        return;
      }
      trackPageView({
        pageLocation: window.location.href,
        pagePath: `${location.pathname}${location.search}`,
        pageTitle: document.title,
      });
      return;
    }

    denyAnalyticsConsent();
  };

  const bannerCard = (
    <div className="relative overflow-hidden rounded-[1.35rem] border border-brand-accent/45 bg-[linear-gradient(145deg,rgba(255,158,187,0.98)_0%,rgba(255,158,187,0.94)_58%,rgba(3,1,3,0.92)_140%)] p-4 shadow-[0_26px_90px_rgba(255,158,187,0.22)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_44%),radial-gradient(circle_at_bottom_left,rgba(3,1,3,0.28),transparent_42%)]" />
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <p className="relative font-mono text-[9px] uppercase tracking-[0.3em] text-[#030103]/72">
        Cookies for the coffee?
      </p>
      <h2 className="relative mt-2 font-sans text-[0.98rem] font-semibold normal-case leading-tight tracking-[-0.01em] text-[#030103]">
        I use simple analytics to learn what people actually open on the site. That’s all.
      </h2>
      <p className="relative mt-3 text-[12px] leading-relaxed text-[#030103]/72">
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
          className="rounded-full border border-[#d83a18] bg-[#d83a18] px-4 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#030103] transition-colors hover:bg-[#e24820]"
        >
          Okidoki
        </button>
        <button
          type="button"
          onClick={() => handleChoice('rejected')}
          className="rounded-full border border-[#030103]/14 bg-white/12 px-4 py-2.5 font-mono text-[9px] font-black uppercase tracking-[0.22em] text-[#030103]/72 transition-colors hover:border-[#030103]/24 hover:bg-white/18 hover:text-[#030103]"
        >
          Nope
        </button>
      </div>
    </div>
  );

  if (!isHomePage) {
    return (
      <div className="relative z-[40] mt-8 md:mt-10">
        <div className={`${PUBLIC_SHELL_CLASS} flex justify-end`}>
          <div className="w-full max-w-[24rem]">{bannerCard}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-x-4 bottom-4 z-[140] md:inset-x-auto md:bottom-6 md:max-w-[24rem] ${
        isHomePage ? 'md:left-6 md:right-auto' : 'md:right-6'
      }`}
    >
      {bannerCard}
    </div>
  );
};

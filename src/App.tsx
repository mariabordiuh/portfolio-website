import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CircleCursor } from './components/CircleCursor';
import { ButtonClickSound } from './components/ButtonClickSound';
import { AnalyticsConsentBanner } from './components/AnalyticsConsentBanner';
import { SmoothScrollProvider } from './components/SmoothScrollProvider';
import { ScrollToTop } from './components/ScrollToTop';
import { Seo } from './components/Seo';
import { initGoogleAnalytics, isGoogleAnalyticsEnabled, trackPageView } from './lib/google-analytics';
import { UnderConstruction } from './pages/UnderConstruction';
import {
  loadAboutRoute,
  loadAdminDataShell,
  loadAdminRoute,
  loadDatenschutzRoute,
  loadHomeRoute,
  loadImpressumRoute,
  loadLabDataShell,
  loadLabRoute,
  loadNotFoundRoute,
  loadPortfolioDataShell,
  loadProjectDetailRoute,
  loadProjectsDataShell,
  loadWorkRoute,
} from './utils/route-prefetch';

const Home = lazy(() => loadHomeRoute().then((module) => ({ default: module.Home })));
const Work = lazy(() => loadWorkRoute().then((module) => ({ default: module.Work })));
const ProjectDetail = lazy(() =>
  loadProjectDetailRoute().then((module) => ({ default: module.ProjectDetail })),
);
const Lab = lazy(() => loadLabRoute().then((module) => ({ default: module.Lab })));
const About = lazy(() => loadAboutRoute().then((module) => ({ default: module.About })));
const Impressum = lazy(() =>
  loadImpressumRoute().then((module) => ({ default: module.Impressum })),
);
const Datenschutz = lazy(() =>
  loadDatenschutzRoute().then((module) => ({ default: module.Datenschutz })),
);
const Admin = lazy(() => loadAdminRoute().then((module) => ({ default: module.Admin })));
const NotFound = lazy(() =>
  loadNotFoundRoute().then((module) => ({ default: module.NotFound })),
);

const ProjectsDataShell = lazy(() =>
  loadProjectsDataShell().then((module) => ({ default: module.ProjectsDataShell })),
);
const PortfolioDataShell = lazy(() =>
  loadPortfolioDataShell().then((module) => ({ default: module.PortfolioDataShell })),
);
const LabDataShell = lazy(() =>
  loadLabDataShell().then((module) => ({ default: module.LabDataShell })),
);
const AdminDataShell = lazy(() =>
  loadAdminDataShell().then((module) => ({ default: module.AdminDataShell })),
);

const LoadingFallback = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    className="fixed inset-0 bg-brand-bg flex items-center justify-center z-[200]"
  >
    <motion.div 
      animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.8, 1, 0.8] }} 
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      className="w-1.5 h-1.5 rounded-full bg-white/40" 
    />
  </motion.div>
);

const SuspenseRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
);

const isUnderConstruction = import.meta.env.VITE_UNDER_CONSTRUCTION === 'true';

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<SuspenseRoute><ProjectsDataShell /></SuspenseRoute>}>
          <Route path="/work/:id" element={<SuspenseRoute><ProjectDetail /></SuspenseRoute>} />
        </Route>

        <Route element={<SuspenseRoute><PortfolioDataShell /></SuspenseRoute>}>
          <Route path="/" element={<SuspenseRoute><Home /></SuspenseRoute>} />
          <Route path="/work" element={<SuspenseRoute><Work /></SuspenseRoute>} />
        </Route>

        <Route element={<SuspenseRoute><LabDataShell /></SuspenseRoute>}>
          <Route path="/lab" element={<SuspenseRoute><Lab /></SuspenseRoute>} />
        </Route>

        <Route element={<SuspenseRoute><AdminDataShell /></SuspenseRoute>}>
          <Route path="/admin" element={<SuspenseRoute><Admin /></SuspenseRoute>} />
        </Route>

        <Route path="/about" element={<SuspenseRoute><About /></SuspenseRoute>} />
        <Route path="/impressum" element={<SuspenseRoute><Impressum /></SuspenseRoute>} />
        <Route path="/datenschutz" element={<SuspenseRoute><Datenschutz /></SuspenseRoute>} />
        <Route path="/omr" element={<Navigate to="/" replace />} />
        <Route path="*" element={<SuspenseRoute><NotFound /></SuspenseRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppShell = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isWorkDetailRoute = location.pathname.startsWith('/work/');
  const isKnownPublicPath =
    location.pathname === '/' ||
    location.pathname === '/work' ||
    location.pathname === '/lab' ||
    location.pathname === '/about' ||
    location.pathname === '/impressum' ||
    location.pathname === '/datenschutz' ||
      location.pathname === '/omr' ||
      isWorkDetailRoute;
  const isNotFoundRoute = !isAdmin && !isKnownPublicPath;
  const enableSmoothScroll =
    !isAdmin && (location.pathname === '/' || isWorkDetailRoute || isNotFoundRoute);
  const enableCustomCursor =
    !isAdmin &&
    (location.pathname === '/' ||
      location.pathname === '/work' ||
      isWorkDetailRoute ||
      isNotFoundRoute);
  const enableClickSound = enableCustomCursor;

  useEffect(() => {
    if (!isGoogleAnalyticsEnabled() || isAdmin) {
      return;
    }

    initGoogleAnalytics();
  }, [isAdmin]);

  useEffect(() => {
    if (!isGoogleAnalyticsEnabled() || isAdmin) {
      return;
    }

    const timer = window.setTimeout(() => {
      trackPageView({
        pageLocation: window.location.href,
        pagePath: `${location.pathname}${location.search}`,
        pageTitle: document.title,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isAdmin, location.pathname, location.search]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.body.dataset.cursorMode = enableCustomCursor ? 'custom' : 'native';

    return () => {
      delete document.body.dataset.cursorMode;
    };
  }, [enableCustomCursor]);

  const appFrame = (
    <div
      className={`selection:bg-brand-accent selection:text-brand-bg bg-brand-bg text-white ${
        isNotFoundRoute ? 'h-[100svh] overflow-hidden flex flex-col' : 'min-h-screen flex flex-col'
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[200] focus:rounded-full focus:bg-brand-accent focus:px-5 focus:py-3 focus:text-[10px] focus:font-black focus:uppercase focus:tracking-[0.24em] focus:text-brand-bg"
      >
        Skip to content
      </a>
      {!isAdmin && !isNotFoundRoute ? <Nav /> : null}
      <main
        id="main-content"
        className={`flex-grow relative z-10 ${isNotFoundRoute ? 'min-h-0 h-full overflow-hidden' : 'min-h-[100svh]'}`}
        tabIndex={-1}
      >
        <AnimatedRoutes />
      </main>
      {!isAdmin ? <ScrollToTop /> : null}
      {!isAdmin && !isNotFoundRoute ? <AnalyticsConsentBanner /> : null}
      {!isAdmin && !isNotFoundRoute ? <Footer /> : null}
    </div>
  );

  if (isAdmin) {
    return (
      <>
        <Seo />
        {appFrame}
      </>
    );
  }

  const interactiveFrame = (
    <>
      {enableCustomCursor ? <CircleCursor /> : null}
      {enableClickSound ? <ButtonClickSound /> : null}
      {appFrame}
    </>
  );

  return (
    <>
      <Seo />
      {enableSmoothScroll ? (
        <SmoothScrollProvider>{interactiveFrame}</SmoothScrollProvider>
      ) : (
        interactiveFrame
      )}
    </>
  );
};

export default function App() {
  if (isUnderConstruction) {
    return (
      <ErrorBoundary>
        <UnderConstruction />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <AppShell />
      </Router>
    </ErrorBoundary>
  );
}

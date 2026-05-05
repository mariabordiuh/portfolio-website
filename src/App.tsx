import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CircleCursor } from './components/CircleCursor';
import { ButtonClickSound } from './components/ButtonClickSound';
import { SmoothScrollProvider } from './components/SmoothScrollProvider';
import { ScrollToTop } from './components/ScrollToTop';
import { Seo } from './components/Seo';
import { UnderConstruction } from './pages/UnderConstruction';
import {
  loadAboutRoute,
  loadAdminDataShell,
  loadAdminRoute,
  loadHomeRoute,
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
const Omr = lazy(() => import('./pages/Omr').then((module) => ({ default: module.Omr })));
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
          <Route path="/" element={<SuspenseRoute><Home /></SuspenseRoute>} />
          <Route path="/work/:id" element={<SuspenseRoute><ProjectDetail /></SuspenseRoute>} />
        </Route>

        <Route element={<SuspenseRoute><PortfolioDataShell /></SuspenseRoute>}>
          <Route path="/work" element={<SuspenseRoute><Work /></SuspenseRoute>} />
        </Route>

        <Route element={<SuspenseRoute><LabDataShell /></SuspenseRoute>}>
          <Route path="/lab" element={<SuspenseRoute><Lab /></SuspenseRoute>} />
        </Route>

        <Route element={<SuspenseRoute><AdminDataShell /></SuspenseRoute>}>
          <Route path="/admin" element={<SuspenseRoute><Admin /></SuspenseRoute>} />
        </Route>

        <Route path="/about" element={<SuspenseRoute><About /></SuspenseRoute>} />
        <Route path="/omr" element={<SuspenseRoute><Omr /></SuspenseRoute>} />
        <Route path="*" element={<SuspenseRoute><NotFound /></SuspenseRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

const AppShell = () => {
  const location = useLocation();
  const isOmr = location.pathname.startsWith('/omr');

  return (
    <>
      <Seo />
      <SmoothScrollProvider>
        <CircleCursor />
        <ButtonClickSound />
        <div className="min-h-screen flex flex-col selection:bg-brand-accent selection:text-brand-bg bg-brand-bg text-white">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-[200] focus:rounded-full focus:bg-brand-accent focus:px-5 focus:py-3 focus:text-[10px] focus:font-black focus:uppercase focus:tracking-[0.24em] focus:text-brand-bg"
          >
            Skip to content
          </a>
          {!isOmr ? <Nav /> : null}
          <main id="main-content" className="flex-grow relative z-10 min-h-[100svh]" tabIndex={-1}>
            <AnimatedRoutes />
          </main>
          <ScrollToTop />
          {!isOmr ? <Footer /> : null}
        </div>
      </SmoothScrollProvider>
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

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CircleCursor } from './components/CircleCursor';
import { SmoothScrollProvider } from './components/SmoothScrollProvider';

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const Work = lazy(() => import('./pages/Work').then((module) => ({ default: module.Work })));
const ProjectDetail = lazy(() =>
  import('./pages/ProjectDetail').then((module) => ({ default: module.ProjectDetail })),
);
const Lab = lazy(() => import('./pages/Lab').then((module) => ({ default: module.Lab })));
const About = lazy(() => import('./pages/About').then((module) => ({ default: module.About })));
const Admin = lazy(() => import('./pages/Admin').then((module) => ({ default: module.Admin })));
const NotFound = lazy(() =>
  import('./pages/NotFound').then((module) => ({ default: module.NotFound })),
);

const ProjectsDataShell = lazy(() =>
  import('./route-shells/ProjectsDataShell').then((module) => ({ default: module.ProjectsDataShell })),
);
const PortfolioDataShell = lazy(() =>
  import('./route-shells/PortfolioDataShell').then((module) => ({ default: module.PortfolioDataShell })),
);
const LabDataShell = lazy(() =>
  import('./route-shells/LabDataShell').then((module) => ({ default: module.LabDataShell })),
);
const AdminDataShell = lazy(() =>
  import('./route-shells/AdminDataShell').then((module) => ({ default: module.AdminDataShell })),
);

const LoadingFallback = () => (
  <div className="fixed inset-0 bg-brand-bg flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-muted animate-pulse">
        brewing...
      </p>
    </div>
  </div>
);

const SuspenseRoute = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>{children}</Suspense>
);

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
        <Route path="*" element={<SuspenseRoute><NotFound /></SuspenseRoute>} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <SmoothScrollProvider>
          <CircleCursor />
          <div className="min-h-screen flex flex-col selection:bg-brand-accent selection:text-brand-bg bg-brand-bg text-white">
            <Nav />
            <main className="flex-grow relative z-10">
              <AnimatedRoutes />
            </main>
            <Footer />
          </div>
        </SmoothScrollProvider>
      </Router>
    </ErrorBoundary>
  );
}

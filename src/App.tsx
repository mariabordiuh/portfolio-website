import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { DataContext, DataProvider } from './context/DataContext';

// Components
import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { CircleCursor } from './components/CircleCursor';

// Lazy Loaded Pages
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Work = lazy(() => import('./pages/Work').then(m => ({ default: m.Work })));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail').then(m => ({ default: m.ProjectDetail })));
const Lab = lazy(() => import('./pages/Lab').then(m => ({ default: m.Lab })));
const About = lazy(() => import('./pages/About').then(m => ({ default: m.About })));
const Admin = lazy(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

const LoadingFallback = () => (
  <div className="fixed inset-0 bg-brand-bg flex items-center justify-center z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-brand-accent/20 border-t-brand-accent rounded-full animate-spin" />
      <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-brand-muted animate-pulse">Synchronizing Archive // Syncing Artifacts</p>
    </div>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Suspense fallback={<LoadingFallback />}><Home /></Suspense>} />
        <Route path="/work" element={<Suspense fallback={<LoadingFallback />}><Work /></Suspense>} />
        <Route path="/work/:id" element={<Suspense fallback={<LoadingFallback />}><ProjectDetail /></Suspense>} />
        <Route path="/lab" element={<Suspense fallback={<LoadingFallback />}><Lab /></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<LoadingFallback />}><About /></Suspense>} />
        <Route path="/admin" element={<Suspense fallback={<LoadingFallback />}><Admin /></Suspense>} />
        <Route path="*" element={<Suspense fallback={<LoadingFallback />}><NotFound /></Suspense>} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <CircleCursor />
            <div className="min-h-screen flex flex-col selection:bg-brand-accent selection:text-brand-bg bg-brand-bg text-white">
              <Nav />
              <main className="flex-grow relative z-10">
                <AnimatedRoutes />
              </main>
              <Footer />
            </div>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

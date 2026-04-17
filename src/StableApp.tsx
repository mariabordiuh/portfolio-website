import { lazy, Suspense, type ReactNode, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Briefcase,
  ExternalLink,
  FlaskConical,
  Github,
  Mail,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Link, BrowserRouter as Router, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { useLivePortfolioData } from './live-data';
import { cn } from '@/src/lib/utils';
import type { LabItem, Project, Video } from './types';

const AdminPanel = lazy(() => import('./admin-panel'));
const CONTACT_EMAIL = 'helloveo333@gmail.com';
const GITHUB_URL = 'https://github.com/mariabordiuh';

function AppChrome() {
  const location = useLocation();
  const { projects, videos, labItems, errorMessage } = useLivePortfolioData();
  const nav = [
    { label: 'Home', href: '/' },
    { label: 'Work', href: '/work' },
    { label: 'Lab', href: '/lab' },
    { label: 'About', href: '/about' },
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-bg/75 backdrop-blur-xl">
        <div className="section-shell flex items-center justify-between py-5">
          <Link to="/" className="text-lg font-semibold tracking-[0.3em] uppercase">
            Maria<span className="text-brand-accent">.</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'text-sm text-brand-muted hover:text-white',
                  location.pathname === item.href && 'text-white',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <MobileNav items={nav} />
        </div>
      </header>
      {errorMessage ? <ContentSyncNotice message={errorMessage} /> : null}
      <main>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<PageShell><HomePage projects={projects} videos={videos} labItems={labItems} /></PageShell>} />
            <Route path="/work" element={<PageShell><WorkPage projects={projects} /></PageShell>} />
            <Route path="/work/:id" element={<PageShell><ProjectPage projects={projects} /></PageShell>} />
            <Route path="/lab" element={<PageShell><LabPage labItems={labItems} /></PageShell>} />
            <Route path="/about" element={<PageShell><AboutPage /></PageShell>} />
            <Route
              path="/admin"
              element={
                <PageShell>
                  <Suspense fallback={<AdminLoadingState />}>
                    <AdminPanel />
                  </Suspense>
                </PageShell>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}

function MobileNav({ items }: { items: { label: string; href: string }[] }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="rounded-full border border-white/10 p-2 md:hidden"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Toggle navigation"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute inset-x-4 top-[72px] rounded-3xl border border-white/10 bg-brand-surface/95 p-4 shadow-2xl md:hidden"
          >
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'rounded-2xl px-4 py-3 text-sm text-brand-muted hover:bg-white/5 hover:text-white',
                    location.pathname === item.href && 'bg-white/5 text-white',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function HomePage({
  projects,
  videos,
  labItems,
}: {
  projects: Project[];
  videos: Video[];
  labItems: LabItem[];
}) {
  return (
    <>
      <section className="section-shell grid gap-12 py-20 md:grid-cols-[1.2fr_0.8fr] md:py-24">
        <div className="space-y-8">
          <span className="pill">Portfolio Stabilized Build</span>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight md:text-7xl">
              Art direction, motion, and AI-led image systems with a steadier foundation.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-brand-muted">
              The public site stays lightweight and resilient, while a separate Firebase workspace handles
              authenticated content edits behind the scenes.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/work"
              className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-brand-bg"
            >
              View work
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white"
            >
              About Maria
            </Link>
          </div>
        </div>
        <div className="glass relative overflow-hidden rounded-[2rem] p-6">
          <div className="grain-overlay" />
          <div className="relative z-10 flex h-full flex-col justify-between gap-12">
            <div className="space-y-3">
              <p className="text-sm uppercase tracking-[0.3em] text-brand-muted">Current focus</p>
              <h2 className="text-3xl font-semibold">Building visual systems that still feel human.</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard label="Projects" value={String(projects.length).padStart(2, '0')} />
              <StatCard label="Experiments" value={String(labItems.length).padStart(2, '0')} />
              <StatCard label="Videos" value={String(videos.length).padStart(2, '0')} />
              <StatCard label="Public routes" value="05" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-shell space-y-8 py-8 md:py-12">
        <div className="flex items-center gap-3">
          <Sparkles className="text-brand-accent" size={18} />
          <h2 className="text-2xl font-semibold">Selected work</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {projects.length ? projects.map((project) => (
            <Link
              key={project.id}
              to={`/work/${project.id}`}
              className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/5"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <ProjectMedia src={project.thumbnail} alt={project.title} />
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="pill">{project.pillar}</span>
                  <ArrowRight size={16} className="text-brand-muted group-hover:text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold">{project.title}</h3>
                  <p className="text-sm leading-7 text-brand-muted">{project.description}</p>
                </div>
              </div>
            </Link>
          )) : <EmptyState title="No projects yet" body="Publish a project from the Firebase admin panel and it will appear here." />}
        </div>
      </section>
    </>
  );
}

function WorkPage({ projects }: { projects: Project[] }) {
  return (
    <section className="section-shell space-y-10 py-16 md:py-20">
      <div className="space-y-4">
        <span className="pill">Work</span>
        <h1 className="text-4xl font-semibold md:text-5xl">A simpler, safer project index.</h1>
        <p className="max-w-2xl text-brand-muted">
          Each case study stays reachable while the original interactive presentation gets rebuilt in smaller
          pieces.
        </p>
      </div>
      <div className="grid gap-6">
        {projects.length ? projects.map((project) => (
          <Link
            key={project.id}
            to={`/work/${project.id}`}
            className="glass grid gap-6 rounded-[2rem] p-5 md:grid-cols-[220px_1fr]"
          >
            <ProjectMedia src={project.thumbnail} alt={project.title} className="aspect-[4/3] h-full w-full rounded-[1.5rem]" />
            <div className="space-y-5">
              <div className="flex flex-wrap gap-2">
                <span className="pill">{project.pillar}</span>
                <span className="pill">{project.category}</span>
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-semibold">{project.title}</h2>
                <p className="max-w-3xl leading-7 text-brand-muted">{project.description}</p>
              </div>
              <TagList items={project.tools} />
            </div>
          </Link>
        )) : <EmptyState title="No projects yet" body="Use the admin panel to publish work items into Firestore." />}
      </div>
    </section>
  );
}

function ProjectPage({ projects }: { projects: Project[] }) {
  const { id } = useParams();
  const project = useMemo(() => projects.find((item) => item.id === id), [projects, id]);

  if (!project) {
    return (
      <section className="section-shell py-20">
        <div className="glass rounded-[2rem] p-8">
          <h1 className="text-3xl font-semibold">Project not found</h1>
          <p className="mt-3 text-brand-muted">That case study is not available in the current stable build.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section-shell space-y-10 py-16 md:py-20">
      <div className="grid gap-10 md:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <span className="pill">{project.pillar}</span>
            <span className="pill">{project.category}</span>
            {project.client ? <span className="pill">{project.client}</span> : null}
          </div>
          <h1 className="text-4xl font-semibold md:text-6xl">{project.title}</h1>
          <p className="max-w-3xl text-lg leading-8 text-brand-muted">{project.description}</p>
        </div>
        <aside className="glass rounded-[2rem] p-6">
          <h2 className="text-lg font-semibold">Snapshot</h2>
          <dl className="mt-5 space-y-5 text-sm">
            <div>
              <dt className="text-brand-muted">Creative tension</dt>
              <dd className="mt-1">{project.creativeTension ?? 'To be expanded in the next rebuild.'}</dd>
            </div>
            <div>
              <dt className="text-brand-muted">Context</dt>
              <dd className="mt-1">{project.globalContext ?? 'Context coming soon.'}</dd>
            </div>
            <div>
              <dt className="text-brand-muted">Tools</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {project.tools.map((tool) => (
                  <span key={tool} className="rounded-full bg-white/5 px-3 py-1 text-xs text-brand-muted">
                    {tool}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white/10">
        <ProjectMedia src={project.thumbnail} alt={project.title} className="aspect-[16/9] w-full" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {(project.outcomeVisuals?.length ? project.outcomeVisuals : project.moodboardImages ?? []).length ? (project.outcomeVisuals?.length ? project.outcomeVisuals : project.moodboardImages ?? []).map((image) => (
          <div key={image} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/5">
            <ProjectMedia src={image} alt="" className="aspect-[4/3] w-full" />
          </div>
        )) : <EmptyState title="No visuals yet" body="Add moodboard or outcome images from the admin panel to fill this case study." />}
      </div>

      <div className="glass rounded-[2rem] p-8">
        <h2 className="text-2xl font-semibold">Why this version is different</h2>
        <p className="mt-4 max-w-3xl leading-8 text-brand-muted">
          The previous app bundled a large number of interactive and admin concerns into one component. This
          stable build keeps the case study visible while reducing the risk of runtime crashes and hook-order
          violations.
        </p>
      </div>
    </section>
  );
}

function LabPage({ labItems }: { labItems: LabItem[] }) {
  return (
    <section className="section-shell space-y-10 py-16 md:py-20">
      <div className="space-y-4">
        <span className="pill">Lab</span>
        <h1 className="text-4xl font-semibold md:text-5xl">Notes, tests, and experiments.</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {labItems.length ? labItems.map((item) => (
          <article key={item.id} className="glass rounded-[2rem] p-6">
            <div className="flex items-center gap-3 text-brand-muted">
              <FlaskConical size={16} />
              <span className="text-xs uppercase tracking-[0.25em]">{item.type}</span>
            </div>
            <h2 className="mt-4 text-2xl font-semibold">{item.title}</h2>
            <p className="mt-3 leading-7 text-brand-muted">{item.content}</p>
            <div className="mt-5">
              <TagList items={item.tools} />
            </div>
          </article>
        )) : <EmptyState title="No lab notes yet" body="Create experiments in the admin panel and they will show up here." />}
      </div>
    </section>
  );
}

function AboutPage() {
  return (
    <section className="section-shell space-y-10 py-16 md:py-20">
      <div className="space-y-4">
        <span className="pill">About</span>
        <h1 className="text-4xl font-semibold md:text-5xl">A calmer public layer for the portfolio.</h1>
      </div>
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="glass rounded-[2rem] p-8">
          <p className="text-lg leading-8 text-brand-muted">
            Maria works across image systems, motion, art direction, and AI-assisted creative production.
            The current stabilization pass focuses on keeping the public-facing site reliable while the richer
            CMS and Firebase-powered editing experience get rebuilt incrementally.
          </p>
        </div>
        <div className="glass rounded-[2rem] p-8">
          <ul className="space-y-4 text-sm text-brand-muted">
            <li className="flex items-center gap-3">
              <Briefcase size={16} className="text-brand-accent" />
              Selected work remains available.
            </li>
            <li className="flex items-center gap-3">
              <Sparkles size={16} className="text-brand-accent" />
              Runtime complexity is reduced.
            </li>
            <li className="flex items-center gap-3">
              <Mail size={16} className="text-brand-accent" />
              Firebase admin now runs separately from the public shell.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="section-shell mt-16 border-t border-white/10 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-brand-muted">Maria Bordiuh</p>
          <p className="mt-2 max-w-xl text-sm leading-7 text-brand-muted">
            Public portfolio shell and Firebase admin refreshed on April 17, 2026.
          </p>
        </div>
        <div className="flex gap-3">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white"
          >
            <Mail size={16} />
            Email
          </a>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white"
          >
            <Github size={16} />
            GitHub
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}

function ContentSyncNotice({ message }: { message: string }) {
  return (
    <div className="section-shell pt-4">
      <div className="flex items-start gap-3 rounded-[1.5rem] border border-amber-400/20 bg-amber-400/8 px-4 py-3 text-sm text-amber-100">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <p>{message}</p>
      </div>
    </div>
  );
}

function AdminLoadingState() {
  return (
    <section className="section-shell py-24">
      <div className="glass mx-auto max-w-xl rounded-[2rem] p-10 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-brand-muted">Loading admin</p>
        <h1 className="mt-4 text-3xl font-semibold">Preparing the Firebase workspace.</h1>
        <p className="mt-4 leading-8 text-brand-muted">
          Admin tools load separately from the public site so the portfolio stays lighter for visitors.
        </p>
      </div>
    </section>
  );
}

function ProjectMedia({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(255,158,187,0.24),transparent_35%),rgba(255,255,255,0.04)] text-sm text-brand-muted',
          className,
        )}
      >
        Visual coming soon
      </div>
    );
  }

  return <img src={src} alt={alt} className={cn('object-cover', className)} />;
}

function TagList({ items }: { items?: string[] }) {
  if (!items?.length) {
    return <span className="text-xs text-brand-muted">Tools are being added.</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((tool) => (
        <span key={tool} className="rounded-full bg-white/5 px-3 py-1 text-xs text-brand-muted">
          {tool}
        </span>
      ))}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="glass rounded-[2rem] p-8">
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-3 max-w-xl text-brand-muted">{body}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-brand-muted">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

export default function StableApp() {
  return (
    <Router>
      <AppChrome />
    </Router>
  );
}

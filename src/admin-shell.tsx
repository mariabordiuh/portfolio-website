import { useEffect, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import { LogOut, Shield } from 'lucide-react';
import { auth } from './firebase-auth';
import { ADMIN_EMAIL, AdminTab, toReadableError } from './admin/admin-logic';
import { GalleryAdmin } from './admin/gallery-admin';
import { LabAdmin } from './admin/lab-admin';
import { ProjectsAdmin } from './admin/projects-admin';
import { VideosAdmin } from './admin/videos-admin';
import { AdminWelcomeCard, CenteredCard, NoticeBanner } from './admin/admin-ui';
import { toReadableGoogleSignInError } from './utils/auth-errors';
import { cn } from '@/src/lib/utils';

export default function AdminShell() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<AdminTab>('projects');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthLoading(false);
      setAuthError(null);
    });
  }, []);

  const isAdmin = user?.email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();

  if (authLoading) {
    return <CenteredCard title="Checking access" body="Connecting to Firebase Auth..." loading />;
  }

  if (!user) {
    return (
      <CenteredCard
        title="Firebase Admin"
        body={authError ?? 'Sign in with Google to open your content dashboard.'}
        action={
          <button
            type="button"
            onClick={async () => {
              try {
                setAuthError(null);
                await signInWithPopup(auth, new GoogleAuthProvider());
              } catch (error) {
                setAuthError(toReadableGoogleSignInError(error));
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-brand-bg"
          >
            <Shield size={16} />
            Sign in with Google
          </button>
        }
      />
    );
  }

  if (!isAdmin) {
    return (
      <CenteredCard
        title="Access restricted"
        body={`Signed in as ${user.email ?? 'an unknown account'}, but this admin panel is locked to ${ADMIN_EMAIL}.`}
        action={
          <button
            type="button"
            onClick={async () => {
              try {
                await signOut(auth);
              } catch (error) {
                setAuthError(toReadableError('Could not sign out.', error));
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        }
      />
    );
  }

  return (
    <section className="section-shell space-y-8 py-16 md:py-20">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-4">
          <span className="pill">Firebase Admin</span>
          <div>
            <h1 className="text-4xl font-semibold md:text-5xl">A calmer content workspace.</h1>
            <p className="mt-3 max-w-2xl text-brand-muted">
              The new flow keeps essentials front and center, protects drafts, and hides optional fields
              until you actually want them.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={async () => {
            try {
              await signOut(auth);
            } catch (error) {
              setAuthError(toReadableError('Could not sign out.', error));
            }
          }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>

      {authError ? <NoticeBanner notice={{ tone: 'error', message: authError }} /> : null}

      <AdminWelcomeCard />

      <div className="flex flex-wrap gap-3">
        {[
          ['projects', 'Projects'],
          ['videos', 'Videos'],
          ['labItems', 'Lab notes'],
          ['gallery', 'Gallery'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value as AdminTab)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm',
              tab === value
                ? 'border-brand-accent bg-brand-accent text-brand-bg'
                : 'border-white/10 bg-white/5 text-white',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'projects' ? <ProjectsAdmin /> : null}
      {tab === 'videos' ? <VideosAdmin /> : null}
      {tab === 'labItems' ? <LabAdmin /> : null}
      {tab === 'gallery' ? <GalleryAdmin /> : null}
    </section>
  );
}

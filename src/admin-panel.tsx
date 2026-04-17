import { type ChangeEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { AlertCircle, Check, CheckCircle2, ImagePlus, LoaderCircle, LogOut, Plus, Save, Shield, Trash2 } from 'lucide-react';
import { auth, db, storage } from './firebase';
import { cn } from '@/src/lib/utils';
import { GalleryImage, LabItem, Project, ProjectPillar, Video } from './types';

const ADMIN_EMAIL = 'helloveo333@gmail.com';
const PROJECT_PILLARS: ProjectPillar[] = [
  'AI Generated',
  'Animations & Motion',
  'Illustration & Design',
  'Art Direction',
];
const LAB_TYPES: LabItem['type'][] = ['Experiment', 'Learning', 'AI', 'Vibe'];

type AdminTab = 'projects' | 'videos' | 'labItems' | 'gallery';

type ProjectDraft = {
  title: string;
  pillar: ProjectPillar;
  subCategory: string;
  category: string;
  description: string;
  thumbnail: string;
  tools: string;
  client: string;
  globalContext: string;
  creativeTension: string;
  mariaRole: string;
  moodboardImages: string;
  outcomeVisuals: string;
  outcomeResultCopy: string;
};

type VideoDraft = {
  title: string;
  pillar: ProjectPillar;
  url: string;
  thumbnail: string;
  description: string;
};

type LabDraft = {
  title: string;
  type: LabItem['type'];
  content: string;
  image: string;
  code: string;
  tools: string;
  date: string;
};

type GalleryDraft = {
  url: string;
  pillar: ProjectPillar | '';
  tags: string;
  software: string;
  info: string;
};

type EditorNotice = {
  tone: 'success' | 'error';
  message: string;
};

const defaultProjectDraft = (): ProjectDraft => ({
  title: '',
  pillar: 'Art Direction',
  subCategory: '',
  category: '',
  description: '',
  thumbnail: '',
  tools: '',
  client: '',
  globalContext: '',
  creativeTension: '',
  mariaRole: '',
  moodboardImages: '',
  outcomeVisuals: '',
  outcomeResultCopy: '',
});

const defaultVideoDraft = (): VideoDraft => ({
  title: '',
  pillar: 'AI Generated',
  url: '',
  thumbnail: '',
  description: '',
});

const defaultLabDraft = (): LabDraft => ({
  title: '',
  type: 'Experiment',
  content: '',
  image: '',
  code: '',
  tools: '',
  date: new Date().toISOString().slice(0, 10),
});

const defaultGalleryDraft = (): GalleryDraft => ({
  url: '',
  pillar: '',
  tags: '',
  software: '',
  info: '',
});

const splitList = (value: string) =>
  value
    .split('\n')
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

const joinList = (values?: string[]) => (values ?? []).join('\n');

const toReadableError = (fallback: string, error: unknown) => {
  if (error instanceof Error && error.message) {
    return `${fallback} ${error.message}`;
  }

  return fallback;
};

const keepSelectedId = <T extends { id: string }>(items: T[], currentId: string | null) => {
  if (currentId && items.some((item) => item.id === currentId)) {
    return currentId;
  }

  return items[0]?.id ?? null;
};

function useEditorNotice() {
  const [notice, setNotice] = useState<EditorNotice | null>(null);
  const clear = useCallback(() => setNotice(null), []);
  const setError = useCallback((message: string) => setNotice({ tone: 'error', message }), []);
  const setSuccess = useCallback((message: string) => setNotice({ tone: 'success', message }), []);

  return {
    notice,
    clear,
    setError,
    setSuccess,
  };
}

function toProjectDraft(project?: Project): ProjectDraft {
  if (!project) {
    return defaultProjectDraft();
  }

  return {
    title: project.title ?? '',
    pillar: project.pillar ?? 'Art Direction',
    subCategory: project.subCategory ?? '',
    category: project.category ?? '',
    description: project.description ?? '',
    thumbnail: project.thumbnail ?? '',
    tools: joinList(project.tools),
    client: project.client ?? '',
    globalContext: project.globalContext ?? '',
    creativeTension: project.creativeTension ?? '',
    mariaRole: joinList(project.mariaRole),
    moodboardImages: joinList(project.moodboardImages),
    outcomeVisuals: joinList(project.outcomeVisuals),
    outcomeResultCopy: project.outcomeResultCopy ?? '',
  };
}

function toVideoDraft(video?: Video): VideoDraft {
  if (!video) {
    return defaultVideoDraft();
  }

  return {
    title: video.title ?? '',
    pillar: video.pillar ?? 'AI Generated',
    url: video.url ?? '',
    thumbnail: video.thumbnail ?? '',
    description: video.description ?? '',
  };
}

function toLabDraft(item?: LabItem): LabDraft {
  if (!item) {
    return defaultLabDraft();
  }

  return {
    title: item.title ?? '',
    type: item.type ?? 'Experiment',
    content: item.content ?? '',
    image: item.image ?? '',
    code: item.code ?? '',
    tools: joinList(item.tools),
    date: item.date ?? new Date().toISOString().slice(0, 10),
  };
}

function toGalleryDraft(item?: GalleryImage): GalleryDraft {
  if (!item) {
    return defaultGalleryDraft();
  }

  return {
    url: item.url ?? '',
    pillar: item.pillar ?? '',
    tags: joinList(item.tags),
    software: item.software ?? '',
    info: item.info ?? '',
  };
}

export default function AdminPanel() {
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
                setAuthError(toReadableError('Google sign-in failed.', error));
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
            <h1 className="text-4xl font-semibold md:text-5xl">Content control is back.</h1>
            <p className="mt-3 max-w-2xl text-brand-muted">
              Manage portfolio content directly in Firestore and Firebase Storage without sending the whole
              public site through a giant monolithic component again.
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

function ProjectsAdmin() {
  const [items, setItems] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProjectDraft>(defaultProjectDraft);
  const [busy, setBusy] = useState(false);
  const { notice, clear, setError, setSuccess } = useEditorNotice();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'projects'),
      (snapshot) => {
        const nextItems = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Project));
        setItems(nextItems);
        setSelectedId((currentId) => keepSelectedId(nextItems, currentId));
      },
      (error) => {
        setError(toReadableError('Could not load projects.', error));
      },
    );

    return unsubscribe;
  }, [setError]);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);

  useEffect(() => {
    setDraft(toProjectDraft(selectedItem));
  }, [selectedItem]);

  const payload = {
    title: draft.title.trim(),
    pillar: draft.pillar,
    subCategory: draft.subCategory.trim() || undefined,
    category: draft.category.trim(),
    description: draft.description.trim(),
    thumbnail: draft.thumbnail.trim(),
    images: [],
    tools: splitList(draft.tools),
    client: draft.client.trim() || undefined,
    globalContext: draft.globalContext.trim() || undefined,
    creativeTension: draft.creativeTension.trim() || undefined,
    mariaRole: splitList(draft.mariaRole),
    moodboardImages: splitList(draft.moodboardImages),
    outcomeVisuals: splitList(draft.outcomeVisuals),
    outcomeResultCopy: draft.outcomeResultCopy.trim() || undefined,
  };

  return (
    <EditorLayout
      title="Projects"
      list={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      getLabel={(item) => item.title}
      onCreate={() => {
        setSelectedId(null);
        setDraft(defaultProjectDraft());
        clear();
      }}
      notice={notice}
      form={
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Title" value={draft.title} onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))} />
          <SelectField
            label="Pillar"
            value={draft.pillar}
            options={PROJECT_PILLARS}
            onChange={(value) => setDraft((prev) => ({ ...prev, pillar: value as ProjectPillar }))}
          />
          <TextField label="Category" value={draft.category} onChange={(value) => setDraft((prev) => ({ ...prev, category: value }))} />
          <TextField label="Subcategory" value={draft.subCategory} onChange={(value) => setDraft((prev) => ({ ...prev, subCategory: value }))} />
          <TextField label="Client" value={draft.client} onChange={(value) => setDraft((prev) => ({ ...prev, client: value }))} />
          <StorageImageField
            label="Thumbnail"
            pathPrefix="projects/thumbnails"
            value={draft.thumbnail}
            onChange={(value) => setDraft((prev) => ({ ...prev, thumbnail: value }))}
            onError={setError}
          />
          <LongField
            label="Description"
            value={draft.description}
            onChange={(value) => setDraft((prev) => ({ ...prev, description: value }))}
          />
          <LongField
            label="Global context"
            value={draft.globalContext}
            onChange={(value) => setDraft((prev) => ({ ...prev, globalContext: value }))}
          />
          <LongField
            label="Creative tension"
            value={draft.creativeTension}
            onChange={(value) => setDraft((prev) => ({ ...prev, creativeTension: value }))}
          />
          <LongField
            label="Outcome result copy"
            value={draft.outcomeResultCopy}
            onChange={(value) => setDraft((prev) => ({ ...prev, outcomeResultCopy: value }))}
          />
          <LongField
            label="Tools"
            hint="One per line or comma-separated"
            value={draft.tools}
            onChange={(value) => setDraft((prev) => ({ ...prev, tools: value }))}
          />
          <LongField
            label="Maria role"
            hint="One per line or comma-separated"
            value={draft.mariaRole}
            onChange={(value) => setDraft((prev) => ({ ...prev, mariaRole: value }))}
          />
          <LongField
            label="Moodboard images"
            hint="One image URL per line"
            value={draft.moodboardImages}
            onChange={(value) => setDraft((prev) => ({ ...prev, moodboardImages: value }))}
          />
          <LongField
            label="Outcome visuals"
            hint="One image URL per line"
            value={draft.outcomeVisuals}
            onChange={(value) => setDraft((prev) => ({ ...prev, outcomeVisuals: value }))}
          />
        </div>
      }
      actions={
        <FormActions
          busy={busy}
          onSave={async () => {
            setBusy(true);
            try {
              if (selectedId) {
                await updateDoc(doc(db, 'projects', selectedId), payload);
                setSuccess('Project changes saved.');
              } else {
                const reference = await addDoc(collection(db, 'projects'), payload);
                setSelectedId(reference.id);
                setSuccess('Project created.');
              }
            } catch (error) {
              setError(toReadableError('Could not save the project.', error));
            } finally {
              setBusy(false);
            }
          }}
          onDelete={
            selectedId
              ? async () => {
                  setBusy(true);
                  try {
                    await deleteDoc(doc(db, 'projects', selectedId));
                    setSelectedId(null);
                    setDraft(defaultProjectDraft());
                    setSuccess('Project deleted.');
                  } catch (error) {
                    setError(toReadableError('Could not delete the project.', error));
                  } finally {
                    setBusy(false);
                  }
                }
              : undefined
          }
        />
      }
    />
  );
}

function VideosAdmin() {
  const [items, setItems] = useState<Video[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<VideoDraft>(defaultVideoDraft);
  const [busy, setBusy] = useState(false);
  const { notice, clear, setError, setSuccess } = useEditorNotice();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'videos'),
      (snapshot) => {
        const nextItems = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Video));
        setItems(nextItems);
        setSelectedId((currentId) => keepSelectedId(nextItems, currentId));
      },
      (error) => {
        setError(toReadableError('Could not load videos.', error));
      },
    );

    return unsubscribe;
  }, [setError]);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);

  useEffect(() => {
    setDraft(toVideoDraft(selectedItem));
  }, [selectedItem]);

  return (
    <EditorLayout
      title="Videos"
      list={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      getLabel={(item) => item.title}
      onCreate={() => {
        setSelectedId(null);
        setDraft(defaultVideoDraft());
        clear();
      }}
      notice={notice}
      form={
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Title" value={draft.title} onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))} />
          <SelectField
            label="Pillar"
            value={draft.pillar}
            options={PROJECT_PILLARS}
            onChange={(value) => setDraft((prev) => ({ ...prev, pillar: value as ProjectPillar }))}
          />
          <TextField label="Video URL" value={draft.url} onChange={(value) => setDraft((prev) => ({ ...prev, url: value }))} />
          <StorageImageField
            label="Thumbnail"
            pathPrefix="videos/thumbnails"
            value={draft.thumbnail}
            onChange={(value) => setDraft((prev) => ({ ...prev, thumbnail: value }))}
            onError={setError}
          />
          <LongField
            label="Description"
            value={draft.description}
            onChange={(value) => setDraft((prev) => ({ ...prev, description: value }))}
          />
        </div>
      }
      actions={
        <FormActions
          busy={busy}
          onSave={async () => {
            const payload = {
              title: draft.title.trim(),
              pillar: draft.pillar,
              url: draft.url.trim(),
              thumbnail: draft.thumbnail.trim(),
              description: draft.description.trim(),
            };
            setBusy(true);
            try {
              if (selectedId) {
                await updateDoc(doc(db, 'videos', selectedId), payload);
                setSuccess('Video changes saved.');
              } else {
                const reference = await addDoc(collection(db, 'videos'), payload);
                setSelectedId(reference.id);
                setSuccess('Video created.');
              }
            } catch (error) {
              setError(toReadableError('Could not save the video.', error));
            } finally {
              setBusy(false);
            }
          }}
          onDelete={
            selectedId
              ? async () => {
                  setBusy(true);
                  try {
                    await deleteDoc(doc(db, 'videos', selectedId));
                    setSelectedId(null);
                    setDraft(defaultVideoDraft());
                    setSuccess('Video deleted.');
                  } catch (error) {
                    setError(toReadableError('Could not delete the video.', error));
                  } finally {
                    setBusy(false);
                  }
                }
              : undefined
          }
        />
      }
    />
  );
}

function LabAdmin() {
  const [items, setItems] = useState<LabItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<LabDraft>(defaultLabDraft);
  const [busy, setBusy] = useState(false);
  const { notice, clear, setError, setSuccess } = useEditorNotice();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'labItems'), orderBy('date', 'desc')),
      (snapshot) => {
        const nextItems = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as LabItem));
        setItems(nextItems);
        setSelectedId((currentId) => keepSelectedId(nextItems, currentId));
      },
      (error) => {
        setError(toReadableError('Could not load lab notes.', error));
      },
    );

    return unsubscribe;
  }, [setError]);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);

  useEffect(() => {
    setDraft(toLabDraft(selectedItem));
  }, [selectedItem]);

  return (
    <EditorLayout
      title="Lab notes"
      list={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      getLabel={(item) => item.title}
      onCreate={() => {
        setSelectedId(null);
        setDraft(defaultLabDraft());
        clear();
      }}
      notice={notice}
      form={
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label="Title" value={draft.title} onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))} />
          <SelectField
            label="Type"
            value={draft.type}
            options={LAB_TYPES}
            onChange={(value) => setDraft((prev) => ({ ...prev, type: value as LabItem['type'] }))}
          />
          <TextField label="Date" value={draft.date} onChange={(value) => setDraft((prev) => ({ ...prev, date: value }))} />
          <StorageImageField
            label="Image"
            pathPrefix="lab/images"
            value={draft.image}
            onChange={(value) => setDraft((prev) => ({ ...prev, image: value }))}
            onError={setError}
          />
          <LongField
            label="Content"
            value={draft.content}
            onChange={(value) => setDraft((prev) => ({ ...prev, content: value }))}
          />
          <LongField label="Code" value={draft.code} onChange={(value) => setDraft((prev) => ({ ...prev, code: value }))} />
          <LongField
            label="Tools"
            hint="One per line or comma-separated"
            value={draft.tools}
            onChange={(value) => setDraft((prev) => ({ ...prev, tools: value }))}
          />
        </div>
      }
      actions={
        <FormActions
          busy={busy}
          onSave={async () => {
            const payload = {
              title: draft.title.trim(),
              type: draft.type,
              content: draft.content.trim(),
              image: draft.image.trim() || undefined,
              code: draft.code.trim() || undefined,
              tools: splitList(draft.tools),
              date: draft.date.trim(),
            };
            setBusy(true);
            try {
              if (selectedId) {
                await updateDoc(doc(db, 'labItems', selectedId), payload);
                setSuccess('Lab note changes saved.');
              } else {
                const reference = await addDoc(collection(db, 'labItems'), payload);
                setSelectedId(reference.id);
                setSuccess('Lab note created.');
              }
            } catch (error) {
              setError(toReadableError('Could not save the lab note.', error));
            } finally {
              setBusy(false);
            }
          }}
          onDelete={
            selectedId
              ? async () => {
                  setBusy(true);
                  try {
                    await deleteDoc(doc(db, 'labItems', selectedId));
                    setSelectedId(null);
                    setDraft(defaultLabDraft());
                    setSuccess('Lab note deleted.');
                  } catch (error) {
                    setError(toReadableError('Could not delete the lab note.', error));
                  } finally {
                    setBusy(false);
                  }
                }
              : undefined
          }
        />
      }
    />
  );
}

function GalleryAdmin() {
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<GalleryDraft>(defaultGalleryDraft);
  const [busy, setBusy] = useState(false);
  const { notice, clear, setError, setSuccess } = useEditorNotice();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'gallery'),
      (snapshot) => {
        const nextItems = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as GalleryImage));
        setItems(nextItems);
        setSelectedId((currentId) => keepSelectedId(nextItems, currentId));
      },
      (error) => {
        setError(toReadableError('Could not load gallery items.', error));
      },
    );

    return unsubscribe;
  }, [setError]);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);

  useEffect(() => {
    setDraft(toGalleryDraft(selectedItem));
  }, [selectedItem]);

  return (
    <EditorLayout
      title="Gallery"
      list={items}
      selectedId={selectedId}
      onSelect={setSelectedId}
      getLabel={(item) => item.info || item.software || item.url}
      onCreate={() => {
        setSelectedId(null);
        setDraft(defaultGalleryDraft());
        clear();
      }}
      notice={notice}
      form={
        <div className="grid gap-4 md:grid-cols-2">
          <StorageImageField
            label="Image"
            pathPrefix="gallery/images"
            value={draft.url}
            onChange={(value) => setDraft((prev) => ({ ...prev, url: value }))}
            onError={setError}
          />
          <SelectField
            label="Pillar"
            value={draft.pillar}
            options={['', ...PROJECT_PILLARS]}
            onChange={(value) => setDraft((prev) => ({ ...prev, pillar: value as ProjectPillar | '' }))}
          />
          <TextField
            label="Software"
            value={draft.software}
            onChange={(value) => setDraft((prev) => ({ ...prev, software: value }))}
          />
          <TextField label="Info" value={draft.info} onChange={(value) => setDraft((prev) => ({ ...prev, info: value }))} />
          <LongField
            label="Tags"
            hint="One per line or comma-separated"
            value={draft.tags}
            onChange={(value) => setDraft((prev) => ({ ...prev, tags: value }))}
          />
        </div>
      }
      actions={
        <FormActions
          busy={busy}
          onSave={async () => {
            const payload = {
              url: draft.url.trim(),
              pillar: draft.pillar || undefined,
              tags: splitList(draft.tags),
              software: draft.software.trim() || undefined,
              info: draft.info.trim() || undefined,
            };
            setBusy(true);
            try {
              if (selectedId) {
                await updateDoc(doc(db, 'gallery', selectedId), payload);
                setSuccess('Gallery item changes saved.');
              } else {
                const reference = await addDoc(collection(db, 'gallery'), {
                  ...payload,
                  createdAt: serverTimestamp(),
                });
                setSelectedId(reference.id);
                setSuccess('Gallery item created.');
              }
            } catch (error) {
              setError(toReadableError('Could not save the gallery item.', error));
            } finally {
              setBusy(false);
            }
          }}
          onDelete={
            selectedId
              ? async () => {
                  setBusy(true);
                  try {
                    await deleteDoc(doc(db, 'gallery', selectedId));
                    setSelectedId(null);
                    setDraft(defaultGalleryDraft());
                    setSuccess('Gallery item deleted.');
                  } catch (error) {
                    setError(toReadableError('Could not delete the gallery item.', error));
                  } finally {
                    setBusy(false);
                  }
                }
              : undefined
          }
        />
      }
    />
  );
}

function EditorLayout<T extends { id: string }>({
  title,
  list,
  selectedId,
  onSelect,
  onCreate,
  getLabel,
  notice,
  form,
  actions,
}: {
  title: string;
  list: T[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  getLabel: (item: T) => string;
  notice?: EditorNotice | null;
  form: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
      <aside className="glass rounded-[2rem] p-4">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-2 pb-4">
          <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="text-xs text-brand-muted">{list.length} entries</p>
          </div>
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em]"
          >
            <Plus size={14} />
            New
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {list.length ? (
            list.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelect(item.id)}
                className={cn(
                  'w-full rounded-2xl border px-4 py-3 text-left text-sm',
                  selectedId === item.id
                    ? 'border-brand-accent bg-brand-accent/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10',
                )}
              >
                <span className="line-clamp-2">{getLabel(item) || 'Untitled item'}</span>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-brand-muted">
              This collection is empty. Create a new entry to get started.
            </div>
          )}
        </div>
      </aside>
      <div className="glass rounded-[2rem] p-6 md:p-8">
        <div className="space-y-6">
          {notice ? <NoticeBanner notice={notice} /> : null}
          {form}
          {actions}
        </div>
      </div>
    </div>
  );
}

function FormActions({
  busy,
  onSave,
  onDelete,
}: {
  busy: boolean;
  onSave: () => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <button
        type="button"
        disabled={busy}
        onClick={onSave}
        className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-bg disabled:opacity-70"
      >
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
        Save
      </button>
      {onDelete ? (
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-300 disabled:opacity-70"
        >
          <Trash2 size={16} />
          Delete
        </button>
      ) : null}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs uppercase tracking-[0.25em] text-brand-muted">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-brand-accent"
      />
    </label>
  );
}

function LongField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs uppercase tracking-[0.25em] text-brand-muted">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-brand-accent"
      />
      {hint ? <span className="text-xs text-brand-muted">{hint}</span> : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs uppercase tracking-[0.25em] text-brand-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-brand-accent"
      >
        {options.map((option) => (
          <option key={option || 'empty'} value={option}>
            {option || 'None'}
          </option>
        ))}
      </select>
    </label>
  );
}

function StorageImageField({
  label,
  pathPrefix,
  value,
  onChange,
  onError,
}: {
  label: string;
  pathPrefix: string;
  value: string;
  onChange: (value: string) => void;
  onError?: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    try {
      setUploadError(null);
      const storageRef = ref(storage, `${pathPrefix}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onChange(url);
    } catch (error) {
      const message = toReadableError('Upload failed.', error);
      setUploadError(message);
      onError?.(message);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <label className="space-y-2">
      <span className="text-xs uppercase tracking-[0.25em] text-brand-muted">{label}</span>
      <div className="flex flex-wrap gap-3">
        <input
          value={value}
          onChange={(event) => {
            setUploadError(null);
            onChange(event.target.value);
          }}
          className="min-w-[240px] flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-brand-accent"
          placeholder="Paste a URL or upload a file"
        />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm">
          {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          Upload
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      </div>
      {value ? (
        <div className="overflow-hidden rounded-2xl border border-white/10">
          <img src={value} alt="" className="aspect-[16/9] w-full max-w-sm object-cover" />
        </div>
      ) : null}
      {uploadError ? <p className="text-xs text-red-300">{uploadError}</p> : null}
    </label>
  );
}

function NoticeBanner({ notice }: { notice: EditorNotice }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[1.25rem] border px-4 py-3 text-sm',
        notice.tone === 'error'
          ? 'border-red-500/20 bg-red-500/10 text-red-100'
          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
      )}
    >
      {notice.tone === 'error' ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={16} className="mt-0.5 shrink-0" />}
      <p>{notice.message}</p>
    </div>
  );
}

function CenteredCard({
  title,
  body,
  action,
  loading = false,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  loading?: boolean;
}) {
  return (
    <section className="section-shell py-24">
      <div className="glass mx-auto max-w-xl rounded-[2rem] p-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
          {loading ? <LoaderCircle className="animate-spin text-brand-accent" /> : <Check className="text-brand-accent" />}
        </div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-4 leading-8 text-brand-muted">{body}</p>
        {action ? <div className="mt-8 flex justify-center">{action}</div> : null}
      </div>
    </section>
  );
}

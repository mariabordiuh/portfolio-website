import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { EntryStatus, GalleryImage, LabItem, Project, ProjectPillar, Video } from '../types';
import { normalizePillar, uniqueStrings } from '../utils/portfolio';

export const ADMIN_EMAIL = 'helloveo333@gmail.com';
export const PROJECT_PILLARS: ProjectPillar[] = [
  'AI Generated',
  'Animation & Motion',
  'Illustration & Design',
  'Art Direction',
];
export const LAB_TYPES: LabItem['type'][] = ['Experiment', 'Learning', 'AI', 'Vibe', 'Thoughts'];
export const VIDEO_TYPES = ['Traditional', 'Cut-Out', 'Motion'] as const;
export const ENTRY_STATUS_OPTIONS: EntryStatus[] = ['draft', 'published'];

export type AdminTab = 'projects' | 'videos' | 'labItems' | 'gallery';

export type ProjectDraft = {
  title: string;
  pillar: ProjectPillar;
  status: EntryStatus;
  subCategory: string;
  category: string;
  description: string;
  tools: string;
  heroImage: string;
  heroZoom: string;
  heroPositionX: string;
  heroPositionY: string;
  thumbnail: string;
  thumbnailZoom: string;
  year: string;
  client: string;
  timeline: string;
  role: string;
  brief: string;
  context: string;
  problem: string;
  insights: string;
  solution: string;
  outcome: string;
  globalContext: string;
  creativeTension: string;
  approach: string;
  moodboardImages: string;
  sketchImages: string;
  childhoodImages: string;
  universityImages: string;
  workImages: string;
  explorationType: 'masonry' | 'slot-machine';
  slotMachineGridSize: string;
  slotMachineFps: string;
  explorationImages: string;
  explorationVideos: string;
  animaticVideoUrls: string;
  outcomeImages: string;
  outcomeResultCopy: string;
  credits: string;
  featured: boolean;
  workPriorityRank: string;
};

export type VideoDraft = {
  title: string;
  pillar: ProjectPillar;
  status: EntryStatus;
  subCategory: string;
  url: string;
  sourceUrl: string;
  thumbnail: string;
  description: string;
  tools: string;
  tags: string;
  featured: boolean;
  workPriorityRank: string;
};

export type LabDraft = {
  title: string;
  status: EntryStatus;
  type: LabItem['type'];
  content: string;
  thumbnail: string;
  heroImage: string;
  slug: string;
  readingTime: string;
  category: string;
  excerpt: string;
  author: string;
  bodyMarkdown: string;
  bodyImageUrl: string;
  bodyImageAlt: string;
  image: string;
  code: string;
  tools: string;
  date: string;
  // Case study fields
  timeline: string;
  role: string;
  brief: string;
  context: string;
  problem: string;
  insights: string;
  solution: string;
  outcome: string;
  labImages: import('../types').LabImage[];
};

export type GalleryDraft = {
  url: string;
  status: EntryStatus;
  pillar: ProjectPillar | '';
  tags: string;
  software: string;
  info: string;
  featured: boolean;
  workPriorityRank: string;
};

export type EditorNotice = {
  tone: 'success' | 'error';
  message: string;
};

export type ChecklistItem = {
  label: string;
  done: boolean;
};

export const defaultProjectDraft = (): ProjectDraft => ({
  title: '',
  pillar: 'Art Direction',
  status: 'draft',
  subCategory: '',
  category: '',
  description: '',
  tools: '',
  heroImage: '',
  heroZoom: '100',
  heroPositionX: '50',
  heroPositionY: '50',
  thumbnail: '',
  thumbnailZoom: '100',
  year: '',
  client: '',
  timeline: '',
  role: '',
  brief: '',
  context: '',
  problem: '',
  insights: '',
  solution: '',
  outcome: '',
  globalContext: '',
  creativeTension: '',
  approach: '',
  moodboardImages: '',
  sketchImages: '',
  childhoodImages: '',
  universityImages: '',
  workImages: '',
  explorationType: 'masonry',
  slotMachineGridSize: '4',
  slotMachineFps: '12',
  explorationImages: '',
  explorationVideos: '',
  animaticVideoUrls: '',
  outcomeImages: '',
  outcomeResultCopy: '',
  credits: '',
  featured: false,
  workPriorityRank: '',
});

export const defaultVideoDraft = (): VideoDraft => ({
  title: '',
  pillar: 'AI Generated',
  status: 'draft',
  subCategory: '',
  url: '',
  sourceUrl: '',
  thumbnail: '',
  description: '',
  tools: '',
  tags: '',
  featured: false,
  workPriorityRank: '',
});

export const defaultLabDraft = (): LabDraft => ({
  title: '',
  status: 'draft',
  type: 'Experiment',
  content: '',
  thumbnail: '',
  heroImage: '',
  slug: '',
  readingTime: '',
  category: '',
  excerpt: '',
  author: 'Maria Bordiuh',
  bodyMarkdown: '',
  bodyImageUrl: '',
  bodyImageAlt: '',
  image: '',
  code: '',
  tools: '',
  date: new Date().toISOString().slice(0, 10),
  timeline: '',
  role: '',
  brief: '',
  context: '',
  problem: '',
  insights: '',
  solution: '',
  outcome: '',
  labImages: [],
});

export const defaultGalleryDraft = (): GalleryDraft => ({
  url: '',
  status: 'draft',
  pillar: '',
  tags: '',
  software: '',
  info: '',
  featured: false,
  workPriorityRank: '',
});

export const splitList = (value: string) =>
  value
    .split('\n')
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

export const joinList = (values?: string[]) => (values ?? []).join('\n');

export const trimValue = (value: string) => value.trim();

export const rankSuggestions = (values: Array<string | null | undefined>, limit = 12) => {
  const counts = new Map<string, number>();

  for (const rawValue of values) {
    const value = rawValue?.trim();
    if (!value) {
      continue;
    }

    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) {
        return right[1] - left[1];
      }

      return left[0].localeCompare(right[0]);
    })
    .slice(0, limit)
    .map(([value]) => value);
};

export const toReadableError = (fallback: string, error: unknown) => {
  if (error instanceof Error && error.message) {
    return `${fallback} ${error.message}`;
  }

  return fallback;
};

export const keepSelectedId = <T extends { id: string }>(
  items: T[],
  currentId: string | null,
  preserveEmptySelection = false,
) => {
  if (currentId && items.some((item) => item.id === currentId)) {
    return currentId;
  }

  if (preserveEmptySelection) {
    return null;
  }

  return items[0]?.id ?? null;
};

const serializeDraft = <T,>(draft: T) => JSON.stringify(draft);
const DRAFT_STORAGE_PREFIX = 'portfolio-admin-draft';

export const confirmDiscardChanges = () =>
  typeof window === 'undefined'
    ? true
    : window.confirm('You have unsaved changes. Switch anyway and lose this draft?');

export const confirmDelete = (label: string) =>
  typeof window === 'undefined' ? true : window.confirm(`Delete ${label}? This cannot be undone.`);

export const getEditorDraftStorageKey = (
  editor: string,
  selectedId: string | null,
  isCreatingNew: boolean,
) => `${DRAFT_STORAGE_PREFIX}:${editor}:${isCreatingNew ? 'new' : selectedId ?? 'none'}`;

type PersistedEditorDraft<T> = {
  draft: T;
  savedAt: number;
};

export function readPersistedEditorDraft<T>(storageKey: string): PersistedEditorDraft<T> | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedEditorDraft<T>;
    if (!parsed || typeof parsed !== 'object' || !('draft' in parsed)) {
      return null;
    }

    return parsed;
  } catch (_error) {
    return null;
  }
}

export function writePersistedEditorDraft<T>(storageKey: string, draft: T) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        draft,
        savedAt: Date.now(),
      } satisfies PersistedEditorDraft<T>),
    );
  } catch (_error) {
    // Ignore local draft write failures.
  }
}

export function clearPersistedEditorDraft(storageKey: string) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch (_error) {
    // Ignore local draft cleanup failures.
  }
}

export function formatRelativeTime(timestamp: number | null) {
  if (!timestamp) {
    return null;
  }

  const diff = Date.now() - timestamp;

  if (diff < 30_000) {
    return 'just now';
  }

  const minutes = Math.floor(diff / 60_000);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function useEditorNotice() {
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

export function useUnsavedChangesWarning(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled]);
}

export function useSaveShortcut(enabled: boolean, onSave: () => Promise<void>) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (!event.key || event.key.toLowerCase() !== 's' || (!event.metaKey && !event.ctrlKey)) {
        return;
      }

      event.preventDefault();
      void onSave();
    };

    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [enabled, onSave]);
}

export function useEditorProgress<T>({
  draft,
  baselineDraft,
  checklist,
}: {
  draft: T;
  baselineDraft: T;
  checklist: ChecklistItem[];
}) {
  const isDirty = useMemo(
    () => serializeDraft(draft) !== serializeDraft(baselineDraft),
    [draft, baselineDraft],
  );
  const missingFields = useMemo(
    () => checklist.filter((item) => !item.done).map((item) => item.label),
    [checklist],
  );
  const completedCount = useMemo(
    () => checklist.filter((item) => item.done).length,
    [checklist],
  );

  return {
    isDirty,
    missingFields,
    completedCount,
    totalCount: checklist.length,
  };
}

export function toProjectDraft(project?: Project): ProjectDraft {
  if (!project) {
    return defaultProjectDraft();
  }

  const rawCredits = (project.credits ?? []) as unknown[];
  const credits = rawCredits.map((entry) => {
    if (typeof entry === 'string') {
      return entry;
    }

    const credit = entry as { name?: string; role?: string };
    return [credit.name?.trim(), credit.role?.trim()].filter(Boolean).join(' - ');
  });

  const primaryImage =
    project.heroImage ||
    project.thumbnail ||
    project.images?.[0] ||
    project.moodboardImages?.[0] ||
    project.outcomeImages?.[0] ||
    project.outcomeVisuals?.[0] ||
    '';

  return {
    title: project.title ?? '',
    pillar: project.pillar ?? 'Art Direction',
    status: project.status ?? 'published',
    subCategory: project.subCategory ?? '',
    category: project.category || project.categories?.join(', ') || '',
    description: project.description || project.approach || '',
    tools: joinList(project.tools),
    heroImage: project.heroImage || project.thumbnail || primaryImage,
    heroZoom: String(project.heroZoom ?? 100),
    heroPositionX: String(project.heroPositionX ?? 50),
    heroPositionY: String(project.heroPositionY ?? 50),
    thumbnail: project.thumbnail || project.heroImage || primaryImage,
    thumbnailZoom: String(project.thumbnailZoom ?? 100),
    year: project.year || '',
    client: project.client || '',
    timeline: project.timelineText || '',
    role: project.role || uniqueStrings(project.mariaRole).join(' / '),
    brief: project.brief || '',
    context: project.context || project.globalContext || '',
    problem: project.problem || project.creativeTension || '',
    insights: project.insights || '',
    solution: project.solution || project.approach || '',
    outcome:
      project.outcome || project.outcomeCopy || project.outcomeResultCopy || project.result || '',
    globalContext: project.globalContext || '',
    creativeTension: project.creativeTension || '',
    approach: project.approach || project.description || '',
    moodboardImages: joinList(project.moodboardImages),
    sketchImages: joinList(project.sketchImages),
    childhoodImages: joinList(project.childhoodImages),
    universityImages: joinList(project.universityImages),
    workImages: joinList(project.workImages),
    explorationType: project.explorationType ?? 'masonry',
    slotMachineGridSize: String(project.slotMachineGridSize ?? 4),
    slotMachineFps: String(project.slotMachineFps ?? 12),
    explorationImages: joinList(project.explorationImages),
    explorationVideos: joinList(project.explorationVideos),
    animaticVideoUrls: joinList(
      project.animaticVideoUrls?.length
        ? project.animaticVideoUrls
        : project.animaticVideoUrl
          ? [project.animaticVideoUrl]
          : [],
    ),
    outcomeImages: joinList(project.outcomeImages?.length ? project.outcomeImages : project.outcomeVisuals),
    outcomeResultCopy: project.outcomeCopy || project.outcomeResultCopy || project.result || '',
    credits: joinList(credits),
    featured: project.featured ?? false,
    workPriorityRank: project.workPriorityRank ? String(project.workPriorityRank) : '',
  };
}

export function toVideoDraft(video?: Video): VideoDraft {
  if (!video) {
    return defaultVideoDraft();
  }

  return {
    title: video.title ?? '',
    pillar: normalizePillar(video.pillar),
    status: video.status ?? 'published',
    subCategory: video.subCategory ?? '',
    url: video.url ?? '',
    sourceUrl: video.sourceUrl ?? '',
    thumbnail: video.thumbnail ?? '',
    description: video.description ?? '',
    tools: joinList(video.tools),
    tags: joinList(video.tags),
    featured: video.featured ?? false,
    workPriorityRank: video.workPriorityRank ? String(video.workPriorityRank) : '',
  };
}

export function toLabDraft(item?: LabItem): LabDraft {
  if (!item) {
    return defaultLabDraft();
  }

  return {
    title: item.title ?? '',
    status: item.status ?? 'published',
    type: item.type ?? 'Experiment',
    content: item.content ?? '',
    thumbnail: item.thumbnail ?? item.image ?? '',
    heroImage: item.heroImage ?? item.thumbnail ?? item.image ?? '',
    slug: item.slug ?? '',
    readingTime: item.readingTime ?? '',
    category: item.category ?? '',
    excerpt: item.excerpt ?? '',
    author: item.author ?? 'Maria Bordiuh',
    bodyMarkdown: item.bodyMarkdown ?? '',
    bodyImageUrl: item.bodyImage?.url ?? '',
    bodyImageAlt: item.bodyImage?.alt ?? '',
    image: item.image ?? item.thumbnail ?? item.heroImage ?? '',
    code: item.code ?? '',
    tools: joinList(item.tools),
    date: item.date ?? new Date().toISOString().slice(0, 10),
    timeline: item.timeline ?? '',
    role: item.role ?? '',
    brief: item.brief ?? '',
    context: item.context ?? '',
    problem: item.problem ?? '',
    insights: item.insights ?? '',
    solution: item.solution ?? '',
    outcome: item.outcome ?? '',
    labImages: item.labImages ?? [],
  };
}

export function toGalleryDraft(item?: GalleryImage): GalleryDraft {
  if (!item) {
    return defaultGalleryDraft();
  }

  return {
    url: item.url ?? '',
    status: item.status ?? 'published',
    pillar: item.pillar ? normalizePillar(item.pillar) : '',
    tags: joinList(item.tags),
    software: item.software ?? '',
    info: item.info ?? '',
    featured: item.featured ?? false,
    workPriorityRank: item.workPriorityRank ? String(item.workPriorityRank) : '',
  };
}

export type EditorLayoutProps<T extends { id: string }> = {
  title: string;
  description: string;
  list: T[];
  selectedId: string | null;
  hasUnsavedChanges: boolean;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  createOptions?: Array<{
    label: string;
    description?: string;
    onSelect: () => void;
  }>;
  getLabel: (item: T) => string;
  getMeta?: (item: T) => string | undefined;
  notice?: EditorNotice | null;
  statusPanel: ReactNode;
  form: ReactNode;
  actions: ReactNode;
  sidebarFooter?: ReactNode;
  batchSelection?: string[];
  onBatchSelectionChange?: (ids: string[]) => void;
  batchPanel?: ReactNode;
};

export type EditorStatusPanelProps = {
  title: string;
  description: string;
  checklist: ChecklistItem[];
  completedCount: number;
  totalCount: number;
  missingFields: string[];
  isDirty: boolean;
  lastSavedAt: number | null;
  hasOptionalFields?: boolean;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  localDraftSavedAt?: number | null;
  publishStatus?: EntryStatus;
};

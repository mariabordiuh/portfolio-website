import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { GalleryImage, LabItem, Project, ProjectPillar, Video } from '../types';

export const ADMIN_EMAIL = 'helloveo333@gmail.com';
export const PROJECT_PILLARS: ProjectPillar[] = [
  'AI Generated',
  'Animations & Motion',
  'Illustration & Design',
  'Art Direction',
];
export const LAB_TYPES: LabItem['type'][] = ['Experiment', 'Learning', 'AI', 'Vibe'];

export type AdminTab = 'projects' | 'videos' | 'labItems' | 'gallery';

export type ProjectDraft = {
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

export type VideoDraft = {
  title: string;
  pillar: ProjectPillar;
  url: string;
  thumbnail: string;
  description: string;
};

export type LabDraft = {
  title: string;
  type: LabItem['type'];
  content: string;
  image: string;
  code: string;
  tools: string;
  date: string;
};

export type GalleryDraft = {
  url: string;
  pillar: ProjectPillar | '';
  tags: string;
  software: string;
  info: string;
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

export const defaultVideoDraft = (): VideoDraft => ({
  title: '',
  pillar: 'AI Generated',
  url: '',
  thumbnail: '',
  description: '',
});

export const defaultLabDraft = (): LabDraft => ({
  title: '',
  type: 'Experiment',
  content: '',
  image: '',
  code: '',
  tools: '',
  date: new Date().toISOString().slice(0, 10),
});

export const defaultGalleryDraft = (): GalleryDraft => ({
  url: '',
  pillar: '',
  tags: '',
  software: '',
  info: '',
});

export const splitList = (value: string) =>
  value
    .split('\n')
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

export const joinList = (values?: string[]) => (values ?? []).join('\n');

export const trimValue = (value: string) => value.trim();

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

export const confirmDiscardChanges = () =>
  typeof window === 'undefined'
    ? true
    : window.confirm('You have unsaved changes. Switch anyway and lose this draft?');

export const confirmDelete = (label: string) =>
  typeof window === 'undefined' ? true : window.confirm(`Delete ${label}? This cannot be undone.`);

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

export function toVideoDraft(video?: Video): VideoDraft {
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

export function toLabDraft(item?: LabItem): LabDraft {
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

export function toGalleryDraft(item?: GalleryImage): GalleryDraft {
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

export type EditorLayoutProps<T extends { id: string }> = {
  title: string;
  description: string;
  list: T[];
  selectedId: string | null;
  hasUnsavedChanges: boolean;
  onSelect: (id: string | null) => void;
  onCreate: () => void;
  getLabel: (item: T) => string;
  getMeta?: (item: T) => string | undefined;
  notice?: EditorNotice | null;
  statusPanel: ReactNode;
  form: ReactNode;
  actions: ReactNode;
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
};

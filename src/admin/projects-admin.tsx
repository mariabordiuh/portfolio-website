import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase-firestore';
import { DataContext } from '../context/DataContext';
import { Project, ProjectPillar } from '../types';
import {
  ChecklistItem,
  ENTRY_STATUS_OPTIONS,
  ProjectDraft,
  PROJECT_PILLARS,
  clearPersistedEditorDraft,
  confirmDelete,
  defaultProjectDraft,
  getEditorDraftStorageKey,
  keepSelectedId,
  rankSuggestions,
  readPersistedEditorDraft,
  splitList,
  toProjectDraft,
  toReadableError,
  trimValue,
  useEditorNotice,
  useEditorProgress,
  useSaveShortcut,
  useUnsavedChangesWarning,
  writePersistedEditorDraft,
} from './admin-logic';
import {
  EditorLayout,
  EditorSection,
  EditorStatusPanel,
  FormActions,
  LongField,
  NumberField,
  SelectField,
  StorageImageField,
  TextField,
  ToggleField,
} from './admin-ui';

const dedupe = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const STORY_IMAGE_GROUPS = [
  { key: 'childhoodImages', label: 'Childhood' },
  { key: 'universityImages', label: 'University' },
  { key: 'workImages', label: 'Work' },
] as const;

type StoryImageGroupKey = (typeof STORY_IMAGE_GROUPS)[number]['key'];
type ProjectImageGroupKey =
  | 'moodboardImages'
  | 'sketchImages'
  | 'childhoodImages'
  | 'universityImages'
  | 'workImages'
  | 'explorationImages'
  | 'outcomeImages';

const moveListItem = (items: string[], index: number, direction: -1 | 1) => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const next = [...items];
  const [moved] = next.splice(index, 1);
  next.splice(targetIndex, 0, moved);
  return next;
};

function ImageListOrganizer({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const images = splitList(value);

  const updateImages = (nextImages: string[]) => {
    onChange(nextImages.join('\n'));
  };

  if (!images.length) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs uppercase tracking-[0.25em] text-brand-muted">{label} order</p>
      <div className="space-y-3">
        {images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="space-y-3 rounded-[1rem] border border-white/10 bg-black/10 p-3"
          >
            <img
              src={image}
              alt={label}
              className="aspect-video w-full rounded-[0.85rem] object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="flex flex-wrap gap-2">
              <a
                href={image}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white"
              >
                Open
              </a>
              <button
                type="button"
                onClick={() => updateImages(moveListItem(images, index, -1))}
                disabled={index === 0}
                className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Move up
              </button>
              <button
                type="button"
                onClick={() => updateImages(moveListItem(images, index, 1))}
                disabled={index === images.length - 1}
                className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Move down
              </button>
              <button
                type="button"
                onClick={() => updateImages(images.filter((_, imageIndex) => imageIndex !== index))}
                className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CaseImageOrganizer({
  groups,
  draft,
  onChange,
}: {
  groups: Array<{ key: ProjectImageGroupKey; label: string }>;
  draft: ProjectDraft;
  onChange: (next: Partial<ProjectDraft>) => void;
}) {
  const groupedImages = useMemo(
    () =>
      groups.map((group) => ({
        ...group,
        images: splitList(draft[group.key]),
      })),
    [draft, groups],
  );

  const totalImages = groupedImages.reduce((sum, group) => sum + group.images.length, 0);

  const moveImage = (url: string, from: ProjectImageGroupKey, to: ProjectImageGroupKey) => {
    if (from === to) {
      return;
    }

    const source = splitList(draft[from]).filter((entry) => entry !== url);
    const target = dedupe([...splitList(draft[to]), url]);

    onChange({
      [from]: source.join('\n'),
      [to]: target.join('\n'),
    });
  };

  const reorderImage = (group: ProjectImageGroupKey, index: number, direction: -1 | 1) => {
    const next = moveListItem(splitList(draft[group]), index, direction);
    onChange({
      [group]: next.join('\n'),
    });
  };

  const removeImage = (group: ProjectImageGroupKey, index: number) => {
    const next = splitList(draft[group]).filter((_, imageIndex) => imageIndex !== index);
    onChange({
      [group]: next.join('\n'),
    });
  };

  if (!totalImages) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-muted">Case image organizer</p>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          Reorder images or move them between case-study sections without editing URLs by hand.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {groupedImages.map((group) => (
          <div key={group.key} className="space-y-3 rounded-[1.25rem] border border-white/10 bg-black/10 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-accent">
              {group.label}
            </p>
            {group.images.length ? (
              group.images.map((image, index) => (
                <div key={`${image}-${index}`} className="space-y-2 rounded-[1rem] border border-white/10 bg-white/5 p-2">
                  <img
                    src={image}
                    alt={group.label}
                    className="aspect-video w-full rounded-[0.85rem] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={image}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => reorderImage(group.key, index, -1)}
                      disabled={index === 0}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => reorderImage(group.key, index, 1)}
                      disabled={index === group.images.length - 1}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Down
                    </button>
                    {groups.filter((target) => target.key !== group.key).map((target) => (
                      <button
                        key={target.key}
                        type="button"
                        onClick={() => moveImage(image, group.key, target.key)}
                        className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white"
                      >
                        Move to {target.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => removeImage(group.key, index)}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1rem] border border-dashed border-white/10 bg-white/5 px-3 py-4 text-xs text-brand-muted">
                No images here yet.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryImageOrganizer({
  draft,
  onChange,
}: {
  draft: ProjectDraft;
  onChange: (next: Partial<ProjectDraft>) => void;
}) {
  const groupedImages = useMemo(
    () =>
      STORY_IMAGE_GROUPS.map((group) => ({
        ...group,
        images: splitList(draft[group.key]),
      })),
    [draft],
  );

  const moveImage = (url: string, from: StoryImageGroupKey, to: StoryImageGroupKey) => {
    if (from === to) {
      return;
    }

    const source = splitList(draft[from]).filter((entry) => entry !== url);
    const target = dedupe([...splitList(draft[to]), url]);

    onChange({
      [from]: source.join('\n'),
      [to]: target.join('\n'),
    });
  };

  const reorderImage = (group: StoryImageGroupKey, index: number, direction: -1 | 1) => {
    const next = moveListItem(splitList(draft[group]), index, direction);
    onChange({
      [group]: next.join('\n'),
    });
  };

  const removeImage = (group: StoryImageGroupKey, index: number) => {
    const next = splitList(draft[group]).filter((_, imageIndex) => imageIndex !== index);
    onChange({
      [group]: next.join('\n'),
    });
  };

  const totalImages = groupedImages.reduce((sum, group) => sum + group.images.length, 0);

  if (!totalImages) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-brand-muted">Story image organizer</p>
        <p className="mt-2 text-sm leading-6 text-brand-muted">
          Move images between Childhood, University, and Work without manually editing the URL lists.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {groupedImages.map((group) => (
          <div key={group.key} className="space-y-3 rounded-[1.25rem] border border-white/10 bg-black/10 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-accent">
              {group.label}
            </p>
            {group.images.length ? (
              group.images.map((image, index) => (
                <div key={`${image}-${index}`} className="space-y-2 rounded-[1rem] border border-white/10 bg-white/5 p-2">
                  <img
                    src={image}
                    alt={group.label}
                    className="aspect-video w-full rounded-[0.85rem] object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={image}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white"
                    >
                      Open
                    </a>
                    <button
                      type="button"
                      onClick={() => reorderImage(group.key, index, -1)}
                      disabled={index === 0}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => reorderImage(group.key, index, 1)}
                      disabled={index === group.images.length - 1}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Down
                    </button>
                    {STORY_IMAGE_GROUPS.filter((target) => target.key !== group.key).map((target) => (
                      <button
                        key={target.key}
                        type="button"
                        onClick={() => moveImage(image, group.key, target.key)}
                        className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white"
                      >
                        Move to {target.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => removeImage(group.key, index)}
                      className="rounded-full border border-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[1rem] border border-dashed border-white/10 bg-white/5 px-3 py-4 text-xs text-brand-muted">
                No images here yet.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProjectsAdmin() {
  const { projects, videos, labItems, galleryImages } = useContext(DataContext);
  const [items, setItems] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draft, setDraft] = useState<ProjectDraft>(defaultProjectDraft);
  const [busy, setBusy] = useState(false);
  const [activeUploads, setActiveUploads] = useState<string[]>([]);
  const [focusMode, setFocusMode] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState<number | null>(null);
  const [batchSelection, setBatchSelection] = useState<string[]>([]);
  const [batchPillar, setBatchPillar] = useState<string>('');
  const [batchStatus, setBatchStatus] = useState('');
  const [batchFeatured, setBatchFeatured] = useState<'keep' | 'on' | 'off'>('keep');
  const [batchCategory, setBatchCategory] = useState('');
  const [batchTools, setBatchTools] = useState('');
  const { notice, clear, setError, setSuccess } = useEditorNotice();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'projects'),
      (snapshot) => {
        const nextItems = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Project));
        setItems(nextItems);
        setSelectedId((currentId) => keepSelectedId(nextItems, currentId, isCreatingNew));
      },
      (error) => {
        setError(toReadableError('Could not load projects.', error));
      },
    );

    return unsubscribe;
  }, [isCreatingNew, setError]);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);
  const isArtDirection = draft.pillar === 'Art Direction';
  const draftStorageKey = useMemo(
    () => getEditorDraftStorageKey('projects', selectedId, isCreatingNew),
    [isCreatingNew, selectedId],
  );
  const baselineDraft = useMemo(() => {
    if (isCreatingNew) {
      return defaultProjectDraft();
    }

    if (selectedId && !selectedItem) {
      return draft;
    }

    return toProjectDraft(selectedItem);
  }, [isCreatingNew, selectedItem]);

  const previousSelectionRef = useRef<{ selectedId: string | null; isCreatingNew: boolean }>({
    selectedId,
    isCreatingNew,
  });
  useEffect(() => {
    const previousSelection = previousSelectionRef.current;
    const selectionChanged =
      previousSelection.selectedId !== selectedId ||
      previousSelection.isCreatingNew !== isCreatingNew;

    if (selectionChanged || !isDirtyRef.current) {
      const persisted = readPersistedEditorDraft<ProjectDraft>(draftStorageKey);
      if (persisted) {
        setDraft(persisted.draft);
        setLocalDraftSavedAt(persisted.savedAt);
        if (selectionChanged) {
          setSuccess('Recovered a local draft so you can keep going.');
        }
      } else {
        setDraft(baselineDraft);
        setLocalDraftSavedAt(null);
      }
    }

    previousSelectionRef.current = { selectedId, isCreatingNew };
  }, [baselineDraft, draftStorageKey, isCreatingNew, selectedId, setSuccess]);

  const checklist = useMemo<ChecklistItem[]>(
    () =>
      isArtDirection
        ? [
            { label: 'Title', done: Boolean(trimValue(draft.title)) },
            { label: 'Categories / tags', done: Boolean(trimValue(draft.category)) },
            {
              label: 'Intro copy',
              done: Boolean(trimValue(draft.description) || trimValue(draft.approach)),
            },
            {
              label: 'Hero image',
              done: Boolean(trimValue(draft.heroImage) || trimValue(draft.thumbnail)),
            },
            { label: 'Context', done: Boolean(trimValue(draft.context)) },
            { label: 'Problem or brief', done: Boolean(trimValue(draft.problem) || trimValue(draft.brief)) },
            { label: 'Solution', done: Boolean(trimValue(draft.solution)) },
            { label: 'Outcome', done: Boolean(trimValue(draft.outcome)) },
          ]
        : [
            { label: 'Title', done: Boolean(trimValue(draft.title)) },
            { label: 'Category', done: Boolean(trimValue(draft.category)) },
            { label: 'Description', done: Boolean(trimValue(draft.description)) },
            { label: 'Thumbnail', done: Boolean(trimValue(draft.thumbnail)) },
          ],
    [draft, isArtDirection],
  );
  const { isDirty, missingFields, completedCount, totalCount } = useEditorProgress({
    draft,
    baselineDraft,
    checklist,
  });
  const isDirtyRef = useRef(false);
  useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);
  useEffect(() => {
    if (!isDirty) {
      clearPersistedEditorDraft(draftStorageKey);
      setLocalDraftSavedAt(null);
      return;
    }

    writePersistedEditorDraft(draftStorageKey, draft);
    setLocalDraftSavedAt(Date.now());
  }, [draft, draftStorageKey, isDirty]);
  const payload = useMemo(() => {
    const title = trimValue(draft.title);
    const categories = dedupe(splitList(draft.category));
    const description = trimValue(draft.description) || trimValue(draft.approach);
    const heroImage = trimValue(draft.heroImage) || trimValue(draft.thumbnail);
    const heroZoomRaw = Number(draft.heroZoom || '100');
    const heroZoom = Number.isFinite(heroZoomRaw)
      ? Math.min(200, Math.max(100, heroZoomRaw))
      : 100;
    const heroPositionXRaw = Number(draft.heroPositionX || '50');
    const heroPositionX = Number.isFinite(heroPositionXRaw)
      ? Math.min(100, Math.max(0, heroPositionXRaw))
      : 50;
    const heroPositionYRaw = Number(draft.heroPositionY || '50');
    const heroPositionY = Number.isFinite(heroPositionYRaw)
      ? Math.min(100, Math.max(0, heroPositionYRaw))
      : 50;
    const thumbnail = trimValue(draft.thumbnail) || heroImage;
    const thumbnailZoomRaw = Number(draft.thumbnailZoom || '100');
    const thumbnailZoom = Number.isFinite(thumbnailZoomRaw)
      ? Math.min(200, Math.max(100, thumbnailZoomRaw))
      : 100;
    const workPriorityRank = draft.workPriorityRank ? Number(draft.workPriorityRank) : null;
    const basePayload = {
      title,
      pillar: draft.pillar,
      status: draft.status,
      subCategory: trimValue(draft.subCategory) || undefined,
      category: categories.join(', ') || trimValue(draft.category),
      categories,
      description,
      thumbnail,
      thumbnailZoom,
      heroZoom,
      heroPositionX,
      heroPositionY,
      heroImage: heroImage || undefined,
      images: [],
      tools: splitList(draft.tools),
      year: trimValue(draft.year) || undefined,
      client: trimValue(draft.client) || undefined,
      role: trimValue(draft.role) || undefined,
      featured: draft.featured,
      workPriorityRank,
    };

    if (!isArtDirection) {
      return basePayload;
    }

    const outcomeImages = splitList(draft.outcomeImages);
    const timelineText = trimValue(draft.timeline);
    const brief = trimValue(draft.brief);
    const context = trimValue(draft.context);
    const problem = trimValue(draft.problem);
    const insights = trimValue(draft.insights);
    const solution = trimValue(draft.solution) || trimValue(draft.approach) || trimValue(draft.description);
    const outcome = trimValue(draft.outcome) || trimValue(draft.outcomeResultCopy);
    const explorationType = draft.explorationType;

    return {
      ...basePayload,
      contentType: 'art-direction' as const,
      timelineText: timelineText || undefined,
      brief: brief || undefined,
      context: context || undefined,
      problem: problem || undefined,
      insights: insights || undefined,
      solution: solution || undefined,
      outcome: outcome || undefined,
      globalContext: context || trimValue(draft.globalContext) || undefined,
      creativeTension: problem || brief || trimValue(draft.creativeTension) || undefined,
      approach: solution || trimValue(draft.approach) || trimValue(draft.description) || undefined,
      moodboardImages: splitList(draft.moodboardImages),
      sketchImages: splitList(draft.sketchImages),
      childhoodImages: splitList(draft.childhoodImages),
      universityImages: splitList(draft.universityImages),
      workImages: splitList(draft.workImages),
      explorationType,
      slotMachineGridSize: Number(draft.slotMachineGridSize || '4'),
      slotMachineFps: Number(draft.slotMachineFps || '12'),
      explorationImages: explorationType === 'masonry' ? splitList(draft.explorationImages) : [],
      explorationVideos: explorationType === 'slot-machine' ? splitList(draft.explorationVideos) : [],
      animaticVideoUrl: splitList(draft.animaticVideoUrls)[0] || undefined,
      animaticVideoUrls: splitList(draft.animaticVideoUrls),
      outcomeImages,
      outcomeVisuals: outcomeImages,
      outcomeCopy: outcome || undefined,
      outcomeResultCopy: outcome || undefined,
      result: outcome || undefined,
      credits: splitList(draft.credits),
    };
  }, [draft, isArtDirection]);
  const publishMissingFields = draft.status === 'published' ? missingFields : [];
  const handleUploadStateChange = useCallback((field: string, uploading: boolean) => {
    setActiveUploads((current) => {
      if (uploading) {
        return current.includes(field) ? current : [...current, field];
      }

      return current.filter((entry) => entry !== field);
    });
  }, []);
  const disabledReason = activeUploads.length
    ? 'Wait for the image upload to finish before saving.'
    : publishMissingFields.length
      ? `Add ${publishMissingFields.join(', ')} to publish.`
      : isDirty
        ? null
        : 'Make a change to enable save.';
  const toolSuggestions = useMemo(
    () =>
      dedupe(
        [
          ...projects.flatMap((item) => item.tools ?? []),
          ...videos.flatMap((item) => item.tools ?? []),
          ...labItems.flatMap((item) => item.tools ?? []),
          ...galleryImages.map((item) => item.software ?? '').filter(Boolean),
        ],
      ).sort((a, b) => a.localeCompare(b)),
    [galleryImages, labItems, projects, videos],
  );
  const quickToolPicks = useMemo(
    () =>
      rankSuggestions([
        ...projects.flatMap((item) => item.tools ?? []),
        ...videos.flatMap((item) => item.tools ?? []),
        ...galleryImages.map((item) => item.software ?? ''),
      ]),
    [galleryImages, projects, videos],
  );
  const categorySuggestions = useMemo(
    () =>
      dedupe([
        ...projects.map((item) => item.category ?? ''),
        ...projects.flatMap((item) => item.categories ?? []),
        ...videos.flatMap((item) => item.tags ?? []),
        ...galleryImages.flatMap((item) => item.tags ?? []),
      ]).sort((a, b) => a.localeCompare(b)),
    [galleryImages, projects, videos],
  );
  const quickCategoryPicks = useMemo(
    () =>
      rankSuggestions([
        ...projects.map((item) => item.category ?? ''),
        ...projects.flatMap((item) => item.categories ?? []),
        ...videos.flatMap((item) => item.tags ?? []),
        ...galleryImages.flatMap((item) => item.tags ?? []),
      ]),
    [galleryImages, projects, videos],
  );
  const caseImageGroups = useMemo(() => {
    const groups: Array<{ key: ProjectImageGroupKey; label: string }> = [
      { key: 'moodboardImages', label: 'Moodboard' },
      { key: 'sketchImages', label: 'Sketches' },
    ];

    if (draft.childhoodImages || draft.universityImages || draft.workImages) {
      groups.push(
        { key: 'childhoodImages', label: 'Childhood' },
        { key: 'universityImages', label: 'University' },
        { key: 'workImages', label: 'Work' },
      );
    }

    if (draft.explorationType === 'masonry') {
      groups.push({ key: 'explorationImages', label: 'Exploration' });
    }

    groups.push({ key: 'outcomeImages', label: 'Outcome' });
    return groups;
  }, [
    draft.childhoodImages,
    draft.explorationType,
    draft.universityImages,
    draft.workImages,
  ]);

  const handleSave = useCallback(async () => {
    if (busy) {
      return;
    }

    if (publishMissingFields.length) {
      setError(`Add ${publishMissingFields.join(', ')} before publishing.`);
      return;
    }

    setBusy(true);
    try {
      clear();

      if (selectedId && !isCreatingNew) {
        await updateDoc(doc(db, 'projects', selectedId), payload);
        setSuccess('Project changes saved.');
      } else {
        const reference = await addDoc(collection(db, 'projects'), payload);
        setSelectedId(reference.id);
        setIsCreatingNew(false);
        setSuccess('Project created.');
      }

      clearPersistedEditorDraft(draftStorageKey);
      setLocalDraftSavedAt(null);
      setLastSavedAt(Date.now());
    } catch (error) {
      setError(toReadableError('Could not save the project.', error));
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    clear,
    draftStorageKey,
    isCreatingNew,
    payload,
    publishMissingFields,
    selectedId,
    setError,
    setSuccess,
  ]);

  const handleDelete = useCallback(async () => {
    if (!selectedId || isCreatingNew) {
      return;
    }

    if (!confirmDelete('this project')) {
      return;
    }

    setBusy(true);
    try {
      clear();
      await deleteDoc(doc(db, 'projects', selectedId));
      clearPersistedEditorDraft(draftStorageKey);
      setLocalDraftSavedAt(null);
      setSelectedId(null);
      setIsCreatingNew(false);
      setDraft(defaultProjectDraft());
      setSuccess('Project deleted.');
    } catch (error) {
      setError(toReadableError('Could not delete the project.', error));
    } finally {
      setBusy(false);
    }
  }, [clear, draftStorageKey, isCreatingNew, selectedId, setError, setSuccess]);

  const handleDuplicate = useCallback(() => {
    if (!selectedItem) {
      return;
    }

    clear();
    setFocusMode(true);
    setIsCreatingNew(true);
    setSelectedId(null);
    setDraft({
      ...toProjectDraft(selectedItem),
      title: `${selectedItem.title || 'Untitled project'} copy`,
      status: 'draft',
      featured: false,
      workPriorityRank: '',
    });
    setSuccess('Duplicated into a new draft.');
  }, [clear, selectedItem, setSuccess]);

  const handleBatchApply = useCallback(async () => {
    if (!batchSelection.length || busy) {
      return;
    }

    setBusy(true);
    try {
      clear();
      const toolAdds = splitList(batchTools);
      const batch = writeBatch(db);

      batchSelection.forEach((id) => {
        const current = items.find((item) => item.id === id);
        if (!current) {
          return;
        }

        const patch: Partial<Project> = {};
        if (batchPillar) {
          patch.pillar = batchPillar as ProjectPillar;
        }
        if (batchStatus) {
          patch.status = batchStatus as ProjectDraft['status'];
        }
        if (batchFeatured !== 'keep') {
          patch.featured = batchFeatured === 'on';
        }
        if (trimValue(batchCategory)) {
          patch.category = trimValue(batchCategory);
        }
        if (toolAdds.length) {
          patch.tools = dedupe([...(current.tools ?? []), ...toolAdds]);
        }
        batch.update(doc(db, 'projects', id), patch);
      });

      await batch.commit();
      setBatchSelection([]);
      setBatchPillar('');
      setBatchStatus('');
      setBatchFeatured('keep');
      setBatchCategory('');
      setBatchTools('');
      setSuccess(`Updated ${batchSelection.length} projects.`);
    } catch (error) {
      setError(toReadableError('Could not update the selected projects.', error));
    } finally {
      setBusy(false);
    }
  }, [batchCategory, batchFeatured, batchPillar, batchSelection, batchStatus, batchTools, busy, clear, items, setError, setSuccess]);

  const previewHref =
    !selectedId || isCreatingNew || draft.status !== 'published'
      ? null
      : draft.pillar === 'Art Direction'
        ? `/work/${selectedId}`
        : `/work?pillar=${encodeURIComponent(draft.pillar)}&preview=${encodeURIComponent(`project:${selectedId}`)}`;

  useSaveShortcut(!busy && !publishMissingFields.length && isDirty, handleSave);
  useUnsavedChangesWarning(isDirty);

  return (
    <EditorLayout
      title="Projects"
      description="Case studies with the most fields. Focus mode keeps the story extras tucked away until you want them."
      list={items}
      selectedId={selectedId}
      hasUnsavedChanges={isDirty}
      createOptions={[
        {
          label: 'Art direction',
          description: 'Start a full case study draft.',
          onSelect: () => {
            clear();
            setFocusMode(false);
            setIsCreatingNew(true);
            setSelectedId(null);
            setDraft({ ...defaultProjectDraft(), pillar: 'Art Direction', status: 'draft' });
          },
        },
        {
          label: 'AI generated',
          description: 'Start an AI Generated project draft.',
          onSelect: () => {
            clear();
            setFocusMode(true);
            setIsCreatingNew(true);
            setSelectedId(null);
            setDraft({ ...defaultProjectDraft(), pillar: 'AI Generated', status: 'draft' });
          },
        },
        {
          label: 'Illustration',
          description: 'Start an Illustration & Design draft.',
          onSelect: () => {
            clear();
            setFocusMode(true);
            setIsCreatingNew(true);
            setSelectedId(null);
            setDraft({ ...defaultProjectDraft(), pillar: 'Illustration & Design', status: 'draft' });
          },
        },
        {
          label: 'Motion',
          description: 'Start an Animation & Motion draft.',
          onSelect: () => {
            clear();
            setFocusMode(true);
            setIsCreatingNew(true);
            setSelectedId(null);
            setDraft({ ...defaultProjectDraft(), pillar: 'Animation & Motion', status: 'draft' });
          },
        },
      ]}
      onSelect={(nextId) => {
        clear();
        setIsCreatingNew(false);
        setSelectedId(nextId);
      }}
      onCreate={() => {
        clear();
        setFocusMode(false);
        setIsCreatingNew(true);
        setSelectedId(null);
        setDraft(defaultProjectDraft());
      }}
      getLabel={(item) => item.title}
      getMeta={(item) => [item.pillar, item.category].filter(Boolean).join(' • ')}
      notice={notice}
      statusPanel={
        <EditorStatusPanel
          title={isCreatingNew ? 'New project' : selectedItem?.title || 'Untitled project'}
          description={
            isArtDirection
              ? 'This mirrors the public Art Direction case-study page: overview, context, process, and outcome.'
              : 'Fill the essentials first. Optional story fields stay out of the way until you ask for them.'
          }
          checklist={checklist}
          completedCount={completedCount}
          totalCount={totalCount}
          missingFields={missingFields}
          isDirty={isDirty}
          lastSavedAt={lastSavedAt}
          localDraftSavedAt={localDraftSavedAt}
          publishStatus={draft.status}
          hasOptionalFields={!isArtDirection}
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode((value) => !value)}
        />
      }
      batchSelection={batchSelection}
      onBatchSelectionChange={setBatchSelection}
      batchPanel={
        <EditorSection
          title="Batch edit"
          description={
            batchSelection.length
              ? `Apply shared changes to ${batchSelection.length} selected projects.`
              : 'Select projects from the list to update them together.'
          }
        >
          <div className="space-y-3">
            <SelectField
              label="Pillar"
              value={batchPillar}
              options={['', ...PROJECT_PILLARS]}
              onChange={setBatchPillar}
            />
            <SelectField
              label="Status"
              value={batchStatus}
              options={['', ...ENTRY_STATUS_OPTIONS]}
              onChange={setBatchStatus}
            />
            <SelectField
              label="Featured"
              value={batchFeatured}
              options={['keep', 'on', 'off']}
              onChange={(value) => setBatchFeatured(value as 'keep' | 'on' | 'off')}
            />
            <TextField
              label="Category"
              value={batchCategory}
              onChange={setBatchCategory}
              placeholder="Campaign, visual system, brand film"
              suggestions={categorySuggestions}
              quickPicks={quickCategoryPicks}
            />
            <LongField
              label="Add tools"
              value={batchTools}
              onChange={setBatchTools}
              placeholder="One per line or comma-separated"
              suggestions={toolSuggestions}
              quickPicks={quickToolPicks}
              suggestionMode="list"
            />
            <button
              type="button"
              disabled={!batchSelection.length || busy}
              onClick={() => void handleBatchApply()}
              className="rounded-full bg-brand-accent px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-bg disabled:opacity-50"
            >
              Apply to selected
            </button>
          </div>
        </EditorSection>
      }
      form={
        <div className="space-y-4">
          {isArtDirection ? (
            <>
              <EditorSection
                title="Overview"
                description="These map to the top of the public case study. Hero image opens the page; card thumbnail only affects the small Work grid card."
                tone="primary"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Title"
                    value={draft.title}
                    required
                    placeholder="Campaign or project name"
                    onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))}
                  />
                  <SelectField
                    label="Status"
                    value={draft.status}
                    options={ENTRY_STATUS_OPTIONS}
                    onChange={(value) => setDraft((prev) => ({ ...prev, status: value as ProjectDraft['status'] }))}
                  />
                  <SelectField
                    label="Pillar"
                    value={draft.pillar}
                    options={PROJECT_PILLARS}
                    onChange={(value) => setDraft((prev) => ({ ...prev, pillar: value as ProjectPillar }))}
                  />
                  <TextField
                    label="Client"
                    placeholder="Client or collaborator"
                    value={draft.client}
                    onChange={(value) => setDraft((prev) => ({ ...prev, client: value }))}
                  />
                  <TextField
                    label="Timeline"
                    placeholder="48 hours, Spring 2026, 2-week sprint"
                    value={draft.timeline}
                    onChange={(value) => setDraft((prev) => ({ ...prev, timeline: value }))}
                  />
                  <TextField
                    label="Year"
                    placeholder="2026"
                    value={draft.year}
                    onChange={(value) => setDraft((prev) => ({ ...prev, year: value }))}
                  />
                  <TextField
                    label="Role"
                    placeholder="Art Director, Visual Designer, Motion Designer"
                    value={draft.role}
                    onChange={(value) => setDraft((prev) => ({ ...prev, role: value }))}
                  />
                  <TextField
                    label="Categories / tags"
                    required
                    placeholder="Brand system, campaign, packaging"
                    value={draft.category}
                    onChange={(value) => setDraft((prev) => ({ ...prev, category: value }))}
                    hint="Comma or line-separated. These show as chips in the case-study header and help with filtering."
                    suggestions={categorySuggestions}
                    quickPicks={quickCategoryPicks}
                    suggestionMode="list"
                  />
                  <StorageImageField
                    label="Hero image"
                    required
                    className="md:col-span-2"
                    pathPrefix="projects/heroes"
                    value={draft.heroImage}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        heroImage: value,
                        thumbnail: prev.thumbnail || value,
                      }))
                    }
                    onUploadingChange={(uploading) => handleUploadStateChange('heroImage', uploading)}
                    hint="This is the big opening image on the full Art Direction case page."
                    previewScale={Math.max(1, Number(draft.heroZoom || '100') / 100)}
                    previewPosition={`${Number(draft.heroPositionX || '50')}% ${Number(draft.heroPositionY || '50')}%`}
                    onError={setError}
                  />
                  <NumberField
                    label="Hero zoom (%)"
                    value={draft.heroZoom}
                    min={100}
                    max={200}
                    onChange={(value) => setDraft((prev) => ({ ...prev, heroZoom: value }))}
                    hint="100 = original fit. Increase this to crop in tighter on the case-study hero."
                  />
                  <NumberField
                    label="Hero horizontal position (%)"
                    value={draft.heroPositionX}
                    min={0}
                    max={100}
                    onChange={(value) => setDraft((prev) => ({ ...prev, heroPositionX: value }))}
                    hint="50 = centered. Lower moves the crop left, higher moves it right."
                  />
                  <NumberField
                    label="Hero vertical position (%)"
                    value={draft.heroPositionY}
                    min={0}
                    max={100}
                    onChange={(value) => setDraft((prev) => ({ ...prev, heroPositionY: value }))}
                    hint="50 = centered. Lower moves the crop up, higher moves it down."
                  />
                  <StorageImageField
                    label="Card thumbnail override"
                    className="md:col-span-2"
                    pathPrefix="projects/thumbnails"
                    value={draft.thumbnail}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        thumbnail: value,
                        heroImage: prev.heroImage || value,
                      }))
                    }
                    onUploadingChange={(uploading) => handleUploadStateChange('thumbnail', uploading)}
                    hint="Optional. Leave it matching the hero image unless the Work card needs a better crop."
                    previewScale={Math.max(1, Number(draft.thumbnailZoom || '100') / 100)}
                    onError={setError}
                  />
                  <NumberField
                    label="Thumbnail zoom (%)"
                    value={draft.thumbnailZoom}
                    min={100}
                    max={200}
                    onChange={(value) => setDraft((prev) => ({ ...prev, thumbnailZoom: value }))}
                    hint="100 = original fit. Increase this to crop in tighter on the Work/archive thumbnail."
                  />
                  <LongField
                    label="Intro / opening copy"
                    required
                    className="md:col-span-2"
                    placeholder="A short opening paragraph that sits under the big case-study title."
                    value={draft.description}
                    onChange={(value) => setDraft((prev) => ({ ...prev, description: value }))}
                  />
                </div>
              </EditorSection>

              <EditorSection
                title="Case study"
                description="Same idea as Lab: fill what you have. These sections appear on the public page when they are populated."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <LongField
                    label="The brief"
                    className="md:col-span-2"
                    placeholder="What was the challenge or goal?"
                    value={draft.brief}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        brief: value,
                        creativeTension: prev.creativeTension || value,
                      }))
                    }
                  />
                  <LongField
                    label="Context"
                    className="md:col-span-2"
                    placeholder="Background, market context, audience, or why this work mattered."
                    value={draft.context}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        context: value,
                        globalContext: value,
                      }))
                    }
                  />
                  <LongField
                    label="The problem"
                    className="md:col-span-2"
                    placeholder="What was hard, messy, or unclear?"
                    value={draft.problem}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        problem: value,
                        creativeTension: value,
                      }))
                    }
                  />
                  <LongField
                    label="Insights"
                    className="md:col-span-2"
                    placeholder="What did you realize while shaping the direction?"
                    value={draft.insights}
                    onChange={(value) => setDraft((prev) => ({ ...prev, insights: value }))}
                  />
                  <LongField
                    label="Solution"
                    className="md:col-span-2"
                    placeholder="What did you build, design, or decide in response?"
                    value={draft.solution}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        solution: value,
                        approach: value,
                      }))
                    }
                  />
                  <LongField
                    label="Outcome"
                    className="md:col-span-2"
                    placeholder="What landed, changed, or was ultimately produced?"
                    value={draft.outcome}
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        outcome: value,
                        outcomeResultCopy: value,
                      }))
                    }
                  />
                </div>
              </EditorSection>

              <EditorSection
                title="Process and visuals"
                description="Moodboards, sketches, exploration, and outcome visuals all feed the public case page."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <LongField
                    label="Tools"
                    hint="One per line or comma-separated"
                    placeholder="Blender, Midjourney, After Effects"
                    value={draft.tools}
                    onChange={(value) => setDraft((prev) => ({ ...prev, tools: value }))}
                    suggestions={toolSuggestions}
                    quickPicks={quickToolPicks}
                    suggestionMode="list"
                  />
                  <LongField
                    label="Credits"
                    hint="One per line. Example: Maria Bordiuh - Art Direction"
                    placeholder="Name - Role"
                    value={draft.credits}
                    onChange={(value) => setDraft((prev) => ({ ...prev, credits: value }))}
                  />
                  <LongField
                    label="Moodboard images"
                    className="md:col-span-2"
                    hint="One image URL per line"
                    placeholder="https://..."
                    value={draft.moodboardImages}
                    onChange={(value) => setDraft((prev) => ({ ...prev, moodboardImages: value }))}
                  />
                  <div className="md:col-span-2">
                    <ImageListOrganizer
                      label="Moodboard images"
                      value={draft.moodboardImages}
                      onChange={(value) => setDraft((prev) => ({ ...prev, moodboardImages: value }))}
                    />
                  </div>
                  <LongField
                    label="Sketch images"
                    className="md:col-span-2"
                    hint="One image URL per line"
                    placeholder="https://..."
                    value={draft.sketchImages}
                    onChange={(value) => setDraft((prev) => ({ ...prev, sketchImages: value }))}
                  />
                  <div className="md:col-span-2">
                    <ImageListOrganizer
                      label="Sketch images"
                      value={draft.sketchImages}
                      onChange={(value) => setDraft((prev) => ({ ...prev, sketchImages: value }))}
                    />
                  </div>
                  <LongField
                    label="Childhood images"
                    className="md:col-span-2"
                    hint="One image URL per line"
                    placeholder="https://..."
                    value={draft.childhoodImages}
                    onChange={(value) => setDraft((prev) => ({ ...prev, childhoodImages: value }))}
                  />
                  <LongField
                    label="University images"
                    className="md:col-span-2"
                    hint="One image URL per line"
                    placeholder="https://..."
                    value={draft.universityImages}
                    onChange={(value) => setDraft((prev) => ({ ...prev, universityImages: value }))}
                  />
                  <LongField
                    label="Work images"
                    className="md:col-span-2"
                    hint="One image URL per line"
                    placeholder="https://..."
                    value={draft.workImages}
                    onChange={(value) => setDraft((prev) => ({ ...prev, workImages: value }))}
                  />
                  <div className="md:col-span-2">
                    <StoryImageOrganizer
                      draft={draft}
                      onChange={(next) => setDraft((prev) => ({ ...prev, ...next }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <CaseImageOrganizer
                      groups={caseImageGroups}
                      draft={draft}
                      onChange={(next) => setDraft((prev) => ({ ...prev, ...next }))}
                    />
                  </div>
                  <SelectField
                    label="Exploration layout"
                    value={draft.explorationType}
                    options={['masonry', 'slot-machine']}
                    hint="Masonry shows a gallery. Slot-machine shows the animated grid on the case page."
                    onChange={(value) =>
                      setDraft((prev) => ({
                        ...prev,
                        explorationType: value as ProjectDraft['explorationType'],
                      }))
                    }
                  />
                  {draft.explorationType === 'slot-machine' ? (
                    <>
                      <NumberField
                        label="Slot-machine grid size"
                        value={draft.slotMachineGridSize}
                        min={2}
                        max={8}
                        onChange={(value) => setDraft((prev) => ({ ...prev, slotMachineGridSize: value }))}
                      />
                      <NumberField
                        label="Slot-machine FPS"
                        value={draft.slotMachineFps}
                        min={1}
                        max={30}
                        onChange={(value) => setDraft((prev) => ({ ...prev, slotMachineFps: value }))}
                      />
                      <LongField
                        label="Exploration videos"
                        className="md:col-span-2"
                        hint="One video URL per line"
                        placeholder="https://..."
                        value={draft.explorationVideos}
                        onChange={(value) => setDraft((prev) => ({ ...prev, explorationVideos: value }))}
                      />
                      <LongField
                        label="Character discovery videos"
                        className="md:col-span-2"
                        hint="One video URL per line"
                        placeholder="https://..."
                        value={draft.animaticVideoUrls}
                        onChange={(value) => setDraft((prev) => ({ ...prev, animaticVideoUrls: value }))}
                      />
                    </>
                  ) : (
                    <>
                      <LongField
                        label="Exploration images"
                        className="md:col-span-2"
                        hint="One image URL per line"
                        placeholder="https://..."
                        value={draft.explorationImages}
                        onChange={(value) => setDraft((prev) => ({ ...prev, explorationImages: value }))}
                      />
                      <div className="md:col-span-2">
                        <ImageListOrganizer
                          label="Exploration images"
                          value={draft.explorationImages}
                          onChange={(value) => setDraft((prev) => ({ ...prev, explorationImages: value }))}
                        />
                      </div>
                      <LongField
                        label="Character discovery videos"
                        className="md:col-span-2"
                        hint="One video URL per line"
                        placeholder="https://..."
                        value={draft.animaticVideoUrls}
                        onChange={(value) => setDraft((prev) => ({ ...prev, animaticVideoUrls: value }))}
                      />
                    </>
                  )}
                  <LongField
                    label="Outcome images"
                    className="md:col-span-2"
                    hint="One image or video URL per line"
                    placeholder="https://..."
                    value={draft.outcomeImages}
                    onChange={(value) => setDraft((prev) => ({ ...prev, outcomeImages: value }))}
                  />
                  <div className="md:col-span-2">
                    <ImageListOrganizer
                      label="Outcome images"
                      value={draft.outcomeImages}
                      onChange={(value) => setDraft((prev) => ({ ...prev, outcomeImages: value }))}
                    />
                  </div>
                </div>
              </EditorSection>
            </>
          ) : (
            <>
              <EditorSection
                title="Essentials"
                description="These are the only fields you need for a clean, publishable project."
                tone="primary"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Title"
                    value={draft.title}
                    required
                    placeholder="Project name"
                    onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))}
                  />
                  <TextField
                    label="Category"
                    value={draft.category}
                    required
                    placeholder="Illustration, visual system, campaign"
                    onChange={(value) => setDraft((prev) => ({ ...prev, category: value }))}
                    suggestions={categorySuggestions}
                    quickPicks={quickCategoryPicks}
                  />
                  <SelectField
                    label="Pillar"
                    value={draft.pillar}
                    options={PROJECT_PILLARS}
                    onChange={(value) => setDraft((prev) => ({ ...prev, pillar: value as ProjectPillar }))}
                  />
                  <SelectField
                    label="Status"
                    value={draft.status}
                    options={ENTRY_STATUS_OPTIONS}
                    onChange={(value) => setDraft((prev) => ({ ...prev, status: value as ProjectDraft['status'] }))}
                  />
                  <StorageImageField
                    label="Thumbnail"
                    required
                    className="md:col-span-2"
                    pathPrefix="projects/thumbnails"
                    value={draft.thumbnail}
                    onChange={(value) => setDraft((prev) => ({ ...prev, thumbnail: value }))}
                    onUploadingChange={(uploading) => handleUploadStateChange('thumbnail', uploading)}
                    previewScale={Math.max(1, Number(draft.thumbnailZoom || '100') / 100)}
                    onError={setError}
                  />
                  <NumberField
                    label="Thumbnail zoom (%)"
                    value={draft.thumbnailZoom}
                    min={100}
                    max={200}
                    onChange={(value) => setDraft((prev) => ({ ...prev, thumbnailZoom: value }))}
                    hint="Increase this if the thumbnail needs a tighter crop on the Work page."
                  />
                  <LongField
                    label="Description"
                    required
                    className="md:col-span-2"
                    placeholder="A short, clear summary of what this project is."
                    value={draft.description}
                    onChange={(value) => setDraft((prev) => ({ ...prev, description: value }))}
                  />
                </div>
              </EditorSection>

              {!focusMode ? (
                <>
                  <EditorSection
                    title="Context"
                    description="Extra metadata if you want it."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <TextField
                        label="Client"
                        placeholder="Client or collaborator"
                        value={draft.client}
                        onChange={(value) => setDraft((prev) => ({ ...prev, client: value }))}
                      />
                      <TextField
                        label="Year"
                        placeholder="2026"
                        value={draft.year}
                        onChange={(value) => setDraft((prev) => ({ ...prev, year: value }))}
                      />
                      <TextField
                        label="Subcategory"
                        placeholder="Optional supporting label"
                        value={draft.subCategory}
                        onChange={(value) => setDraft((prev) => ({ ...prev, subCategory: value }))}
                      />
                      <TextField
                        label="Role"
                        placeholder="Your role on the piece"
                        value={draft.role}
                        onChange={(value) => setDraft((prev) => ({ ...prev, role: value }))}
                      />
                    </div>
                  </EditorSection>

                  <EditorSection
                    title="Extras"
                    description="Supporting links and tool lists."
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <LongField
                        label="Tools"
                        hint="One per line or comma-separated"
                        placeholder="Blender, Midjourney, After Effects"
                        value={draft.tools}
                        onChange={(value) => setDraft((prev) => ({ ...prev, tools: value }))}
                        suggestions={toolSuggestions}
                        quickPicks={quickToolPicks}
                        suggestionMode="list"
                      />
                      <StorageImageField
                        label="Hero image"
                        pathPrefix="projects/heroes"
                        value={draft.heroImage}
                        onChange={(value) => setDraft((prev) => ({ ...prev, heroImage: value }))}
                        onUploadingChange={(uploading) => handleUploadStateChange('heroImage', uploading)}
                        previewScale={Math.max(1, Number(draft.heroZoom || '100') / 100)}
                        previewPosition={`${Number(draft.heroPositionX || '50')}% ${Number(draft.heroPositionY || '50')}%`}
                        onError={setError}
                      />
                      <NumberField
                        label="Hero zoom (%)"
                        value={draft.heroZoom}
                        min={100}
                        max={200}
                        onChange={(value) => setDraft((prev) => ({ ...prev, heroZoom: value }))}
                        hint="100 = original fit. Increase this to crop in tighter on the case-study hero."
                      />
                      <NumberField
                        label="Hero horizontal position (%)"
                        value={draft.heroPositionX}
                        min={0}
                        max={100}
                        onChange={(value) => setDraft((prev) => ({ ...prev, heroPositionX: value }))}
                        hint="50 = centered. Lower moves the crop left, higher moves it right."
                      />
                      <NumberField
                        label="Hero vertical position (%)"
                        value={draft.heroPositionY}
                        min={0}
                        max={100}
                        onChange={(value) => setDraft((prev) => ({ ...prev, heroPositionY: value }))}
                        hint="50 = centered. Lower moves the crop up, higher moves it down."
                      />
                    </div>
                  </EditorSection>
                </>
              ) : null}
            </>
          )}

          <EditorSection
            title="Visibility"
            description="Controls whether this project appears in Selected Works and the Work page priority grid."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ToggleField
                label="Featured"
                hint="Show in Selected Works on the homepage"
                value={draft.featured}
                onChange={(value) => setDraft((prev) => ({ ...prev, featured: value }))}
              />
              <NumberField
                label="Work priority rank"
                hint="1–6 sets position in the priority grid, empty = not ranked"
                placeholder="Leave empty or enter 1–6"
                value={draft.workPriorityRank}
                min={1}
                max={6}
                onChange={(value) => setDraft((prev) => ({ ...prev, workPriorityRank: value }))}
              />
            </div>
          </EditorSection>
        </div>
      }
      actions={
        <FormActions
          busy={busy}
          isDirty={isDirty}
          saveLabel={
            draft.status === 'draft'
              ? isCreatingNew
                ? 'Create draft'
                : 'Save draft'
              : isCreatingNew
                ? 'Publish project'
                : 'Publish changes'
          }
          disabledReason={disabledReason}
          onSave={handleSave}
          onDelete={!isCreatingNew && selectedId ? handleDelete : undefined}
          onDuplicate={!isCreatingNew && selectedItem ? handleDuplicate : undefined}
          previewHref={previewHref}
        />
      }
    />
  );
}

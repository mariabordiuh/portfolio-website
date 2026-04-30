import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase-firestore';
import { DataContext } from '../context/DataContext';
import { ProjectPillar, Video } from '../types';
import { isEmbeddableVideoUrl, isGifUrl, isVideoFileUrl, normalizePillar, toEmbedUrl } from '../utils/portfolio';
import {
  ChecklistItem,
  ENTRY_STATUS_OPTIONS,
  PROJECT_PILLARS,
  VIDEO_TYPES,
  VideoDraft,
  clearPersistedEditorDraft,
  confirmDelete,
  defaultVideoDraft,
  getEditorDraftStorageKey,
  keepSelectedId,
  rankSuggestions,
  readPersistedEditorDraft,
  splitList,
  toReadableError,
  toVideoDraft,
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
  StorageVideoField,
  TextField,
  ToggleField,
} from './admin-ui';

const dedupe = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const extractVideoIdFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      return parsed.pathname.replace('/', '').trim();
    }

    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) {
        return parsed.pathname.split('/').filter(Boolean)[1] ?? '';
      }

      return parsed.searchParams.get('v') ?? '';
    }
  } catch (_error) {
    return '';
  }

  return '';
};

const fetchYouTubeMetadata = async (url: string) => {
  const response = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const thumbnailFromOEmbed =
    typeof data.thumbnail_url === 'string' ? data.thumbnail_url.trim() : '';
  const youtubeId = extractVideoIdFromUrl(url);
  const fallbackThumbnail = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : '';

  return {
    title,
    thumbnail: thumbnailFromOEmbed || fallbackThumbnail,
  };
};

export function VideosAdmin() {
  const { projects, videos, labItems, galleryImages } = useContext(DataContext);
  const [items, setItems] = useState<Video[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draft, setDraft] = useState<VideoDraft>(defaultVideoDraft);
  const [busy, setBusy] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState<number | null>(null);
  const [batchSelection, setBatchSelection] = useState<string[]>([]);
  const [batchPillar, setBatchPillar] = useState<string>('');
  const [batchType, setBatchType] = useState('');
  const [batchStatus, setBatchStatus] = useState('');
  const [batchFeatured, setBatchFeatured] = useState<'keep' | 'on' | 'off'>('keep');
  const [batchTools, setBatchTools] = useState('');
  const [batchTags, setBatchTags] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkPillar, setBulkPillar] = useState<ProjectPillar>('Animation & Motion');
  const [bulkType, setBulkType] = useState('Motion');
  const [bulkStatus, setBulkStatus] = useState<'draft' | 'published'>('draft');
  const [bulkTools, setBulkTools] = useState('');
  const [bulkTags, setBulkTags] = useState('');
  const { notice, clear, setError, setSuccess } = useEditorNotice();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'videos'),
      (snapshot) => {
        const nextItems = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as Video));
        setItems(nextItems);
        setSelectedId((currentId) => keepSelectedId(nextItems, currentId, isCreatingNew));
      },
      (error) => {
        setError(toReadableError('Could not load videos.', error));
      },
    );

    return unsubscribe;
  }, [isCreatingNew, setError]);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);
  const draftStorageKey = useMemo(
    () => getEditorDraftStorageKey('videos', selectedId, isCreatingNew),
    [isCreatingNew, selectedId],
  );
  const baselineDraft = useMemo(() => {
    if (isCreatingNew) {
      return defaultVideoDraft();
    }

    if (selectedId && !selectedItem) {
      return draft;
    }

    return toVideoDraft(selectedItem);
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
      const persisted = readPersistedEditorDraft<VideoDraft>(draftStorageKey);
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
    () => [
      { label: 'Video URL', done: Boolean(trimValue(draft.url)) },
    ],
    [draft],
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
  const payload = useMemo(
    () => ({
      title: trimValue(draft.title),
      pillar: draft.pillar,
      status: draft.status,
      subCategory:
        draft.pillar === 'Animation & Motion'
          ? trimValue(draft.subCategory) || undefined
          : undefined,
      url: trimValue(draft.url),
      sourceUrl: trimValue(draft.sourceUrl) || undefined,
      thumbnail: trimValue(draft.thumbnail),
      description: trimValue(draft.description),
      tools: splitList(draft.tools),
      tags: splitList(draft.tags),
      featured: draft.featured,
      workPriorityRank: draft.workPriorityRank ? Number(draft.workPriorityRank) : null,
    }),
    [draft],
  );
  const publishMissingFields = draft.status === 'published' ? missingFields : [];
  const disabledReason = publishMissingFields.length
    ? `Add ${publishMissingFields.join(', ')} to publish.`
    : isDirty
      ? null
      : 'Make a change to enable save.';
  const previewUrl = trimValue(draft.url);
  const sourceVideoUrl = trimValue(draft.sourceUrl);
  const previewThumb = trimValue(draft.thumbnail);
  const previewEmbedUrl = isEmbeddableVideoUrl(previewUrl) ? toEmbedUrl(previewUrl) : '';
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
        ...videos.flatMap((item) => item.tools ?? []),
        ...projects.flatMap((item) => item.tools ?? []),
        ...labItems.flatMap((item) => item.tools ?? []),
        ...galleryImages.map((item) => item.software ?? ''),
      ]),
    [galleryImages, labItems, projects, videos],
  );
  const tagSuggestions = useMemo(
    () =>
      dedupe([
        ...videos.flatMap((item) => item.tags ?? []),
        ...galleryImages.flatMap((item) => item.tags ?? []),
        ...projects.flatMap((item) => item.categories ?? []),
      ]).sort((a, b) => a.localeCompare(b)),
    [galleryImages, projects, videos],
  );
  const quickTagPicks = useMemo(
    () =>
      rankSuggestions([
        ...videos.flatMap((item) => item.tags ?? []),
        ...galleryImages.flatMap((item) => item.tags ?? []),
        ...projects.flatMap((item) => item.categories ?? []),
      ]),
    [galleryImages, projects, videos],
  );

  useEffect(() => {
    const url = trimValue(draft.url);
    if (!url || isVideoFileUrl(url) || isGifUrl(url)) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const applyVideoMetadata = async () => {
      try {
        const data = await fetchYouTubeMetadata(url);
        if (cancelled) {
          return;
        }

        if (!data) {
          return;
        }

        setDraft((prev) => {
          if (trimValue(prev.url) !== url) {
            return prev;
          }

          return {
            ...prev,
            title: trimValue(prev.title) || data.title || prev.title,
            thumbnail: trimValue(prev.thumbnail) || data.thumbnail || prev.thumbnail,
          };
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
      }
    };

    const timeout = window.setTimeout(() => {
      void applyVideoMetadata();
    }, 250);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [draft.url]);

  const resolvePayloadWithMetadata = useCallback(async () => {
    const url = trimValue(draft.url);
    const nextPayload = { ...payload };

    if (url && !isVideoFileUrl(url) && !isGifUrl(url) && (!nextPayload.thumbnail || !nextPayload.title)) {
      const metadata = await fetchYouTubeMetadata(url).catch(() => null);
      if (metadata) {
        nextPayload.title = nextPayload.title || metadata.title;
        nextPayload.thumbnail = nextPayload.thumbnail || metadata.thumbnail;

        setDraft((prev) => ({
          ...prev,
          title: trimValue(prev.title) || metadata.title || prev.title,
          thumbnail: trimValue(prev.thumbnail) || metadata.thumbnail || prev.thumbnail,
        }));
      }
    }

    return nextPayload;
  }, [draft.url, payload]);

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
      const nextPayload = await resolvePayloadWithMetadata();

      if (selectedId && !isCreatingNew) {
        await updateDoc(doc(db, 'videos', selectedId), nextPayload);
        setSuccess('Video changes saved.');
      } else {
        const reference = await addDoc(collection(db, 'videos'), nextPayload);
        setSelectedId(reference.id);
        setIsCreatingNew(false);
        setSuccess('Video created.');
      }

      clearPersistedEditorDraft(draftStorageKey);
      setLocalDraftSavedAt(null);
      setLastSavedAt(Date.now());
    } catch (error) {
      setError(toReadableError('Could not save the video.', error));
    } finally {
      setBusy(false);
    }
  }, [
    busy,
    clear,
    draftStorageKey,
    isCreatingNew,
    publishMissingFields,
    resolvePayloadWithMetadata,
    selectedId,
    setError,
    setSuccess,
  ]);

  const handleDelete = useCallback(async () => {
    if (!selectedId || isCreatingNew) {
      return;
    }

    if (!confirmDelete('this video')) {
      return;
    }

    setBusy(true);
    try {
      clear();
      await deleteDoc(doc(db, 'videos', selectedId));
      clearPersistedEditorDraft(draftStorageKey);
      setLocalDraftSavedAt(null);
      setSelectedId(null);
      setIsCreatingNew(false);
      setDraft(defaultVideoDraft());
      setSuccess('Video deleted.');
    } catch (error) {
      setError(toReadableError('Could not delete the video.', error));
    } finally {
      setBusy(false);
    }
  }, [clear, draftStorageKey, isCreatingNew, selectedId, setError, setSuccess]);

  const handleDuplicate = useCallback(() => {
    if (!selectedItem) {
      return;
    }

    clear();
    setIsCreatingNew(true);
    setSelectedId(null);
    setDraft({
      ...toVideoDraft(selectedItem),
      title: `${selectedItem.title || 'Untitled video'} copy`,
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

    const toolAdds = splitList(batchTools);
    const tagAdds = splitList(batchTags);
    setBusy(true);
    try {
      clear();
      const batch = writeBatch(db);

      batchSelection.forEach((id) => {
        const current = items.find((item) => item.id === id);
        if (!current) {
          return;
        }

        const nextPillar = (batchPillar || current.pillar) as ProjectPillar;
        const patch: Partial<Video> = {};

        if (batchPillar) {
          patch.pillar = batchPillar as ProjectPillar;
          if (batchPillar !== 'Animation & Motion') {
            patch.subCategory = '';
          }
        }

        if (nextPillar === 'Animation & Motion' && batchType) {
          patch.subCategory = batchType;
        }

        if (batchStatus) {
          patch.status = batchStatus as VideoDraft['status'];
        }

        if (batchFeatured !== 'keep') {
          patch.featured = batchFeatured === 'on';
        }

        if (toolAdds.length) {
          patch.tools = dedupe([...(current.tools ?? []), ...toolAdds]);
        }

        if (tagAdds.length) {
          patch.tags = dedupe([...(current.tags ?? []), ...tagAdds]);
        }

        batch.update(doc(db, 'videos', id), patch);
      });

      await batch.commit();
      setBatchSelection([]);
      setBatchPillar('');
      setBatchType('');
      setBatchStatus('');
      setBatchFeatured('keep');
      setBatchTools('');
      setBatchTags('');
      setSuccess(`Updated ${batchSelection.length} videos.`);
    } catch (error) {
      setError(toReadableError('Could not update the selected videos.', error));
    } finally {
      setBusy(false);
    }
  }, [
    batchFeatured,
    batchPillar,
    batchSelection,
    batchStatus,
    batchTags,
    batchTools,
    batchType,
    busy,
    clear,
    items,
    setError,
    setSuccess,
  ]);

  const handleBatchDelete = useCallback(async () => {
    if (!batchSelection.length || busy) {
      return;
    }

    if (!confirmDelete(`${batchSelection.length} selected videos`)) {
      return;
    }

    setBusy(true);
    try {
      clear();
      const batch = writeBatch(db);
      batchSelection.forEach((id) => {
        batch.delete(doc(db, 'videos', id));
      });
      await batch.commit();
      setBatchSelection([]);
      setSuccess(`Deleted ${batchSelection.length} videos.`);
    } catch (error) {
      setError(toReadableError('Could not delete the selected videos.', error));
    } finally {
      setBusy(false);
    }
  }, [batchSelection, busy, clear, setError, setSuccess]);

  const handleBulkImport = useCallback(async () => {
    if (busy) {
      return;
    }

    const urls = dedupe(splitList(bulkUrls));
    if (!urls.length) {
      setError('Paste at least one video URL to bulk import.');
      return;
    }

    setBusy(true);
    try {
      clear();
      const tools = splitList(bulkTools);
      const tags = splitList(bulkTags);

      for (const url of urls) {
        const metadata =
          !isVideoFileUrl(url) && !isGifUrl(url)
            ? await fetchYouTubeMetadata(url).catch(() => null)
            : null;

        await addDoc(collection(db, 'videos'), {
          title: metadata?.title ?? '',
          pillar: bulkPillar,
          status: bulkStatus,
          subCategory: bulkPillar === 'Animation & Motion' ? bulkType || undefined : undefined,
          url,
          sourceUrl: '',
          thumbnail: metadata?.thumbnail ?? '',
          description: '',
          tools,
          tags,
          featured: false,
          workPriorityRank: null,
        });
      }

      setBulkUrls('');
      setBulkTools('');
      setBulkTags('');
      setSuccess(`Imported ${urls.length} videos.`);
    } catch (error) {
      setError(toReadableError('Could not bulk import the videos.', error));
    } finally {
      setBusy(false);
    }
  }, [bulkPillar, bulkStatus, bulkTags, bulkTools, bulkType, bulkUrls, busy, clear, setError, setSuccess]);

  const previewPillar = normalizePillar(draft.pillar);
  const previewHref =
    !selectedId || isCreatingNew || draft.status !== 'published'
      ? null
      : `/work?pillar=${encodeURIComponent(previewPillar)}&preview=${encodeURIComponent(`video:${selectedId}`)}`;

  useSaveShortcut(!busy && !publishMissingFields.length && isDirty, handleSave);
  useUnsavedChangesWarning(isDirty);

  return (
    <EditorLayout
      title="Videos"
      description="A small, straightforward editor for reels and motion pieces."
      list={items}
      selectedId={selectedId}
      hasUnsavedChanges={isDirty}
      createOptions={[
        {
          label: 'AI video',
          description: 'Seed a fast AI Generated draft.',
          onSelect: () => {
            clear();
            setIsCreatingNew(true);
            setSelectedId(null);
            setDraft({
              ...defaultVideoDraft(),
              pillar: 'AI Generated',
              status: 'draft',
            });
          },
        },
        {
          label: 'Motion',
          description: 'Start a motion draft with the Motion type selected.',
          onSelect: () => {
            clear();
            setIsCreatingNew(true);
            setSelectedId(null);
            setDraft({
              ...defaultVideoDraft(),
              pillar: 'Animation & Motion',
              subCategory: 'Motion',
              status: 'draft',
            });
          },
        },
        {
          label: 'Traditional',
          description: 'Start a traditional animation entry.',
          onSelect: () => {
            clear();
            setIsCreatingNew(true);
            setSelectedId(null);
            setDraft({
              ...defaultVideoDraft(),
              pillar: 'Animation & Motion',
              subCategory: 'Traditional',
              status: 'draft',
            });
          },
        },
        {
          label: 'Cut-Out',
          description: 'Start a cut-out animation entry.',
          onSelect: () => {
            clear();
            setIsCreatingNew(true);
            setSelectedId(null);
            setDraft({
              ...defaultVideoDraft(),
              pillar: 'Animation & Motion',
              subCategory: 'Cut-Out',
              status: 'draft',
            });
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
        setIsCreatingNew(true);
        setSelectedId(null);
        setDraft(defaultVideoDraft());
      }}
      getLabel={(item) => item.title || 'Untitled video'}
      getMeta={(item) => [item.pillar, item.subCategory, ...(item.tools ?? []).slice(0, 1)].filter(Boolean).join(' · ')}
      notice={notice}
      statusPanel={
        <EditorStatusPanel
          title={isCreatingNew ? 'New video' : selectedItem?.title || 'Untitled video'}
          description="Everything important is already visible here, so you can move quickly."
          checklist={checklist}
          completedCount={completedCount}
          totalCount={totalCount}
          missingFields={missingFields}
          isDirty={isDirty}
          lastSavedAt={lastSavedAt}
          localDraftSavedAt={localDraftSavedAt}
          publishStatus={draft.status}
        />
      }
      batchSelection={batchSelection}
      onBatchSelectionChange={setBatchSelection}
      batchPanel={
        <EditorSection
          title="Batch edit"
          description={
            batchSelection.length
              ? `Apply shared changes to ${batchSelection.length} selected videos.`
              : 'Select videos from the list to update them together.'
          }
        >
          <div className="space-y-3">
            <SelectField
              label="Pillar"
              value={batchPillar}
              options={['', ...PROJECT_PILLARS]}
              onChange={setBatchPillar}
            />
            {batchPillar === 'Animation & Motion' ? (
              <SelectField
                label="Type"
                value={batchType}
                options={['', ...VIDEO_TYPES]}
                onChange={setBatchType}
              />
            ) : null}
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
            <LongField
              label="Add tools"
              value={batchTools}
              onChange={setBatchTools}
              placeholder="After Effects, Seedance 2.0"
              suggestions={toolSuggestions}
              quickPicks={quickToolPicks}
              suggestionMode="list"
            />
            <LongField
              label="Add tags"
              value={batchTags}
              onChange={setBatchTags}
              placeholder="looping, motion, editorial"
              suggestions={tagSuggestions}
              quickPicks={quickTagPicks}
              suggestionMode="list"
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                disabled={!batchSelection.length || busy}
                onClick={() => void handleBatchApply()}
                className="rounded-full bg-brand-accent px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-bg disabled:opacity-50"
              >
                Apply to selected
              </button>
              <button
                type="button"
                disabled={!batchSelection.length || busy}
                onClick={() => void handleBatchDelete()}
                className="rounded-full border border-red-500/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-red-300 disabled:opacity-50"
              >
                Delete selected
              </button>
            </div>
          </div>
        </EditorSection>
      }
      sidebarFooter={
        <EditorSection
          title="Bulk import"
          description="Paste several YouTube, Vimeo, GIF, or direct video URLs and stamp the shared defaults once."
        >
          <div className="space-y-3">
            <LongField
              label="URLs"
              value={bulkUrls}
              onChange={setBulkUrls}
              placeholder="One URL per line"
            />
            <SelectField
              label="Pillar"
              value={bulkPillar}
              options={PROJECT_PILLARS}
              onChange={(value) => setBulkPillar(value as ProjectPillar)}
            />
            {bulkPillar === 'Animation & Motion' ? (
              <SelectField
                label="Type"
                value={bulkType}
                options={['', ...VIDEO_TYPES]}
                onChange={setBulkType}
              />
            ) : null}
            <SelectField
              label="Status"
              value={bulkStatus}
              options={ENTRY_STATUS_OPTIONS}
              onChange={(value) => setBulkStatus(value as 'draft' | 'published')}
            />
            <TextField
              label="Shared tools"
              value={bulkTools}
              onChange={setBulkTools}
              placeholder="Seedance 2.0, After Effects"
              suggestions={toolSuggestions}
              quickPicks={quickToolPicks}
              suggestionMode="list"
            />
            <LongField
              label="Shared tags"
              value={bulkTags}
              onChange={setBulkTags}
              placeholder="One per line or comma-separated"
              suggestions={tagSuggestions}
              quickPicks={quickTagPicks}
              suggestionMode="list"
            />
            <button
              type="button"
              disabled={busy || !trimValue(bulkUrls)}
              onClick={() => void handleBulkImport()}
              className="w-full rounded-full bg-white px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-black disabled:opacity-50"
            >
              Import queue
            </button>
          </div>
        </EditorSection>
      }
      form={
        <div className="space-y-4">
        <EditorSection
          title="Preview"
          description="Play or inspect the current video link before you touch the rest."
          tone="primary"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs leading-6 text-brand-muted">
              This sits right under the top action bar so you can check motion fast.
            </div>
            {previewUrl ? (
              <a
                href={sourceVideoUrl || previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-brand-muted transition-colors hover:text-white"
              >
                {sourceVideoUrl ? 'Open original' : 'Open source'}
              </a>
            ) : null}
          </div>

          {previewUrl ? (
            <div className="mt-4 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 p-3">
              {previewEmbedUrl ? (
                <div className="aspect-video overflow-hidden rounded-[1.25rem] border border-white/10 bg-black">
                  <iframe
                    src={previewEmbedUrl}
                    title={draft.title || 'Video preview'}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : isGifUrl(previewUrl) ? (
                <div className="flex justify-center rounded-[1.25rem] border border-white/10 bg-black/40 p-3">
                  <img
                    src={previewUrl}
                    alt={draft.title || 'GIF preview'}
                    className="h-auto max-h-[28rem] w-auto max-w-full rounded-[1rem] object-contain"
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="aspect-video overflow-hidden rounded-[1.25rem] border border-white/10 bg-black">
                  <video
                    src={previewUrl}
                    controls
                    playsInline
                    preload="metadata"
                    poster={previewThumb || undefined}
                    className="h-full w-full object-contain"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-brand-muted">
              Add a video URL to see the preview here.
            </div>
          )}
        </EditorSection>
        <EditorSection
          title="Video details"
          description="Keep it simple: title, link, cover image, and a short description."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Title"
              placeholder="Name of the reel or motion piece"
              value={draft.title}
              onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))}
            />
            <SelectField
              label="Pillar"
              value={draft.pillar}
              options={PROJECT_PILLARS}
              onChange={(value) =>
                setDraft((prev) => ({
                  ...prev,
                  pillar: value as ProjectPillar,
                  subCategory: value === 'Animation & Motion' ? prev.subCategory : '',
                }))
              }
            />
            {draft.pillar === 'Animation & Motion' ? (
              <SelectField
                label="Type"
                value={draft.subCategory}
                options={['', ...VIDEO_TYPES]}
                onChange={(value) => setDraft((prev) => ({ ...prev, subCategory: value }))}
              />
            ) : null}
            <StorageVideoField
              label="Video"
              pathPrefix="videos/media"
              value={draft.url}
              sourceValue={draft.sourceUrl}
              thumbnailValue={draft.thumbnail}
              onChange={(value) => setDraft((prev) => ({ ...prev, url: value }))}
              onSourceChange={(value) => setDraft((prev) => ({ ...prev, sourceUrl: value }))}
              onThumbnailChange={(value) => setDraft((prev) => ({ ...prev, thumbnail: value }))}
              onError={setError}
              hint="Upload a video file to keep the original, generate an optimized web MP4, and create a poster automatically."
            />
            <StorageImageField
              label="Thumbnail"
              pathPrefix="videos/thumbnails"
              value={draft.thumbnail}
              onChange={(value) => setDraft((prev) => ({ ...prev, thumbnail: value }))}
              onError={setError}
              hint="Optional. For YouTube links this fills automatically from the URL."
            />
            <SelectField
              label="Status"
              value={draft.status}
              options={ENTRY_STATUS_OPTIONS}
              onChange={(value) => setDraft((prev) => ({ ...prev, status: value as VideoDraft['status'] }))}
            />
            <LongField
              label="Description"
              className="md:col-span-2"
              placeholder="What is this piece and what should someone notice about it?"
              value={draft.description}
              onChange={(value) => setDraft((prev) => ({ ...prev, description: value }))}
            />
            <TextField
              label="Tools / Software"
              className="md:col-span-2"
              placeholder="After Effects, Premiere Pro, Blender"
              value={draft.tools}
              onChange={(value) => setDraft((prev) => ({ ...prev, tools: value }))}
              suggestions={toolSuggestions}
              quickPicks={quickToolPicks}
              suggestionMode="list"
            />
            <LongField
              label="Tags"
              className="md:col-span-2"
              placeholder="Editorial motion, looping, character animation"
              value={draft.tags}
              onChange={(value) => setDraft((prev) => ({ ...prev, tags: value }))}
              suggestions={tagSuggestions}
              quickPicks={quickTagPicks}
              suggestionMode="list"
            />
          </div>
        </EditorSection>

        <EditorSection
          title="Visibility"
          description="Controls whether this video appears in Selected Works and the Work page priority grid."
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
                ? 'Publish video'
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

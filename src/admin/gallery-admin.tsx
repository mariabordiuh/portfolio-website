import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { DataContext } from '../context/DataContext';
import { db } from '../firebase-firestore';
import { storage } from '../firebase-storage';
import { GalleryImage, ProjectPillar } from '../types';
import {
  ChecklistItem,
  ENTRY_STATUS_OPTIONS,
  GalleryDraft,
  PROJECT_PILLARS,
  clearPersistedEditorDraft,
  confirmDelete,
  defaultGalleryDraft,
  getEditorDraftStorageKey,
  keepSelectedId,
  rankSuggestions,
  readPersistedEditorDraft,
  splitList,
  toGalleryDraft,
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

const filenameToInfo = (filename: string) =>
  filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function GalleryAdmin() {
  const { projects, videos, labItems, galleryImages } = useContext(DataContext);
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draft, setDraft] = useState<GalleryDraft>(defaultGalleryDraft);
  const [busy, setBusy] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState<number | null>(null);
  const [batchSelection, setBatchSelection] = useState<string[]>([]);
  const [batchPillar, setBatchPillar] = useState<string>('');
  const [batchStatus, setBatchStatus] = useState('');
  const [batchFeatured, setBatchFeatured] = useState<'keep' | 'on' | 'off'>('keep');
  const [batchSoftware, setBatchSoftware] = useState('');
  const [batchTags, setBatchTags] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkPillar, setBulkPillar] = useState<ProjectPillar>('Illustration & Design');
  const [bulkStatus, setBulkStatus] = useState<'draft' | 'published'>('draft');
  const [bulkSoftware, setBulkSoftware] = useState('');
  const [bulkTags, setBulkTags] = useState('');
  const { notice, clear, setError, setSuccess } = useEditorNotice();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'gallery'),
      (snapshot) => {
        const nextItems = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as GalleryImage));
        setItems(nextItems);
        setSelectedId((currentId) => keepSelectedId(nextItems, currentId, isCreatingNew));
      },
      (error) => {
        setError(toReadableError('Could not load gallery items.', error));
      },
    );

    return unsubscribe;
  }, [isCreatingNew, setError]);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);
  const draftStorageKey = useMemo(
    () => getEditorDraftStorageKey('gallery', selectedId, isCreatingNew),
    [isCreatingNew, selectedId],
  );
  const baselineDraft = useMemo(() => {
    if (isCreatingNew) {
      return defaultGalleryDraft();
    }

    if (selectedId && !selectedItem) {
      return draft;
    }

    return toGalleryDraft(selectedItem);
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
      const persisted = readPersistedEditorDraft<GalleryDraft>(draftStorageKey);
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
      { label: 'Image', done: Boolean(trimValue(draft.url)) },
      { label: 'Label', done: Boolean(trimValue(draft.info) || trimValue(draft.software)) },
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
      url: trimValue(draft.url),
      status: draft.status,
      pillar: draft.pillar || undefined,
      tags: splitList(draft.tags),
      software: trimValue(draft.software) || undefined,
      info: trimValue(draft.info) || undefined,
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
  const quickSoftwarePicks = useMemo(
    () =>
      rankSuggestions([
        ...galleryImages.map((item) => item.software ?? ''),
        ...projects.flatMap((item) => item.tools ?? []),
        ...videos.flatMap((item) => item.tools ?? []),
      ]),
    [galleryImages, projects, videos],
  );
  const tagSuggestions = useMemo(
    () =>
      dedupe([
        ...galleryImages.flatMap((item) => item.tags ?? []),
        ...videos.flatMap((item) => item.tags ?? []),
        ...projects.flatMap((item) => item.categories ?? []),
      ]).sort((a, b) => a.localeCompare(b)),
    [galleryImages, projects, videos],
  );
  const quickTagPicks = useMemo(
    () =>
      rankSuggestions([
        ...galleryImages.flatMap((item) => item.tags ?? []),
        ...videos.flatMap((item) => item.tags ?? []),
        ...projects.flatMap((item) => item.categories ?? []),
      ]),
    [galleryImages, projects, videos],
  );

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
        await updateDoc(doc(db, 'gallery', selectedId), payload);
        setSuccess('Gallery item changes saved.');
      } else {
        const reference = await addDoc(collection(db, 'gallery'), {
          ...payload,
          createdAt: serverTimestamp(),
        });
        setSelectedId(reference.id);
        setIsCreatingNew(false);
        setSuccess('Gallery item created.');
      }

      clearPersistedEditorDraft(draftStorageKey);
      setLocalDraftSavedAt(null);
      setLastSavedAt(Date.now());
    } catch (error) {
      setError(toReadableError('Could not save the gallery item.', error));
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

    if (!confirmDelete('this gallery item')) {
      return;
    }

    setBusy(true);
    try {
      clear();
      await deleteDoc(doc(db, 'gallery', selectedId));
      clearPersistedEditorDraft(draftStorageKey);
      setLocalDraftSavedAt(null);
      setSelectedId(null);
      setIsCreatingNew(false);
      setDraft(defaultGalleryDraft());
      setSuccess('Gallery item deleted.');
    } catch (error) {
      setError(toReadableError('Could not delete the gallery item.', error));
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
      ...toGalleryDraft(selectedItem),
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
      const tagAdds = splitList(batchTags);
      const batch = writeBatch(db);

      batchSelection.forEach((id) => {
        const current = items.find((item) => item.id === id);
        if (!current) {
          return;
        }

        const patch: Partial<GalleryImage> = {};

        if (batchPillar) {
          patch.pillar = batchPillar as ProjectPillar;
        }

        if (batchStatus) {
          patch.status = batchStatus as GalleryDraft['status'];
        }

        if (batchFeatured !== 'keep') {
          patch.featured = batchFeatured === 'on';
        }

        if (trimValue(batchSoftware)) {
          patch.software = trimValue(batchSoftware);
        }

        if (tagAdds.length) {
          patch.tags = dedupe([...(current.tags ?? []), ...tagAdds]);
        }

        batch.update(doc(db, 'gallery', id), patch);
      });

      await batch.commit();
      setBatchSelection([]);
      setBatchPillar('');
      setBatchStatus('');
      setBatchFeatured('keep');
      setBatchSoftware('');
      setBatchTags('');
      setSuccess(`Updated ${batchSelection.length} gallery items.`);
    } catch (error) {
      setError(toReadableError('Could not update the selected gallery items.', error));
    } finally {
      setBusy(false);
    }
  }, [batchFeatured, batchPillar, batchSelection, batchSoftware, batchStatus, batchTags, busy, clear, items, setError, setSuccess]);

  const handleBatchDelete = useCallback(async () => {
    if (!batchSelection.length || busy) {
      return;
    }

    if (!confirmDelete(`${batchSelection.length} selected gallery items`)) {
      return;
    }

    setBusy(true);
    try {
      clear();
      const batch = writeBatch(db);
      batchSelection.forEach((id) => batch.delete(doc(db, 'gallery', id)));
      await batch.commit();
      setBatchSelection([]);
      setSuccess(`Deleted ${batchSelection.length} gallery items.`);
    } catch (error) {
      setError(toReadableError('Could not delete the selected gallery items.', error));
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
      setError('Paste at least one image URL to bulk import.');
      return;
    }

    setBusy(true);
    try {
      clear();
      const tags = splitList(bulkTags);
      for (const url of urls) {
        await addDoc(collection(db, 'gallery'), {
          url,
          status: bulkStatus,
          pillar: bulkPillar,
          tags,
          software: trimValue(bulkSoftware) || undefined,
          info: undefined,
          featured: false,
          workPriorityRank: null,
          createdAt: serverTimestamp(),
        });
      }
      setBulkUrls('');
      setBulkSoftware('');
      setBulkTags('');
      setSuccess(`Imported ${urls.length} gallery items.`);
    } catch (error) {
      setError(toReadableError('Could not bulk import the gallery items.', error));
    } finally {
      setBusy(false);
    }
  }, [bulkPillar, bulkSoftware, bulkStatus, bulkTags, bulkUrls, busy, clear, setError, setSuccess]);

  const handleBulkFileImport = useCallback(
    async (files: FileList | null) => {
      if (busy || !files?.length) {
        return;
      }

      if (!storage) {
        setError('Image uploads are not available right now.');
        return;
      }

      setBusy(true);
      try {
        clear();
        const tags = splitList(bulkTags);
        const uploads = Array.from(files);

        for (const file of uploads) {
          const path = `gallery/images/${Date.now()}-${file.name}`;
          const ref = storageRef(storage, path);
          await uploadBytes(ref, file);
          const url = await getDownloadURL(ref);

          await addDoc(collection(db, 'gallery'), {
            url,
            status: bulkStatus,
            pillar: bulkPillar,
            tags,
            software: trimValue(bulkSoftware) || undefined,
            info: filenameToInfo(file.name) || undefined,
            featured: false,
            workPriorityRank: null,
            createdAt: serverTimestamp(),
          });
        }

        setSuccess(`Uploaded ${uploads.length} image${uploads.length === 1 ? '' : 's'} from your laptop.`);
      } catch (error) {
        setError(toReadableError('Could not upload the gallery images.', error));
      } finally {
        setBusy(false);
      }
    },
    [bulkPillar, bulkSoftware, bulkStatus, bulkTags, busy, clear, setError, setSuccess],
  );

  const previewHref =
    !selectedId || isCreatingNew || draft.status !== 'published'
      ? null
      : `/work?pillar=${encodeURIComponent(draft.pillar || 'Illustration & Design')}&preview=${encodeURIComponent(`gallery:${selectedId}`)}`;

  useSaveShortcut(!busy && !publishMissingFields.length && isDirty, handleSave);
  useUnsavedChangesWarning(isDirty);

  return (
    <EditorLayout
      title="Gallery"
      description="A minimal image editor with one clear goal: upload, label, and save without clutter."
      list={items}
      selectedId={selectedId}
      hasUnsavedChanges={isDirty}
      createOptions={[
        {
          label: 'Illustration',
          description: 'Start a draft in Illustration & Design.',
          onSelect: () => {
            clear();
            setFocusMode(true);
            setIsCreatingNew(true);
            setSelectedId(null);
            setDraft({
              ...defaultGalleryDraft(),
              pillar: 'Illustration & Design',
              status: 'draft',
            });
          },
        },
        {
          label: 'AI image',
          description: 'Start a draft in AI Generated.',
          onSelect: () => {
            clear();
            setFocusMode(true);
            setIsCreatingNew(true);
            setSelectedId(null);
            setDraft({
              ...defaultGalleryDraft(),
              pillar: 'AI Generated',
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
        setFocusMode(true);
        setIsCreatingNew(true);
        setSelectedId(null);
        setDraft(defaultGalleryDraft());
      }}
      getLabel={(item) => item.info || item.software || 'Untitled image'}
      getMeta={(item) => [item.pillar, item.software].filter(Boolean).join(' • ')}
      notice={notice}
      statusPanel={
        <EditorStatusPanel
          title={isCreatingNew ? 'New gallery item' : selectedItem?.info || selectedItem?.software || 'Untitled gallery item'}
          description="Lead with the image and a simple label. The rest is optional support."
          checklist={checklist}
          completedCount={completedCount}
          totalCount={totalCount}
          missingFields={missingFields}
          isDirty={isDirty}
          lastSavedAt={lastSavedAt}
          localDraftSavedAt={localDraftSavedAt}
          publishStatus={draft.status}
          hasOptionalFields
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
              ? `Apply shared changes to ${batchSelection.length} selected images.`
              : 'Select images from the list to update them together.'
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
              label="Software"
              value={batchSoftware}
              onChange={setBatchSoftware}
              placeholder="Midjourney, Photoshop, Blender"
              suggestions={toolSuggestions}
              quickPicks={quickSoftwarePicks}
            />
            <LongField
              label="Add tags"
              value={batchTags}
              onChange={setBatchTags}
              placeholder="One per line or comma-separated"
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
          description="Paste several image URLs or upload several local images at once, then stamp shared defaults before saving them to the gallery."
        >
          <div className="space-y-3">
            <LongField
              label="Image URLs"
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
            <SelectField
              label="Status"
              value={bulkStatus}
              options={ENTRY_STATUS_OPTIONS}
              onChange={(value) => setBulkStatus(value as 'draft' | 'published')}
            />
            <TextField
              label="Shared software"
              value={bulkSoftware}
              onChange={setBulkSoftware}
              placeholder="Midjourney, Photoshop"
              suggestions={toolSuggestions}
              quickPicks={quickSoftwarePicks}
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
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !trimValue(bulkUrls)}
                onClick={() => void handleBulkImport()}
                className="flex-1 rounded-full bg-white px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-black disabled:opacity-50"
              >
                Import URLs
              </button>
              <label className="flex-1 cursor-pointer rounded-full border border-white/10 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-white transition-colors hover:border-brand-accent/40 hover:text-brand-accent">
                Upload files
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    void handleBulkFileImport(event.target.files);
                    event.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>
        </EditorSection>
      }
      form={
        <div className="space-y-4">
          <EditorSection
            title="Essentials"
            description="If you only do these fields, the gallery item is still useful and easy to spot later."
            tone="primary"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <StorageImageField
                label="Image"
                required
                pathPrefix="gallery/images"
                value={draft.url}
                onChange={(value) => setDraft((prev) => ({ ...prev, url: value }))}
                onError={setError}
              />
              <TextField
                label="Info"
                required
                hint="A short label, caption, or reminder"
                placeholder="Chrome sculpture exploration"
                value={draft.info}
                onChange={(value) => setDraft((prev) => ({ ...prev, info: value }))}
              />
              <TextField
                label="Software"
                className="md:col-span-2"
                placeholder="Midjourney, Blender, Photoshop"
                value={draft.software}
                onChange={(value) => setDraft((prev) => ({ ...prev, software: value }))}
                suggestions={toolSuggestions}
                quickPicks={quickSoftwarePicks}
              />
            </div>
          </EditorSection>

          {!focusMode ? (
            <EditorSection
              title="Optional organization"
              description="Helpful when you want to filter or remember context later."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Pillar"
                  value={draft.pillar}
                  options={['', ...PROJECT_PILLARS]}
                  onChange={(value) => setDraft((prev) => ({ ...prev, pillar: value as ProjectPillar | '' }))}
                />
                <SelectField
                  label="Status"
                  value={draft.status}
                  options={ENTRY_STATUS_OPTIONS}
                  onChange={(value) => setDraft((prev) => ({ ...prev, status: value as GalleryDraft['status'] }))}
                />
                <LongField
                  label="Tags"
                  hint="One per line or comma-separated"
                  placeholder="metallic, macro, surreal"
                  value={draft.tags}
                  onChange={(value) => setDraft((prev) => ({ ...prev, tags: value }))}
                  suggestions={tagSuggestions}
                  quickPicks={quickTagPicks}
                  suggestionMode="list"
                />
              </div>
            </EditorSection>
          ) : null}

          {focusMode ? (
            <EditorSection
              title="Publishing"
              description="Keep rough uploads hidden until you are ready to publish them on the live site."
            >
              <SelectField
                label="Status"
                value={draft.status}
                options={ENTRY_STATUS_OPTIONS}
                onChange={(value) => setDraft((prev) => ({ ...prev, status: value as GalleryDraft['status'] }))}
              />
            </EditorSection>
          ) : null}

          <EditorSection
            title="Visibility"
            description="Controls whether this image appears in Selected Works and the Work page priority grid."
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
                ? 'Publish image'
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

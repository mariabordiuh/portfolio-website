import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { GripVertical, ImagePlus, LoaderCircle, Trash2, X } from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { db } from '../firebase-firestore';
import { storage } from '../firebase-storage';
import { LabImage, LabItem, LabSection } from '../types';
import {
  ChecklistItem,
  ENTRY_STATUS_OPTIONS,
  LAB_TYPES,
  LabDraft,
  clearPersistedEditorDraft,
  confirmDelete,
  defaultLabDraft,
  getEditorDraftStorageKey,
  keepSelectedId,
  rankSuggestions,
  readPersistedEditorDraft,
  splitList,
  toLabDraft,
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
} from './admin-ui';

const dedupe = (values: string[]) =>
  Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));

const SECTION_OPTIONS: { value: LabSection | ''; label: string }[] = [
  { value: '', label: 'Gallery (bottom)' },
  { value: 'brief', label: 'After Brief' },
  { value: 'context', label: 'After Context' },
  { value: 'problem', label: 'After Problem' },
  { value: 'insights', label: 'After Insights' },
  { value: 'solution', label: 'After Solution' },
  { value: 'outcome', label: 'After Outcome' },
];

function DraggableImageList({
  images,
  onChange,
  onError,
}: {
  images: LabImage[];
  onChange: (images: LabImage[]) => void;
  onError: (msg: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const handleFiles = async (files: FileList) => {
    if (!storage) { onError('Storage not configured.'); return; }
    setUploading(true);
    try {
      const uploaded: LabImage[] = [];
      for (const file of Array.from(files)) {
        const r = storageRef(storage, `lab/images/${Date.now()}-${file.name}`);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        uploaded.push({ url });
      }
      onChange([...images, ...uploaded]);
    } catch (e) {
      onError(toReadableError('Upload failed.', e));
    } finally {
      setUploading(false);
    }
  };

  const updateImage = (index: number, patch: Partial<LabImage>) => {
    const next = images.map((img, i) => i === index ? { ...img, ...patch } : img);
    onChange(next);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  const onDragStart = (index: number) => { dragIndex.current = index; };
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex.current === null || dragIndex.current === index) return;
    const next = [...images];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(index, 0, moved);
    dragIndex.current = index;
    onChange(next);
  };
  const onDragEnd = () => { dragIndex.current = null; };

  return (
    <div className="space-y-3">
      {images.map((img, i) => (
        <div
          key={img.url + i}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDragEnd={onDragEnd}
          className="flex gap-3 items-center rounded-2xl border border-white/10 bg-white/5 p-3 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={16} className="shrink-0 text-brand-muted" />
          <img src={img.url} alt="" className="h-14 w-20 rounded-xl object-cover shrink-0 border border-white/10" />
          <select
            value={img.after ?? ''}
            onChange={(e) => updateImage(i, { after: (e.target.value as LabSection) || undefined })}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none focus:border-brand-accent"
          >
            {SECTION_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} className="bg-black">{opt.label}</option>
            ))}
          </select>
          <button type="button" onClick={() => removeImage(i)} className="shrink-0 text-brand-muted hover:text-red-400 transition-colors">
            <X size={16} />
          </button>
        </div>
      ))}

      <label className="flex items-center gap-2 cursor-pointer rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm text-brand-muted hover:border-brand-accent hover:text-white transition-colors">
        {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}
        {uploading ? 'Uploading…' : 'Upload images'}
        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} disabled={uploading} />
      </label>
    </div>
  );
}

export function LabAdmin() {
  const { projects, videos, labItems, galleryImages } = useContext(DataContext);
  const [items, setItems] = useState<LabItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draft, setDraft] = useState<LabDraft>(defaultLabDraft);
  const [busy, setBusy] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState<number | null>(null);
  const [batchSelection, setBatchSelection] = useState<string[]>([]);
  const [batchType, setBatchType] = useState('');
  const [batchStatus, setBatchStatus] = useState('');
  const [batchTools, setBatchTools] = useState('');
  const { notice, clear, setError, setSuccess } = useEditorNotice();
  const isThoughtPost = draft.type === 'Thoughts';

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'labItems'), orderBy('date', 'desc')),
      (snapshot) => {
        const nextItems = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as LabItem));
        setItems(nextItems);
        setSelectedId((currentId) => keepSelectedId(nextItems, currentId, isCreatingNew));
      },
      (error) => {
        setError(toReadableError('Could not load lab notes.', error));
      },
    );

    return unsubscribe;
  }, [isCreatingNew, setError]);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedId), [items, selectedId]);
  const draftStorageKey = useMemo(
    () => getEditorDraftStorageKey('labItems', selectedId, isCreatingNew),
    [isCreatingNew, selectedId],
  );
  const baselineDraft = useMemo(() => {
    if (isCreatingNew) {
      return defaultLabDraft();
    }

    if (selectedId && !selectedItem) {
      return draft;
    }

    return toLabDraft(selectedItem);
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
      const persisted = readPersistedEditorDraft<LabDraft>(draftStorageKey);
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
      isThoughtPost
        ? [
            { label: 'Title', done: Boolean(trimValue(draft.title)) },
            { label: 'Date', done: Boolean(trimValue(draft.date)) },
            { label: 'Excerpt', done: Boolean(trimValue(draft.excerpt) || trimValue(draft.content)) },
            { label: 'Body', done: Boolean(trimValue(draft.bodyMarkdown)) },
          ]
        : [
            { label: 'Title', done: Boolean(trimValue(draft.title)) },
            { label: 'Date', done: Boolean(trimValue(draft.date)) },
            { label: 'Content', done: Boolean(trimValue(draft.content)) },
          ],
    [draft, isThoughtPost],
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
    () => {
      const thumbnail = trimValue(draft.thumbnail) || trimValue(draft.image) || undefined;
      const thumbnailZoomRaw = Number(draft.thumbnailZoom || '100');
      const thumbnailPositionXRaw = Number(draft.thumbnailPositionX || '50');
      const thumbnailPositionYRaw = Number(draft.thumbnailPositionY || '50');

      return {
        title: trimValue(draft.title),
        status: draft.status,
        type: draft.type,
        content: trimValue(isThoughtPost ? draft.excerpt || draft.content : draft.content),
        thumbnail,
        thumbnailZoom: Number.isFinite(thumbnailZoomRaw)
          ? Math.min(200, Math.max(100, thumbnailZoomRaw))
          : 100,
        thumbnailPositionX: Number.isFinite(thumbnailPositionXRaw)
          ? Math.min(100, Math.max(0, thumbnailPositionXRaw))
          : 50,
        thumbnailPositionY: Number.isFinite(thumbnailPositionYRaw)
          ? Math.min(100, Math.max(0, thumbnailPositionYRaw))
          : 50,
        heroImage:
          trimValue(draft.heroImage) ||
          trimValue(draft.thumbnail) ||
          trimValue(draft.image) ||
          undefined,
        slug: trimValue(draft.slug) || undefined,
        readingTime: trimValue(draft.readingTime) || undefined,
        category: trimValue(draft.category) || undefined,
        excerpt: trimValue(draft.excerpt) || undefined,
        author: trimValue(draft.author) || undefined,
        bodyMarkdown: trimValue(draft.bodyMarkdown) || undefined,
        bodyImage:
          trimValue(draft.bodyImageUrl)
            ? {
                url: trimValue(draft.bodyImageUrl),
                alt: trimValue(draft.bodyImageAlt) || undefined,
              }
            : undefined,
        image:
          trimValue(draft.thumbnail) ||
          trimValue(draft.image) ||
          trimValue(draft.heroImage) ||
          undefined,
        code: trimValue(draft.code) || undefined,
        tools: splitList(draft.tools),
        date: trimValue(draft.date),
        timeline: trimValue(draft.timeline) || undefined,
        role: trimValue(draft.role) || undefined,
        brief: trimValue(draft.brief) || undefined,
        context: trimValue(draft.context) || undefined,
        problem: trimValue(draft.problem) || undefined,
        insights: trimValue(draft.insights) || undefined,
        solution: trimValue(draft.solution) || undefined,
        outcome: trimValue(draft.outcome) || undefined,
        labImages: draft.labImages.length ? draft.labImages : undefined,
      };
    },
    [draft, isThoughtPost],
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
  const quickToolPicks = useMemo(
    () =>
      rankSuggestions([
        ...labItems.flatMap((item) => item.tools ?? []),
        ...projects.flatMap((item) => item.tools ?? []),
        ...videos.flatMap((item) => item.tools ?? []),
      ]),
    [labItems, projects, videos],
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
        await updateDoc(doc(db, 'labItems', selectedId), payload);
        setSuccess('Lab note changes saved.');
      } else {
        const reference = await addDoc(collection(db, 'labItems'), payload);
        setSelectedId(reference.id);
        setIsCreatingNew(false);
        setSuccess('Lab note created.');
      }

      clearPersistedEditorDraft(draftStorageKey);
      setLocalDraftSavedAt(null);
      setLastSavedAt(Date.now());
    } catch (error) {
      setError(toReadableError('Could not save the lab note.', error));
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

    if (!confirmDelete('this lab note')) {
      return;
    }

    setBusy(true);
    try {
      clear();
      await deleteDoc(doc(db, 'labItems', selectedId));
      clearPersistedEditorDraft(draftStorageKey);
      setLocalDraftSavedAt(null);
      setSelectedId(null);
      setIsCreatingNew(false);
      setDraft(defaultLabDraft());
      setSuccess('Lab note deleted.');
    } catch (error) {
      setError(toReadableError('Could not delete the lab note.', error));
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
      ...toLabDraft(selectedItem),
      title: `${selectedItem.title || 'Untitled lab note'} copy`,
      status: 'draft',
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

        const patch: Partial<LabItem> = {};
        if (batchType) {
          patch.type = batchType as LabItem['type'];
        }
        if (batchStatus) {
          patch.status = batchStatus as LabDraft['status'];
        }
        if (toolAdds.length) {
          patch.tools = dedupe([...(current.tools ?? []), ...toolAdds]);
        }
        batch.update(doc(db, 'labItems', id), patch);
      });

      await batch.commit();
      setBatchSelection([]);
      setBatchType('');
      setBatchStatus('');
      setBatchTools('');
      setSuccess(`Updated ${batchSelection.length} lab notes.`);
    } catch (error) {
      setError(toReadableError('Could not update the selected lab notes.', error));
    } finally {
      setBusy(false);
    }
  }, [batchSelection, batchStatus, batchTools, batchType, busy, clear, items, setError, setSuccess]);

  const previewHref =
    !selectedId || isCreatingNew || draft.status !== 'published'
      ? null
      : `/lab?preview=${encodeURIComponent(selectedId)}`;

  useSaveShortcut(!busy && !publishMissingFields.length && isDirty, handleSave);
  useUnsavedChangesWarning(isDirty);

  return (
    <EditorLayout
      title="Lab notes"
      description="Capture experiments quickly, then open optional fields only if you need images, tools, or code."
      list={items}
      selectedId={selectedId}
      hasUnsavedChanges={isDirty}
      createOptions={LAB_TYPES.map((type) => ({
        label: type,
        description: `Start a ${type.toLowerCase()} lab draft.`,
        onSelect: () => {
          clear();
          setFocusMode(true);
          setIsCreatingNew(true);
          setSelectedId(null);
          setDraft({
            ...defaultLabDraft(),
            type,
            status: 'draft',
          });
        },
      }))}
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
        setDraft(defaultLabDraft());
      }}
      getLabel={(item) => item.title}
      getMeta={(item) => `${item.type} • ${item.date}`}
      notice={notice}
      statusPanel={
        <EditorStatusPanel
          title={isCreatingNew ? 'New lab note' : selectedItem?.title || 'Untitled lab note'}
          description="Start with the note itself. Support material can wait until the idea is clear."
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
              ? `Apply shared changes to ${batchSelection.length} selected lab notes.`
              : 'Select lab notes from the list to update them together.'
          }
        >
          <div className="space-y-3">
            <SelectField
              label="Type"
              value={batchType}
              options={['', ...LAB_TYPES]}
              onChange={setBatchType}
            />
            <SelectField
              label="Status"
              value={batchStatus}
              options={['', ...ENTRY_STATUS_OPTIONS]}
              onChange={setBatchStatus}
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
          <EditorSection
            title="Essentials"
            description="These fields are enough for a useful, searchable lab entry."
            tone="primary"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Title"
                required
                placeholder="What did you explore?"
                value={draft.title}
                onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))}
              />
              <SelectField
                label="Status"
                value={draft.status}
                options={ENTRY_STATUS_OPTIONS}
                onChange={(value) => setDraft((prev) => ({ ...prev, status: value as LabDraft['status'] }))}
              />
              <SelectField
                label="Type"
                value={draft.type}
                options={LAB_TYPES}
                onChange={(value) => setDraft((prev) => ({ ...prev, type: value as LabItem['type'] }))}
              />
              <TextField
                label="Date"
                required
                placeholder="YYYY-MM-DD"
                value={draft.date}
                onChange={(value) => setDraft((prev) => ({ ...prev, date: value }))}
              />
              <LongField
                label={isThoughtPost ? 'Excerpt' : 'Teaser'}
                required
                className="md:col-span-2"
                placeholder={
                  isThoughtPost
                    ? 'Short preview shown on the Lab index'
                    : 'One-liner shown on the card (e.g. A premium Hanseatic bakery experience.)'
                }
                value={isThoughtPost ? draft.excerpt : draft.content}
                onChange={(value) =>
                  setDraft((prev) =>
                    isThoughtPost
                      ? { ...prev, excerpt: value, content: prev.content || value }
                      : { ...prev, content: value },
                  )
                }
              />
            </div>
          </EditorSection>

          <EditorSection
            title="Display"
            description="Thumbnail is for the Lab card. Hero image is used when the post opens."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <StorageImageField
                label="Card thumbnail"
                pathPrefix="lab/images"
                value={draft.thumbnail}
                onChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    thumbnail: value,
                    image: value || prev.image,
                    heroImage: prev.heroImage || value,
                  }))
                }
                onError={setError}
                hint="Used on the Lab index / preview card."
                previewScale={Math.max(1, Number(draft.thumbnailZoom || '100') / 100)}
                previewPosition={`${Number(draft.thumbnailPositionX || '50')}% ${Number(draft.thumbnailPositionY || '50')}%`}
              />
              <StorageImageField
                label="Hero image"
                pathPrefix="lab/images"
                value={draft.heroImage}
                onChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    heroImage: value,
                    thumbnail: prev.thumbnail || value,
                    image: prev.image || prev.thumbnail || value,
                  }))
                }
                onError={setError}
                hint="Shown at the top of the opened Lab post."
              />
              <NumberField
                label="Thumbnail zoom (%)"
                value={draft.thumbnailZoom}
                min={100}
                max={200}
                onChange={(value) => setDraft((prev) => ({ ...prev, thumbnailZoom: value }))}
                hint="100 = original fit. Increase this to crop in tighter on the Lab card."
              />
              <NumberField
                label="Thumbnail horizontal position (%)"
                value={draft.thumbnailPositionX}
                min={0}
                max={100}
                onChange={(value) => setDraft((prev) => ({ ...prev, thumbnailPositionX: value }))}
                hint="50 = centered. Lower moves the crop left, higher moves it right."
              />
              <NumberField
                label="Thumbnail vertical position (%)"
                value={draft.thumbnailPositionY}
                min={0}
                max={100}
                onChange={(value) => setDraft((prev) => ({ ...prev, thumbnailPositionY: value }))}
                hint="50 = centered. Lower moves the crop up, higher moves it down."
              />
            </div>
          </EditorSection>

          {isThoughtPost ? (
            <EditorSection
              title="Article post"
              description="Use this for Thoughts or Notes that do not follow the structured case-study layout."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Slug"
                  placeholder="pinterest-most-used-tool"
                  value={draft.slug}
                  onChange={(value) => setDraft((prev) => ({ ...prev, slug: value }))}
                />
                <TextField
                  label="Reading time"
                  placeholder="2 min"
                  value={draft.readingTime}
                  onChange={(value) => setDraft((prev) => ({ ...prev, readingTime: value }))}
                />
                <TextField
                  label="Category / tag"
                  placeholder="Thoughts"
                  value={draft.category}
                  onChange={(value) => setDraft((prev) => ({ ...prev, category: value }))}
                />
                <TextField
                  label="Author"
                  placeholder="Maria Bordiuh"
                  value={draft.author}
                  onChange={(value) => setDraft((prev) => ({ ...prev, author: value }))}
                />
                <LongField
                  label="Body markdown"
                  required
                  className="md:col-span-2"
                  placeholder="Write the full post in markdown."
                  value={draft.bodyMarkdown}
                  onChange={(value) => setDraft((prev) => ({ ...prev, bodyMarkdown: value }))}
                />
                <StorageImageField
                  label="Inline article image"
                  pathPrefix="lab/images"
                  className="md:col-span-2"
                  value={draft.bodyImageUrl}
                  onChange={(value) => setDraft((prev) => ({ ...prev, bodyImageUrl: value }))}
                  onError={setError}
                  hint="This is the image inserted at the placeholder inside the article body."
                />
                <TextField
                  label="Inline image alt text"
                  className="md:col-span-2"
                  placeholder="Describe the image for accessibility."
                  value={draft.bodyImageAlt}
                  onChange={(value) => setDraft((prev) => ({ ...prev, bodyImageAlt: value }))}
                />
              </div>
            </EditorSection>
          ) : (
            <EditorSection
              title="Case study"
              description="Fill what you have — leave the rest empty. Only populated sections show on the site."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Timeline"
                  placeholder="e.g. 48 hours"
                  value={draft.timeline}
                  onChange={(value) => setDraft((prev) => ({ ...prev, timeline: value }))}
                />
                <TextField
                  label="Role"
                  placeholder="e.g. Art Director & Brand Designer"
                  value={draft.role}
                  onChange={(value) => setDraft((prev) => ({ ...prev, role: value }))}
                />
                <LongField
                  label="Brief"
                  className="md:col-span-2"
                  placeholder="What was the challenge or goal?"
                  value={draft.brief}
                  onChange={(value) => setDraft((prev) => ({ ...prev, brief: value }))}
                />
                <LongField
                  label="Context"
                  className="md:col-span-2"
                  placeholder="Background, why this matters"
                  value={draft.context}
                  onChange={(value) => setDraft((prev) => ({ ...prev, context: value }))}
                />
                <LongField
                  label="Problem"
                  className="md:col-span-2"
                  placeholder="What made this hard?"
                  value={draft.problem}
                  onChange={(value) => setDraft((prev) => ({ ...prev, problem: value }))}
                />
                <LongField
                  label="Insights"
                  className="md:col-span-2"
                  placeholder="Key learnings"
                  value={draft.insights}
                  onChange={(value) => setDraft((prev) => ({ ...prev, insights: value }))}
                />
                <LongField
                  label="Solution"
                  className="md:col-span-2"
                  placeholder="What you built and how"
                  value={draft.solution}
                  onChange={(value) => setDraft((prev) => ({ ...prev, solution: value }))}
                />
                <LongField
                  label="Outcome"
                  className="md:col-span-2"
                  placeholder="Result, reflection, what you'd do differently"
                  value={draft.outcome}
                  onChange={(value) => setDraft((prev) => ({ ...prev, outcome: value }))}
                />
                <div className="md:col-span-2 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Images</p>
                  <p className="text-xs text-brand-muted">Upload and reorder. Choose where each image appears, or leave as gallery at the bottom.</p>
                  <DraggableImageList
                    images={draft.labImages}
                    onChange={(imgs) => setDraft((prev) => ({ ...prev, labImages: imgs }))}
                    onError={setError}
                  />
                </div>
              </div>
            </EditorSection>
          )}

          {!focusMode ? (
            <EditorSection
              title="Extras"
              description="Image, tools, and code snippets."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <LongField
                  label="Code"
                  placeholder="Paste a short code sample or prompt"
                  value={draft.code}
                  onChange={(value) => setDraft((prev) => ({ ...prev, code: value }))}
                  className={isThoughtPost ? 'md:col-span-2' : undefined}
                />
                <LongField
                  label="Tools"
                  className="md:col-span-2"
                  hint="One per line or comma-separated"
                  placeholder="Runway, Blender, ChatGPT"
                  value={draft.tools}
                  onChange={(value) => setDraft((prev) => ({ ...prev, tools: value }))}
                  suggestions={toolSuggestions}
                  quickPicks={quickToolPicks}
                  suggestionMode="list"
                />
              </div>
            </EditorSection>
          ) : null}
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
                ? 'Publish lab note'
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

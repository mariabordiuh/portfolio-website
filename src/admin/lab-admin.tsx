import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import { GripVertical, ImagePlus, LoaderCircle, Trash2, X } from 'lucide-react';
import { db } from '../firebase-firestore';
import { storage } from '../firebase-storage';
import { LabImage, LabItem, LabSection } from '../types';
import {
  ChecklistItem,
  LAB_TYPES,
  LabDraft,
  confirmDelete,
  defaultLabDraft,
  keepSelectedId,
  splitList,
  toLabDraft,
  toReadableError,
  trimValue,
  useEditorNotice,
  useEditorProgress,
  useSaveShortcut,
  useUnsavedChangesWarning,
} from './admin-logic';
import {
  EditorLayout,
  EditorSection,
  EditorStatusPanel,
  FormActions,
  LongField,
  SelectField,
  StorageImageField,
  TextField,
} from './admin-ui';

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
  const [items, setItems] = useState<LabItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draft, setDraft] = useState<LabDraft>(defaultLabDraft);
  const [busy, setBusy] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const { notice, clear, setError, setSuccess } = useEditorNotice();

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
  const baselineDraft = useMemo(() => {
    if (isCreatingNew) {
      return defaultLabDraft();
    }

    if (selectedId && !selectedItem) {
      return draft;
    }

    return toLabDraft(selectedItem);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreatingNew, selectedItem]);

  const checklist = useMemo<ChecklistItem[]>(
    () => [
      { label: 'Title', done: Boolean(trimValue(draft.title)) },
      { label: 'Date', done: Boolean(trimValue(draft.date)) },
      { label: 'Content', done: Boolean(trimValue(draft.content)) },
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
    if (!isDirtyRef.current) {
      setDraft(baselineDraft);
    }
  }, [baselineDraft]);
  const payload = useMemo(
    () => ({
      title: trimValue(draft.title),
      type: draft.type,
      content: trimValue(draft.content),
      image: trimValue(draft.image) || undefined,
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
    }),
    [draft],
  );
  const disabledReason = missingFields.length
    ? `Add ${missingFields.join(', ')} to save.`
    : isDirty
      ? null
      : 'Make a change to enable save.';

  const handleSave = useCallback(async () => {
    if (busy) {
      return;
    }

    if (missingFields.length) {
      setError(`Add ${missingFields.join(', ')} before saving.`);
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

      setLastSavedAt(Date.now());
    } catch (error) {
      setError(toReadableError('Could not save the lab note.', error));
    } finally {
      setBusy(false);
    }
  }, [busy, clear, isCreatingNew, missingFields, payload, selectedId, setError, setSuccess]);

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
      setSelectedId(null);
      setIsCreatingNew(false);
      setDraft(defaultLabDraft());
      setSuccess('Lab note deleted.');
    } catch (error) {
      setError(toReadableError('Could not delete the lab note.', error));
    } finally {
      setBusy(false);
    }
  }, [clear, isCreatingNew, selectedId, setError, setSuccess]);

  useSaveShortcut(!busy && !missingFields.length && isDirty, handleSave);
  useUnsavedChangesWarning(isDirty);

  return (
    <EditorLayout
      title="Lab notes"
      description="Capture experiments quickly, then open optional fields only if you need images, tools, or code."
      list={items}
      selectedId={selectedId}
      hasUnsavedChanges={isDirty}
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
          hasOptionalFields
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode((value) => !value)}
        />
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
                label="Teaser"
                required
                className="md:col-span-2"
                placeholder="One-liner shown on the card (e.g. A premium Hanseatic bakery experience.)"
                value={draft.content}
                onChange={(value) => setDraft((prev) => ({ ...prev, content: value }))}
              />
            </div>
          </EditorSection>

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

          {!focusMode ? (
            <EditorSection
              title="Extras"
              description="Image, tools, and code snippets."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <StorageImageField
                  label="Image"
                  pathPrefix="lab/images"
                  value={draft.image}
                  onChange={(value) => setDraft((prev) => ({ ...prev, image: value }))}
                  onError={setError}
                />
                <LongField
                  label="Code"
                  placeholder="Paste a short code sample or prompt"
                  value={draft.code}
                  onChange={(value) => setDraft((prev) => ({ ...prev, code: value }))}
                />
                <LongField
                  label="Tools"
                  className="md:col-span-2"
                  hint="One per line or comma-separated"
                  placeholder="Runway, Blender, ChatGPT"
                  value={draft.tools}
                  onChange={(value) => setDraft((prev) => ({ ...prev, tools: value }))}
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
          saveLabel={isCreatingNew ? 'Create lab note' : 'Save lab note'}
          disabledReason={disabledReason}
          onSave={handleSave}
          onDelete={!isCreatingNew && selectedId ? handleDelete : undefined}
        />
      }
    />
  );
}

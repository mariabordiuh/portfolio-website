import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-firestore';
import { ProjectPillar, Video } from '../types';
import {
  ChecklistItem,
  PROJECT_PILLARS,
  VideoDraft,
  confirmDelete,
  defaultVideoDraft,
  keepSelectedId,
  toReadableError,
  toVideoDraft,
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
  NumberField,
  SelectField,
  StorageImageField,
  TextField,
  ToggleField,
} from './admin-ui';

export function VideosAdmin() {
  const [items, setItems] = useState<Video[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draft, setDraft] = useState<VideoDraft>(defaultVideoDraft);
  const [busy, setBusy] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
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
      setDraft(baselineDraft);
    }

    previousSelectionRef.current = { selectedId, isCreatingNew };
  }, [baselineDraft, isCreatingNew, selectedId]);

  const checklist = useMemo<ChecklistItem[]>(
    () => [
      { label: 'Title', done: Boolean(trimValue(draft.title)) },
      { label: 'Video URL', done: Boolean(trimValue(draft.url)) },
      { label: 'Thumbnail', done: Boolean(trimValue(draft.thumbnail)) },
      { label: 'Description', done: Boolean(trimValue(draft.description)) },
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
  const payload = useMemo(
    () => ({
      title: trimValue(draft.title),
      pillar: draft.pillar,
      url: trimValue(draft.url),
      thumbnail: trimValue(draft.thumbnail),
      description: trimValue(draft.description),
      featured: draft.featured,
      workPriorityRank: draft.workPriorityRank ? Number(draft.workPriorityRank) : null,
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
        await updateDoc(doc(db, 'videos', selectedId), payload);
        setSuccess('Video changes saved.');
      } else {
        const reference = await addDoc(collection(db, 'videos'), payload);
        setSelectedId(reference.id);
        setIsCreatingNew(false);
        setSuccess('Video created.');
      }

      setLastSavedAt(Date.now());
    } catch (error) {
      setError(toReadableError('Could not save the video.', error));
    } finally {
      setBusy(false);
    }
  }, [busy, clear, isCreatingNew, missingFields, payload, selectedId, setError, setSuccess]);

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
      setSelectedId(null);
      setIsCreatingNew(false);
      setDraft(defaultVideoDraft());
      setSuccess('Video deleted.');
    } catch (error) {
      setError(toReadableError('Could not delete the video.', error));
    } finally {
      setBusy(false);
    }
  }, [clear, isCreatingNew, selectedId, setError, setSuccess]);

  useSaveShortcut(!busy && !missingFields.length && isDirty, handleSave);
  useUnsavedChangesWarning(isDirty);

  return (
    <EditorLayout
      title="Videos"
      description="A small, straightforward editor for reels and motion pieces."
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
        setIsCreatingNew(true);
        setSelectedId(null);
        setDraft(defaultVideoDraft());
      }}
      getLabel={(item) => item.title}
      getMeta={(item) => item.pillar}
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
        />
      }
      form={
        <div className="space-y-4">
        <EditorSection
          title="Video details"
          description="Keep it simple: title, link, cover image, and a short description."
          tone="primary"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              label="Title"
              required
              placeholder="Name of the reel or motion piece"
              value={draft.title}
              onChange={(value) => setDraft((prev) => ({ ...prev, title: value }))}
            />
            <SelectField
              label="Pillar"
              value={draft.pillar}
              options={PROJECT_PILLARS}
              onChange={(value) => setDraft((prev) => ({ ...prev, pillar: value as ProjectPillar }))}
            />
            <TextField
              label="Video URL"
              required
              placeholder="https://..."
              value={draft.url}
              onChange={(value) => setDraft((prev) => ({ ...prev, url: value }))}
            />
            <StorageImageField
              label="Thumbnail"
              required
              pathPrefix="videos/thumbnails"
              value={draft.thumbnail}
              onChange={(value) => setDraft((prev) => ({ ...prev, thumbnail: value }))}
              onError={setError}
            />
            <LongField
              label="Description"
              required
              className="md:col-span-2"
              placeholder="What is this piece and what should someone notice about it?"
              value={draft.description}
              onChange={(value) => setDraft((prev) => ({ ...prev, description: value }))}
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
          saveLabel={isCreatingNew ? 'Create video' : 'Save video'}
          disabledReason={disabledReason}
          onSave={handleSave}
          onDelete={!isCreatingNew && selectedId ? handleDelete : undefined}
        />
      }
    />
  );
}

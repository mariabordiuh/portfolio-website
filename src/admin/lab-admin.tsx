import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-firestore';
import { LabItem } from '../types';
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
  }, [draft, isCreatingNew, selectedId, selectedItem]);

  useEffect(() => {
    setDraft(baselineDraft);
  }, [baselineDraft]);

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
  const payload = useMemo(
    () => ({
      title: trimValue(draft.title),
      type: draft.type,
      content: trimValue(draft.content),
      image: trimValue(draft.image) || undefined,
      code: trimValue(draft.code) || undefined,
      tools: splitList(draft.tools),
      date: trimValue(draft.date),
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
                label="Content"
                required
                className="md:col-span-2"
                placeholder="Write the idea, observation, or result in plain language."
                value={draft.content}
                onChange={(value) => setDraft((prev) => ({ ...prev, content: value }))}
              />
            </div>
          </EditorSection>

          {!focusMode ? (
            <EditorSection
              title="Optional support"
              description="Add these only when they help the note stand on its own."
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

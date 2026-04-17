import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { GalleryImage, ProjectPillar } from '../types';
import {
  ChecklistItem,
  GalleryDraft,
  PROJECT_PILLARS,
  confirmDelete,
  defaultGalleryDraft,
  keepSelectedId,
  splitList,
  toGalleryDraft,
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

export function GalleryAdmin() {
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draft, setDraft] = useState<GalleryDraft>(defaultGalleryDraft);
  const [busy, setBusy] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
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
  const baselineDraft = useMemo(() => {
    if (isCreatingNew) {
      return defaultGalleryDraft();
    }

    if (selectedId && !selectedItem) {
      return draft;
    }

    return toGalleryDraft(selectedItem);
  }, [draft, isCreatingNew, selectedId, selectedItem]);

  useEffect(() => {
    setDraft(baselineDraft);
  }, [baselineDraft]);

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
  const payload = useMemo(
    () => ({
      url: trimValue(draft.url),
      pillar: draft.pillar || undefined,
      tags: splitList(draft.tags),
      software: trimValue(draft.software) || undefined,
      info: trimValue(draft.info) || undefined,
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

      setLastSavedAt(Date.now());
    } catch (error) {
      setError(toReadableError('Could not save the gallery item.', error));
    } finally {
      setBusy(false);
    }
  }, [busy, clear, isCreatingNew, missingFields, payload, selectedId, setError, setSuccess]);

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
      setSelectedId(null);
      setIsCreatingNew(false);
      setDraft(defaultGalleryDraft());
      setSuccess('Gallery item deleted.');
    } catch (error) {
      setError(toReadableError('Could not delete the gallery item.', error));
    } finally {
      setBusy(false);
    }
  }, [clear, isCreatingNew, selectedId, setError, setSuccess]);

  useSaveShortcut(!busy && !missingFields.length && isDirty, handleSave);
  useUnsavedChangesWarning(isDirty);

  return (
    <EditorLayout
      title="Gallery"
      description="A minimal image editor with one clear goal: upload, label, and save without clutter."
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
          hasOptionalFields
          focusMode={focusMode}
          onToggleFocusMode={() => setFocusMode((value) => !value)}
        />
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
                <LongField
                  label="Tags"
                  hint="One per line or comma-separated"
                  placeholder="metallic, macro, surreal"
                  value={draft.tags}
                  onChange={(value) => setDraft((prev) => ({ ...prev, tags: value }))}
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
          saveLabel={isCreatingNew ? 'Create gallery item' : 'Save gallery item'}
          disabledReason={disabledReason}
          onSave={handleSave}
          onDelete={!isCreatingNew && selectedId ? handleDelete : undefined}
        />
      }
    />
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase-firestore';
import { Project, ProjectPillar } from '../types';
import {
  ChecklistItem,
  ProjectDraft,
  PROJECT_PILLARS,
  confirmDelete,
  defaultProjectDraft,
  keepSelectedId,
  splitList,
  toProjectDraft,
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

export function ProjectsAdmin() {
  const [items, setItems] = useState<Project[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [draft, setDraft] = useState<ProjectDraft>(defaultProjectDraft);
  const [busy, setBusy] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
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
  const baselineDraft = useMemo(() => {
    if (isCreatingNew) {
      return defaultProjectDraft();
    }

    if (selectedId && !selectedItem) {
      return draft;
    }

    return toProjectDraft(selectedItem);
  }, [draft, isCreatingNew, selectedId, selectedItem]);

  useEffect(() => {
    setDraft(baselineDraft);
  }, [baselineDraft]);

  const checklist = useMemo<ChecklistItem[]>(
    () => [
      { label: 'Title', done: Boolean(trimValue(draft.title)) },
      { label: 'Category', done: Boolean(trimValue(draft.category)) },
      { label: 'Description', done: Boolean(trimValue(draft.description)) },
      { label: 'Thumbnail', done: Boolean(trimValue(draft.thumbnail)) },
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
      pillar: draft.pillar,
      subCategory: trimValue(draft.subCategory) || undefined,
      category: trimValue(draft.category),
      description: trimValue(draft.description),
      thumbnail: trimValue(draft.thumbnail),
      images: [],
      tools: splitList(draft.tools),
      client: trimValue(draft.client) || undefined,
      globalContext: trimValue(draft.globalContext) || undefined,
      creativeTension: trimValue(draft.creativeTension) || undefined,
      mariaRole: splitList(draft.mariaRole),
      moodboardImages: splitList(draft.moodboardImages),
      outcomeVisuals: splitList(draft.outcomeVisuals),
      outcomeResultCopy: trimValue(draft.outcomeResultCopy) || undefined,
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
        await updateDoc(doc(db, 'projects', selectedId), payload);
        setSuccess('Project changes saved.');
      } else {
        const reference = await addDoc(collection(db, 'projects'), payload);
        setSelectedId(reference.id);
        setIsCreatingNew(false);
        setSuccess('Project created.');
      }

      setLastSavedAt(Date.now());
    } catch (error) {
      setError(toReadableError('Could not save the project.', error));
    } finally {
      setBusy(false);
    }
  }, [busy, clear, isCreatingNew, missingFields, payload, selectedId, setError, setSuccess]);

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
      setSelectedId(null);
      setIsCreatingNew(false);
      setDraft(defaultProjectDraft());
      setSuccess('Project deleted.');
    } catch (error) {
      setError(toReadableError('Could not delete the project.', error));
    } finally {
      setBusy(false);
    }
  }, [clear, isCreatingNew, selectedId, setError, setSuccess]);

  useSaveShortcut(!busy && !missingFields.length && isDirty, handleSave);
  useUnsavedChangesWarning(isDirty);

  return (
    <EditorLayout
      title="Projects"
      description="Case studies with the most fields. Focus mode keeps the story extras tucked away until you want them."
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
        setDraft(defaultProjectDraft());
      }}
      getLabel={(item) => item.title}
      getMeta={(item) => [item.pillar, item.category].filter(Boolean).join(' • ')}
      notice={notice}
      statusPanel={
        <EditorStatusPanel
          title={isCreatingNew ? 'New project' : selectedItem?.title || 'Untitled project'}
          description="Fill the essentials first. Optional story fields stay out of the way until you ask for them."
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
            description="These are the only fields you need for a clean, publishable case study."
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
              <TextField
                label="Category"
                value={draft.category}
                required
                placeholder="Brand film, visual system, social campaign"
                onChange={(value) => setDraft((prev) => ({ ...prev, category: value }))}
              />
              <SelectField
                label="Pillar"
                value={draft.pillar}
                options={PROJECT_PILLARS}
                onChange={(value) => setDraft((prev) => ({ ...prev, pillar: value as ProjectPillar }))}
              />
              <StorageImageField
                label="Thumbnail"
                required
                pathPrefix="projects/thumbnails"
                value={draft.thumbnail}
                onChange={(value) => setDraft((prev) => ({ ...prev, thumbnail: value }))}
                onError={setError}
              />
              <LongField
                label="Description"
                required
                className="md:col-span-2"
                placeholder="A short, clear summary of what this project is and why it matters."
                value={draft.description}
                onChange={(value) => setDraft((prev) => ({ ...prev, description: value }))}
              />
            </div>
          </EditorSection>

          {!focusMode ? (
            <>
              <EditorSection
                title="Context and credits"
                description="Use this when you want more story and context around the project."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label="Client"
                    placeholder="Client or collaborator"
                    value={draft.client}
                    onChange={(value) => setDraft((prev) => ({ ...prev, client: value }))}
                  />
                  <TextField
                    label="Subcategory"
                    placeholder="Optional supporting label"
                    value={draft.subCategory}
                    onChange={(value) => setDraft((prev) => ({ ...prev, subCategory: value }))}
                  />
                  <LongField
                    label="Global context"
                    className="md:col-span-2"
                    placeholder="What was happening around the project? What made it important?"
                    value={draft.globalContext}
                    onChange={(value) => setDraft((prev) => ({ ...prev, globalContext: value }))}
                  />
                  <LongField
                    label="Creative tension"
                    placeholder="What challenge or tension shaped the work?"
                    value={draft.creativeTension}
                    onChange={(value) => setDraft((prev) => ({ ...prev, creativeTension: value }))}
                  />
                  <LongField
                    label="Outcome result copy"
                    placeholder="What changed, landed, or succeeded?"
                    value={draft.outcomeResultCopy}
                    onChange={(value) => setDraft((prev) => ({ ...prev, outcomeResultCopy: value }))}
                  />
                </div>
              </EditorSection>

              <EditorSection
                title="Lists and supporting visuals"
                description="One item per line works well here, especially when you want to brain-dump quickly."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <LongField
                    label="Tools"
                    hint="One per line or comma-separated"
                    placeholder="Blender, Midjourney, After Effects"
                    value={draft.tools}
                    onChange={(value) => setDraft((prev) => ({ ...prev, tools: value }))}
                  />
                  <LongField
                    label="Maria role"
                    hint="One per line or comma-separated"
                    placeholder="Art direction, image curation, motion design"
                    value={draft.mariaRole}
                    onChange={(value) => setDraft((prev) => ({ ...prev, mariaRole: value }))}
                  />
                  <LongField
                    label="Moodboard images"
                    hint="One image URL per line"
                    placeholder="https://..."
                    value={draft.moodboardImages}
                    onChange={(value) => setDraft((prev) => ({ ...prev, moodboardImages: value }))}
                  />
                  <LongField
                    label="Outcome visuals"
                    hint="One image URL per line"
                    placeholder="https://..."
                    value={draft.outcomeVisuals}
                    onChange={(value) => setDraft((prev) => ({ ...prev, outcomeVisuals: value }))}
                  />
                </div>
              </EditorSection>
            </>
          ) : null}
        </div>
      }
      actions={
        <FormActions
          busy={busy}
          isDirty={isDirty}
          saveLabel={isCreatingNew ? 'Create project' : 'Save project'}
          disabledReason={disabledReason}
          onSave={handleSave}
          onDelete={!isCreatingNew && selectedId ? handleDelete : undefined}
        />
      }
    />
  );
}

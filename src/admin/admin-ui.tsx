import { type ChangeEvent, type ReactNode, useDeferredValue, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  ImagePlus,
  ListFilter,
  LoaderCircle,
  Film,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase-storage';
import { cn } from '@/src/lib/utils';
import { optimizeAndUploadVideo } from '../utils/video-upload';
import {
  ChecklistItem,
  EditorLayoutProps,
  EditorNotice,
  EditorStatusPanelProps,
  confirmDiscardChanges,
  formatRelativeTime,
  toReadableError,
} from './admin-logic';

const splitSuggestionEntries = (value: string) =>
  value
    .split('\n')
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

const getListSuggestionQuery = (value: string) => {
  const match = value.match(/(?:^|[\n,])\s*([^\n,]*)$/);
  return match?.[1]?.trim() ?? value.trim();
};

const replaceListSuggestion = (value: string, suggestion: string) => {
  const match = value.match(/(^|[\n,])(\s*)([^\n,]*)$/);
  if (!match) {
    return suggestion;
  }

  const currentToken = match[3] ?? '';
  return `${value.slice(0, value.length - currentToken.length)}${suggestion}`;
};

function SuggestionTray({
  items,
  onPick,
}: {
  items: string[];
  onPick: (value: string) => void;
}) {
  if (!items.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPick(item)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:border-brand-accent/30 hover:text-white"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export function NoticeBanner({ notice }: { notice: EditorNotice }) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-[1.25rem] border px-4 py-3 text-sm',
        notice.tone === 'error'
          ? 'border-red-500/20 bg-red-500/10 text-red-100'
          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
      )}
    >
      {notice.tone === 'error' ? (
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
      )}
      <p>{notice.message}</p>
    </div>
  );
}

export function CenteredCard({
  title,
  body,
  action,
  loading = false,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  loading?: boolean;
}) {
  return (
    <section className="section-shell py-24">
      <div className="glass mx-auto max-w-xl rounded-[2rem] p-10 text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-white/5">
          {loading ? (
            <LoaderCircle className="animate-spin text-brand-accent" />
          ) : (
            <Check className="text-brand-accent" />
          )}
        </div>
        <h1 className="text-3xl font-semibold">{title}</h1>
        <p className="mt-4 leading-8 text-brand-muted">{body}</p>
        {action ? <div className="mt-8 flex justify-center">{action}</div> : null}
      </div>
    </section>
  );
}

export function AdminWelcomeCard() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="glass rounded-[2rem] p-6">
        <div className="flex items-center gap-2 text-brand-accent">
          <Sparkles size={16} />
          <span className="text-xs font-semibold uppercase tracking-[0.25em]">ADHD-friendly flow</span>
        </div>
        <h2 className="mt-4 text-2xl font-semibold">One clear step at a time.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-muted">
          Pick one collection, fill the essentials first, then save when the status card says you are ready.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <StepCard number="1" title="Choose one list" body="Use search if the sidebar feels busy." />
          <StepCard number="2" title="Fill essentials" body="Optional fields stay hidden in focus mode." />
          <StepCard number="3" title="Save with confidence" body="Draft protection and required checks catch slips." />
        </div>
      </div>

      <div className="glass rounded-[2rem] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted">Helpful safeguards</p>
        <div className="mt-4 space-y-3 text-sm text-brand-muted">
          <p>Unsaved edits are protected before you switch items or reload the page.</p>
          <p>The save area tells you exactly what is still missing instead of leaving you guessing.</p>
          <p>`Cmd/Ctrl + S` works whenever a form is ready, so finishing is easy when you are in flow.</p>
        </div>
      </div>
    </div>
  );
}

export function EditorLayout<T extends { id: string }>({
  title,
  description,
  list,
  selectedId,
  hasUnsavedChanges,
  onSelect,
  onCreate,
  createOptions,
  getLabel,
  getMeta,
  notice,
  statusPanel,
  form,
  actions,
  sidebarFooter,
  batchSelection,
  onBatchSelectionChange,
  batchPanel,
}: EditorLayoutProps<T>) {
  const [query, setQuery] = useState('');
  const [batchMode, setBatchMode] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const filteredList = useMemo(() => {
    if (!deferredQuery) {
      return list;
    }

    return list.filter((item) => {
      const label = getLabel(item).toLowerCase();
      const meta = getMeta?.(item)?.toLowerCase() ?? '';

      return label.includes(deferredQuery) || meta.includes(deferredQuery);
    });
  }, [deferredQuery, getLabel, getMeta, list]);
  const selectedHiddenBySearch = Boolean(
    deferredQuery && selectedId && !filteredList.some((item) => item.id === selectedId),
  );

  const handleSelect = (id: string) => {
    if (id === selectedId) {
      return;
    }

    if (hasUnsavedChanges && !confirmDiscardChanges()) {
      return;
    }

    onSelect(id);
  };

  const handleCreate = () => {
    if (hasUnsavedChanges && !confirmDiscardChanges()) {
      return;
    }

    setBatchMode(false);
    onBatchSelectionChange?.([]);
    onCreate();
  };

  const handleBatchToggle = () => {
    const nextValue = !batchMode;
    setBatchMode(nextValue);
    if (!nextValue) {
      onBatchSelectionChange?.([]);
    }
  };

  const allShownIds = filteredList.map((item) => item.id);
  const allShownSelected = Boolean(
    batchMode &&
      batchSelection?.length &&
      allShownIds.length &&
      allShownIds.every((id) => batchSelection.includes(id)),
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
      <aside className="glass rounded-[2rem] p-4">
        <div className="border-b border-white/10 px-2 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="mt-1 text-xs leading-6 text-brand-muted">{description}</p>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em]"
            >
              <Plus size={14} />
              New
            </button>
          </div>
          {createOptions?.length ? (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted">Quick add</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {createOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      if (hasUnsavedChanges && !confirmDiscardChanges()) {
                        return;
                      }

                      setBatchMode(false);
                      onBatchSelectionChange?.([]);
                      option.onSelect();
                    }}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-white transition-colors hover:border-brand-accent/30 hover:text-brand-accent"
                    title={option.description}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-3 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-[0.2em] text-brand-muted">
              <div className="flex items-center gap-2">
                <ListFilter size={14} />
                {filteredList.length === list.length ? `${list.length} entries` : `${filteredList.length} of ${list.length} shown`}
              </div>
              {onBatchSelectionChange ? (
                <button
                  type="button"
                  onClick={handleBatchToggle}
                  className={cn(
                    'rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em]',
                    batchMode
                      ? 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent'
                      : 'border-white/10 bg-white/5 text-brand-muted',
                  )}
                >
                  {batchMode ? 'Done selecting' : 'Batch edit'}
                </button>
              ) : null}
            </div>
            <label className="mt-3 flex items-center gap-3 rounded-[1rem] border border-white/10 bg-white/5 px-3 py-3">
              <Search size={16} className="text-brand-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${title.toLowerCase()}...`}
                className="w-full bg-transparent text-sm outline-none placeholder:text-brand-muted"
              />
            </label>
            {batchMode && onBatchSelectionChange ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    onBatchSelectionChange(
                      allShownSelected
                        ? (batchSelection ?? []).filter((id) => !allShownIds.includes(id))
                        : Array.from(new Set([...(batchSelection ?? []), ...allShownIds])),
                    )
                  }
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-brand-muted"
                >
                  {allShownSelected ? 'Clear shown' : 'Select shown'}
                </button>
                {batchSelection?.length ? (
                  <button
                    type="button"
                    onClick={() => onBatchSelectionChange([])}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-brand-muted"
                  >
                    Clear all
                  </button>
                ) : null}
              </div>
            ) : null}
            {selectedHiddenBySearch ? (
              <p className="mt-3 text-xs text-amber-200">
                The current draft is hidden by this search. Clear the search to see it again.
              </p>
            ) : null}
          </div>
        </div>

        {batchMode && batchPanel ? <div className="mt-4">{batchPanel}</div> : null}

        <div className="mt-4 max-h-[640px] space-y-2 overflow-y-auto pr-1">
          {filteredList.length ? (
            filteredList.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (batchMode && onBatchSelectionChange) {
                    onBatchSelectionChange(
                      batchSelection?.includes(item.id)
                        ? (batchSelection ?? []).filter((id) => id !== item.id)
                        : [...(batchSelection ?? []), item.id],
                    );
                    return;
                  }

                  handleSelect(item.id);
                }}
                className={cn(
                  'w-full rounded-2xl border px-4 py-3 text-left',
                  selectedId === item.id
                    ? 'border-brand-accent bg-brand-accent/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10',
                )}
              >
                <div className="flex items-start gap-3">
                  {batchMode && onBatchSelectionChange ? (
                    <span
                      className={cn(
                        'mt-0.5 inline-flex h-4 w-4 shrink-0 rounded border',
                        batchSelection?.includes(item.id)
                          ? 'border-brand-accent bg-brand-accent'
                          : 'border-white/15 bg-transparent',
                      )}
                    >
                      {batchSelection?.includes(item.id) ? (
                        <Check size={12} className="m-auto text-brand-bg" />
                      ) : null}
                    </span>
                  ) : null}
                  <div className="min-w-0">
                    <span className="line-clamp-2 text-sm font-medium text-white">
                      {getLabel(item) || 'Untitled item'}
                    </span>
                    {getMeta?.(item) ? (
                      <span className="mt-1 block text-xs text-brand-muted">{getMeta(item)}</span>
                    ) : null}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-6 text-sm text-brand-muted">
              No matches yet. Try another search or create a fresh entry.
            </div>
          )}
        </div>

        {sidebarFooter ? <div className="mt-4">{sidebarFooter}</div> : null}
      </aside>

      <div className="space-y-4">
        {notice ? <NoticeBanner notice={notice} /> : null}
        {statusPanel}
        <div className="glass rounded-[2rem] p-6 md:p-8">
          <div className="space-y-6">
            {actions ? <div className="sticky top-4 z-10">{actions}</div> : null}
            {form}
            {actions}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EditorStatusPanel({
  title,
  description,
  checklist,
  completedCount,
  totalCount,
  missingFields,
  isDirty,
  lastSavedAt,
  hasOptionalFields = false,
  focusMode = false,
  onToggleFocusMode,
  localDraftSavedAt,
  publishStatus = 'published',
}: EditorStatusPanelProps) {
  const savedLabel = formatRelativeTime(lastSavedAt);
  const localDraftLabel = formatRelativeTime(localDraftSavedAt);

  return (
    <div className="glass rounded-[2rem] p-5 md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-muted">Current editor</p>
          <div>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-muted">{description}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {checklist.map((item) => (
              <ChecklistChip key={item.label} item={item} />
            ))}
          </div>

          <p className="text-sm text-brand-muted">
            Essentials ready: {completedCount}/{totalCount}
          </p>

          {publishStatus === 'draft' ? (
            <p className="text-sm text-amber-100">
              Saved as draft items stay hidden from the live site until you switch them to published.
            </p>
          ) : missingFields.length ? (
            <p className="text-sm text-amber-200">Still needed: {missingFields.join(', ')}</p>
          ) : (
            <p className="text-sm text-emerald-200">Everything essential is ready to save.</p>
          )}
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          {hasOptionalFields && onToggleFocusMode ? (
            <button
              type="button"
              onClick={onToggleFocusMode}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-white"
            >
              {focusMode ? 'Show optional fields' : 'Hide optional fields'}
            </button>
          ) : null}

          <StatusPill tone={isDirty ? 'warning' : 'success'}>
            {isDirty ? 'Unsaved changes' : 'Everything saved'}
          </StatusPill>

          {localDraftLabel ? (
            <div className="inline-flex items-center gap-2 text-xs text-brand-muted">
              <Save size={14} />
              Local draft updated {localDraftLabel}
            </div>
          ) : null}

          {savedLabel ? (
            <div className="inline-flex items-center gap-2 text-xs text-brand-muted">
              <Clock3 size={14} />
              Last saved {savedLabel}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EditorSection({
  title,
  description,
  tone = 'default',
  children,
}: {
  title: string;
  description: string;
  tone?: 'default' | 'primary';
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-[1.5rem] border p-5',
        tone === 'primary'
          ? 'border-brand-accent/25 bg-brand-accent/5'
          : 'border-white/10 bg-white/[0.03]',
      )}
    >
      <div className="mb-4 space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm leading-7 text-brand-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function FormActions({
  busy,
  isDirty,
  saveLabel,
  disabledReason,
  onSave,
  onDelete,
  onDuplicate,
  previewHref,
  previewLabel = 'Open live preview',
}: {
  busy: boolean;
  isDirty: boolean;
  saveLabel: string;
  disabledReason: string | null;
  onSave: () => Promise<void>;
  onDelete?: () => Promise<void>;
  onDuplicate?: () => void;
  previewHref?: string | null;
  previewLabel?: string;
}) {
  const saveDisabled = busy || Boolean(disabledReason);

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-white">
            {busy ? 'Saving changes...' : saveDisabled ? 'Not ready yet' : 'Ready to save'}
          </p>
          <p className="text-sm text-brand-muted">
            {busy
              ? 'Hold on while Firebase updates this item.'
              : disabledReason ?? 'Use the button or press Cmd/Ctrl + S while this form is ready.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={saveDisabled}
            onClick={() => void onSave()}
            className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
            {saveLabel}
          </button>

          {onDelete ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void onDelete()}
              className="inline-flex items-center gap-2 rounded-full border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-300 disabled:opacity-70"
            >
              <Trash2 size={16} />
              Delete
            </button>
          ) : null}

          {onDuplicate ? (
            <button
              type="button"
              disabled={busy}
              onClick={onDuplicate}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
            >
              <Copy size={16} />
              Duplicate
            </button>
          ) : null}

          {previewHref ? (
            <a
              href={previewHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white"
            >
              <ExternalLink size={16} />
              {previewLabel}
            </a>
          ) : null}

          {!isDirty && !busy ? (
            <StatusPill tone="muted">No unsaved changes</StatusPill>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-accent">{number}</p>
      <h3 className="mt-2 text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-brand-muted">{body}</p>
    </div>
  );
}

function ChecklistChip({ item }: { item: ChecklistItem }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs',
        item.done
          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
          : 'border-white/10 bg-white/5 text-brand-muted',
      )}
    >
      {item.done ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
      {item.label}
    </span>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: 'success' | 'warning' | 'muted';
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]',
        tone === 'success' && 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100',
        tone === 'warning' && 'border-amber-400/20 bg-amber-400/10 text-amber-100',
        tone === 'muted' && 'border-white/10 bg-white/5 text-brand-muted',
      )}
    >
      {children}
    </span>
  );
}

function FieldLabel({
  label,
  required = false,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-[0.25em] text-brand-muted">{label}</span>
      {required ? (
        <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-accent">
          Essential
        </span>
      ) : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  required = false,
  className,
  suggestions,
  quickPicks,
  suggestionMode = 'single',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  suggestions?: string[];
  quickPicks?: string[];
  suggestionMode?: 'single' | 'list';
}) {
  const normalizedSuggestions = useMemo(
    () =>
      (suggestions ?? [])
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item, index, array) => array.indexOf(item) === index),
    [suggestions],
  );
  const existingEntries = useMemo(() => new Set(splitSuggestionEntries(value).map((entry) => entry.toLowerCase())), [value]);
  const query =
    suggestionMode === 'list' ? getListSuggestionQuery(value).toLowerCase() : value.trim().toLowerCase();
  const matchingSuggestions = useMemo(() => {
    if (!query) {
      return (quickPicks ?? [])
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item, index, array) => array.indexOf(item) === index)
        .filter((item) => {
          if (suggestionMode === 'list' && existingEntries.has(item.toLowerCase())) {
            return false;
          }

          return true;
        })
        .slice(0, 10);
    }

    return normalizedSuggestions
      .filter((item) => {
        const normalizedItem = item.toLowerCase();
        if (!normalizedItem.includes(query) || normalizedItem === query) {
          return false;
        }

        if (suggestionMode === 'list' && existingEntries.has(normalizedItem)) {
          return false;
        }

        return true;
      })
      .slice(0, 8);
  }, [existingEntries, normalizedSuggestions, query, quickPicks, suggestionMode]);

  return (
    <label className={cn('space-y-2', className)}>
      <FieldLabel label={label} required={required} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
      />
      <SuggestionTray
        items={matchingSuggestions}
        onPick={(nextValue) =>
          onChange(suggestionMode === 'list' ? replaceListSuggestion(value, nextValue) : nextValue)
        }
      />
      {hint ? <span className="text-xs text-brand-muted">{hint}</span> : null}
    </label>
  );
}

export function LongField({
  label,
  value,
  onChange,
  hint,
  placeholder,
  required = false,
  className,
  suggestions,
  quickPicks,
  suggestionMode = 'single',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  suggestions?: string[];
  quickPicks?: string[];
  suggestionMode?: 'single' | 'list';
}) {
  const normalizedSuggestions = useMemo(
    () =>
      (suggestions ?? [])
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item, index, array) => array.indexOf(item) === index),
    [suggestions],
  );
  const existingEntries = useMemo(() => new Set(splitSuggestionEntries(value).map((entry) => entry.toLowerCase())), [value]);
  const query =
    suggestionMode === 'list' ? getListSuggestionQuery(value).toLowerCase() : value.trim().toLowerCase();
  const matchingSuggestions = useMemo(() => {
    if (!query) {
      return (quickPicks ?? [])
        .map((item) => item.trim())
        .filter(Boolean)
        .filter((item, index, array) => array.indexOf(item) === index)
        .filter((item) => {
          if (suggestionMode === 'list' && existingEntries.has(item.toLowerCase())) {
            return false;
          }

          return true;
        })
        .slice(0, 10);
    }

    return normalizedSuggestions
      .filter((item) => {
        const normalizedItem = item.toLowerCase();
        if (!normalizedItem.includes(query) || normalizedItem === query) {
          return false;
        }

        if (suggestionMode === 'list' && existingEntries.has(normalizedItem)) {
          return false;
        }

        return true;
      })
      .slice(0, 8);
  }, [existingEntries, normalizedSuggestions, query, quickPicks, suggestionMode]);

  return (
    <label className={cn('space-y-2', className)}>
      <FieldLabel label={label} required={required} />
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-32 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
      />
      <SuggestionTray
        items={matchingSuggestions}
        onPick={(nextValue) =>
          onChange(suggestionMode === 'list' ? replaceListSuggestion(value, nextValue) : nextValue)
        }
      />
      {hint ? <span className="text-xs text-brand-muted">{hint}</span> : null}
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  hint,
  className,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={cn('space-y-2', className)}>
      <FieldLabel label={label} />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none focus:border-brand-accent"
      >
        {options.map((option) => (
          <option key={option || 'empty'} value={option}>
            {option || 'None'}
          </option>
        ))}
      </select>
      {hint ? <span className="text-xs text-brand-muted">{hint}</span> : null}
    </label>
  );
}

export function StorageImageField({
  label,
  pathPrefix,
  value,
  onChange,
  onError,
  onUploadingChange,
  hint,
  required = false,
  className,
  previewScale = 1,
  previewPosition = '50% 50%',
}: {
  label: string;
  pathPrefix: string;
  value: string;
  onChange: (value: string) => void;
  onError?: (message: string) => void;
  onUploadingChange?: (uploading: boolean) => void;
  hint?: string;
  required?: boolean;
  className?: string;
  previewScale?: number;
  previewPosition?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);
    onUploadingChange?.(true);

    try {
      setUploadError(null);
      const storageRef = ref(storage, `${pathPrefix}/${Date.now()}-${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      onChange(url);
    } catch (error) {
      const message = toReadableError('Upload failed.', error);
      setUploadError(message);
      onError?.(message);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      event.target.value = '';
    }
  };

  return (
    <label className={cn('space-y-2', className)}>
      <FieldLabel label={label} required={required} />
      <div className="flex flex-wrap gap-3">
        <input
          value={value}
          onChange={(event) => {
            setUploadError(null);
            onChange(event.target.value);
          }}
          className="min-w-[240px] flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
          placeholder="Paste a URL or upload a file"
        />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm">
          {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          Upload
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
      </div>
      {hint ? <span className="text-xs text-brand-muted">{hint}</span> : null}
      {value ? (
        <div className="space-y-2">
          <div className="overflow-hidden rounded-2xl border border-white/10">
            <img
              src={value}
              alt=""
              className="aspect-video w-full max-w-sm object-cover"
              style={{
                transform: `scale(${previewScale})`,
                transformOrigin: 'center center',
                objectPosition: previewPosition,
              }}
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={value}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-brand-muted transition-colors hover:text-white"
            >
              <ExternalLink size={12} />
              Open full size
            </a>
          </div>
        </div>
      ) : null}
      {uploadError ? <p className="text-xs text-red-300">{uploadError}</p> : null}
    </label>
  );
}

export function StorageVideoField({
  label,
  pathPrefix,
  value,
  sourceValue,
  thumbnailValue,
  onChange,
  onSourceChange,
  onThumbnailChange,
  onError,
  hint,
  className,
}: {
  label: string;
  pathPrefix: string;
  value: string;
  sourceValue?: string;
  thumbnailValue?: string;
  onChange: (value: string) => void;
  onSourceChange?: (value: string) => void;
  onThumbnailChange?: (value: string) => void;
  onError?: (message: string) => void;
  hint?: string;
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploading(true);

    try {
      setUploadError(null);
      const result = await optimizeAndUploadVideo({
        file,
        pathPrefix,
        onStatus: (nextStatus) => setStatus(nextStatus),
      });
      onChange(result.optimizedUrl);
      onSourceChange?.(result.originalUrl);
      onThumbnailChange?.(result.posterUrl);
      setStatus(
        result.usedOriginalAsPrimary
          ? 'Original kept as primary because optimization did not meaningfully reduce size.'
          : `Optimized from ${(result.originalSize / 1024 / 1024).toFixed(1)}MB to ${(result.optimizedSize / 1024 / 1024).toFixed(1)}MB.`,
      );
    } catch (error) {
      const message = toReadableError('Video upload failed.', error);
      setUploadError(message);
      onError?.(message);
      setStatus(null);
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  return (
    <label className={cn('space-y-2', className)}>
      <FieldLabel label={label} required />
      <div className="flex flex-wrap gap-3">
        <input
          value={value}
          onChange={(event) => {
            setUploadError(null);
            onChange(event.target.value);
          }}
          className="min-w-[240px] flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
          placeholder="Paste a video URL or upload a file"
        />
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 px-4 py-3 text-sm">
          {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <Film size={16} />}
          {uploading ? 'Optimizing...' : 'Upload video'}
          <input type="file" accept="video/*" onChange={handleFile} className="hidden" />
        </label>
      </div>
      {hint ? <span className="text-xs text-brand-muted">{hint}</span> : null}
      {status ? <p className="text-xs text-brand-muted">{status}</p> : null}
      {value ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50">
          <video
            src={value}
            poster={thumbnailValue || undefined}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full max-w-2xl object-contain"
          />
        </div>
      ) : null}
      {sourceValue ? (
        <a
          href={sourceValue}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-xs text-brand-muted underline underline-offset-4 hover:text-white"
        >
          Open original source video
        </a>
      ) : null}
      {uploadError ? <p className="text-xs text-red-300">{uploadError}</p> : null}
    </label>
  );
}

export function ToggleField({
  label,
  hint,
  value,
  onChange,
  className,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}) {
  return (
    <label className={cn('flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3', className)}>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {hint ? <p className="mt-0.5 text-xs text-brand-muted">{hint}</p> : null}
      </div>
      <div
        className={cn(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200',
          value ? 'bg-brand-accent' : 'bg-white/10',
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
            value ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
        <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
      </div>
    </label>
  );
}

export function NumberField({
  label,
  hint,
  placeholder,
  value,
  onChange,
  min,
  max,
  className,
}: {
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <FieldLabel label={label} />
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none placeholder:text-brand-muted focus:border-brand-accent"
      />
      {hint ? <p className="text-xs text-brand-muted">{hint}</p> : null}
    </div>
  );
}

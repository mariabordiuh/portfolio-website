import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { getBlob, getDownloadURL, getMetadata, ref, uploadBytes } from 'firebase/storage';

import { db } from '../firebase-firestore';
import { storage } from '../firebase-storage';
import { cn } from '../lib/utils';
import type { GalleryImage, HomeHeroSettings, LabItem, Project, Video } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Where an image URL lives in Firestore. */
type ImageReference = {
  collection: string;
  docId: string;
  field: string;
};

type ImageEntry = {
  url: string;
  storagePath: string;
  fileName: string;
  /** Byte size of the current file. `null` while loading. */
  size: number | null;
  /** References to every Firestore doc/field that uses this URL. */
  refs: ImageReference[];
  /** Optimization status. */
  status: 'idle' | 'optimizing' | 'done' | 'error';
  /** New size after optimization (if done). */
  newSize?: number;
  /** New download URL after optimization (if done). */
  newUrl?: string;
  /** Error message if optimization failed. */
  errorMessage?: string;
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WARN_THRESHOLD = 500 * 1024;  // 500 KB
const DANGER_THRESHOLD = 1024 * 1024; // 1 MB
const WEBP_QUALITY = 0.82;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const sizeTone = (bytes: number): 'green' | 'amber' | 'red' => {
  if (bytes > DANGER_THRESHOLD) return 'red';
  if (bytes > WARN_THRESHOLD) return 'amber';
  return 'green';
};

/** Check if a URL points to Firebase Storage. */
const isFirebaseStorageUrl = (url: string) =>
  url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com');

/**
 * Extract the storage object path from a Firebase Storage download URL.
 * URL pattern: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded-path}?...
 */
const extractStoragePath = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const pathSegment = parsed.pathname.split('/o/')[1];
    if (!pathSegment) return null;
    return decodeURIComponent(pathSegment);
  } catch {
    return null;
  }
};

/** Pull a short readable file name from the storage path. */
const extractFileName = (storagePath: string): string => {
  const parts = storagePath.split('/');
  return parts[parts.length - 1] || storagePath;
};

// ---------------------------------------------------------------------------
// URL extraction from Firestore data
// ---------------------------------------------------------------------------

type CollectionData = {
  projects: Project[];
  videos: Video[];
  labItems: LabItem[];
  galleryImages: GalleryImage[];
  homeHero: HomeHeroSettings;
};

/**
 * Walk every known image-URL field in the data and return  a de-duplicated
 * list of Firebase Storage URLs with their Firestore references.
 */
const extractAllImageUrls = (data: CollectionData): Map<string, ImageReference[]> => {
  const map = new Map<string, ImageReference[]>();

  const add = (url: string | undefined | null, collection: string, docId: string, field: string) => {
    if (!url || !url.trim() || !isFirebaseStorageUrl(url)) return;
    const refs = map.get(url) ?? [];
    refs.push({ collection, docId, field });
    map.set(url, refs);
  };

  const addList = (urls: string[] | undefined, collection: string, docId: string, field: string) => {
    urls?.forEach((url, i) => add(url, collection, docId, `${field}[${i}]`));
  };

  // Projects
  for (const p of data.projects) {
    add(p.thumbnail, 'projects', p.id, 'thumbnail');
    add(p.heroImage, 'projects', p.id, 'heroImage');
    add(p.mediaUrl, 'projects', p.id, 'mediaUrl');
    add(p.videoUrl, 'projects', p.id, 'videoUrl');
    addList(p.images, 'projects', p.id, 'images');
    addList(p.moodboardImages, 'projects', p.id, 'moodboardImages');
    addList(p.sketchImages, 'projects', p.id, 'sketchImages');
    addList(p.explorationImages, 'projects', p.id, 'explorationImages');
    addList(p.outcomeImages, 'projects', p.id, 'outcomeImages');
    addList(p.outcomeVisuals, 'projects', p.id, 'outcomeVisuals');
  }

  // Videos
  for (const v of data.videos) {
    add(v.thumbnail, 'videos', v.id, 'thumbnail');
  }

  // Lab items
  for (const l of data.labItems) {
    add(l.image, 'labItems', l.id, 'image');
  }

  // Gallery
  for (const g of data.galleryImages) {
    add(g.url, 'gallery', g.id, 'url');
    add(g.image, 'gallery', g.id, 'image');
  }

  // Home hero
  if (data.homeHero?.id) {
    const heroId = data.homeHero.id;
    add(data.homeHero.desktopImage, 'settings', heroId, 'desktopImage');
    add(data.homeHero.mobileImage, 'settings', heroId, 'mobileImage');
    add(data.homeHero.posterImage, 'settings', heroId, 'posterImage');
  }

  return map;
};

// ---------------------------------------------------------------------------
// Image optimization via Canvas
// ---------------------------------------------------------------------------

const optimizeImage = async (blob: Blob): Promise<Blob> => {
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const webpBlob = await canvas.convertToBlob({ type: 'image/webp', quality: WEBP_QUALITY });
  return webpBlob;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export type StorageOptimizerProps = CollectionData;

export function StorageOptimizer(props: StorageOptimizerProps) {
  const [entries, setEntries] = useState<ImageEntry[]>([]);
  const [scanning, setScanning] = useState(false);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const abortRef = useRef(false);

  // ---- Scan ----

  const scan = useCallback(async () => {
    setScanning(true);
    abortRef.current = false;

    const urlMap = extractAllImageUrls(props);
    const list: ImageEntry[] = [];

    for (const [url, refs] of urlMap) {
      const storagePath = extractStoragePath(url);
      if (!storagePath) continue;
      list.push({
        url,
        storagePath,
        fileName: extractFileName(storagePath),
        size: null,
        refs,
        status: 'idle',
      });
    }

    setEntries(list);

    // Fetch sizes in parallel (batched to avoid too many requests)
    const BATCH = 6;
    for (let i = 0; i < list.length; i += BATCH) {
      if (abortRef.current) break;
      const batch = list.slice(i, i + BATCH);
      await Promise.all(
        batch.map(async (entry) => {
          try {
            const storageRef = ref(storage, entry.storagePath);
            const metadata = await getMetadata(storageRef);
            entry.size = metadata.size;
          } catch {
            entry.size = -1;
          }
        }),
      );
      setEntries((prev) => [...prev]);
    }

    setScanning(false);
  }, [props]);

  // Auto-scan on mount
  useEffect(() => {
    scan();
    return () => {
      abortRef.current = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Optimize a single image ----

  const optimizeSingle = useCallback(async (index: number) => {
    setEntries((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status: 'optimizing' };
      return next;
    });

    try {
      const entry = entries[index];

      // 1. Fetch the original image blob via Firebase SDK (avoids CORS)
      const storageRef = ref(storage, entry.storagePath);
      const originalBlob = await getBlob(storageRef);

      // 2. Optimize via Canvas → WebP
      const optimizedBlob = await optimizeImage(originalBlob);

      // 3. Upload to same storage path (overwrite)
      await uploadBytes(storageRef, optimizedBlob, { contentType: 'image/webp' });

      // 4. Get new download URL
      const newUrl = await getDownloadURL(storageRef);

      // 5. Update every Firestore document referencing the old URL
      await patchFirestoreRefs(entry.refs, entry.url, newUrl);

      setEntries((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: 'done',
          newSize: optimizedBlob.size,
          newUrl,
          url: newUrl,
          size: optimizedBlob.size,
        };
        return next;
      });
    } catch (err) {
      console.error('Optimize failed:', err);
      setEntries((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        };
        return next;
      });
    }
  }, [entries]);

  // ---- Batch optimize ----

  const optimizeAll = useCallback(async () => {
    const oversizedIndexes = entries
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => e.size !== null && e.size > WARN_THRESHOLD && e.status === 'idle')
      .map(({ i }) => i);

    if (!oversizedIndexes.length) return;

    setBatchRunning(true);
    setBatchProgress({ done: 0, total: oversizedIndexes.length });
    abortRef.current = false;

    for (let j = 0; j < oversizedIndexes.length; j++) {
      if (abortRef.current) break;
      await optimizeSingle(oversizedIndexes[j]);
      setBatchProgress({ done: j + 1, total: oversizedIndexes.length });
    }

    setBatchRunning(false);
  }, [entries, optimizeSingle]);

  const stopBatch = useCallback(() => {
    abortRef.current = true;
  }, []);

  // ---- Stats ----

  const stats = useMemo(() => {
    const loaded = entries.filter((e) => e.size !== null && e.size >= 0);
    const totalSize = loaded.reduce((acc, e) => acc + (e.size ?? 0), 0);
    const oversized = loaded.filter((e) => (e.size ?? 0) > WARN_THRESHOLD);
    const critical = loaded.filter((e) => (e.size ?? 0) > DANGER_THRESHOLD);
    const optimized = entries.filter((e) => e.status === 'done');
    const totalSavings = optimized.reduce(
      (acc, e) => acc + ((e.newSize !== undefined ? (entries.find((_) => _.url === e.url)?.size ?? e.newSize) : 0) - (e.newSize ?? 0)),
      0,
    );

    return {
      total: entries.length,
      loaded: loaded.length,
      totalSize,
      oversized: oversized.length,
      critical: critical.length,
      optimized: optimized.length,
      totalSavings: Math.max(0, totalSavings),
    };
  }, [entries]);

  // ---- Sort: biggest first, but group by status ----

  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      // Errors first
      if (a.status === 'error' && b.status !== 'error') return -1;
      if (b.status === 'error' && a.status !== 'error') return 1;
      // Then by size descending
      return (b.size ?? 0) - (a.size ?? 0);
    });
  }, [entries]);

  // ---- Render ----

  return (
    <div className="lg:col-span-3 space-y-8">
      {/* Header */}
      <div className="glass rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="border-b border-white/5 bg-white/[0.02] px-10 py-10">
          <div className="max-w-4xl space-y-4">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-accent">
              Storage Optimizer
            </p>
            <h2 className="text-5xl font-black uppercase tracking-tighter">
              Image Health
            </h2>
            <p className="max-w-2xl text-sm leading-relaxed text-white/65">
              Scans every image URL across your Firestore collections, shows file sizes, and lets
              you compress oversized images to WebP — re-uploading in-place and patching all
              references automatically.
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5">
          <StatCell
            icon={<ImageIcon size={16} />}
            label="Total images"
            value={scanning ? `${stats.loaded} / ${stats.total}` : `${stats.total}`}
            loading={scanning}
          />
          <StatCell
            icon={<HardDrive size={16} />}
            label="Total size"
            value={stats.totalSize > 0 ? formatBytes(stats.totalSize) : '—'}
            loading={scanning}
          />
          <StatCell
            icon={<AlertTriangle size={16} />}
            label="Oversized (>500 KB)"
            value={`${stats.oversized}`}
            tone={stats.oversized > 0 ? 'amber' : 'green'}
          />
          <StatCell
            icon={<Sparkles size={16} />}
            label="Optimized"
            value={stats.optimized > 0 ? `${stats.optimized} (−${formatBytes(stats.totalSavings)})` : '0'}
            tone={stats.optimized > 0 ? 'green' : undefined}
          />
        </div>

        {/* Action bar */}
        <div className="px-10 py-6 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={scan}
            disabled={scanning}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white/5 disabled:opacity-40"
          >
            <RefreshCw size={14} className={scanning ? 'animate-spin' : ''} />
            {scanning ? 'Scanning...' : 'Re-scan'}
          </button>

          {stats.oversized > 0 && !batchRunning && (
            <button
              type="button"
              onClick={optimizeAll}
              className="inline-flex items-center gap-2 rounded-full bg-brand-accent px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-brand-bg hover:brightness-110"
            >
              <Zap size={14} />
              Optimize All ({stats.oversized} images)
            </button>
          )}

          {batchRunning && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-brand-accent">
                <Loader2 size={16} className="animate-spin" />
                {batchProgress.done} / {batchProgress.total}
              </div>
              <div className="h-2 w-40 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-brand-accent rounded-full transition-all duration-500"
                  style={{ width: `${(batchProgress.done / batchProgress.total) * 100}%` }}
                />
              </div>
              <button
                type="button"
                onClick={stopBatch}
                className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300"
              >
                Stop
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image list */}
      {entries.length > 0 ? (
        <div className="space-y-3">
          {sortedEntries.map((entry, idx) => {
            // Find the real index in entries[] for the optimize callback
            const realIndex = entries.findIndex((e) => e.url === entry.url && e.storagePath === entry.storagePath);
            return (
              <ImageRow
                key={entry.storagePath}
                entry={entry}
                onOptimize={() => optimizeSingle(realIndex)}
              />
            );
          })}
        </div>
      ) : !scanning ? (
        <div className="glass rounded-[2rem] border border-white/5 p-12 text-center">
          <p className="text-brand-muted text-sm">No Firebase Storage images found across your collections.</p>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCell({
  icon,
  label,
  value,
  tone,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'green' | 'amber' | 'red';
  loading?: boolean;
}) {
  return (
    <div className="bg-brand-bg/70 px-6 py-5 space-y-2">
      <div className="flex items-center gap-2 text-brand-muted">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
      </div>
      <p
        className={cn(
          'text-2xl font-black tracking-tight',
          tone === 'green' && 'text-emerald-400',
          tone === 'amber' && 'text-amber-400',
          tone === 'red' && 'text-red-400',
          !tone && 'text-white',
        )}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            {value} <Loader2 size={14} className="animate-spin text-brand-muted" />
          </span>
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function ImageRow({
  entry,
  onOptimize,
}: {
  entry: ImageEntry;
  onOptimize: () => void;
}) {
  const isOversized = entry.size !== null && entry.size > WARN_THRESHOLD;
  const tone = entry.size !== null && entry.size >= 0 ? sizeTone(entry.size) : undefined;

  return (
    <div
      className={cn(
        'glass rounded-2xl border overflow-hidden transition-all',
        entry.status === 'error'
          ? 'border-red-500/30'
          : entry.status === 'done'
            ? 'border-emerald-500/20'
            : isOversized
              ? 'border-amber-400/20'
              : 'border-white/5',
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
          <img
            src={entry.url}
            alt=""
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-semibold text-white truncate" title={entry.fileName}>
            {entry.fileName}
          </p>
          <p className="text-[10px] text-brand-muted uppercase tracking-widest truncate" title={entry.storagePath}>
            {entry.storagePath}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {entry.refs.map((r, i) => (
              <span
                key={`${r.collection}-${r.docId}-${r.field}-${i}`}
                className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-widest text-brand-muted"
              >
                {r.collection}/{r.field}
              </span>
            ))}
          </div>
        </div>

        {/* Size + action */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {entry.size === null ? (
            <Loader2 size={14} className="animate-spin text-brand-muted" />
          ) : entry.size < 0 ? (
            <span className="text-xs text-red-400">fetch error</span>
          ) : (
            <div className="text-right">
              <p
                className={cn(
                  'text-sm font-black tabular-nums',
                  tone === 'green' && 'text-emerald-400',
                  tone === 'amber' && 'text-amber-400',
                  tone === 'red' && 'text-red-400',
                )}
              >
                {formatBytes(entry.size)}
              </p>
              {entry.status === 'done' && entry.newSize !== undefined && (
                <p className="text-[10px] text-emerald-400 font-semibold">
                  was {formatBytes(entry.size)} → optimized
                </p>
              )}
            </div>
          )}

          {/* Action button */}
          {entry.status === 'idle' && isOversized && (
            <button
              type="button"
              onClick={onOptimize}
              className="inline-flex items-center gap-2 rounded-full bg-brand-accent/10 border border-brand-accent/30 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-brand-accent hover:bg-brand-accent/20 transition-all"
            >
              <Zap size={12} />
              Optimize
            </button>
          )}

          {entry.status === 'optimizing' && (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-brand-muted">
              <Loader2 size={12} className="animate-spin" />
              Converting...
            </div>
          )}

          {entry.status === 'done' && (
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400">
              <CheckCircle2 size={12} />
              Done
            </div>
          )}

          {entry.status === 'error' && (
            <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 border border-red-500/20 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-red-400" title={entry.errorMessage}>
              <AlertTriangle size={12} />
              Failed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Firestore patching
// ---------------------------------------------------------------------------

/**
 * For each reference, update the Firestore document, replacing oldUrl with
 * newUrl in the specified field.
 *
 * For array fields like `images[2]`, we need to read the array, replace the
 * matching element, and write back. For simple string fields, we just set.
 */
async function patchFirestoreRefs(refs: ImageReference[], oldUrl: string, newUrl: string) {
  // Group refs by collection/docId so we batch updates per document
  const grouped = new Map<string, ImageReference[]>();
  for (const r of refs) {
    const key = `${r.collection}/${r.docId}`;
    const list = grouped.get(key) ?? [];
    list.push(r);
    grouped.set(key, list);
  }

  for (const [key, docRefs] of grouped) {
    const [collectionName, docId] = key.split('/');
    const docRef = doc(db, collectionName, docId);

    const updates: Record<string, unknown> = {};

    for (const r of docRefs) {
      const arrayMatch = r.field.match(/^(.+)\[\d+\]$/);
      if (arrayMatch) {
        // Array field — we can't do a targeted array index update in Firestore,
        // so we need to do a fieldValue replacement. However, updateDoc doesn't
        // support arrayRemove+arrayUnion atomically for ordered arrays. Instead,
        // the next time the entry is re-read from Firestore's onSnapshot, it will
        // pick up the new URL.
        //
        // Simpler approach: we fetch document, replace in array, write back.
        // But we'd need getDoc. Instead, since the Firestore data is already
        // available in-memory via DataContext, let's just track the array field
        // name and handle it.
        const baseField = arrayMatch[1];
        if (!updates[`__array:${baseField}`]) {
          updates[`__array:${baseField}`] = true;
        }
      } else {
        // Simple string field
        updates[r.field] = newUrl;
      }
    }

    // Build the actual Firestore update payload
    const payload: Record<string, unknown> = {};

    for (const [field, value] of Object.entries(updates)) {
      if (field.startsWith('__array:')) {
        // For array fields, we need the current data. Since we don't have it
        // handy here, we'll use a special approach: fetch the doc, patch, write.
        const arrayField = field.replace('__array:', '');
        // We'll handle this via a separate getDoc + setDoc below
        continue;
      }
      payload[field] = value;
    }

    // Handle simple fields
    if (Object.keys(payload).length > 0) {
      await updateDoc(docRef, payload);
    }

    // Handle array fields by fetching, patching, writing
    const arrayFields = Object.keys(updates)
      .filter((k) => k.startsWith('__array:'))
      .map((k) => k.replace('__array:', ''));

    if (arrayFields.length > 0) {
      const { getDoc } = await import('firebase/firestore');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const arrayUpdates: Record<string, unknown> = {};
        for (const arrField of arrayFields) {
          const arr = data[arrField];
          if (Array.isArray(arr)) {
            arrayUpdates[arrField] = arr.map((item: string) => (item === oldUrl ? newUrl : item));
          }
        }
        if (Object.keys(arrayUpdates).length > 0) {
          await updateDoc(docRef, arrayUpdates);
        }
      }
    }
  }
}

import { FFmpeg } from '@ffmpeg/ffmpeg';
import type { FileData } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase-storage';

const FFMPEG_CORE_VERSION = '0.12.10';
const MAX_VIDEO_FILE_SIZE_BYTES = 150 * 1024 * 1024;
const CORE_BASE_URL = `https://unpkg.com/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoadPromise: Promise<FFmpeg> | null = null;

export type OptimizedVideoUploadResult = {
  optimizedUrl: string;
  originalUrl: string;
  posterUrl: string;
  optimizedSize: number;
  originalSize: number;
  usedOriginalAsPrimary: boolean;
};

const sanitizeFileStem = (filename: string) =>
  filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase() || 'video';

const getMimeType = (bytes: Uint8Array) => {
  const signature = Array.from(bytes.slice(4, 8))
    .map((value) => String.fromCharCode(value))
    .join('');

  if (signature === 'ftyp') {
    return 'video/mp4';
  }

  return 'video/mp4';
};

const ensureBinaryData = (data: FileData, label: string) => {
  if (data instanceof Uint8Array) {
    return data;
  }

  throw new Error(`${label} could not be generated.`);
};

const uploadBlob = async (blob: Blob, storagePath: string, contentType: string) => {
  if (!storage) {
    throw new Error('Storage is not configured.');
  }

  const storageReference = ref(storage, storagePath);
  await uploadBytes(storageReference, blob, { contentType });
  return getDownloadURL(storageReference);
};

const loadFFmpeg = async (onStatus?: (status: string) => void) => {
  if (ffmpegInstance) {
    return ffmpegInstance;
  }

  if (!ffmpegLoadPromise) {
    ffmpegLoadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      onStatus?.('Loading video engine...');
      await ffmpeg.load({
        coreURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${CORE_BASE_URL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      ffmpegInstance = ffmpeg;
      return ffmpeg;
    })();
  }

  return ffmpegLoadPromise;
};

export const optimizeAndUploadVideo = async ({
  file,
  pathPrefix,
  onStatus,
}: {
  file: File;
  pathPrefix: string;
  onStatus?: (status: string) => void;
}): Promise<OptimizedVideoUploadResult> => {
  if (!storage) {
    throw new Error('Storage is not configured.');
  }

  if (file.size > MAX_VIDEO_FILE_SIZE_BYTES) {
    throw new Error('Video is too large to optimize in-browser. Please keep it under 150MB.');
  }

  const timestamp = Date.now();
  const stem = sanitizeFileStem(file.name);
  const originalExtension = file.name.split('.').pop()?.toLowerCase() || 'mp4';

  onStatus?.('Uploading original...');
  const originalPath = `${pathPrefix}/originals/${timestamp}-${stem}.${originalExtension}`;
  const originalUrl = await uploadBlob(file, originalPath, file.type || 'video/mp4');

  onStatus?.('Preparing optimized version...');
  const ffmpeg = await loadFFmpeg(onStatus);
  const inputName = `input.${originalExtension}`;
  const outputName = 'optimized.mp4';
  const posterName = 'poster.jpg';

  await ffmpeg.writeFile(inputName, await fetchFile(file));

  onStatus?.('Encoding optimized mp4...');
  await ffmpeg.exec([
    '-i',
    inputName,
    '-vf',
    "scale='min(1920,iw)':'-2'",
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '22',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    outputName,
  ]);

  onStatus?.('Extracting poster...');
  await ffmpeg.exec([
    '-ss',
    '00:00:00.500',
    '-i',
    outputName,
    '-frames:v',
    '1',
    '-q:v',
    '2',
    posterName,
  ]);

  const optimizedBytes = ensureBinaryData(await ffmpeg.readFile(outputName), 'Optimized video');
  const posterBytes = ensureBinaryData(await ffmpeg.readFile(posterName), 'Poster image');
  const optimizedBlob = new Blob([optimizedBytes], { type: getMimeType(optimizedBytes) });
  const posterBlob = new Blob([posterBytes], { type: 'image/jpeg' });

  const useOriginalAsPrimary = optimizedBlob.size >= file.size * 0.98;

  onStatus?.('Uploading optimized assets...');
  const optimizedPath = `${pathPrefix}/optimized/${timestamp}-${stem}.mp4`;
  const posterPath = `${pathPrefix}/posters/${timestamp}-${stem}.jpg`;

  const [optimizedUrl, posterUrl] = await Promise.all([
    uploadBlob(optimizedBlob, optimizedPath, 'video/mp4'),
    uploadBlob(posterBlob, posterPath, 'image/jpeg'),
  ]);

  onStatus?.('Cleaning up...');
  await Promise.allSettled([
    ffmpeg.deleteFile(inputName),
    ffmpeg.deleteFile(outputName),
    ffmpeg.deleteFile(posterName),
  ]);

  return {
    optimizedUrl: useOriginalAsPrimary ? originalUrl : optimizedUrl,
    originalUrl,
    posterUrl,
    optimizedSize: optimizedBlob.size,
    originalSize: file.size,
    usedOriginalAsPrimary: useOriginalAsPrimary,
  };
};

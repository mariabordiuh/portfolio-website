import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import fs from 'node:fs';
import os from 'node:os';

const execFileAsync = promisify(execFile);

const PROJECT_ID = 'gen-lang-client-0170385513';
const PROJECT_NUMBER = '23817082037';
const DATABASE_ID = '(default)';
const BUCKET = 'gen-lang-client-0170385513.firebasestorage.app';
const MAX_WIDTH = 480;
const JPEG_QUALITY = 4;
const THUMBNAIL_CONTENT_TYPE = 'image/jpeg';
const THUMBNAIL_EXTENSION = 'jpg';
const REGENERATE_EXISTING = true;

const firebaseConfigPath = `${os.homedir()}/.config/configstore/firebase-tools.json`;
const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
const token = firebaseConfig.tokens.access_token;

const authHeaders = { Authorization: `Bearer ${token}` };

const toFields = (data) => {
  const fields = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    }
  }

  return { fields };
};

const getStringField = (doc, field) => doc.fields?.[field]?.stringValue ?? '';

const listDocs = async (collectionName) => {
  const docs = [];
  let pageToken = '';

  do {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${encodeURIComponent(DATABASE_ID)}/documents/${collectionName}`,
    );
    url.searchParams.set('pageSize', '200');
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url, { headers: authHeaders });
    if (!res.ok) {
      throw new Error(`Could not list ${collectionName}: ${res.status} ${await res.text()}`);
    }

    const json = await res.json();
    docs.push(...(json.documents ?? []));
    pageToken = json.nextPageToken ?? '';
  } while (pageToken);

  return docs;
};

const storagePathFromUrl = (url) => {
  try {
    const parsed = new URL(url);
    const pathSegment = parsed.pathname.split('/o/')[1];
    return pathSegment ? decodeURIComponent(pathSegment) : null;
  } catch {
    return null;
  }
};

const isSkippableMedia = (url) => /\.(gif|mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url);

const downloadStorageObject = async (url) => {
  const res = await fetch(url, { headers: authHeaders });
  if (!res.ok) {
    throw new Error(`Could not download image: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
};

const uploadThumbnail = async (buffer, destinationPath) => {
  const uploadUrl = new URL(`https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o`);
  uploadUrl.searchParams.set('uploadType', 'media');
  uploadUrl.searchParams.set('name', destinationPath);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': THUMBNAIL_CONTENT_TYPE,
      'x-goog-meta-firebaseStorageDownloadTokens': crypto.randomUUID(),
    },
    body: buffer,
  });

  if (!res.ok) {
    throw new Error(`Could not upload thumbnail: ${res.status} ${await res.text()}`);
  }

  const meta = await res.json();
  const tokenValue = meta.metadata?.firebaseStorageDownloadTokens;
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(destinationPath)}?alt=media&token=${tokenValue}`;
};

const patchDoc = async (docName, data) => {
  const url = new URL(`https://firestore.googleapis.com/v1/${docName}`);
  for (const field of Object.keys(data)) {
    url.searchParams.append('updateMask.fieldPaths', field);
  }

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(toFields(data)),
  });

  if (!res.ok) {
    throw new Error(`Could not patch ${docName}: ${res.status} ${await res.text()}`);
  }
};

const convertToThumbnail = async (inputBuffer, tempDir, id) => {
  const inputPath = join(tempDir, `${id}-input`);
  const outputPath = join(tempDir, `${id}-thumb.${THUMBNAIL_EXTENSION}`);

  await writeFile(inputPath, inputBuffer);
  await execFileAsync('ffmpeg', [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    inputPath,
    '-vf',
    `scale='min(${MAX_WIDTH},iw)':-2`,
    '-frames:v',
    '1',
    '-q:v',
    String(JPEG_QUALITY),
    outputPath,
  ]);

  return readFile(outputPath);
};

const sourceUrlForDoc = (doc, collectionName) => {
  if (collectionName === 'gallery') {
    return getStringField(doc, 'url') || getStringField(doc, 'image');
  }

  return getStringField(doc, 'thumbnail') || getStringField(doc, 'heroImage');
};

const run = async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'portfolio-thumbs-'));
  let created = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const collectionName of ['gallery', 'projects', 'videos']) {
      const docs = await listDocs(collectionName);

      for (const doc of docs) {
        const existing = getStringField(doc, 'thumbnailUrl') || getStringField(doc, 'previewUrl');
        const sourceUrl = sourceUrlForDoc(doc, collectionName);
        const docId = doc.name.split('/').pop();

        if ((!REGENERATE_EXISTING && existing) || !sourceUrl || !sourceUrl.includes('firebasestorage.googleapis.com') || isSkippableMedia(sourceUrl)) {
          skipped += 1;
          continue;
        }

        const sourcePath = storagePathFromUrl(sourceUrl);
        if (!sourcePath) {
          skipped += 1;
          continue;
        }

        try {
          const input = await downloadStorageObject(sourceUrl);
          const thumb = await convertToThumbnail(input, tempDir, `${collectionName}-${docId}`);
          const baseName = sourcePath.split('/').pop()?.replace(/\.[^.]+$/, '') || docId;
          const thumbPath = `thumbnails/${collectionName}/${docId}-${baseName}.${THUMBNAIL_EXTENSION}`;
          const thumbUrl = await uploadThumbnail(thumb, thumbPath);

          await patchDoc(doc.name, {
            thumbnailUrl: thumbUrl,
            previewUrl: thumbUrl,
          });

          created += 1;
          console.log(`created ${collectionName}/${docId}: ${(thumb.length / 1024).toFixed(1)} KB`);
        } catch (error) {
          failed += 1;
          console.error(`failed ${collectionName}/${docId}:`, error instanceof Error ? error.message : error);
        }
      }
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  console.log(JSON.stringify({ created, skipped, failed }, null, 2));
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

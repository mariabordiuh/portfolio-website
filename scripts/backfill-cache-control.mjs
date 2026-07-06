// One-time backfill: sets Cache-Control metadata on all existing Firebase
// Storage objects so browsers stop re-downloading every image on every visit.
// New uploads get this automatically (see uploadBytes call sites); this fixes
// objects uploaded before that change.
//
// Auth: reuses the local Firebase CLI login (no new credentials needed).
//   node scripts/backfill-cache-control.mjs           # dry run, prints what it would do
//   node scripts/backfill-cache-control.mjs --apply   # actually patch metadata
import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const BUCKET = 'gen-lang-client-0170385513.firebasestorage.app';
const CACHE_CONTROL = 'public, max-age=31536000';
const APPLY = process.argv.includes('--apply');

// Public OAuth client of the Firebase CLI (not a secret; shipped in firebase-tools).
const CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

const configstore = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
const { tokens } = JSON.parse(await readFile(configstore, 'utf8'));
if (!tokens?.refresh_token) throw new Error('No Firebase CLI login found. Run: npx firebase-tools login');

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tokens.refresh_token,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }),
});
if (!tokenRes.ok) throw new Error('Token refresh failed: ' + (await tokenRes.text()));
const { access_token } = await tokenRes.json();
const auth = { authorization: `Bearer ${access_token}` };

let pageToken;
let total = 0;
let patched = 0;
let skipped = 0;
do {
  const url = new URL(`https://storage.googleapis.com/storage/v1/b/${BUCKET}/o`);
  url.searchParams.set('fields', 'items(name,cacheControl),nextPageToken');
  url.searchParams.set('maxResults', '500');
  if (pageToken) url.searchParams.set('pageToken', pageToken);
  const res = await fetch(url, { headers: auth });
  if (!res.ok) throw new Error('List failed: ' + (await res.text()));
  const data = await res.json();
  for (const obj of data.items ?? []) {
    total++;
    if (obj.cacheControl) {
      skipped++;
      continue;
    }
    if (APPLY) {
      const patchUrl = `https://storage.googleapis.com/storage/v1/b/${BUCKET}/o/${encodeURIComponent(obj.name)}`;
      const p = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { ...auth, 'content-type': 'application/json' },
        body: JSON.stringify({ cacheControl: CACHE_CONTROL }),
      });
      if (!p.ok) {
        console.error('FAILED', obj.name, await p.text());
        continue;
      }
    }
    patched++;
    if (patched % 50 === 0) console.log(`...${patched} ${APPLY ? 'patched' : 'would patch'}`);
  }
  pageToken = data.nextPageToken;
} while (pageToken);

console.log(`${total} objects total, ${skipped} already had cacheControl, ${patched} ${APPLY ? 'patched' : 'would be patched (dry run — rerun with --apply)'}`);

// Downloads the site's Google Fonts as woff2 into public/fonts/ and generates
// public/fonts/fonts.css with local URLs. Run after changing font families:
//   node scripts/selfhost-fonts.mjs
// See docs/fonts.md for why fonts are self-hosted (GDPR).
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=Archivo+Expanded:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Press+Start+2P&display=swap';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(repoRoot, 'public', 'fonts');
const FILES_DIR = path.join(OUT_DIR, 'files');
// Modern Chrome UA so Google serves woff2 with unicode-range subsets
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const css = await (await fetch(CSS_URL, { headers: { 'user-agent': UA } })).text();
const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2/g))];
console.log('woff2 files to download:', urls.length);

await mkdir(FILES_DIR, { recursive: true });

let localCss = css;
for (const url of urls) {
  const parts = new URL(url).pathname.split('/');
  const family = parts[2];
  const fileName = `${family}-${parts[parts.length - 1]}`;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  await writeFile(path.join(FILES_DIR, fileName), buf);
  localCss = localCss.replaceAll(url, `/fonts/files/${fileName}`);
}

await writeFile(path.join(OUT_DIR, 'fonts.css'), localCss);
if (localCss.includes('fonts.gstatic.com')) throw new Error('leftover gstatic URL!');
console.log('wrote fonts.css — no external URLs remain');

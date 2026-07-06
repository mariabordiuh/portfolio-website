// Post-build: bakes per-route <head> metadata into static HTML files so
// social crawlers (LinkedIn, Slack, WhatsApp, X — none of which run JS) see
// route-specific titles, descriptions, and OG cards instead of the homepage
// fallback. Firebase Hosting serves exact file matches (dist/work/index.html
// for /work) before applying the SPA rewrite, so the app itself is untouched.
//
// Keep ROUTES in sync with src/components/Seo.tsx and public/sitemap.xml.
// Runs automatically after `vite build` (see package.json).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_URL = 'https://mariabordiuh.com';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(repoRoot, 'dist');

if (process.env.VITE_UNDER_CONSTRUCTION === 'true') {
  console.log('[route-meta] under-construction build — skipping per-route HTML');
  process.exit(0);
}

const ROUTES = [
  {
    route: '/work',
    title: 'Work — Maria Bordiuh',
    description:
      'Selected work by Maria Bordiuh across art direction, motion, illustration, AI visuals, and campaign image systems.',
    image: '/og/work.jpg',
  },
  {
    route: '/lab',
    title: 'Lab — Maria Bordiuh',
    description:
      'Experiments, motion tests, visual systems, and unfinished creative-tech notes from Maria Bordiuh.',
    image: '/og/lab.jpg',
  },
  {
    route: '/about',
    title: 'About — Maria Bordiuh',
    description:
      'About Maria Bordiuh, a Hamburg-based creative director, art director, motion designer, and AI-forward visual creative.',
    image: '/og/about.jpg',
  },
  {
    route: '/ai',
    title: 'AI Campaign Visuals for Fashion & E-commerce | Maria Bordiuh AI',
    description:
      'AI visual production for fashion and e-commerce brands. Campaign imagery, consistent model identities, product visuals and art-directed image systems by Maria Bordiuh AI.',
    image: '/og/ai.jpg',
  },
  {
    route: '/impressum',
    title: 'Impressum — Maria Bordiuh',
    description: 'Impressum gemaess Paragraph 5 DDG for mariabordiuh.com.',
    image: '/og/legal.jpg',
  },
  {
    route: '/datenschutz',
    title: 'Datenschutz — Maria Bordiuh',
    description: 'Datenschutzerklaerung for mariabordiuh.com.',
    image: '/og/legal.jpg',
  },
  // Published case studies — update when projects are added/renamed in admin.
  {
    route: '/work/novoseven',
    title: 'NovoSeven — Creative Case Study | Maria Bordiuh',
    description:
      'Two educational films for hematologists, designed to explain rare bleeding disorders without showing blood, distress, or product glamour.',
    image: '/og/projects/novoseven.jpg',
    type: 'article',
  },
  {
    route: '/work/dr-lena',
    title: 'Dr. Lena — Creative Case Study | Maria Bordiuh',
    description:
      'A character-led pitch world that makes medical bureaucracy feel immediate, personal, and impossible to ignore.',
    image: '/og/projects/dr-lena.jpg',
    type: 'article',
  },
  {
    route: '/work/karpatosauriki',
    title: 'Karpatosauriki — Creative Case Study | Maria Bordiuh',
    description:
      'A premium character world for a national kids water launch, built to feel playful to children and trustworthy to parents at the same time.',
    image: '/og/projects/karpatosauriki.jpg',
    type: 'article',
  },
];

const escapeHtml = (s) =>
  s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const replaceOrThrow = (html, pattern, replacement, label, route) => {
  if (!pattern.test(html)) throw new Error(`[route-meta] ${route}: could not find ${label} in dist/index.html`);
  return html.replace(pattern, replacement);
};

const base = await readFile(path.join(dist, 'index.html'), 'utf8');

for (const { route, title, description, image, type = 'website' } of ROUTES) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const url = `${SITE_URL}${route}`;
  const img = `${SITE_URL}${image}`;
  let html = base;
  html = replaceOrThrow(html, /<title>[^<]*<\/title>/, `<title>${t}</title>`, '<title>', route);
  html = replaceOrThrow(html, /(<meta name="description" content=")[^"]*(")/, `$1${d}$2`, 'description', route);
  html = replaceOrThrow(html, /(<meta property="og:title" content=")[^"]*(")/, `$1${t}$2`, 'og:title', route);
  html = replaceOrThrow(html, /(<meta property="og:description" content=")[^"]*(")/, `$1${d}$2`, 'og:description', route);
  html = replaceOrThrow(html, /(<meta property="og:image" content=")[^"]*(")/, `$1${img}$2`, 'og:image', route);
  html = replaceOrThrow(html, /(<meta property="og:image:alt" content=")[^"]*(")/, `$1${t}$2`, 'og:image:alt', route);
  html = replaceOrThrow(html, /(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`, 'og:url', route);
  html = replaceOrThrow(html, /(<meta property="og:type" content=")[^"]*(")/, `$1${type}$2`, 'og:type', route);
  html = replaceOrThrow(html, /(<meta name="twitter:title" content=")[^"]*(")/, `$1${t}$2`, 'twitter:title', route);
  html = replaceOrThrow(html, /(<meta name="twitter:description" content=")[^"]*(")/, `$1${d}$2`, 'twitter:description', route);
  html = replaceOrThrow(html, /(<meta name="twitter:image" content=")[^"]*(")/, `$1${img}$2`, 'twitter:image', route);
  html = replaceOrThrow(html, /(<meta name="twitter:image:alt" content=")[^"]*(")/, `$1${t}$2`, 'twitter:image:alt', route);
  html = replaceOrThrow(html, /(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`, 'canonical', route);

  const outDir = path.join(dist, ...route.split('/').filter(Boolean));
  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, 'index.html'), html);
  console.log(`[route-meta] wrote ${route}/index.html`);
}
console.log(`[route-meta] ${ROUTES.length} routes done`);

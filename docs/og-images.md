# Open Graph Images

This project should use dedicated raster social preview cards for important public routes.

## Required size

- `1200x630`

## Accepted formats

- `JPG`
- `PNG`

Do not rely on `SVG` as the only social preview fallback. Some platforms handle SVG previews inconsistently.

## File structure

Place exported files here:

```text
public/og/home.jpg
public/og/work.jpg
public/og/about.jpg
public/og/lab.jpg
public/og/legal.jpg
public/og/projects/novoseven.jpg
public/og/projects/dr-lena.jpg
public/og/projects/karpatosauriki.jpg
```

`.png` is also acceptable if needed.

## Route mapping

- `/` -> `public/og/home.jpg`
- `/work` -> `public/og/work.jpg`
- `/about` -> `public/og/about.jpg`
- `/lab` -> `public/og/lab.jpg`
- `/impressum` -> `public/og/legal.jpg`
- `/datenschutz` -> `public/og/legal.jpg`
- `/work/novoseven` -> `public/og/projects/novoseven.jpg`
- `/work/dr-lena` -> `public/og/projects/dr-lena.jpg`
- `/work/karpatosauriki` -> `public/og/projects/karpatosauriki.jpg`

Project OG cards should use the stable slug names, not Firestore IDs.

## Export checklist

- Export at exactly `1200x630`
- Use `JPG` unless transparency is required
- Keep typography large and legible in small link previews
- Avoid tiny UI details that disappear in Slack/Telegram/X previews
- Check that the crop still reads on LinkedIn and iMessage
- Keep the filename aligned with the route mapping above
- After export, update metadata only if the real file exists

## Current state

All files in the mapping above exist (plus `public/og/ai.jpg` for `/ai`) and are
wired into `src/components/Seo.tsx`, `index.html`, and
`scripts/generate-route-meta.mjs`. They are currently automated 1200x630
center-crops of existing site imagery — replace any of them with designed
cards whenever; same filename, no code change needed.

## Crawler support

Social crawlers do not run JavaScript, so `Seo.tsx` alone never reached them.
`scripts/generate-route-meta.mjs` (runs as part of `npm run build`) writes a
static `dist/<route>/index.html` per public route with the correct
title/description/OG tags baked in. Firebase Hosting serves exact file matches
before the SPA rewrite. **When adding a route or publishing a new case study,
update the ROUTES list in that script, `Seo.tsx`, and `public/sitemap.xml`.**

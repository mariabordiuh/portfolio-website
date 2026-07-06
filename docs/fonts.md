# Self-hosted fonts

Fonts are served from `public/fonts/` instead of `fonts.googleapis.com`.

**Why:** loading Google Fonts remotely sends every visitor's IP address to
Google before they can consent, which German courts (LG München, 2022) have
ruled a GDPR violation. Self-hosting removes that exposure and a
render-blocking third-party request.

## Files

- `public/fonts/fonts.css` — generated `@font-face` rules (local URLs)
- `public/fonts/files/*.woff2` — the font binaries (~236 KB total)
- `index.html` links `/fonts/fonts.css`

## Changing fonts

1. Edit `CSS_URL` in `scripts/selfhost-fonts.mjs` (a standard Google Fonts
   css2 URL with the families you want).
2. Run `node scripts/selfhost-fonts.mjs`.
3. Delete stale files from `public/fonts/files/` if families were removed.

Do **not** re-add `fonts.googleapis.com` / `fonts.gstatic.com` links to
`index.html` — the CSP in `firebase.json` no longer allows them.

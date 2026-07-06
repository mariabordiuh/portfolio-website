# /ai page assets — drop files in, no code changes needed

Every image below falls back to a styled placeholder until the file exists.
Use JPG (quality ~80), sRGB. Keep files under ~400 KB each.

## roster/ — one portrait + one output shot per identity (3:4)
- aiko-portrait.jpg, aiko-output.jpg
- fernando-portrait.jpg, fernando-output.jpg
- anna-portrait.jpg, anna-output.jpg
- clara-portrait.jpg, clara-output.jpg
- zuri-portrait.jpg, zuri-output.jpg
- jonas-portrait.jpg, jonas-output.jpg  ← rename id in src/pages/ai/data.ts if "Jonas" changes

## before-after/ — 3 pairs (4:5, same crop for both images of a pair!)
- 1-before.jpg / 1-after.jpg   (product photo → campaign hero)
- 2-before.jpg / 2-after.jpg   (flat-lay → on-model lifestyle)
- 3-before.jpg / 3-after.jpg   (catalog shot → editorial world)

## sets/ — mixed "anything can look premium" gallery (4:5)
- item-1.jpg … item-8.jpg
Captions live in src/pages/ai/data.ts (SHOWCASE_ITEMS) — current order:
safety vest, hair oil, cheesecake, cordless drill, 60+ knitwear,
fine jewelry, sofa, sneakers. Deliberately mixed — the range IS the pitch.

## motion/ — looping mp4s (4:5, muted, H.264, < 3 MB) + poster frames
- loop-1.mp4, loop-1-poster.jpg
- loop-2.mp4, loop-2-poster.jpg
- loop-3.mp4, loop-3-poster.jpg

## Everything editable (prices, slots, FAQ, roster copy):
src/pages/ai/data.ts

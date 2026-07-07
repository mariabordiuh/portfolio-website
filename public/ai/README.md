# /ai page assets — drop files in, no code changes needed

Every image falls back to a styled gray placeholder until the file exists.
Use JPG (quality ~80), sRGB, under ~400 KB each. The page is mono-ink — your
photos are the only color, so pick strong images.

## hero.jpg — the big hero plate (21:9, wide landscape)
One striking campaign image. Shows full-width under the headline.

## before-after/ — the bento slider (4:5, SAME crop for both)
- 1-before.jpg  (a raw/phone product photo)
- 1-after.jpg   (the finished campaign version of the same shot)
(Only pair 1 is used now. 2 and 3 are optional/unused.)

## roster/ — model portraits (1:1 square, headshots)
- aiko-portrait.jpg, fernando-portrait.jpg, anna-portrait.jpg
  (the bento face-pile shows the first 3; add the rest if you like)
- clara-portrait.jpg, zuri-portrait.jpg, jonas-portrait.jpg

## sets/ — the "anything can look premium" gallery (3:4)
- item-1.jpg … item-8.jpg
Captions live in src/pages/ai/data.ts (SHOWCASE_ITEMS), current order:
safety vest, hair oil, cheesecake, cordless drill, 60+ knit,
fine jewelry, sofa, sneakers. Deliberately mixed — the range IS the pitch.

## motion/ — the bento motion tile (4:5, muted, H.264, < 3 MB)
- loop-1.mp4   (autoplays muted in the bento "Auch in Bewegung" tile)
- loop-1-poster.jpg  (fallback frame)

## demo.mp4 — the Ohneis-style sales/demo video (16:9, with sound)
- demo.mp4 + demo-poster.jpg + demo-captions.vtt (German subtitles)
The "So entsteht eine Kampagne" section is INVISIBLE until this file exists —
drop it in and the section appears automatically. Plays with controls, not
autoplay (it has a voiceover). Subtitles matter: many people watch muted.
ElevenLabs voiceover plan: see spec §10.

## Everything editable (prices, slots, stats, FAQ, WhatsApp, Cal link):
src/pages/ai/data.ts
- STATS → the 48h / 900+ bento numbers (count 900+ before launch!)
- SCARCITY → founding-rate counter
- WHATSAPP_NUMBER → E.164 digits (e.g. 4915112345678); button hides until set
- CAL_LINK → Cal.com handle (e.g. mariabordiuh/intro); email fallback until set
- SIGNOFF → your "Hi, ich bin Maria" contact block

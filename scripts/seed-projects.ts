/**
 * Seed script — two Art Direction case studies
 * Run once with:  npm run seed
 *
 * Guard: checks for existing titles before writing — safe to run more than once.
 *
 * NOTE: if your Firestore rules require authentication this will fail with
 * "permission-denied". Temporarily open the rules for the projects collection
 * (or run against the local emulator), seed, then restore the rules.
 */

import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../src/firebase-firestore';

// ─── Project data ─────────────────────────────────────────────────────────────

const PROJECTS = [
  {
    title: 'Karpatosauriki',
    pillar: 'Art Direction',
    contentType: 'art-direction',
    client: 'Morshynska (Nestlé Ukraine)',
    year: '2025',
    category: 'Character design & visual system',
    categories: ['Character design', 'Illustration', 'Packaging', 'Kids', 'AI-assisted'],
    mariaRole: [
      'Creative Direction',
      'Visual System Design',
      'Team Coordination',
      'AI Integration',
    ],
    tools: ['Midjourney', 'Firefly', 'NanoBananaPro', 'Photoshop', 'Illustrator', 'InDesign'],
    credits: [] as string[],
    team: [
      { name: 'Denys Veremiienko', role: 'Executive Producer' },
      { name: 'Iryna Zelenko', role: 'Illustrator' },
      { name: 'Andriy Bocharov', role: 'Print Designer' },
      { name: 'Kate Rudnytska', role: 'Copywriter' },
    ],
    globalContext: `Morshynska is the most widely distributed water brand in Ukraine, owned by Nestlé. They were launching a new children's line nationally and the concept, dinosaurs rooted in the Carpathian mountains, came from them. What they needed was someone to own the visual direction from scratch and lead the team delivering it. That was my part.`,
    creativeTension: `Every single visual decision on this project had to survive two readings. A five year old picking up the bottle in the shop, and the mother deciding whether to put it in the cart. If it was too cute, the mothers would read it as cheap. If it was too stylised, the kids wouldn't care. The whole system had to sit in the narrow place between playful and crafted, and every character, every colour, every line weight had to pass that test.`,
    approach: `I spent a long time in Midjourney pulling the visual language around until it clicked. It wasn't one good prompt, it was maybe three hundred iterations of getting closer to what the Karpatosauriki wanted to look like. Playful but not a cartoon. Bright but not loud. Something that could live on a label next to a serious brand logo without embarrassing it. Once the style was right, the shapes weren't. The new direction looked correct but the dinosaur anatomy kept drifting. What solved it was using the previous generation of Morshynska dinosaurs as a reference in Firefly and mixing them with the new style direction. Old shapes, new skin. That's the moment the characters actually became Karpatosauriki instead of generic dinosaurs with a Ukrainian badge on them. The visual direction had to hold across a whole system, not just one bottle. Labels for the main SKUs, coloring pages that kids could actually colour in, presentation visuals for internal sign-off, packshots for the pitch. I coordinated the illustrator, print designer, and copywriter, and ran AI through the production wherever it sped things up without losing control. Colour rendering tests, coloring page production, final packshots in NanoBananaPro instead of a photo shoot. The copywriter and I also used AI to proofread the dinosaur stories for age appropriateness, which mattered because it was going on every bottle.`,
    outcomeResultCopy: `The Karpatosauriki system is in national distribution. You can buy it in every major retailer in Ukraine.`,
    explorationType: 'slot-machine',
    slotMachineGridSize: 4,
    slotMachineFps: 12,
    thumbnail: '',
    heroImage: '',
    images: [] as string[],
    moodboardImages: [] as string[],
    sketchImages: [] as string[],
    explorationImages: [] as string[],
    explorationVideos: [] as string[],
    outcomeVisuals: [] as string[],
    outcomeImages: [] as string[],
  },
  {
    title: 'NovoSeven',
    pillar: 'Art Direction',
    contentType: 'art-direction',
    client: 'Novo Nordisk Ukraine',
    year: '2022–2025',
    category: 'Pharma education films',
    categories: ['Motion', 'Pharma', 'Animation', 'Education', 'Remote team'],
    mariaRole: ['Creative Direction', 'Visual Concept', 'Team Direction'],
    tools: ['Midjourney', 'After Effects', 'Illustrator', 'Photoshop'],
    credits: [] as string[],
    team: [
      { name: 'Motion Designer', role: 'Motion Design, Ukraine' },
      { name: 'Illustrator', role: 'Illustration, Bali' },
    ],
    globalContext: `Novo Nordisk came to us with a tough brief. They needed two 60-second animated films aimed at Ukrainian hematologists, explaining the mechanism of rare bleeding disorders and how NovoSeven works. The catch was that pharma regulations don't let you show anything graphic, anything product-glamorising, or anything that could be read as promotional promise. So the job was to teach doctors something technical and specific without ever showing a patient in distress, a vial, a drop of blood, or a treatment outcome. Everything had to happen in metaphor.`,
    creativeTension: `I built the whole visual system around three shapes. Chains to represent the coagulation cascade, because everyone in medicine knows the cascade as a chain reaction anyway. Circles for rarity and for cells, which gave us something soft to balance the rigidity of the chains. And silhouettes for patients, drawn as whole people, standing upright, never as victims or case studies. The challenge was making something that felt clinical enough to earn doctors' trust but human enough that the silhouettes didn't dissolve into pure diagram.`,
    approach: `The colour system had to do a lot of work because we couldn't rely on imagery to signal stakes. Blues carried the clinical register and the trust. Corals and warmer reds did the work that blood would have done in a less regulated brief, signalling urgency without ever actually showing it. Soft pinks softened the whole palette so nothing read as threatening. It was essentially a mood system translated into colour, and it held across both films. This was the first project where I ran a fully distributed team across three timezones. I had a motion designer in Ukraine and an illustrator in Bali, and I was directing both from Hamburg. It taught me a lot about how to communicate visual intent when you can't sit next to someone. I used AI to diagnose visual inconsistencies in the illustrator's output, which let me point at specific frames and say exactly why something wasn't working rather than sending vague feedback. Faster, clearer, less exhausting for everyone. I used Midjourney for visual language exploration in the early weeks, testing colour and shape combinations faster than I could have done manually. AI also sped up research at the start, both into the medical material and into visual conventions in pharma education. At the end, I used it as a review layer on the illustrator's output to catch drift before it reached the motion designer. AI was in the pipeline but never in the output. The final frames are all drawn and animated by hand.`,
    outcomeResultCopy: `Both films are currently in active use by Novo Nordisk as educational material for hematologists. They came back for a second project after the first, and then a third. I'm now in production on Ozempic for the same team. Repeat pharma client three times over is rare in this industry, which tells me the work is doing what it's meant to do.`,
    explorationType: 'masonry',
    slotMachineGridSize: 4,
    slotMachineFps: 12,
    thumbnail: '',
    heroImage: '',
    images: [] as string[],
    moodboardImages: [] as string[],
    sketchImages: [] as string[],
    explorationImages: [] as string[],
    explorationVideos: [] as string[],
    outcomeVisuals: [] as string[],
    outcomeImages: [] as string[],
  },
];

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function seed() {
  const col = collection(db, 'projects');

  for (const project of PROJECTS) {
    const existing = await getDocs(query(col, where('title', '==', project.title)));

    if (!existing.empty) {
      console.log(`⏭  "${project.title}" already exists — skipping (id: ${existing.docs[0].id})`);
      continue;
    }

    const docRef = await addDoc(col, {
      ...project,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`✅  Created "${project.title}" → id: ${docRef.id}`);
  }

  console.log('\nDone. Open /admin and find both projects in the list to upload images.');
}

seed().catch((err: Error & { code?: string }) => {
  console.error('\n❌  Seed failed:', err.message);
  if (err.code === 'permission-denied') {
    console.error(
      '\nFirestore rules require authentication. Options:\n' +
      '  1. Temporarily open rules for the projects collection, re-run, then restore.\n' +
      '  2. Run against the local emulator:\n' +
      '       firebase emulators:start --only firestore\n' +
      '     then add connectFirestoreEmulator(db, "localhost", 8080) before seed().',
    );
  }
  process.exit(1);
});

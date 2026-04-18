import { LabItem, Project, Video } from './types';

export const projects: Project[] = [
  {
    id: '1',
    title: 'Karpatosauriki',
    pillar: 'Art Direction',
    contentType: 'art-direction',
    category: 'Campaign, Packaging',
    categories: ['Campaign', 'Packaging', 'Character System'],
    description:
      "A playful visual world for a children's water line, designed to feel imaginative for kids and art-directed enough for the adults buying it.",
    thumbnail: 'https://picsum.photos/seed/dino-hero/1600/2000',
    heroImage: 'https://picsum.photos/seed/dino-hero/1600/2000',
    images: [],
    tools: ['Midjourney', 'Photoshop', 'Firefly', 'Creative Direction'],
    year: '2024',
    client: 'Morshynska (Nestle)',
    role: 'Creative Direction',
    creativeTension:
      'The world needed to feel bold and collectible without losing the warmth and clarity expected from a family brand.',
    globalContext:
      "The packaging had to compete on shelf in a crowded mass-market category while still feeling specific, character-led, and premium enough to become a memorably branded kids' line.",
    approach:
      'We built a focused visual language around silhouette, color rhythm, and character consistency, then pressure-tested the system across fast moodboard, exploration, and packaging compositions before locking the final direction.',
    moodboardImages: [
      'https://picsum.photos/seed/dino-mood-1/900/1200',
      'https://picsum.photos/seed/dino-mood-2/900/1200',
      'https://picsum.photos/seed/dino-mood-3/900/1200',
    ],
    explorationImages: [
      'https://picsum.photos/seed/dino-exp-1/1000/1200',
      'https://picsum.photos/seed/dino-exp-2/1000/1200',
      'https://picsum.photos/seed/dino-exp-3/1000/1200',
      'https://picsum.photos/seed/dino-exp-4/1000/1200',
    ],
    outcomeImages: [
      'https://picsum.photos/seed/dino-outcome-1/1600/1200',
      'https://picsum.photos/seed/dino-outcome-2/1600/1200',
      'https://picsum.photos/seed/dino-outcome-3/1600/1200',
    ],
    outcomeCopy:
      'The final system gave the brand a collectible cast of characters, a tighter shelf presence, and a reusable visual language for future product extensions.',
    credits: ['Maria Bordiuh - Creative Direction', 'Packaging Team - Production Design'],
  },
  {
    id: '2',
    title: 'Signal Bloom',
    pillar: 'AI Generated',
    contentType: 'ai-image',
    aiSubtype: 'ai-image',
    category: '',
    categories: [],
    description: 'A single still exploring synthetic florals, reflective surfaces, and near-editorial lighting.',
    thumbnail: 'https://picsum.photos/seed/ai-image-1/1200/1500',
    heroImage: 'https://picsum.photos/seed/ai-image-1/1200/1500',
    images: ['https://picsum.photos/seed/ai-image-1/1200/1500'],
    tools: ['Midjourney', 'Photoshop'],
  },
  {
    id: '3',
    title: 'Fever Loop',
    pillar: 'Animation & Motion',
    contentType: 'motion-video',
    motionType: 'mp4',
    category: '',
    categories: [],
    description: 'A short motion study built from repeating vector distortions and rhythmic type hits.',
    thumbnail: 'https://picsum.photos/seed/motion-thumb-1/1200/1500',
    heroImage: 'https://picsum.photos/seed/motion-thumb-1/1200/1500',
    images: [],
    mediaUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    tools: ['After Effects', 'Premiere Pro'],
  },
  {
    id: '4',
    title: 'Soft Geometry',
    pillar: 'Illustration & Design',
    contentType: 'illustration',
    category: '',
    categories: [],
    description: 'A compact illustration set balancing material softness with strict geometric framing.',
    thumbnail: 'https://picsum.photos/seed/illustration-hero/1200/1500',
    heroImage: 'https://picsum.photos/seed/illustration-hero/1200/1500',
    images: [
      'https://picsum.photos/seed/illustration-hero/1200/1500',
      'https://picsum.photos/seed/illustration-2/1200/1500',
      'https://picsum.photos/seed/illustration-3/1200/1500',
    ],
    tools: ['Illustrator', 'Photoshop'],
  },
];

export const videos: Video[] = [
  {
    id: '1',
    title: 'Future Artifact',
    pillar: 'AI Generated',
    url: 'https://www.w3schools.com/html/movie.mp4',
    thumbnail: 'https://picsum.photos/seed/ai-video-thumb/1280/720',
    description: 'Legacy AI video entry kept for backwards-compatible work grid support.',
  },
  {
    id: '2',
    title: 'Motion Study 01',
    pillar: 'Animation & Motion',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://picsum.photos/seed/motion-video-thumb/1280/720',
    description: 'Legacy motion video entry kept for backwards-compatible work grid support.',
  },
];

export const labItems: LabItem[] = [
  {
    id: '1',
    title: 'Prompt Engineering for Textures',
    type: 'Learning',
    content:
      'Discovered a more reliable way to keep textile patterns coherent across multiple prompt iterations.',
    image: 'https://picsum.photos/seed/lab1/800/800',
    tools: ['Midjourney', 'Magnific AI'],
    date: '2024-03-10',
  },
  {
    id: '2',
    title: 'Vibe-based Color Palettes',
    type: 'Experiment',
    content: 'An algorithm that generates color palettes based on the emotional tone of a text prompt.',
    code: 'const generatePalette = (vibe) => { /* ... */ }',
    tools: ['React', 'Gemini API'],
    date: '2024-03-15',
  },
];

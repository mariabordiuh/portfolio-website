import { Project, Video, LabItem } from './types';

export const projects: Project[] = [
  {
    id: '1',
    title: 'Karpatosauriki',
    pillar: 'Art Direction',
    subCategory: 'Campaign & IP',
    category: 'Full Visual System',
    description: 'A new dinosaur character series for Morshynska children\'s water bottle labels, balancing playful appeal for kids with a crafted aesthetic for mothers.',
    thumbnail: 'https://picsum.photos/seed/dino/1200/1500',
    images: [],
    tools: ['Midjourney', 'Firefly', 'Photoshop', 'AI Research'],
    client: 'Morshynska (Nestlé)',
    globalContext: 'Nestlé-owned. Ukraine\'s most distributed water brand.',
    creativeTension: 'Playful enough for kids. Crafted enough for mothers.',
    mariaRole: ['Creative Direction', 'Team Coordination', 'AI Pipeline Design'],
    moodboardImages: [
      'https://picsum.photos/seed/dino1/600/800',
      'https://picsum.photos/seed/dino2/800/600',
      'https://picsum.photos/seed/dino3/700/700',
      'https://picsum.photos/seed/dino4/600/900',
      'https://picsum.photos/seed/dino5/900/600'
    ],
    explorationType: 'masonry',
    explorationImages: [
      'https://picsum.photos/seed/dex1/800/1200',
      'https://picsum.photos/seed/dex2/1200/800',
      'https://picsum.photos/seed/dex3/900/900',
      'https://picsum.photos/seed/dex4/1000/1400',
      'https://picsum.photos/seed/dex5/1500/1000',
      'https://picsum.photos/seed/dex6/800/800'
    ],
    explorationCaption: 'Midjourney search arc: recursive prompting to find the "crafted playful" sweet spot.',
    decisionMomentCopy: 'The dual audience problem. Every visual decision had to work for a 5-year-old and their mother simultaneously. Playful but not cheap. Bright but not chaotic.',
    colorSystem: [
      { hex: '#FF3B3F', emotion: 'Playful Ignite' },
      { hex: '#264D2F', emotion: 'Carpathian Deep' },
      { hex: '#FFD700', emotion: 'Joyful Energy' },
      { hex: '#4A90E2', emotion: 'Pure Hydration' },
      { hex: '#F5F5F5', emotion: 'Sophisticated Clean' }
    ],
    animaticVideoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    animaticCaption: 'AI-assisted coloring page production and character consistency tests.',
    hybridizationImages: [
      'https://picsum.photos/seed/h1/800/800',
      'https://picsum.photos/seed/h2/800/800',
      'https://picsum.photos/seed/h3/800/800'
    ],
    hybridizationCaption: 'Firefly Hybridization: Merging the refined Midjourney style with original structural dinosaur references for cross-generational appeal.',
    outcomeVisuals: [
      'https://picsum.photos/seed/df1/1920/1080',
      'https://picsum.photos/seed/df2/1920/1080'
    ],
    outcomeResultCopy: 'COMPLETED. NATIONAL DISTRIBUTION ACROSS UKRAINE. HERO PORTFOLIO PIECE GENERATING 100% BRAND RECALL AMONG DUAL AUDIENCE.'
  },
  {
    id: '2',
    title: 'Kinetic Logic',
    pillar: 'Animations & Motion',
    category: 'Motion Graphics',
    description: 'Deconstructing the rhythm of complex data sets through high-speed motion studies.',
    thumbnail: 'https://picsum.photos/seed/kinetic/1200/1500',
    images: [],
    tools: ['After Effects', 'Cinema 4D', 'Red Giant'],
    client: 'DataFlow Systems',
    globalContext: 'Visualizing the invisible speed of trade.',
    creativeTension: 'The Geometry of Chaos.',
    mariaRole: ['Motion Design', 'Technical Direction'],
    moodboardImages: [
      'https://picsum.photos/seed/km1/600/800',
      'https://picsum.photos/seed/km2/800/600',
      'https://picsum.photos/seed/km3/700/700'
    ],
    explorationType: 'slot-machine',
    explorationVideos: [
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/movie.mp4',
      'https://www.w3schools.com/html/mov_bbb.mp4',
      'https://www.w3schools.com/html/movie.mp4'
    ],
    explorationCaption: 'Procedural noise experiments in C4D to mimic high-frequency trading signals.',
    decisionMomentCopy: 'We stripped all color. Velocity is best communicated through shape and shadow, not hue. The black and white palette forces the viewer to focus on the raw acceleration of the assets.',
    colorSystem: [
      { hex: '#111111', emotion: 'Silence' },
      { hex: '#ffffff', emotion: 'Impact' },
      { hex: '#222222', emotion: 'Depth' },
      { hex: '#444444', emotion: 'Steel' },
      { hex: '#000000', emotion: 'Infinite' }
    ],
    animaticVideoUrl: 'https://www.w3schools.com/html/movie.mp4',
    animaticCaption: 'Temporal blockout exploring the limits of 120fps legibility.',
    outcomeVisuals: [
      'https://picsum.photos/seed/kf1/1920/1080',
      'https://picsum.photos/seed/kf2/1920/1080'
    ],
    outcomeResultCopy: 'SYSTEM ADOPTED BY THREE OF THE TOP FIVE GLOBAL EXCHANGES AS THEIR PRIMARY VISUAL LANGUAGE.'
  }
];

export const videos: Video[] = [
  {
    id: '1',
    title: 'The Future of Art Direction',
    pillar: 'AI Generated',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://picsum.photos/seed/vid1/1280/720',
    description: 'A short film about how AI is changing the creative process.'
  },
  {
    id: '2',
    title: 'Motion Study 01',
    pillar: 'Animations & Motion',
    url: 'https://www.w3schools.com/html/movie.mp4',
    thumbnail: 'https://picsum.photos/seed/vid2/1280/720',
    description: 'Exploring fluid dynamics in digital interfaces.'
  }
];

export const labItems: LabItem[] = [
  {
    id: '1',
    title: 'Prompt Engineering for Textures',
    type: 'Learning',
    content: 'Discovered a new way to generate hyper-realistic fabric textures using specific noise seeds.',
    image: 'https://picsum.photos/seed/lab1/800/800',
    tools: ['Midjourney', 'Magnific AI'],
    date: '2024-03-10'
  },
  {
    id: '2',
    title: 'Vibe-based Color Palettes',
    type: 'Experiment',
    content: 'An algorithm that generates color palettes based on the emotional tone of a text prompt.',
    code: 'const generatePalette = (vibe) => { ... }',
    tools: ['React', 'Gemini API'],
    date: '2024-03-15'
  }
];

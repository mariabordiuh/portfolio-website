export type ProjectPillar = 'AI Generated' | 'Animations & Motion' | 'Illustration & Design' | 'Art Direction';

export interface Project {
  id: string;
  title: string;
  pillar: ProjectPillar;
  subCategory?: string;
  category: string;
  description: string;
  thumbnail: string;
  images: string[];
  videoUrl?: string; // Standard video URL
  tools: string[];
  team?: { name: string; role: string }[];
  timeline?: { stage: string; date: string; description: string; image?: string }[];
  drafts?: string[];
  result?: string;
  
  // New Case Study Structure Fields
  client?: string;
  globalContext?: string;
  creativeTension?: string;
  mariaRole?: string[];
  moodboardImages?: string[];
  explorationType?: 'masonry' | 'slot-machine';
  explorationImages?: string[];
  explorationVideos?: string[];
  explorationCaption?: string;
  decisionMomentCopy?: string;
  colorSystem?: { hex: string; emotion: string }[];
  animaticVideoUrl?: string;
  animaticCaption?: string;
  hybridizationImages?: string[];
  hybridizationCaption?: string;
  outcomeVisuals?: string[];
  outcomeResultCopy?: string;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  pillar: ProjectPillar;
  thumbnail: string;
  description: string;
}

export interface LabItem {
  id: string;
  title: string;
  type: 'Experiment' | 'Learning' | 'AI' | 'Vibe';
  content: string;
  image?: string;
  code?: string;
  tools: string[];
  date: string;
}

export interface GalleryImage {
  id: string;
  url: string;
  pillar?: ProjectPillar;
  tags: string[];
  software?: string;
  info?: string;
  createdAt?: any;
}

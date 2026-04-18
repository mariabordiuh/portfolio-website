export type ProjectPillar =
  | 'AI Generated'
  | 'Animation & Motion'
  | 'Illustration & Design'
  | 'Art Direction';

export type LegacyProjectPillar = ProjectPillar | 'Animations & Motion';

export type AIGeneratedSubtype = 'ai-image' | 'ai-video';
export type MotionMediaType = 'embed' | 'gif' | 'mp4';
export type ProjectContentType =
  | 'art-direction'
  | 'illustration'
  | AIGeneratedSubtype
  | 'motion-embed'
  | 'motion-gif'
  | 'motion-video';

export interface TeamMember {
  name: string;
  role: string;
}

export interface TimelineEntry {
  stage: string;
  date: string;
  description: string;
  image?: string;
}

export interface ColorSwatch {
  hex: string;
  emotion: string;
}

export interface Project {
  id: string;
  title: string;
  pillar: ProjectPillar;
  contentType?: ProjectContentType;
  aiSubtype?: AIGeneratedSubtype;
  motionType?: MotionMediaType;
  subCategory?: string;
  category: string;
  categories?: string[];
  description: string;
  thumbnail: string;
  heroImage?: string;
  images: string[];
  mediaUrl?: string;
  embedUrl?: string;
  videoUrl?: string;
  tools: string[];
  year?: string;
  role?: string;
  credits?: string[];
  team?: TeamMember[];
  timeline?: TimelineEntry[];
  drafts?: string[];
  result?: string;
  approach?: string;
  outcomeImages?: string[];
  outcomeCopy?: string;

  client?: string;
  globalContext?: string;
  creativeTension?: string;
  mariaRole?: string[];
  moodboardImages?: string[];
  sketchImages?: string[];
  explorationType?: 'masonry' | 'slot-machine';
  slotMachineGridSize?: number;
  slotMachineFps?: number;
  explorationImages?: string[];
  explorationVideos?: string[];
  explorationCaption?: string;
  decisionMomentCopy?: string;
  colorSystem?: ColorSwatch[];
  animaticVideoUrl?: string;
  animaticCaption?: string;
  hybridizationImages?: string[];
  hybridizationCaption?: string;
  outcomeVisuals?: string[];
  outcomeResultCopy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  pillar: LegacyProjectPillar;
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
  pillar?: LegacyProjectPillar;
  tags: string[];
  software?: string;
  info?: string;
  createdAt?: any;
}

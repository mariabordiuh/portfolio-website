export type ProjectPillar =
  | 'AI Generated'
  | 'Animation & Motion'
  | 'Illustration & Design'
  | 'Art Direction';

export type EntryStatus = 'draft' | 'published';

export type LegacyProjectPillar = ProjectPillar | 'Animations & Motion';

export type AIGeneratedSubtype = 'ai-image' | 'ai-video';
export type MotionMediaType = 'embed' | 'gif' | 'mp4';
export type HomeHeroMode = 'image' | 'video';
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
  status?: EntryStatus;
  contentType?: ProjectContentType;
  aiSubtype?: AIGeneratedSubtype;
  motionType?: MotionMediaType;
  featured?: boolean;
  workPriorityRank?: number;
  subCategory?: string;
  category: string;
  categories?: string[];
  description: string;
  thumbnail: string;
  thumbnailZoom?: number;
  heroZoom?: number;
  heroPositionX?: number;
  heroPositionY?: number;
  thumbnailUrl?: string;
  previewUrl?: string;
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
  timelineText?: string;
  drafts?: string[];
  result?: string;
  approach?: string;
  outcomeImages?: string[];
  outcomeCopy?: string;

  client?: string;
  globalContext?: string;
  creativeTension?: string;
  brief?: string;
  context?: string;
  problem?: string;
  insights?: string;
  solution?: string;
  outcome?: string;
  mariaRole?: string[];
  moodboardImages?: string[];
  sketchImages?: string[];
  childhoodImages?: string[];
  universityImages?: string[];
  workImages?: string[];
  explorationType?: 'masonry' | 'slot-machine';
  slotMachineGridSize?: number;
  slotMachineFps?: number;
  explorationImages?: string[];
  explorationVideos?: string[];
  explorationCaption?: string;
  decisionMomentCopy?: string;
  colorSystem?: ColorSwatch[];
  animaticVideoUrl?: string;
  animaticVideoUrls?: string[];
  animaticCaption?: string;
  processVideoTitle?: string;
  processVideoEyebrow?: string;
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
  sourceUrl?: string;
  pillar: LegacyProjectPillar;
  status?: EntryStatus;
  subCategory?: string;
  thumbnail: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  description: string;
  tools?: string[];
  tags?: string[];
  featured?: boolean;
  workPriorityRank?: number;
}

export type LabSection = 'brief' | 'context' | 'problem' | 'insights' | 'solution' | 'outcome';

export interface LabImage {
  url: string;
  after?: LabSection;
}

export interface LabItem {
  id: string;
  title: string;
  status?: EntryStatus;
  type: 'Experiment' | 'Learning' | 'AI' | 'Vibe';
  content: string;
  image?: string;
  code?: string;
  tools: string[];
  date: string;
  // Case study fields — render as named sections when populated
  timeline?: string;
  role?: string;
  brief?: string;
  context?: string;
  problem?: string;
  insights?: string;
  solution?: string;
  outcome?: string;
  labImages?: LabImage[];
}

export interface GalleryImage {
  id: string;
  url: string;
  image?: string;
  status?: EntryStatus;
  thumbnailUrl?: string;
  previewUrl?: string;
  pillar?: LegacyProjectPillar;
  tags: string[];
  software?: string;
  info?: string;
  featured?: boolean;
  workPriorityRank?: number;
  createdAt?: any;
}

export interface HomeHeroSettings {
  id: string;
  mode: HomeHeroMode;
  flipHorizontal?: boolean;
  flipPosterHorizontal?: boolean;
  desktopImage: string;
  mobileImage?: string;
  desktopVideo?: string;
  mobileVideo?: string;
  posterImage?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

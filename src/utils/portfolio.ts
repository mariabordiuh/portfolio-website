import {
  type AIGeneratedSubtype,
  type GalleryImage,
  type LegacyProjectPillar,
  type MotionMediaType,
  type Project,
  type ProjectContentType,
  type ProjectPillar,
  type Video,
} from '../types';

export const WORK_PILLARS: ProjectPillar[] = [
  'AI Generated',
  'Art Direction',
  'Illustration & Design',
  'Animation & Motion',
];

export type PortfolioItemSource = 'project' | 'video' | 'gallery';

export type PortfolioItem = {
  id: string;
  source: PortfolioItemSource;
  sourceId: string;
  routeId?: string;
  title: string;
  pillar: ProjectPillar;
  contentType: ProjectContentType;
  description: string;
  thumbnail: string;
  thumbnailZoom?: number;
  heroZoom?: number;
  heroPositionX?: number;
  heroPositionY?: number;
  thumbnailUrl?: string;
  previewUrl?: string;
  heroImage: string;
  images: string[];
  mediaUrl?: string;
  embedUrl?: string;
  tools: string[];
  categories: string[];
  subCategory?: string;
  year?: string;
  client?: string;
  role?: string;
  credits?: string[];
  featured?: boolean;
  workPriorityRank?: number;
};

const trim = (value?: string | null) => value?.trim() ?? '';

export const getPortfolioImageSrc = (item: Pick<PortfolioItem, 'thumbnailUrl' | 'previewUrl' | 'thumbnail' | 'heroImage' | 'images'>) =>
  item.thumbnailUrl || item.previewUrl || item.thumbnail || item.heroImage || item.images[0] || '';

export const normalizePillar = (pillar?: LegacyProjectPillar | string | null): ProjectPillar => {
  switch (pillar) {
    case 'AI Generated':
      return 'AI Generated';
    case 'Illustration & Design':
      return 'Illustration & Design';
    case 'Animation & Motion':
    case 'Animations & Motion':
      return 'Animation & Motion';
    case 'Art Direction':
    default:
      return 'Art Direction';
  }
};

export const splitTagLikeString = (value?: string | null) =>
  (value ?? '')
    .split('\n')
    .flatMap((entry) => entry.split(','))
    .map((entry) => entry.trim())
    .filter(Boolean);

export const uniqueStrings = (values?: Array<string | null | undefined>) => {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const rawValue of values ?? []) {
    const value = rawValue?.trim();
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }

  return result;
};

export const isVideoFileUrl = (url?: string | null) => {
  const value = trim(url).toLowerCase();
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/.test(value);
};

export const isGifUrl = (url?: string | null) => {
  const value = trim(url).toLowerCase();
  return /\.gif(\?|#|$)/.test(value);
};

export const isEmbeddableVideoUrl = (url?: string | null) => {
  const value = trim(url);
  if (!value || isVideoFileUrl(value) || isGifUrl(value)) {
    return false;
  }

  try {
    const parsed = new URL(value);
    const hostname = parsed.hostname.toLowerCase();
    return (
      hostname.includes('youtube.com') ||
      hostname.includes('youtu.be') ||
      hostname.includes('vimeo.com')
    );
  } catch (_error) {
    return false;
  }
};

const toYouTubeEmbed = (url: string) => {
  const buildYouTubeEmbed = (videoId: string) => {
    const params = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      iv_load_policy: '3',
      cc_load_policy: '0',
      fs: '0',
    });

    return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
  };

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace('/', '').trim();
      return videoId ? buildYouTubeEmbed(videoId) : null;
    }

    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/shorts/')) {
        const videoId = parsed.pathname.split('/').filter(Boolean)[1];
        return videoId ? buildYouTubeEmbed(videoId) : null;
      }

      const videoId = parsed.searchParams.get('v');
      return videoId ? buildYouTubeEmbed(videoId) : null;
    }
  } catch (_error) {
    return null;
  }

  return null;
};

const toVimeoEmbed = (url: string) => {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('vimeo.com')) {
      return null;
    }

    const segments = parsed.pathname.split('/').filter(Boolean);
    const videoId = segments.at(-1);
    return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
  } catch (_error) {
    return null;
  }
};

export const toEmbedUrl = (url?: string | null) => {
  const value = trim(url);
  if (!value) {
    return '';
  }

  return toYouTubeEmbed(value) ?? toVimeoEmbed(value) ?? value;
};

const inferMotionType = (project: Partial<Project>) => {
  if (project.motionType) {
    return project.motionType;
  }

  if (trim(project.embedUrl)) {
    return 'embed';
  }

  const mediaUrl = trim(project.mediaUrl || project.videoUrl);
  if (isGifUrl(mediaUrl)) {
    return 'gif';
  }

  return 'mp4';
};

const inferAISubtype = (project: Partial<Project>): AIGeneratedSubtype => {
  if (project.aiSubtype) {
    return project.aiSubtype;
  }

  if (project.contentType === 'ai-video') {
    return 'ai-video';
  }

  const mediaUrl = trim(project.mediaUrl || project.videoUrl);
  return mediaUrl ? 'ai-video' : 'ai-image';
};

export const inferProjectContentType = (project: Partial<Project>): ProjectContentType => {
  const pillar = normalizePillar(project.pillar);

  if (pillar === 'Art Direction') {
    return 'art-direction';
  }

  if (pillar === 'Illustration & Design') {
    return 'illustration';
  }

  if (pillar === 'AI Generated') {
    return inferAISubtype(project);
  }

  const motionType = inferMotionType(project);
  if (motionType === 'embed') {
    return 'motion-embed';
  }

  return motionType === 'gif' ? 'motion-gif' : 'motion-video';
};

export const normalizeProject = (project: Partial<Project> & { id: string }): Project => {
  const pillar = normalizePillar(project.pillar);
  const contentType = inferProjectContentType({ ...project, pillar });
  const aiSubtype = pillar === 'AI Generated' ? inferAISubtype(project) : undefined;
  const motionType = pillar === 'Animation & Motion' ? inferMotionType(project) : undefined;
  const categories = uniqueStrings(
    project.categories?.length ? project.categories : splitTagLikeString(project.category),
  );
  const tools = uniqueStrings(project.tools);
  const role = trim(project.role) || uniqueStrings(project.mariaRole).join(' / ');
  const timelineText = trim(project.timelineText);
  const brief = trim(project.brief);
  const context = trim(project.context) || trim(project.globalContext);
  const problem = trim(project.problem) || trim(project.creativeTension);
  const insights = trim(project.insights);
  const solution = trim(project.solution) || trim(project.approach);
  const outcome =
    trim(project.outcome) || trim(project.outcomeCopy) || trim(project.outcomeResultCopy) || trim(project.result);
  const heroImage =
    trim(project.heroImage) ||
    trim(project.thumbnail) ||
    uniqueStrings(project.images)[0] ||
    uniqueStrings(project.moodboardImages)[0] ||
    '';
  const mediaUrl = trim(project.mediaUrl) || trim(project.videoUrl);
  const images = uniqueStrings(project.images);
  const outcomeImages = uniqueStrings(
    project.outcomeImages?.length ? project.outcomeImages : project.outcomeVisuals,
  );
  // Firestore data arrives untyped — `credits` may contain {name, role} objects
  // instead of strings if older documents were seeded incorrectly. Handle both.
  const rawCredits = (project.credits ?? []) as unknown[];
  const creditsAsStrings: string[] = rawCredits.map((c) => {
    if (typeof c === 'string') return c;
    const obj = c as { name?: string; role?: string };
    return [trim(obj.name), trim(obj.role)].filter(Boolean).join(' - ');
  });
  const credits = uniqueStrings(
    creditsAsStrings.filter(Boolean).length
      ? creditsAsStrings
      : project.team?.map((member) =>
          [trim(member.name), trim(member.role)].filter(Boolean).join(' - '),
        ),
  );

  return {
    id: project.id,
    title: trim(project.title),
    pillar,
    status: project.status ?? 'published',
    contentType,
    aiSubtype,
    motionType,
    subCategory: trim(project.subCategory),
    category: categories.join(', ') || trim(project.category),
    categories,
    description: trim(project.description),
    thumbnail: trim(project.thumbnail) || heroImage || mediaUrl,
    thumbnailZoom: project.thumbnailZoom ?? 100,
    heroZoom: project.heroZoom ?? 100,
    heroPositionX: project.heroPositionX ?? 50,
    heroPositionY: project.heroPositionY ?? 50,
    heroImage,
    images,
    mediaUrl,
    embedUrl: trim(project.embedUrl),
    videoUrl: mediaUrl,
    tools,
    year: trim(project.year),
    role,
    timelineText,
    credits,
    team: project.team ?? [],
    timeline: project.timeline ?? [],
    drafts: project.drafts ?? [],
    result: trim(project.result),
    approach: trim(project.approach) || trim(project.description),
    outcomeImages,
    outcomeCopy:
      trim(project.outcomeCopy) || trim(project.outcomeResultCopy) || trim(project.result),
    client: trim(project.client),
    globalContext: trim(project.globalContext),
    creativeTension: trim(project.creativeTension),
    brief,
    context,
    problem,
    insights,
    solution,
    outcome,
    mariaRole: uniqueStrings(project.mariaRole),
    moodboardImages: uniqueStrings(project.moodboardImages),
    sketchImages: uniqueStrings(project.sketchImages),
    childhoodImages: uniqueStrings(project.childhoodImages),
    universityImages: uniqueStrings(project.universityImages),
    workImages: uniqueStrings(project.workImages),
    explorationType: project.explorationType ?? 'masonry',
    slotMachineGridSize: project.slotMachineGridSize ?? 4,
    slotMachineFps: project.slotMachineFps ?? 12,
    explorationImages: uniqueStrings(project.explorationImages),
    explorationVideos: uniqueStrings(project.explorationVideos),
    explorationCaption: trim(project.explorationCaption),
    decisionMomentCopy: trim(project.decisionMomentCopy),
    colorSystem: project.colorSystem ?? [],
    animaticVideoUrl: trim(project.animaticVideoUrl),
    animaticVideoUrls: uniqueStrings(
      project.animaticVideoUrls?.length
        ? project.animaticVideoUrls
        : trim(project.animaticVideoUrl)
          ? [trim(project.animaticVideoUrl)]
          : [],
    ),
    animaticCaption: trim(project.animaticCaption),
    processVideoTitle: trim(project.processVideoTitle),
    processVideoEyebrow: trim(project.processVideoEyebrow),
    hybridizationImages: uniqueStrings(project.hybridizationImages),
    hybridizationCaption: trim(project.hybridizationCaption),
    outcomeVisuals: outcomeImages,
    outcomeResultCopy:
      trim(project.outcomeResultCopy) || trim(project.outcomeCopy) || trim(project.result),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
};

export const toPortfolioItem = (project: Project): PortfolioItem => {
  const normalized = normalizeProject(project);
  const contentType = normalized.contentType ?? inferProjectContentType(normalized);
  const isArtDirection = normalized.pillar === 'Art Direction';
  const isAIItem = contentType === 'ai-image' || contentType === 'ai-video';
  const images =
    contentType === 'illustration'
      ? uniqueStrings(normalized.images.length ? normalized.images : [normalized.thumbnail])
      : contentType === 'ai-image'
        ? uniqueStrings([normalized.thumbnail || normalized.heroImage])
        : contentType === 'art-direction'
          ? uniqueStrings([normalized.heroImage || normalized.thumbnail])
          : uniqueStrings(normalized.images);

  return {
    id: `project:${normalized.id}`,
    source: 'project',
    sourceId: normalized.id,
    routeId: isArtDirection ? normalized.id : undefined,
    title: normalized.title,
    pillar: normalized.pillar,
    contentType,
    description: normalized.description,
    thumbnail: normalized.thumbnail || normalized.heroImage || normalized.mediaUrl || images[0] || '',
    thumbnailZoom: normalized.thumbnailZoom ?? 100,
    heroZoom: normalized.heroZoom ?? 100,
    heroPositionX: normalized.heroPositionX ?? 50,
    heroPositionY: normalized.heroPositionY ?? 50,
    thumbnailUrl: trim(project.thumbnailUrl) || trim(project.previewUrl),
    previewUrl: trim(project.previewUrl) || trim(project.thumbnailUrl),
    heroImage: normalized.heroImage || normalized.thumbnail || images[0] || '',
    images,
    mediaUrl: normalized.mediaUrl || normalized.videoUrl,
    embedUrl: normalized.embedUrl,
    tools: normalized.tools,
    categories: normalized.categories ?? [],
    subCategory: normalized.subCategory,
    year: normalized.year,
    client: normalized.client,
    role: normalized.role,
    credits: isAIItem ? [] : normalized.credits,
    featured: project.featured,
    workPriorityRank: project.workPriorityRank,
  };
};

export const videoToPortfolioItem = (video: Video): PortfolioItem => {
  const pillar = normalizePillar(video.pillar);
  const rawUrl = trim(video.url);
  const embedUrl = isEmbeddableVideoUrl(rawUrl) ? toEmbedUrl(rawUrl) : '';
  const contentType =
    pillar === 'Animation & Motion'
      ? embedUrl
        ? 'motion-embed'
        : 'motion-video'
      : 'ai-video';

  return {
    id: `video:${video.id}`,
    source: 'video',
    sourceId: video.id,
    title: trim(video.title),
    pillar,
    contentType,
    description: trim(video.description),
    thumbnail: trim(video.thumbnail) || rawUrl,
    thumbnailUrl: trim(video.thumbnailUrl) || trim(video.previewUrl),
    previewUrl: trim(video.previewUrl) || trim(video.thumbnailUrl),
    heroImage: trim(video.thumbnail) || rawUrl,
    images: trim(video.thumbnail) ? [trim(video.thumbnail)] : [],
    mediaUrl: embedUrl ? '' : rawUrl,
    embedUrl,
    tools: uniqueStrings(video.tools),
    categories: uniqueStrings(video.tags),
    subCategory: trim(video.subCategory),
    featured: video.featured,
    workPriorityRank: video.workPriorityRank,
  };
};

export const galleryToPortfolioItem = (image: GalleryImage): PortfolioItem => {
  const pillar = normalizePillar(image.pillar || 'Illustration & Design');
  const contentType = pillar === 'AI Generated' ? 'ai-image' : 'illustration';
  const title =
    trim(image.info) ||
    uniqueStrings(image.tags)[0] ||
    trim(image.software) ||
    'Gallery work';

  return {
    id: `gallery:${image.id}`,
    source: 'gallery',
    sourceId: image.id,
    title,
    pillar,
    contentType,
    description: trim(image.info),
    thumbnail: trim(image.url || (image as any).image),
    thumbnailUrl: trim(image.thumbnailUrl) || trim(image.previewUrl),
    previewUrl: trim(image.previewUrl) || trim(image.thumbnailUrl),
    heroImage: trim(image.url || (image as any).image),
    images: trim(image.url || (image as any).image) ? [trim(image.url || (image as any).image)] : [],
    mediaUrl: '',
    embedUrl: '',
    tools: uniqueStrings(image.software ? [image.software] : []),
    categories: uniqueStrings(image.tags),
    subCategory: undefined,
    featured: image.featured,
    workPriorityRank: image.workPriorityRank,
  };
};

export const isArtDirectionItem = (item: PortfolioItem) => item.pillar === 'Art Direction';

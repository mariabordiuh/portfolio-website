import { GalleryImage, Project, Video } from '../types';
import {
  PortfolioItem,
  WORK_PILLARS,
  galleryToPortfolioItem,
  normalizeProject,
  toPortfolioItem,
  videoToPortfolioItem,
} from './portfolio';

const SOURCE_WEIGHT: Record<PortfolioItem['source'], number> = {
  project: 0,
  video: 1,
  gallery: 2,
};

const sortPriorityItems = (items: PortfolioItem[]) =>
  [...items].sort((left, right) => {
    const leftRank = left.workPriorityRank ?? Number.POSITIVE_INFINITY;
    const rightRank = right.workPriorityRank ?? Number.POSITIVE_INFINITY;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return left.title.localeCompare(right.title);
  });

const sortBalancedItems = (items: PortfolioItem[]) =>
  [...items].sort((left, right) => {
    const sourceDelta = SOURCE_WEIGHT[left.source] - SOURCE_WEIGHT[right.source];
    if (sourceDelta !== 0) {
      return sourceDelta;
    }

    return left.title.localeCompare(right.title);
  });

const uniqueById = (items: PortfolioItem[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
};

const buildBalancedFallback = (items: PortfolioItem[]) => {
  const sorted = sortBalancedItems(items);
  const preferred = sorted.filter((item) => item.source !== 'gallery');
  const used = new Set<string>();
  const pool: PortfolioItem[] = [];

  for (const pillar of WORK_PILLARS) {
    const candidate =
      preferred.find((item) => item.pillar === pillar && !used.has(item.id)) ??
      sorted.find((item) => item.pillar === pillar && !used.has(item.id));

    if (!candidate) {
      continue;
    }

    used.add(candidate.id);
    pool.push(candidate);
  }

  for (const candidate of sorted) {
    if (used.has(candidate.id)) {
      continue;
    }

    used.add(candidate.id);
    pool.push(candidate);
  }

  return pool;
};

export const buildSelectedPool = (items: PortfolioItem[]) => {
  const ranked = sortPriorityItems(items.filter((item) => typeof item.workPriorityRank === 'number'));

  if (ranked.length > 0) {
    const featured = sortBalancedItems(items.filter((item) => item.featured));
    const fallback = buildBalancedFallback(items);
    return uniqueById([...ranked, ...featured, ...fallback]).slice(0, 12);
  }

  return buildBalancedFallback(items).slice(0, 12);
};

export const buildSelectedPoolFromCollections = (
  projects: Project[],
  videos: Video[],
  galleryImages: GalleryImage[],
) =>
  buildSelectedPool([
    ...projects.map((project) => toPortfolioItem(normalizeProject(project))),
    ...videos.map((video) => videoToPortfolioItem(video)),
    ...galleryImages.map((image) => galleryToPortfolioItem(image)),
  ]);

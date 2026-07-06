import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const SITE_URL = 'https://mariabordiuh.com';

type SeoMeta = {
  canonicalPath?: string;
  description: string;
  image?: string;
  imageHeight?: number;
  imageAlt?: string;
  imageWidth?: number;
  robots?: string;
  title: string;
  twitterCard?: 'summary' | 'summary_large_image';
  type?: 'website' | 'article';
};

const DEFAULT_TITLE = 'Maria Bordiuh — Creative Direction, Motion & Visual Systems';
const DEFAULT_DESCRIPTION =
  'Maria Bordiuh is a Hamburg-based creative director, art director, motion designer, and AI-forward visual creative working across campaigns, moving image, and visual systems.';
// Dedicated 1200x630 social cards live in public/og/ (see docs/og-images.md).
// scripts/generate-route-meta.mjs bakes these into per-route static HTML for
// crawlers that don't run JS — keep both in sync when adding routes.
const DEFAULT_IMAGE = `${SITE_URL}/og/home.jpg`;
const DEFAULT_IMAGE_WIDTH = 1200;
const DEFAULT_IMAGE_HEIGHT = 630;

const ROUTE_META: Array<SeoMeta & { test: (pathname: string) => boolean }> = [
  {
    test: (pathname: string) => pathname === '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonicalPath: '/',
    image: `${SITE_URL}/og/home.jpg`,
    imageWidth: 1200,
    imageHeight: 630,
  },
  {
    test: (pathname: string) => pathname === '/work',
    title: 'Work — Maria Bordiuh',
    description:
      'Selected work by Maria Bordiuh across art direction, motion, illustration, AI visuals, and campaign image systems.',
    canonicalPath: '/work',
    image: `${SITE_URL}/og/work.jpg`,
    imageWidth: 1200,
    imageHeight: 630,
  },
  {
    test: (pathname: string) => pathname.startsWith('/work/'),
    title: 'Creative Case Study — Maria Bordiuh',
    description:
      'A visual case study by Maria Bordiuh, covering concept, process, art direction, and final outcomes.',
    image: `${SITE_URL}/og/work.jpg`,
    imageWidth: 1200,
    imageHeight: 630,
    type: 'article',
  },
  {
    test: (pathname: string) => pathname === '/lab',
    title: 'Lab — Maria Bordiuh',
    description:
      'Experiments, motion tests, visual systems, and unfinished creative-tech notes from Maria Bordiuh.',
    canonicalPath: '/lab',
    image: `${SITE_URL}/og/lab.jpg`,
    imageWidth: 1200,
    imageHeight: 630,
  },
  {
    test: (pathname: string) => pathname === '/about',
    title: 'About — Maria Bordiuh',
    description:
      'About Maria Bordiuh, a Hamburg-based creative director, art director, motion designer, and AI-forward visual creative.',
    canonicalPath: '/about',
    image: `${SITE_URL}/og/about.jpg`,
    imageWidth: 1200,
    imageHeight: 630,
  },
  {
    test: (pathname: string) => pathname === '/impressum',
    title: 'Impressum — Maria Bordiuh',
    description: 'Impressum gemaess Paragraph 5 DDG for mariabordiuh.com.',
    canonicalPath: '/impressum',
    image: `${SITE_URL}/og/legal.jpg`,
    imageWidth: 1200,
    imageHeight: 630,
  },
  {
    test: (pathname: string) => pathname === '/datenschutz',
    title: 'Datenschutz — Maria Bordiuh',
    description: 'Datenschutzerklaerung for mariabordiuh.com.',
    canonicalPath: '/datenschutz',
    image: `${SITE_URL}/og/legal.jpg`,
    imageWidth: 1200,
    imageHeight: 630,
  },
  {
    test: (pathname: string) => pathname === '/admin',
    title: 'Admin — Maria Bordiuh',
    description: 'Private portfolio administration workspace.',
    image: `${SITE_URL}/og/home.jpg`,
    imageWidth: 1200,
    imageHeight: 630,
    robots: 'noindex, nofollow',
  },
];

const FALLBACK_NOT_FOUND_META: SeoMeta = {
  title: 'Page Not Found — Maria Bordiuh',
  description: 'This page does not exist on Maria Bordiuh’s portfolio.',
  robots: 'noindex, nofollow',
};

const findMeta = (pathname: string): SeoMeta =>
  ROUTE_META.find((entry) => entry.test(pathname)) ?? FALLBACK_NOT_FOUND_META;

const removeMeta = (selector: string) => {
  document.head.querySelector(selector)?.remove();
};

const upsertMeta = (
  selector: string,
  attribute: 'name' | 'property',
  key: string,
  content: string,
) => {
  let meta = document.head.querySelector<HTMLMetaElement>(selector);

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, key);
    document.head.appendChild(meta);
  }

  meta.content = content;
};

const setCanonical = (href: string) => {
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }

  canonical.href = href;
};

const toAbsoluteUrl = (value?: string) => {
  if (!value) {
    return DEFAULT_IMAGE;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `${SITE_URL}${value.startsWith('/') ? value : `/${value}`}`;
};

const trimDescription = (value: string) => {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 160) {
    return normalized;
  }

  const truncated = normalized.slice(0, 157).trimEnd();
  const lastSpace = truncated.lastIndexOf(' ');
  return `${(lastSpace > 110 ? truncated.slice(0, lastSpace) : truncated).trimEnd()}...`;
};

export const Seo = ({
  canonicalPath,
  description,
  image,
  imageHeight,
  imageAlt,
  imageWidth,
  robots,
  title,
  twitterCard = 'summary_large_image',
  type = 'website',
}: Partial<SeoMeta>) => {
  const location = useLocation();

  useEffect(() => {
    const fallbackMeta = findMeta(location.pathname);
    const resolvedTitle = title ?? fallbackMeta.title;
    const resolvedDescription = trimDescription(description ?? fallbackMeta.description);
    const resolvedCanonicalPath =
      canonicalPath ??
      fallbackMeta.canonicalPath ??
      (location.pathname === '/' ? '/' : location.pathname);
    const canonicalUrl = `${SITE_URL}${resolvedCanonicalPath === '/' ? '' : resolvedCanonicalPath}`;
    const resolvedRobots =
      robots ?? (fallbackMeta.robots ? fallbackMeta.robots : 'index, follow');
    const resolvedImage = toAbsoluteUrl(image ?? fallbackMeta.image ?? DEFAULT_IMAGE);
    const resolvedImageWidth = imageWidth ?? fallbackMeta.imageWidth ?? DEFAULT_IMAGE_WIDTH;
    const resolvedImageHeight = imageHeight ?? fallbackMeta.imageHeight ?? DEFAULT_IMAGE_HEIGHT;
    const resolvedImageAlt = imageAlt ?? resolvedTitle;

    document.title = resolvedTitle;
    setCanonical(canonicalUrl);

    upsertMeta('meta[name="description"]', 'name', 'description', resolvedDescription);
    upsertMeta('meta[name="robots"]', 'name', 'robots', resolvedRobots);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', resolvedTitle);
    upsertMeta(
      'meta[property="og:description"]',
      'property',
      'og:description',
      resolvedDescription,
    );
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', resolvedImage);
    upsertMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt', resolvedImageAlt);
    upsertMeta(
      'meta[property="og:image:width"]',
      'property',
      'og:image:width',
      String(resolvedImageWidth),
    );
    upsertMeta(
      'meta[property="og:image:height"]',
      'property',
      'og:image:height',
      String(resolvedImageHeight),
    );
    upsertMeta('meta[property="og:type"]', 'property', 'og:type', type);
    upsertMeta('meta[name="twitter:card"]', 'name', 'twitter:card', twitterCard);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', resolvedTitle);
    upsertMeta(
      'meta[name="twitter:description"]',
      'name',
      'twitter:description',
      resolvedDescription,
    );
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', resolvedImage);
    upsertMeta(
      'meta[name="twitter:image:alt"]',
      'name',
      'twitter:image:alt',
      resolvedImageAlt,
    );
    removeMeta('meta[name="twitter:image:width"]');
    removeMeta('meta[name="twitter:image:height"]');
  }, [canonicalPath, description, image, imageAlt, imageHeight, imageWidth, location.pathname, robots, title, twitterCard, type]);

  return null;
};

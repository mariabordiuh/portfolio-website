import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://mariabordiuh.com';
const DEFAULT_TITLE = 'Maria Bordiuh — AI Creative Director & Art Director, Hamburg.';
const DEFAULT_DESCRIPTION =
  'Maria Bordiuh is a Hamburg-based AI Creative Director and Art Director working across CGI, motion, generative image, and brand systems.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.svg`;

const ROUTE_META = [
  {
    test: (pathname: string) => pathname === '/',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  {
    test: (pathname: string) => pathname === '/work',
    title: 'Work — Maria Bordiuh',
    description: 'Selected AI-generated visuals, art direction case studies, illustration, design, and motion work by Maria Bordiuh.',
  },
  {
    test: (pathname: string) => pathname.startsWith('/work/'),
    title: 'Case Study — Maria Bordiuh',
    description: 'An art direction case study by Maria Bordiuh, covering context, process, and visual outcomes.',
  },
  {
    test: (pathname: string) => pathname === '/lab',
    title: 'Lab — Maria Bordiuh',
    description: 'Experiments, notes, and creative technology studies from Maria Bordiuh.',
  },
  {
    test: (pathname: string) => pathname === '/about',
    title: 'About — Maria Bordiuh',
    description: 'About Maria Bordiuh, a Hamburg-based Art Director and AI Creative Director.',
  },
  {
    test: (pathname: string) => pathname === '/admin',
    title: 'Admin — Maria Bordiuh',
    description: 'Private portfolio administration workspace.',
    robots: 'noindex, nofollow',
  },
];

const findMeta = (pathname: string) =>
  ROUTE_META.find((entry) => entry.test(pathname)) ?? {
    title: 'Page Not Found — Maria Bordiuh',
    description: 'This page does not exist on Maria Bordiuh’s portfolio.',
    robots: 'noindex, nofollow',
  };

const upsertMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
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

export const Seo = () => {
  const location = useLocation();

  useEffect(() => {
    const meta = findMeta(location.pathname);
    const canonicalPath = location.pathname === '/' ? '' : location.pathname;
    const canonicalUrl = `${SITE_URL}${canonicalPath}`;
    const robots = 'robots' in meta && meta.robots ? meta.robots : 'index, follow';

    document.title = meta.title;
    setCanonical(canonicalUrl);

    upsertMeta('meta[name="description"]', 'name', 'description', meta.description);
    upsertMeta('meta[name="robots"]', 'name', 'robots', robots);
    upsertMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
    upsertMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
    upsertMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    upsertMeta('meta[property="og:image"]', 'property', 'og:image', DEFAULT_IMAGE);
    upsertMeta('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
    upsertMeta('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);
    upsertMeta('meta[name="twitter:image"]', 'name', 'twitter:image', DEFAULT_IMAGE);
  }, [location.pathname]);

  return null;
};

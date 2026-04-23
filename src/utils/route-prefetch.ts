const pageLoaders = {
  home: () => import('../pages/Home'),
  work: () => import('../pages/Work'),
  projectDetail: () => import('../pages/ProjectDetail'),
  lab: () => import('../pages/Lab'),
  about: () => import('../pages/About'),
  admin: () => import('../pages/Admin'),
  notFound: () => import('../pages/NotFound'),
};

const shellLoaders = {
  projectsData: () => import('../route-shells/ProjectsDataShell'),
  portfolioData: () => import('../route-shells/PortfolioDataShell'),
  labData: () => import('../route-shells/LabDataShell'),
  adminData: () => import('../route-shells/AdminDataShell'),
};

export const loadHomeRoute = pageLoaders.home;
export const loadWorkRoute = pageLoaders.work;
export const loadProjectDetailRoute = pageLoaders.projectDetail;
export const loadLabRoute = pageLoaders.lab;
export const loadAboutRoute = pageLoaders.about;
export const loadAdminRoute = pageLoaders.admin;
export const loadNotFoundRoute = pageLoaders.notFound;

export const loadProjectsDataShell = shellLoaders.projectsData;
export const loadPortfolioDataShell = shellLoaders.portfolioData;
export const loadLabDataShell = shellLoaders.labData;
export const loadAdminDataShell = shellLoaders.adminData;

const prefetchCache = new Set<string>();

const prefetchOnce = (key: string, loader: () => Promise<unknown>) => {
  if (prefetchCache.has(key)) {
    return;
  }

  prefetchCache.add(key);
  void loader().catch(() => {
    prefetchCache.delete(key);
  });
};

export const prefetchRoute = (to: string) => {
  if (to === '/') {
    prefetchOnce('projectsData', loadProjectsDataShell);
    prefetchOnce('home', loadHomeRoute);
    return;
  }

  if (to === '/work') {
    prefetchOnce('portfolioData', loadPortfolioDataShell);
    prefetchOnce('work', loadWorkRoute);
    return;
  }

  if (to.startsWith('/work/')) {
    prefetchOnce('projectsData', loadProjectsDataShell);
    prefetchOnce('projectDetail', loadProjectDetailRoute);
    return;
  }

  if (to === '/lab') {
    prefetchOnce('labData', loadLabDataShell);
    prefetchOnce('lab', loadLabRoute);
    return;
  }

  if (to === '/about') {
    prefetchOnce('about', loadAboutRoute);
    return;
  }

  if (to === '/admin') {
    prefetchOnce('adminData', loadAdminDataShell);
    prefetchOnce('admin', loadAdminRoute);
  }
};

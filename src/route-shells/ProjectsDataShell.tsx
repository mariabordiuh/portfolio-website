import { Outlet } from 'react-router-dom';
import { PublicDataProvider } from '../context/PublicDataProvider';

export const ProjectsDataShell = () => (
  <PublicDataProvider
    collections={{ projects: true, videos: false, labItems: false, galleryImages: false, homeHero: false }}
  >
    <Outlet />
  </PublicDataProvider>
);

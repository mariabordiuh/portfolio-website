import { Outlet } from 'react-router-dom';
import { DataProvider } from '../context/DataContext';

export const ProjectsDataShell = () => (
  <DataProvider collections={{ projects: true, videos: false, labItems: false, galleryImages: false, homeHero: true }}>
    <Outlet />
  </DataProvider>
);

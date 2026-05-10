import { Outlet } from 'react-router-dom';
import { PublicDataProvider } from '../context/PublicDataProvider';

export const LabDataShell = () => (
  <PublicDataProvider
    collections={{ projects: false, videos: false, labItems: true, galleryImages: false }}
  >
    <Outlet />
  </PublicDataProvider>
);

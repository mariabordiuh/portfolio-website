import { Outlet } from 'react-router-dom';
import { PublicDataProvider } from '../context/PublicDataProvider';

export const PortfolioDataShell = () => (
  <PublicDataProvider
    collections={{ projects: true, videos: true, labItems: false, galleryImages: true }}
  >
    <Outlet />
  </PublicDataProvider>
);

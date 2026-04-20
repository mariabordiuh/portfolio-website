import { Outlet } from 'react-router-dom';
import { DataProvider } from '../context/DataContext';

export const PortfolioDataShell = () => (
  <DataProvider collections={{ projects: true, videos: true, labItems: false, galleryImages: true }}>
    <Outlet />
  </DataProvider>
);

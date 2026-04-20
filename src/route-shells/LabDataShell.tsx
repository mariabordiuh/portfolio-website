import { Outlet } from 'react-router-dom';
import { DataProvider } from '../context/DataContext';

export const LabDataShell = () => (
  <DataProvider collections={{ projects: false, videos: false, labItems: true, galleryImages: false }}>
    <Outlet />
  </DataProvider>
);

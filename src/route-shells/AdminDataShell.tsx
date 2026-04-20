import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { DataProvider } from '../context/DataContext';

export const AdminDataShell = () => (
  <AuthProvider>
    <DataProvider collections={{ projects: true, videos: true, labItems: true, galleryImages: true, homeHero: true }}>
      <Outlet />
    </DataProvider>
  </AuthProvider>
);

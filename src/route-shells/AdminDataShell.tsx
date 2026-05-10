import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { AdminDataProvider } from '../context/AdminDataProvider';

export const AdminDataShell = () => (
  <AuthProvider>
    <AdminDataProvider
      collections={{ projects: true, videos: true, labItems: true, galleryImages: true, homeHero: true }}
      includeDrafts
    >
      <Outlet />
    </AdminDataProvider>
  </AuthProvider>
);

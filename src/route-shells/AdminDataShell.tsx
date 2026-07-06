import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';
import { AdminDataProvider } from '../context/AdminDataProvider';

const AdminDataShellInner = () => {
  const { user, isAdmin, loading } = useAuth();
  const enableAdminCollections = Boolean(user && isAdmin && !loading);

  return (
    <AdminDataProvider
      collections={{
        projects: enableAdminCollections,
        videos: enableAdminCollections,
        labItems: enableAdminCollections,
        galleryImages: enableAdminCollections,
        homeHero: enableAdminCollections,
      }}
      includeDrafts
    >
      <Outlet />
    </AdminDataProvider>
  );
};

export const AdminDataShell = () => (
  <AuthProvider>
    <AdminDataShellInner />
  </AuthProvider>
);

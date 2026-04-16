'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import MobileNavbar from '@/components/MobileNavbar';
import SidebarOverlay from '@/components/SidebarOverlay';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const { currentUser, authLoading } = useAuth();

  const isLoginPage = pathname === '/login';

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  // Login page renders without shell
  if (isLoginPage || !currentUser) {
    return <>{children}</>;
  }

  // Authenticated layout
  return (
    <div className="app-layout">
      <MobileNavbar />
      <Sidebar />
      <main className="main-content fade-in">
        {children}
      </main>
      <SidebarOverlay />
    </div>
  );
}

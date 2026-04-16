import "./globals.css";
import { AppProvider } from '@/context/AppContext';
import { LanguageProvider } from '@/context/LanguageContext';
import Sidebar from '@/components/Sidebar';
import MobileNavbar from '@/components/MobileNavbar';
import SidebarOverlay from '@/components/SidebarOverlay';

export const metadata = {
  title: "StokTakip — Stok Yönetim Sistemi",
  description: "Departmanlar arası stok takibi, transfer yönetimi ve envanter kontrol sistemi",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <AppProvider>
            <div className="app-layout">
              <MobileNavbar />
              <Sidebar />
              <main className="main-content fade-in">
                {children}
              </main>
              <SidebarOverlay />
            </div>
          </AppProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

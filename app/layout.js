import "./globals.css";
import { AppProvider } from '@/context/AppContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext';
import AppShell from '@/components/AppShell';

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
          <AuthProvider>
            <AppProvider>
              <AppShell>{children}</AppShell>
            </AppProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

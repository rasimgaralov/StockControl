import "./globals.css";
import { AppProvider } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: "StokTakip — Stok Yönetim Sistemi",
  description: "Departmanlar arası stok takibi, transfer yönetimi ve envanter kontrol sistemi",
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <AppProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content fade-in">
              {children}
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  );
}

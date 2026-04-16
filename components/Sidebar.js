'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';

const navItems = [
  { label: 'Ana Sayfa', icon: '📊', href: '/' },
  { label: 'Ürünler', icon: '📋', href: '/urunler' },
  { label: 'Departmanlar', icon: '🏢', href: '/departmanlar' },
  { label: 'Transferler', icon: '🔄', href: '/transferler' },
  { label: 'Fire / Zayi', icon: '🗑️', href: '/fire-zayi' },
  { label: 'Alarmlar', icon: '🔔', href: '/alarmlar' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { activeAlerts } = useApp();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">ST</div>
        <div>
          <h1>StokTakip</h1>
          <span>Stok Yönetim Sistemi</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">Menü</div>
        {navItems.map(item => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.href === '/alarmlar' && activeAlerts.length > 0 && (
                <span className="nav-badge">{activeAlerts.length}</span>
              )}
            </Link>
          );
        })}

        <div className="nav-section-title" style={{ marginTop: '12px' }}>Sistem</div>
        <div className="nav-link" style={{ cursor: 'default', opacity: 0.5 }}>
          <span className="nav-icon">⚙️</span>
          <span>Ayarlar</span>
        </div>
      </nav>

      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '14px',
          fontWeight: '700',
          color: 'white',
          flexShrink: 0,
        }}>AY</div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Ahmet Yılmaz</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin</div>
        </div>
      </div>
    </aside>
  );
}

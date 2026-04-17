'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function Sidebar() {
  const pathname = usePathname();
  const { activeAlerts } = useApp();
  const { currentUser, logout, getRoleName } = useAuth();
  const { t, lang, changeLanguage } = useLanguage();

  const navItems = [
    { label: t('sidebar.home'), icon: '📊', href: '/' },
    { label: t('sidebar.products'), icon: '📋', href: '/urunler' },
    { label: t('sidebar.inbounds'), icon: '📥', href: '/gelen-stoklar' },
    { label: t('sidebar.departments'), icon: '🏢', href: '/departmanlar' },
    { label: t('sidebar.transfers'), icon: '🔄', href: '/transferler' },
    { label: t('sidebar.waste'), icon: '🗑️', href: '/fire-zayi' },
    { label: t('sidebar.invoices'), icon: '🧾', href: '/faturalar' },
    { label: t('sidebar.alerts'), icon: '🔔', href: '/alarmlar' },
  ];

  const closeSidebarOnMobile = () => {
    document.documentElement.classList.remove('sidebar-open');
  };

  const initials = currentUser?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '??';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ flexDirection: 'column', alignItems: 'center', padding: '24px 20px 10px', gap: '4px' }}>
        <img 
          src="/assets/Gulf_Distinguished_Hospitality_Co.svg" 
          alt="Gulf Logo" 
          style={{ width: '100%', maxWidth: '140px', height: 'auto', marginBottom: '6px' }}
        />
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '700', 
          color: 'var(--text-primary)', 
          textAlign: 'center',
          lineHeight: '1.2'
        }}>
          Gulf Distinguished
          <div style={{ fontSize: '13px', fontWeight: '600' }}>Hospitality Co.</div>
        </div>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: '600', 
          color: 'var(--accent-primary)', 
          textTransform: 'uppercase', 
          letterSpacing: '0.8px',
          marginTop: '2px'
        }}>
          Stock Control System
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-title">{t('sidebar.menu')}</div>
        {navItems.map(item => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={closeSidebarOnMobile}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.href === '/alarmlar' && activeAlerts.length > 0 && (
                <span className="nav-badge">{activeAlerts.length}</span>
              )}
            </Link>
          );
        })}

        <div className="nav-section-title" style={{ marginTop: '12px' }}>{t('sidebar.system')}</div>
        <Link 
          href="/ayarlar" 
          className={`nav-link ${pathname === '/ayarlar' ? 'active' : ''}`}
          onClick={closeSidebarOnMobile}
        >
          <span className="nav-icon">⚙️</span>
          <span>{t('sidebar.settings')}</span>
        </Link>
        <Link 
          href="/islem-gecmisi" 
          className={`nav-link ${pathname.startsWith('/islem-gecmisi') ? 'active' : ''}`}
          onClick={closeSidebarOnMobile}
        >
          <span className="nav-icon">📝</span>
          <span>{t('sidebar.activityHistory')}</span>
        </Link>

        {/* Global Language Switcher in Sidebar */}
        <div style={{ marginTop: 'auto', marginBottom: '10px' }}>
          <div className="nav-section-title">{lang === 'en' ? 'Language' : 'اللغة'}</div>
          <button 
            className="nav-link" 
            style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
            onClick={() => changeLanguage(lang === 'en' ? 'ar' : 'en')}
          >
            <span className="nav-icon">🌐</span>
            <span>{lang === 'en' ? 'Arabic (عربي)' : 'English'}</span>
          </button>
        </div>
      </nav>

      <div style={{
        padding: '12px 20px',
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
          fontSize: '12px',
          fontWeight: '700',
          color: 'white',
          flexShrink: 0,
        }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentUser?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{getRoleName()}</div>
        </div>
        <button 
          onClick={logout}
          title={t('sidebar.logout')}
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '8px',
            padding: '6px 8px',
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: 1,
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
        >
          🚪
        </button>
      </div>
    </aside>
  );
}

'use client';

import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

export default function AyarlarPage() {
  const { theme, changeTheme } = useApp();
  const { t } = useLanguage();

  const themes = [
    {
      id: 'light-mint',
      name: t('settingsPage.themes.lightMint'),
      mode: t('settingsPage.modes.light'),
      colors: ['#f2f2f2', '#33cdb0', '#ffffff']
    },
    {
      id: 'light-blue',
      name: t('settingsPage.themes.iceBlue'),
      mode: t('settingsPage.modes.light'),
      colors: ['#f1f5f9', '#3b82f6', '#ffffff']
    },
    {
      id: 'dark-emerald',
      name: t('settingsPage.themes.darkEmerald'),
      mode: t('settingsPage.modes.dark'),
      colors: ['#0c1c18', '#059669', '#1a3830']
    },
    {
      id: 'dark-midnight',
      name: t('settingsPage.themes.midnight'),
      mode: t('settingsPage.modes.dark'),
      colors: ['#020617', '#6366f1', '#1e293b']
    }
  ];

  return (
    <div className="slide-up">
      <div className="page-header">
        <h2>{t('settingsPage.title')}</h2>
        <p>{t('settingsPage.subtitle')}</p>
      </div>

      <div className="content-card">
        <div className="content-card-header">
          <h3>{t('settingsPage.themeSelection')}</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {themes.map(themeObj => {
            const isActive = theme === themeObj.id;

            return (
              <div
                key={themeObj.id}
                onClick={() => changeTheme(themeObj.id)}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: isActive ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'var(--shadow-sm)'
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'var(--accent-primary)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    ✓
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {themeObj.colors.map((c, i) => (
                    <div key={i} style={{ width: '32px', height: '32px', borderRadius: '8px', background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                  ))}
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>{themeObj.name}</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{themeObj.mode} {t('settingsPage.themeSuffix')}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';

export default function MobileNavbar() {
  const { lang, changeLanguage } = useLanguage();
  const { activeAlerts } = useApp();

  const toggleSidebar = () => {
    document.documentElement.classList.toggle('sidebar-open');
  };

  const toggleLang = () => {
    changeLanguage(lang === 'en' ? 'ar' : 'en');
  };

  return (
    <div className="mobile-navbar">
      <div className="mobile-navbar-left">
        <button onClick={toggleSidebar} className="hamburger-btn">
          <span className="hamburger-icon">☰</span>
        </button>
        <div className="mobile-logo-text">
          Gulf Distinguished
        </div>
      </div>
      
      <div className="mobile-navbar-right">
        <button onClick={toggleLang} className="lang-toggle-btn">
          {lang === 'en' ? 'العربية' : 'EN'}
        </button>
        <Link href="/alarmlar" className="mobile-alert-btn">
          🔔
          {activeAlerts.length > 0 && <span className="mobile-alert-badge">{activeAlerts.length}</span>}
        </Link>
      </div>
    </div>
  );
}

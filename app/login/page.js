'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';

export default function LoginPage() {
  const { login } = useAuth();
  const { t, lang, changeLanguage } = useLanguage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0c1c18 0%, #1a3830 40%, #0f2922 100%)',
      padding: '20px',
    }}>
      {/* Language Switcher */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '8px', zIndex: 10 }}>
        <button 
          type="button"
          onClick={() => changeLanguage('en')}
          style={{ background: lang === 'en' ? 'var(--accent-primary, #059669)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}
        >EN</button>
        <button 
          type="button"
          onClick={() => changeLanguage('ar')}
          style={{ background: lang === 'ar' ? 'var(--accent-primary, #059669)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600, transition: '0.2s' }}
        >AR</button>
      </div>

      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '48px 36px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      }}>
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: '36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <img 
            src="/assets/Gulf_Distinguished_Hospitality_Co.svg" 
            alt="Gulf Logo" 
            style={{ width: '100%', maxWidth: '140px', height: 'auto', marginBottom: '6px' }}
          />
          <div style={{ 
            fontSize: '15px', 
            fontWeight: '700', 
            color: '#f1f5f9', 
            textAlign: 'center',
            lineHeight: '1.2'
          }}>
            Gulf Distinguished
            <div style={{ fontSize: '14px', fontWeight: '600' }}>Hospitality Co.</div>
          </div>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#10b981', 
            textTransform: 'uppercase', 
            letterSpacing: '0.8px',
            marginTop: '4px'
          }}>
            Stock Control System
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            color: '#f87171',
            fontSize: '13px',
            fontWeight: '600',
            textAlign: 'center',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#94a3b8',
              marginBottom: '8px',
              letterSpacing: '0.3px',
            }}>
              {t('login.username')}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('login.username')}
              required
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)',
                color: '#f1f5f9',
                fontSize: '15px',
                fontWeight: '500',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: '#94a3b8',
              marginBottom: '8px',
              letterSpacing: '0.3px',
            }}>
              {t('login.password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('login.password')}
              required
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.06)',
                color: '#f1f5f9',
                fontSize: '15px',
                fontWeight: '500',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#059669';
                e.target.style.boxShadow = '0 0 0 3px rgba(5,150,105,0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              background: loading 
                ? 'rgba(5,150,105,0.4)' 
                : 'linear-gradient(135deg, #059669, #10b981)',
              color: 'white',
              fontSize: '15px',
              fontWeight: '700',
              cursor: loading ? 'wait' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 8px 30px rgba(5,150,105,0.25)',
              letterSpacing: '0.3px',
            }}
          >
            {loading ? `⏳ ${t('login.logging')}` : `🔐 ${t('login.loginBtn')}`}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontSize: '12px',
          color: '#64748b',
          fontWeight: '500',
        }}>
          Stock Control System v1.0
        </div>
      </div>
    </div>
  );
}

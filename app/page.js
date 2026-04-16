'use client';

import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDateTime, getStockStatus } from '@/data/mockData';
import Link from 'next/link';

export default function Dashboard() {
  const { products, transfersList, wasteLogsList, activeAlerts, criticalProducts, todayTransfers, departments, getDeptName, getDeptIcon, getProductName, getUserName, loading } = useApp();
  const { t, tData } = useLanguage();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('dashboard.preparing')}</p>
      </div>
    );
  }

  const criticalCount = activeAlerts.filter(a => a.alertType === 'critical_stock').length;
  const lowCount = activeAlerts.filter(a => a.alertType === 'low_stock').length;
  const expiryCount = activeAlerts.filter(a => a.alertType === 'expiry_warning').length;

  // Dept stock counts (by unique item count)
  const totalProducts = products.length || 1;
  const deptStockSummary = departments.map(dept => {
    const deptProducts = products.filter(p => p.deptId === dept.id);
    return { ...dept, productCount: deptProducts.length };
  });

  // Recent activities (merge transfers + waste, sort by date)
  const activities = [
    ...transfersList.slice(0, 5).map(t_activity => ({
      type: 'transfer',
      icon: '🔄',
      iconBg: 'var(--color-info-bg)',
      text: `<strong>${getProductName(t_activity.productId)}</strong> — ${t_activity.quantity} ${t('common.unknown')} ${tData(getDeptName(t_activity.fromDeptId), 'departments')} → ${tData(getDeptName(t_activity.toDeptId), 'departments')}`,
      time: t_activity.transferredAt,
      user: getUserName(t_activity.transferredBy),
    })),
    ...wasteLogsList.slice(0, 3).map(w => ({
      type: 'waste',
      icon: '🗑️',
      iconBg: 'var(--color-danger-bg)',
      text: `<strong>${getProductName(w.productId)}</strong> — ${w.quantity} ${t('dashboard.wasteLog')}`,
      time: w.loggedAt,
      user: getUserName(w.loggedBy),
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

  return (
    <div className="slide-up">
      <div className="page-header">
        <h2>{t('dashboard.title')}</h2>
        <p>{t('dashboard.subtitle')}</p>
      </div>

      {/* ═══ Stats Grid ═══ */}
      <div className="stats-grid">
        <Link href="/urunler" className="stat-card" style={{ '--card-accent': 'var(--accent-primary)', textDecoration: 'none' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon purple">📦</div>
            <div className="stat-card-trend up">↑ 12%</div>
          </div>
          <div className="stat-card-value">{products.length}</div>
          <div className="stat-card-label">{t('dashboard.totalProducts')}</div>
        </Link>

        <div className="stat-card" style={{ '--card-accent': 'var(--color-danger)', padding: '18px 16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: '600' }}>⚠️ {t('dashboard.rapidAlerts')}</div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            <Link href="/alarmlar?filter=critical_stock" style={{ flex: 1, textAlign: 'center', background: 'var(--color-danger-bg)', padding: '12px 4px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(248, 113, 113, 0.2)' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-danger)', lineHeight: 1 }}>{criticalCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 600 }}>{t('dashboard.critical')}</div>
            </Link>            
            <Link href="/alarmlar?filter=low_stock" style={{ flex: 1, textAlign: 'center', background: 'var(--color-warning-bg)', padding: '12px 4px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(250, 204, 21, 0.2)' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-warning)', lineHeight: 1 }}>{lowCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 600 }}>{t('dashboard.low')}</div>
            </Link>            
            <Link href="/alarmlar?filter=expiry_warning" style={{ flex: 1, textAlign: 'center', background: 'var(--color-info-bg)', padding: '12px 4px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-info)', lineHeight: 1 }}>{expiryCount}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 600 }}>{t('dashboard.expiry')}</div>
            </Link>
          </div>
        </div>

        <Link href="/transferler" className="stat-card" style={{ '--card-accent': 'var(--color-info)', textDecoration: 'none' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon blue">🔄</div>
          </div>
          <div className="stat-card-value">{todayTransfers.length}</div>
          <div className="stat-card-label">{t('dashboard.todayTransfers')}</div>
        </Link>

        <Link href="/alarmlar" className="stat-card" style={{ '--card-accent': 'var(--color-warning)', textDecoration: 'none' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon yellow">🔔</div>
          </div>
          <div className="stat-card-value">{activeAlerts.length}</div>
          <div className="stat-card-label">{t('dashboard.activeAlerts')}</div>
        </Link>
      </div>

      {/* ═══ Charts + Activity ═══ */}
      <div className="content-grid">
        {/* Bar Chart */}
        <div className="content-card">
          <div className="content-card-header">
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>{t('dashboard.deptAnalysis')}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('dashboard.deptAnalysisSub')}</p>
            </div>
          </div>
          <div className="modern-distribution-list" style={{ display: 'flex', flexDirection: 'column', gap: '22px', padding: '12px 4px 4px' }}>
            {deptStockSummary.map(dept => {
              const percentage = Math.round((dept.productCount / totalProducts) * 100);
              return (
                <div key={dept.id} className="dist-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', group: 'hover' }}>
                  <div style={{
                    width: '46px', height: '46px', borderRadius: '14px',
                    background: `linear-gradient(135deg, var(--bg-surface-hover), var(--bg-primary))`, 
                    border: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', flexShrink: 0,
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {dept.icon}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', letterSpacing: '0.2px' }}>{tData(dept.name, 'departments')}</span>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>%{percentage}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>({dept.productCount} {t('dashboard.product')})</span>
                      </div>
                    </div>
                    
                    {/* Track Background */}
                    <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '20px', position: 'relative' }}>
                      {/* Active Progress */}
                      <div style={{ 
                        height: '100%', width: `${percentage}%`, 
                        background: `linear-gradient(90deg, ${dept.color}, ${dept.color}dd)`,
                        borderRadius: '20px',
                        boxShadow: `0 0 12px ${dept.color}66`,
                        transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="content-card">
          <div className="content-card-header">
            <h3>{t('dashboard.recentActivity')}</h3>
          </div>
          <div className="activity-list">
            {activities.map((act, i) => (
              <div key={i} className="activity-item">
                <div className="activity-icon" style={{ background: act.iconBg }}>
                  {act.icon}
                </div>
                <div className="activity-content">
                  <div className="activity-text" dangerouslySetInnerHTML={{ __html: act.text }} />
                  <div className="activity-time">{act.user} • {formatDateTime(act.time)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Alerts Panel ═══ */}
      {activeAlerts.length > 0 && (
        <div className="content-card">
          <div className="content-card-header">
            <h3>🔔 {t('dashboard.activeAlertsTitle')}</h3>
            <span className="badge badge-danger">{activeAlerts.length} {t('dashboard.alertCount')}</span>
          </div>
          <div className="alert-list">
            {activeAlerts.slice(0, 15).map(alert => {
              const product = products.find(p => p.id === alert.productId);
              const isCritical = alert.alertType === 'critical_stock';
              const isLow = alert.alertType === 'low_stock';
              const isExpiry = alert.alertType === 'expiry_warning';
              
              let icon = '⏰'; let cls = 'warning'; let desc = '';
              if (isCritical) {
                icon = '🚨'; cls = 'critical';
                desc = `${t('dashboard.stockCritical')}: ${product?.quantity} ${tData(product?.unit, 'units')} (${t('dashboard.threshold')}: ${product?.criticalThreshold})`;
              } else if (isLow) {
                icon = '⚠️'; cls = 'warning';
                desc = `${t('dashboard.stockLow')}: ${product?.quantity} ${tData(product?.unit, 'units')} (${t('dashboard.thresholdApproaching')}: ${product?.criticalThreshold})`;
              } else if (isExpiry) {
                icon = '⏰'; cls = 'warning';
                desc = `${t('dashboard.expiryApproaching')}: ${product?.expiryDate}`;
              }

              return (
                <div key={alert.id} className={`alert-item ${cls}`}>
                  <div className="alert-item-icon">{icon}</div>
                  <div className="alert-item-content">
                    <div className="alert-item-title">
                      {product?.name || 'Bilinmiyor'}
                    </div>
                    <div className="alert-item-desc">{desc}</div>
                  </div>
                  <div className="alert-item-time">{formatDateTime(alert.triggeredAt)}</div>
                </div>
              );
            })}
          </div>
          {activeAlerts.length > 15 && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <Link href="/alarmlar" className="btn btn-secondary">
                {t('dashboard.seeAll')} ({activeAlerts.length - 15} {t('dashboard.more')})
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

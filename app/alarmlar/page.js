'use client';

import { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getProductName, getProductById, getDeptName, formatDateTime } from '@/data/mockData';

export default function AlarmlarPage() {
  const { alerts, resolveAlert, products } = useApp();

  const activeAlerts = useMemo(() => alerts.filter(a => !a.resolved), [alerts]);
  const resolvedAlerts = useMemo(() => alerts.filter(a => a.resolved), [alerts]);

  const criticalCount = activeAlerts.filter(a => a.alertType === 'critical_stock').length;
  const expiryCount = activeAlerts.filter(a => a.alertType === 'expiry_warning').length;

  return (
    <div className="slide-up">
      <div className="page-header">
        <h2>Alarmlar</h2>
        <p>Stok uyarıları ve bildirimler</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-danger)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon red">🚨</div>
          </div>
          <div className="stat-card-value">{criticalCount}</div>
          <div className="stat-card-label">Kritik Stok Alarmı</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-warning)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon yellow">⏰</div>
          </div>
          <div className="stat-card-value">{expiryCount}</div>
          <div className="stat-card-label">SKT Uyarısı</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-success)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon green">✅</div>
          </div>
          <div className="stat-card-value">{resolvedAlerts.length}</div>
          <div className="stat-card-label">Çözümlendi</div>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>🔔 Aktif Alarmlar</h3>
          {activeAlerts.length > 0 && (
            <span className="badge badge-danger">{activeAlerts.length} aktif</span>
          )}
        </div>
        {activeAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-text">Aktif alarm yok — her şey yolunda!</div>
          </div>
        ) : (
          <div className="alert-list">
            {activeAlerts.map(alert => {
              const product = getProductById(alert.productId);
              const isCritical = alert.alertType === 'critical_stock';

              return (
                <div key={alert.id} className={`alert-item ${isCritical ? 'critical' : 'warning'}`}>
                  <div className="alert-item-icon">{isCritical ? '🚨' : '⏰'}</div>
                  <div className="alert-item-content">
                    <div className="alert-item-title">{product?.name || 'Bilinmiyor'}</div>
                    <div className="alert-item-desc">
                      {isCritical
                        ? `Stok kritik seviyede! Mevcut: ${product?.quantity} ${product?.unit}, Eşik: ${product?.criticalThreshold} ${product?.unit}`
                        : `Son kullanma tarihi yaklaşıyor: ${product?.expiryDate}`
                      }
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="alert-item-time">{formatDateTime(alert.triggeredAt)}</div>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      ✓ Çözüldü
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <div className="content-card" style={{ opacity: 0.7 }}>
          <div className="content-card-header">
            <h3>✅ Çözümlenmiş Alarmlar</h3>
            <span className="badge badge-success">{resolvedAlerts.length} çözümlendi</span>
          </div>
          <div className="alert-list">
            {resolvedAlerts.map(alert => {
              const product = getProductById(alert.productId);
              const isCritical = alert.alertType === 'critical_stock';

              return (
                <div key={alert.id} className={`alert-item ${isCritical ? 'critical' : 'warning'}`} style={{ opacity: 0.6 }}>
                  <div className="alert-item-icon">{isCritical ? '🚨' : '⏰'}</div>
                  <div className="alert-item-content">
                    <div className="alert-item-title" style={{ textDecoration: 'line-through' }}>{product?.name || 'Bilinmiyor'}</div>
                    <div className="alert-item-desc">
                      {isCritical ? 'Kritik stok alarmı çözümlendi' : 'SKT uyarısı çözümlendi'}
                    </div>
                  </div>
                  <div className="alert-item-time">{formatDateTime(alert.triggeredAt)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

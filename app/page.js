'use client';

import { useApp } from '@/context/AppContext';
import { getDeptName, getDeptIcon, getProductName, formatDateTime, getUserName, getStockStatus } from '@/data/mockData';

export default function Dashboard() {
  const { products, transfersList, wasteLogsList, activeAlerts, criticalProducts, todayTransfers, departments } = useApp();

  // Dept stock counts
  const deptStockSummary = departments.map(dept => {
    const deptProducts = products.filter(p => p.deptId === dept.id);
    const totalQty = deptProducts.reduce((sum, p) => sum + p.quantity, 0);
    return { ...dept, totalQty, productCount: deptProducts.length };
  });

  // Recent activities (merge transfers + waste, sort by date)
  const activities = [
    ...transfersList.slice(0, 5).map(t => ({
      type: 'transfer',
      icon: '🔄',
      iconBg: 'var(--color-info-bg)',
      text: `<strong>${getProductName(t.productId)}</strong> — ${t.quantity} adet ${getDeptName(t.fromDeptId)} → ${getDeptName(t.toDeptId)}`,
      time: t.transferredAt,
      user: getUserName(t.transferredBy),
    })),
    ...wasteLogsList.slice(0, 3).map(w => ({
      type: 'waste',
      icon: '🗑️',
      iconBg: 'var(--color-danger-bg)',
      text: `<strong>${getProductName(w.productId)}</strong> — ${w.quantity} adet fire kaydı`,
      time: w.loggedAt,
      user: getUserName(w.loggedBy),
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

  const maxQty = Math.max(...deptStockSummary.map(d => d.totalQty), 1);

  return (
    <div className="slide-up">
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>Stok durumunuzun genel görünümü</p>
      </div>

      {/* ═══ Stats Grid ═══ */}
      <div className="stats-grid">
        <div className="stat-card" style={{ '--card-accent': 'var(--accent-primary)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon purple">📦</div>
            <div className="stat-card-trend up">↑ 12%</div>
          </div>
          <div className="stat-card-value">{products.length}</div>
          <div className="stat-card-label">Toplam Ürün</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--color-danger)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon red">⚠️</div>
          </div>
          <div className="stat-card-value">{criticalProducts.length}</div>
          <div className="stat-card-label">Kritik Stok</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--color-info)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon blue">🔄</div>
          </div>
          <div className="stat-card-value">{todayTransfers.length}</div>
          <div className="stat-card-label">Bugünkü Transfer</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--color-warning)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon yellow">🔔</div>
          </div>
          <div className="stat-card-value">{activeAlerts.length}</div>
          <div className="stat-card-label">Aktif Alarm</div>
        </div>
      </div>

      {/* ═══ Charts + Activity ═══ */}
      <div className="content-grid">
        {/* Bar Chart */}
        <div className="content-card">
          <div className="content-card-header">
            <h3>Departman Stok Durumu</h3>
          </div>
          <div className="chart-container">
            <div className="bar-chart">
              {deptStockSummary.map(dept => (
                <div key={dept.id} className="bar-chart-item">
                  <div className="bar-chart-value">{dept.totalQty}</div>
                  <div
                    className="bar-chart-bar"
                    style={{
                      height: `${(dept.totalQty / maxQty) * 160}px`,
                      background: `linear-gradient(180deg, ${dept.color}, ${dept.color}88)`,
                    }}
                  />
                  <div className="bar-chart-label">{dept.icon} {dept.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="content-card">
          <div className="content-card-header">
            <h3>Son İşlemler</h3>
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
            <h3>🔔 Aktif Alarmlar</h3>
            <span className="badge badge-danger">{activeAlerts.length} alarm</span>
          </div>
          <div className="alert-list">
            {activeAlerts.map(alert => {
              const product = products.find(p => p.id === alert.productId);
              const isCritical = alert.alertType === 'critical_stock';
              return (
                <div key={alert.id} className={`alert-item ${isCritical ? 'critical' : 'warning'}`}>
                  <div className="alert-item-icon">{isCritical ? '🚨' : '⏰'}</div>
                  <div className="alert-item-content">
                    <div className="alert-item-title">
                      {product?.name || 'Bilinmiyor'}
                    </div>
                    <div className="alert-item-desc">
                      {isCritical
                        ? `Stok kritik seviyede: ${product?.quantity} ${product?.unit} (eşik: ${product?.criticalThreshold})`
                        : `Son kullanma tarihi yaklaşıyor: ${product?.expiryDate}`
                      }
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

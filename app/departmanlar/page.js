'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getProductName, getStockStatus, formatDate } from '@/data/mockData';

export default function DepartmanlarPage() {
  const { departments, products, deptStockList } = useApp();
  const [selectedDept, setSelectedDept] = useState(null);

  const deptSummaries = useMemo(() => {
    return departments.map(dept => {
      const deptProducts = products.filter(p => p.deptId === dept.id);
      const totalQty = deptProducts.reduce((sum, p) => sum + p.quantity, 0);
      const criticalCount = deptProducts.filter(p => p.quantity <= p.criticalThreshold).length;
      return {
        ...dept,
        totalQty,
        productCount: deptProducts.length,
        criticalCount,
        products: deptProducts,
      };
    });
  }, [departments, products]);

  const selectedDeptData = deptSummaries.find(d => d.id === selectedDept);

  return (
    <div className="slide-up">
      <div className="page-header">
        <h2>Departmanlar</h2>
        <p>Departman bazlı stok durumunu görüntüleyin</p>
      </div>

      {/* Department Cards Grid */}
      <div className="dept-grid">
        {deptSummaries.map(dept => (
          <div
            key={dept.id}
            className="dept-card"
            onClick={() => setSelectedDept(selectedDept === dept.id ? null : dept.id)}
            style={{
              borderColor: selectedDept === dept.id ? dept.color : undefined,
              boxShadow: selectedDept === dept.id ? `0 0 20px ${dept.color}22` : undefined,
            }}
          >
            <div className="dept-card-header">
              <div className="dept-card-icon" style={{ background: `${dept.color}20`, fontSize: '24px' }}>
                {dept.icon}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{dept.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dept.productCount} ürün</div>
              </div>
            </div>
            <div className="dept-card-stats">
              <div className="dept-stat">
                <div className="dept-stat-value">{dept.totalQty}</div>
                <div className="dept-stat-label">Toplam Stok</div>
              </div>
              <div className="dept-stat">
                <div className="dept-stat-value" style={{ color: dept.criticalCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {dept.criticalCount}
                </div>
                <div className="dept-stat-label">Kritik Ürün</div>
              </div>
            </div>
            {dept.criticalCount > 0 && (
              <div style={{ marginTop: '14px' }}>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${dept.criticalCount > 2 ? 'red' : dept.criticalCount > 0 ? 'yellow' : 'green'}`}
                    style={{ width: `${Math.min(100, (dept.criticalCount / dept.productCount) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Selected Department Detail */}
      {selectedDeptData && (
        <div className="content-card slide-up">
          <div className="content-card-header">
            <h3>{selectedDeptData.icon} {selectedDeptData.name} — Stok Detayı</h3>
            <span className="badge badge-purple">{selectedDeptData.productCount} ürün</span>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ürün</th>
                  <th>Miktar</th>
                  <th>Birim</th>
                  <th>Kritik Eşik</th>
                  <th>SKT</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {selectedDeptData.products.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <div className="empty-state-text">Bu departmanda ürün yok</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  selectedDeptData.products.map(p => {
                    const status = getStockStatus(p);
                    return (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                        <td style={{
                          fontWeight: 700,
                          color: status === 'critical' ? 'var(--color-danger)' : status === 'warning' ? 'var(--color-warning)' : 'var(--text-primary)'
                        }}>{p.quantity}</td>
                        <td>{p.unit}</td>
                        <td>{p.criticalThreshold}</td>
                        <td>{formatDate(p.expiryDate)}</td>
                        <td>
                          {status === 'critical' && <span className="badge badge-danger">Kritik</span>}
                          {status === 'warning' && <span className="badge badge-warning">Düşük</span>}
                          {status === 'normal' && <span className="badge badge-success">Normal</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

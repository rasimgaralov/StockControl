'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { getStockStatus, formatDate } from '@/data/mockData';

export default function DepartmanlarPage() {
  const { departments, products, deptStockList, getProductName, loading } = useApp();
  const { t, lang } = useLanguage();
  const [selectedDept, setSelectedDept] = useState(null);

  const deptSummaries = useMemo(() => {
    return departments.map(dept => {
      const deptProducts = products.filter(p => p.deptId === dept.id);
      const inStockCount = deptProducts.filter(p => p.quantity > 0).length;
      const criticalCount = deptProducts.length - inStockCount;
      return {
        ...dept,
        inStockCount,
        productCount: deptProducts.length,
        criticalCount,
        products: deptProducts,
      };
    });
  }, [departments, products]);

  const selectedDeptData = deptSummaries.find(d => d.id === selectedDept);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('departmentsPage.loading')}</p>
      </div>
    );
  }

  return (
    <div className="slide-up">
      <div className="page-header">
        <h2>{t('departmentsPage.title')}</h2>
        <p>{t('departmentsPage.subtitle')}</p>
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
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{(dept[`name_${lang}`] || dept.name_en)}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{dept.productCount} {t('departmentsPage.products')}</div>
              </div>
            </div>
            <div className="dept-card-stats">
              <div className="dept-stat">
                <div className="dept-stat-value">{dept.inStockCount}/{dept.productCount}</div>
                <div className="dept-stat-label">{t('departmentsPage.totalStock')}</div>
              </div>
              <div className="dept-stat">
                <div className="dept-stat-value" style={{ color: dept.criticalCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {dept.criticalCount}
                </div>
                <div className="dept-stat-label">{t('departmentsPage.criticalProduct')}</div>
              </div>
            </div>
            {dept.productCount > 0 && (
              <div style={{ marginTop: '14px' }}>
                <div className="progress-bar">
                  <div
                    className={`progress-fill ${dept.inStockCount === dept.productCount ? 'green' : (dept.inStockCount < dept.productCount / 2 ? 'red' : 'yellow')}`}
                    style={{ width: `${Math.min(100, (dept.inStockCount / dept.productCount) * 100)}%` }}
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
            <h3>{selectedDeptData.icon} {(selectedDeptData[`name_${lang}`] || selectedDeptData.name_en)} — {t('departmentsPage.detailTitle')}</h3>
            <span className="badge badge-purple">{selectedDeptData.productCount} {t('departmentsPage.products')}</span>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('departmentsPage.table.product')}</th>
                  <th>{t('departmentsPage.table.quantity')}</th>
                  <th>{t('departmentsPage.table.unit')}</th>
                  <th>{t('departmentsPage.table.criticalThreshold')}</th>
                  <th>{t('departmentsPage.table.expiry')}</th>
                  <th>{t('departmentsPage.table.status')}</th>
                </tr>
              </thead>
              <tbody>
                {selectedDeptData.products.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <div className="empty-state-text">{t('departmentsPage.emptyState')}</div>
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
                        <td>{(p[`unit_${lang}`] || p.unit_en)}</td>
                        <td>{p.criticalThreshold}</td>
                        <td>{formatDate(p.expiryDate)}</td>
                        <td>
                          {status === 'critical' && <span className="badge badge-danger">{t('productsPage.status.critical')}</span>}
                          {status === 'warning' && <span className="badge badge-warning">{t('productsPage.status.warning')}</span>}
                          {status === 'normal' && <span className="badge badge-success">{t('productsPage.status.normal')}</span>}
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

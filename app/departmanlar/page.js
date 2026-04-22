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
    const warehouseDept = departments.find(d => d.name_en === 'Warehouse' || d.id === 'd5');
    
    const summaries = departments.map(dept => {
      let deptProducts = [];
      if (warehouseDept && dept.id === warehouseDept.id) {
        deptProducts = products; // Warehouse sees all products
      } else {
        deptProducts = products.filter(p => p.category === dept.name_en); // Others see by category
      }
      
      const inStockCount = deptProducts.filter(p => p.quantity > 0).length;
      const criticalCount = deptProducts.filter(p => p.quantity <= p.criticalThreshold).length;
      
      return {
        ...dept,
        inStockCount,
        productCount: deptProducts.length,
        criticalCount,
        products: deptProducts,
      };
    });

    // Make sure Warehouse is always the first card
    if (warehouseDept) {
      summaries.sort((a, b) => (a.id === warehouseDept.id ? -1 : b.id === warehouseDept.id ? 1 : 0));
    }

    return summaries;
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

      {/* Warehouse Card - Full Width */}
      {(() => {
        const warehouseDept = deptSummaries.find(d => d.id === 'd5' || d.name_en === 'Warehouse');
        const otherDepts = deptSummaries.filter(d => d.id !== 'd5' && d.name_en !== 'Warehouse');

        const renderCard = (dept, isWarehouse = false) => {
          const percentage = dept.productCount === 0 ? 0 : Math.round((dept.inStockCount / dept.productCount) * 100);
          return (
            <div
              key={dept.id}
              className="dept-card"
              onClick={() => setSelectedDept(selectedDept === dept.id ? null : dept.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                padding: '24px',
                borderColor: selectedDept === dept.id ? dept.color : (isWarehouse ? 'var(--accent-primary)' : undefined),
                boxShadow: selectedDept === dept.id ? `0 0 20px ${dept.color}33` : (isWarehouse ? 'var(--shadow-sm)' : undefined),
                ...(isWarehouse ? { borderStyle: 'dashed', borderWidth: '2px' } : {})
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                {/* Icon & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div className="dept-card-icon" style={{ background: `${dept.color}20`, fontSize: '26px', width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', flexShrink: 0 }}>
                    {dept.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>{(dept[`name_${lang}`] || dept.name_en)}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{dept.productCount} {t('departmentsPage.products')}</div>
                  </div>
                </div>

                {/* Critical Stats */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: dept.criticalCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    {dept.criticalCount}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('departmentsPage.criticalProduct')}</div>
                </div>
              </div>

              {/* Thick Progress Bar with Text */}
              <div style={{ width: '100%' }}>
                <div style={{ 
                  position: 'relative', 
                  height: '32px', 
                  background: 'var(--bg-surface-hover)', 
                  borderRadius: '16px', 
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${percentage}%`,
                    background: `linear-gradient(90deg, ${dept.color}, ${dept.color}dd)`,
                    transition: 'width 1s ease',
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: percentage > 40 ? '#fff' : 'var(--text-primary)',
                    textShadow: percentage > 40 ? '0 1px 2px rgba(0,0,0,0.5)' : 'none',
                    pointerEvents: 'none'
                  }}>
                    {dept.inStockCount} / {dept.productCount} ({percentage}%)
                  </div>
                </div>
              </div>
            </div>
          );
        };

        const renderVerticalCard = (dept) => {
          const percentage = dept.productCount === 0 ? 0 : Math.round((dept.inStockCount / dept.productCount) * 100);
          return (
            <div
              key={dept.id}
              className="dept-card"
              onClick={() => setSelectedDept(selectedDept === dept.id ? null : dept.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                borderColor: selectedDept === dept.id ? dept.color : undefined,
                boxShadow: selectedDept === dept.id ? `0 0 20px ${dept.color}33` : 'var(--shadow-sm)',
                height: '100%',
              }}
            >
              {/* Header: Icon and Title */}
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div className="dept-card-icon" style={{ background: `${dept.color}20`, fontSize: '32px', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '16px', margin: '0 auto 12px' }}>
                  {dept.icon}
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>{(dept[`name_${lang}`] || dept.name_en)}</div>
              </div>

              {/* Vertical Progress Bar */}
              <div style={{ 
                position: 'relative', 
                width: '100%',
                height: '160px', 
                background: 'var(--bg-surface-hover)', 
                borderRadius: '16px', 
                overflow: 'hidden',
                border: '1px solid var(--border-color)',
                boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.1)',
                marginTop: '4px'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0, left: 0, right: 0,
                  height: `${percentage}%`,
                  background: `linear-gradient(0deg, ${dept.color}, ${dept.color}dd)`,
                  transition: 'height 1s ease',
                }} />
                
                {/* Text centered inside the bar */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: percentage > 45 ? '#fff' : 'var(--text-primary)',
                  textShadow: percentage > 45 ? '0 1px 3px rgba(0,0,0,0.6)' : 'none',
                  pointerEvents: 'none'
                }}>
                  <span style={{ fontSize: '20px', fontWeight: '800' }}>{percentage}%</span>
                  <span style={{ fontSize: '13px', fontWeight: '600', opacity: 0.9 }}>{dept.inStockCount} / {dept.productCount}</span>
                </div>
              </div>

              {/* Critical Stats */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('departmentsPage.criticalProduct')}</span>
                <span style={{ fontSize: '16px', fontWeight: '800', color: dept.criticalCount > 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {dept.criticalCount}
                </span>
              </div>
            </div>
          );
        };

        return (
          <>
            {warehouseDept && (
              <div style={{ marginBottom: '24px' }}>
                {renderCard(warehouseDept, true)}
              </div>
            )}
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
              gap: '12px' 
            }}>
              {otherDepts.map(dept => renderVerticalCard(dept))}
            </div>
          </>
        );
      })()}

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

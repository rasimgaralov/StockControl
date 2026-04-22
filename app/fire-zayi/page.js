'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDateTime } from '@/data/mockData';
import Modal from '@/components/Modal';

export default function FireZayiPage() {
  const { products, departments, wasteLogsList, addWasteLog, getProductName, getDeptName, getDeptIcon, getUserName, loading } = useApp();
  const { hasPermission, currentUser } = useAuth();
  const { t, lang } = useLanguage();

  const canAdd = hasPermission('add');

  const [showModal, setShowModal] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  
  const [formData, setFormData] = useState({
    productId: '', deptId: '', quantity: '', reason_en: '', reason_ar: ''
  });
  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const [correctionData, setCorrectionData] = useState({
    productId: '', quantity: ''
  });
  const [correctionSearch, setCorrectionSearch] = useState('');
  const [showCorrectionDropdown, setShowCorrectionDropdown] = useState(false);

  // Filtered products for dropdowns
  const filteredProducts = useMemo(() => {
    if (!productSearch || !showDropdown) return products;
    const q = productSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, productSearch, showDropdown]);

  const filteredCorrectionProducts = useMemo(() => {
    if (!correctionSearch || !showCorrectionDropdown) return products;
    const q = correctionSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, correctionSearch, showCorrectionDropdown]);

  const totalWaste = wasteLogsList.reduce((sum, w) => sum + w.quantity, 0);
  const wasteByDept = useMemo(() => {
    const map = {};
    wasteLogsList.forEach(w => {
      map[w.deptId] = (map[w.deptId] || 0) + w.quantity;
    });
    return map;
    return map;
  }, [wasteLogsList]);

  const filteredWaste = useMemo(() => {
    let result = [...wasteLogsList];
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(a.loggedAt) - new Date(b.loggedAt);
      } else if (sortBy === 'name') {
        const nameA = getProductName(a.productId) || '';
        const nameB = getProductName(b.productId) || '';
        cmp = nameA.localeCompare(nameB, 'tr');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return result;
  }, [wasteLogsList, sortBy, sortDir, getProductName]);

  const openModal = () => {
    setFormData({
      productId: '',
      deptId: departments[0]?.id || '',
      quantity: '',
      reason_en: '',
      reason_ar: ''
    });
    setProductSearch('');
    setShowDropdown(false);
    setShowModal(true);
  };

  const openCorrectionModal = () => {
    setCorrectionData({
      productId: '',
      quantity: ''
    });
    setCorrectionSearch('');
    setShowCorrectionDropdown(false);
    setShowCorrectionModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addWasteLog({
      productId: formData.productId,
      deptId: formData.deptId,
      quantity: Number(String(formData.quantity).replace(',', '.')),
      reason_en: formData.reason_en,
      reason_ar: formData.reason_ar,
    });
    setShowModal(false);
  };

  const handleCorrectionSubmit = (e) => {
    e.preventDefault();
    addWasteLog({
      productId: correctionData.productId,
      deptId: 'd5', // Warehouse
      quantity: Number(String(correctionData.quantity).replace(',', '.')),
      reason_en: 'Stock Correction (Accidental Entry)',
      reason_ar: 'تصحيح المخزون (إدخال خاطئ)',
    });
    setShowCorrectionModal(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('wastePage.loading')}</p>
      </div>
    );
  }

  const selectedProduct = products.find(p => p.id === formData.productId);
  const selectedCorrectionProduct = products.find(p => p.id === correctionData.productId);

  return (
    <div className="slide-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>{t('wastePage.title')}</h2>
            <p>{t('wastePage.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {currentUser?.role === 'admin' && (
              <button className="btn btn-secondary" onClick={openCorrectionModal}>
                ⚠️ {lang === 'ar' ? 'تصحيح المخزون' : 'Yanlış Stok Çıkarma'}
              </button>
            )}
            {canAdd && (
              <button className="btn btn-primary" onClick={openModal}>
                ➕ {t('wastePage.newRecord')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', width: '100%', gap: '12px', justifyContent: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <select className="filter-select" style={{ width: '100%', border: '1px solid var(--border-color)', padding: '12px', borderRadius: 'var(--radius-sm)' }} value={`${sortBy}-${sortDir}`} onChange={(e) => {
              const parts = e.target.value.split('-');
              setSortBy(parts[0]);
              setSortDir(parts[1]);
            }}>
              <option value="name-asc">{t('common.sortOptions.az')}</option>
              <option value="name-desc">{t('common.sortOptions.za')}</option>
              <option value="date-desc">{t('common.sortOptions.newest')}</option>
              <option value="date-asc">{t('common.sortOptions.oldest')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-danger)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon red">🗑️</div>
          </div>
          <div className="stat-card-value">{wasteLogsList.length}</div>
          <div className="stat-card-label">{t('wastePage.totalLogs')}</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-warning)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon yellow">📊</div>
          </div>
          <div className="stat-card-value">{totalWaste}</div>
          <div className="stat-card-label">{t('wastePage.totalAmount')}</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--accent-primary)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon purple">🏢</div>
          </div>
          <div className="stat-card-value">{Object.keys(wasteByDept).length}</div>
          <div className="stat-card-label">{t('wastePage.affectedDepts')}</div>
        </div>
      </div>

      {/* Table */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>{t('wastePage.historyTitle')}</h3>
          <span className="badge badge-danger">{wasteLogsList.length} {t('wastePage.historyCount')}</span>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('wastePage.table.date')}</th>
                <th>{t('wastePage.table.product')}</th>
                <th>{t('wastePage.table.dept')}</th>
                <th>{t('wastePage.table.amount')}</th>
                <th>{t('wastePage.table.reason')}</th>
                <th>{t('wastePage.table.user')}</th>
              </tr>
            </thead>
            <tbody>
              {wasteLogsList.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">✅</div>
                      <div className="empty-state-text">{t('wastePage.emptyState')}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredWaste.map(w => (
                  <tr key={w.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(w.loggedAt)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getProductName(w.productId)}</td>
                    <td>
                      <span className="badge badge-purple">
                        {getDeptIcon(w.deptId)} {getDeptName(w.deptId, lang)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>-{w.quantity}</td>
                    <td style={{ maxWidth: '250px' }}>{(w[`reason_${lang}`] || w.reason_en)}</td>
                    <td>{getUserName(w.loggedBy)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('wastePage.modalTitle')}>
        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">{t('wastePage.productLabel')}</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="form-input" 
                type="text" 
                placeholder="Search product..." 
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => {
                  setProductSearch('');
                  setShowDropdown(true);
                }}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              />
              {formData.productId && !showDropdown && selectedProduct && (
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{selectedProduct.quantity} {(selectedProduct[`unit_${lang}`] || selectedProduct.unit_en)}</span>
                  <span style={{ color: 'var(--color-success)' }}>✓</span>
                </div>
              )}
              {showDropdown && (
                <ul className="dropdown-menu-list" style={{ 
                  position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', 
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', 
                  maxHeight: '200px', overflowY: 'auto', zIndex: 1000, margin: '4px 0 0 0', padding: 0,
                  boxShadow: 'var(--shadow-md)', listStyle: 'none'
                }}>
                  {filteredProducts.length === 0 ? (
                    <li style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '14px' }}>Bulunamadı</li>
                  ) : (
                    filteredProducts.map(p => (
                      <li 
                        key={p.id} 
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '14px', background: formData.productId === p.id ? 'var(--bg-surface-hover)' : 'transparent', display: 'flex', justifyContent: 'space-between' }}
                        onMouseDown={() => {
                          setFormData({ ...formData, productId: p.id });
                          setProductSearch(p.name);
                          setShowDropdown(false);
                        }}
                      >
                        <span>{p.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{p.quantity} {(p[`unit_${lang}`] || p.unit_en)}</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('wastePage.deptLabel')}</label>
              <select className="form-select" value={formData.deptId} onChange={(e) => setFormData({ ...formData, deptId: e.target.value })}>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.icon} {(d[`name_${lang}`] || d.name_en)}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('wastePage.amountLabel')}</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type="number" required min="1" step={selectedProduct && ['kg', 'liters'].includes(selectedProduct.unit_en) ? "0.001" : "0.1"} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} style={{ paddingRight: '56px' }} />
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', pointerEvents: 'none' }}>
                  {selectedProduct ? (selectedProduct[`unit_${lang}`] || selectedProduct.unit_en) : ''}
                </div>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('wastePage.reasonLabel')}</label>
            <textarea className="form-textarea" required value={formData.reason_en} onChange={(e) => setFormData({ ...formData, reason_en: e.target.value, reason_ar: e.target.value })} placeholder={t('wastePage.reasonPlaceholder')} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary">{t('wastePage.saveBtn')}</button>
          </div>
        </form>
      </Modal>

      {/* Correction Modal */}
      <Modal isOpen={showCorrectionModal} onClose={() => setShowCorrectionModal(false)} title={lang === 'ar' ? 'تصحيح المخزون' : 'Yanlış Girilen Stoğu Düzelt'}>
        <form onSubmit={handleCorrectionSubmit}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {lang === 'ar' ? 'استخدم هذا النموذج لخصم المخزون الذي تم إدخاله بالخطأ.' : 'Yanlışlıkla fazladan girilmiş stoğu eksiltmek için bu formu kullanın (Sadece Depo stoğundan düşer).'}
          </p>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">{t('wastePage.productLabel')}</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="form-input" 
                type="text" 
                placeholder="Search product..." 
                value={correctionSearch}
                onChange={(e) => {
                  setCorrectionSearch(e.target.value);
                  setShowCorrectionDropdown(true);
                }}
                onFocus={() => {
                  setCorrectionSearch('');
                  setShowCorrectionDropdown(true);
                }}
                onBlur={() => setTimeout(() => setShowCorrectionDropdown(false), 200)}
              />
              {correctionData.productId && !showCorrectionDropdown && selectedCorrectionProduct && (
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', pointerEvents: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{selectedCorrectionProduct.quantity} {(selectedCorrectionProduct[`unit_${lang}`] || selectedCorrectionProduct.unit_en)}</span>
                  <span style={{ color: 'var(--color-success)' }}>✓</span>
                </div>
              )}
              {showCorrectionDropdown && (
                <ul className="dropdown-menu-list" style={{ 
                  position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-surface)', 
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', 
                  maxHeight: '200px', overflowY: 'auto', zIndex: 1000, margin: '4px 0 0 0', padding: 0,
                  boxShadow: 'var(--shadow-md)', listStyle: 'none'
                }}>
                  {filteredCorrectionProducts.length === 0 ? (
                    <li style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '14px' }}>Bulunamadı</li>
                  ) : (
                    filteredCorrectionProducts.map(p => (
                      <li 
                        key={p.id} 
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '14px', background: correctionData.productId === p.id ? 'var(--bg-surface-hover)' : 'transparent', display: 'flex', justifyContent: 'space-between' }}
                        onMouseDown={() => {
                          setCorrectionData({ ...correctionData, productId: p.id });
                          setCorrectionSearch(p.name);
                          setShowCorrectionDropdown(false);
                        }}
                      >
                        <span>{p.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{p.quantity} {(p[`unit_${lang}`] || p.unit_en)}</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{lang === 'ar' ? 'الكمية المراد خصمها' : 'Çıkarılacak Miktar'}</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type="number" required min="0.001" step={selectedCorrectionProduct && ['kg', 'liters'].includes(selectedCorrectionProduct.unit_en) ? "0.001" : "0.1"} value={correctionData.quantity} onChange={(e) => setCorrectionData({ ...correctionData, quantity: e.target.value })} style={{ paddingRight: '56px' }} />
              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', pointerEvents: 'none' }}>
                {selectedCorrectionProduct ? (selectedCorrectionProduct[`unit_${lang}`] || selectedCorrectionProduct.unit_en) : ''}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowCorrectionModal(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-danger">{lang === 'ar' ? 'تأكيد الخصم' : 'Stoktan Çıkar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

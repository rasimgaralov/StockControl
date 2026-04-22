'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDateTime } from '@/data/mockData';
import Modal from '@/components/Modal';

export default function TransferlerPage() {
  const { products, departments, transfersList, addTransfer, getProductName, getDeptName, getDeptIcon, getUserName, loading, todayTransfers } = useApp();
  const { currentUser, hasPermission } = useAuth();
  const { t, lang } = useLanguage();

  const canAdd = hasPermission('add');

  const [showModal, setShowModal] = useState(false);
  const [filterDept, setFilterDept] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  
  const [formData, setFormData] = useState({
    productId: '', fromDeptId: '', toDeptId: '', quantity: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredModalProducts = useMemo(() => {
    let result = products;
    if (formData.fromDeptId) {
      result = result.filter(p => p.deptId === formData.fromDeptId);
    }
    
    // If there is a search term, search across ALL warehouse products
    if (productSearch && showDropdown) {
      const q = productSearch.toLowerCase();
      return result.filter(p => p.name.toLowerCase().includes(q));
    }
    
    // If there is no search term, but a target department is selected, filter by category
    if (formData.toDeptId) {
      const targetDept = departments.find(d => d.id === formData.toDeptId);
      if (targetDept) {
        result = result.filter(p => p.category === targetDept.name_en);
      }
    }
    
    return result;
  }, [products, productSearch, showDropdown, formData.fromDeptId, formData.toDeptId, departments]);

  const filtered = useMemo(() => {
    let result = transfersList;
    if (filterDept !== 'all') {
      result = result.filter(t => t.fromDeptId === filterDept || t.toDeptId === filterDept);
    }
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0,0,0,0);
      result = result.filter(t => new Date(t.transferredAt) >= sDate);
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23,59,59,999);
      result = result.filter(t => new Date(t.transferredAt) <= eDate);
    }
    
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(a.transferredAt) - new Date(b.transferredAt);
      } else if (sortBy === 'name') {
        const nameA = getProductName(a.productId) || '';
        const nameB = getProductName(b.productId) || '';
        cmp = nameA.localeCompare(nameB, 'tr');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transfersList, filterDept, startDate, endDate, sortBy, sortDir, getProductName]);

  const openModal = () => {
    const warehouseDept = departments.find(d => d.name_en === 'Warehouse' || d.name_en === 'Depo') || departments.find(d => d.id === 'd5') || departments[0];

    setFormData({
      productId: '',
      fromDeptId: warehouseDept?.id || '',
      toDeptId: '',
      quantity: ''
    });
    setProductSearch('');
    setShowDropdown(false);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.toDeptId || !formData.productId) {
      setErrorMsg(t('common.fillRequired') || 'Lütfen departman ve ürün seçin.');
      return;
    }
    if (formData.fromDeptId === formData.toDeptId) {
      setErrorMsg(t('transfersPage.errSameDept'));
      return;
    }

    const selectedProduct = products.find(p => p.id === formData.productId);
    const transferQty = Number(String(formData.quantity).replace(',', '.'));

    if (selectedProduct && transferQty > selectedProduct.quantity) {
      setErrorMsg(`${t('transfersPage.errInsufficient')} ${selectedProduct.quantity}`);
      return;
    }

    setErrorMsg('');
    addTransfer({
      productId: formData.productId,
      fromDeptId: formData.fromDeptId,
      toDeptId: formData.toDeptId,
      quantity: transferQty,
    });
    setShowModal(false);
  };

  // Stats
  const totalTransfers = transfersList.length;
  const totalQtyTransferred = transfersList.reduce((sum, t) => sum + t.quantity, 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('transfersPage.loading')}</p>
      </div>
    );
  }

  const warehouseDept = departments.find(d => d.name_en === 'Warehouse' || d.name_en === 'Depo') || departments[0];
  const selectedProduct = products.find(p => p.id === formData.productId);
  const isKiloOrLiters = selectedProduct && (selectedProduct.unit_en === 'kg' || selectedProduct.unit_en === 'liters');
  const stepVal = isKiloOrLiters ? "0.001" : "0.1";
  const minVal = isKiloOrLiters ? "0.001" : "0.1";

  return (
    <div className="slide-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>{t('transfersPage.title')}</h2>
            <p>{t('transfersPage.subtitle')}</p>
          </div>
          {canAdd && (
            <button className="btn btn-primary" onClick={openModal}>
              🔄 {t('transfersPage.newTransfer')}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon blue">🔄</div>
          </div>
          <div className="stat-card-value">{totalTransfers}</div>
          <div className="stat-card-label">{t('transfersPage.totalTransfers')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon green">📦</div>
          </div>
          <div className="stat-card-value">{totalQtyTransferred}</div>
          <div className="stat-card-label">{t('transfersPage.qtyTransferred')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon purple">🏢</div>
          </div>
          <div className="stat-card-value">{departments.length}</div>
          <div className="stat-card-label">{t('transfersPage.activeDepts')}</div>
        </div>
      </div>

      {/* Today's Filters / Today's History */}
      <div className="content-card" style={{ border: '1px solid var(--accent-primary)', boxShadow: 'var(--shadow-glow)' }}>
        <div className="content-card-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>⭐</span> {t('transfersPage.todaysTransfers')}
          </h3>
          <span className="badge badge-success">{todayTransfers?.length || 0} {t('transfersPage.transfersRenewed')}</span>
        </div>
        <div className="activity-list" style={{ marginTop: '10px' }}>
          {(!todayTransfers || todayTransfers.length === 0) ? (
            <div className="empty-state" style={{ padding: '20px' }}>
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-text">{t('transfersPage.noTransfersToday')}</div>
            </div>
          ) : (
            todayTransfers.slice(0, 10).map((tItem) => (
              <div key={tItem.id} className="activity-item" style={{ background: 'var(--bg-primary)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
                <div className="activity-icon" style={{ background: 'var(--color-info-bg)' }}>🔄</div>
                <div className="activity-content">
                  <div className="activity-text">
                    <strong style={{ color: 'var(--text-primary)' }}>{getProductName(tItem.productId)}</strong>
                    {' '} — {tItem.quantity} {t('common.unknown').replace('Unknown', 'units').replace('غير معروف', 'وحدة')}: {' '}
                    <span style={{ color: 'var(--text-muted)' }}>{getDeptName(tItem.fromDeptId, lang)}</span>
                    <span style={{ color: 'var(--accent-secondary)', margin: '0 4px' }}>→</span>
                    <span style={{ color: 'var(--text-muted)' }}>{getDeptName(tItem.toDeptId, lang)}</span>
                  </div>
                  <div className="activity-time">{getUserName(tItem.transferredBy)} • {formatDateTime(tItem.transferredAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', width: '100%', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <select className="filter-select" style={{ width: '100%', border: '1px solid var(--border-color)', padding: '12px', borderRadius: 'var(--radius-sm)' }} value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
              <option value="all">{t('productsPage.allDepartments')}</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.icon} {(d[`name_${lang}`] || d.name_en)}</option>
              ))}
            </select>
          </div>
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
          <button 
            className="btn btn-secondary mobile-only" 
            onClick={() => setShowMobileDatePicker(!showMobileDatePicker)}
            style={{ padding: '0 14px', height: '45px', display: 'flex', alignItems: 'center' }}
            title="Toggle Date Filter"
          >
            📅
          </button>
        </div>
        
        <div className={showMobileDatePicker ? '' : 'mobile-hidden'} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('transfersPage.dateRange')}</span>
          <input 
            className="form-input" 
            style={{ width: '140px', background: 'var(--bg-surface)' }} 
            type="date"
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input 
            className="form-input" 
            style={{ width: '140px', background: 'var(--bg-surface)' }} 
            type="date"
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
      </div>

      {/* Table */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>{t('transfersPage.historyTitle')}</h3>
          <span className="badge badge-info">{filtered.length} {t('transfersPage.historyCount')}</span>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('transfersPage.table.date')}</th>
                <th>{t('transfersPage.table.product')}</th>
                <th>{t('transfersPage.table.source')}</th>
                <th></th>
                <th>{t('transfersPage.table.target')}</th>
                <th>{t('transfersPage.table.qty')}</th>
                <th>{t('transfersPage.table.user')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <div className="empty-state-text">{t('transfersPage.emptyState')}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(tItem => (
                  <tr key={tItem.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(tItem.transferredAt)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getProductName(tItem.productId)}</td>
                    <td>
                      <span className="badge badge-purple">
                        {getDeptIcon(tItem.fromDeptId)} {getDeptName(tItem.fromDeptId, lang)}
                      </span>
                    </td>
                    <td style={{ fontSize: '18px', color: 'var(--accent-secondary)', textAlign: 'center' }}>→</td>
                    <td>
                      <span className="badge badge-info">
                        {getDeptIcon(tItem.toDeptId)} {getDeptName(tItem.toDeptId, lang)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tItem.quantity}</td>
                    <td>{getUserName(tItem.transferredBy)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('transfersPage.modalTitle')}>

        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="alert-item critical" style={{ marginBottom: '16px', background: 'var(--color-danger-bg)' }}>
              <div className="alert-item-icon" style={{ color: 'var(--color-danger)' }}>⚠️</div>
              <div className="alert-item-content">
                <div className="alert-item-title" style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{errorMsg}</div>
              </div>
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('transfersPage.sourceLabel')}</label>
              <div className="form-input" style={{ backgroundColor: 'var(--bg-surface-hover)', cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {warehouseDept?.icon} {warehouseDept ? (warehouseDept[`name_${lang}`] || warehouseDept.name_en) : 'Warehouse'}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{t('transfersPage.targetLabel')}</label>
              <select className="form-select" required value={formData.toDeptId} onChange={(e) => {
                setFormData({ ...formData, toDeptId: e.target.value });
              }}>
                <option value="" disabled>{lang === 'ar' ? 'حدد القسم' : 'Select Department'}</option>
                {departments.filter(d => d.id !== formData.fromDeptId).map(d => (
                  <option key={d.id} value={d.id}>{d.icon} {(d[`name_${lang}`] || d.name_en)}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">{t('transfersPage.productLabel')}</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="form-input" 
                type="text" 
                placeholder="Search..." 
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
                  {filteredModalProducts.length === 0 ? (
                    <li style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '14px' }}>Bulunamadı</li>
                  ) : (
                    filteredModalProducts.map(p => (
                      <li 
                        key={p.id} 
                        style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '14px', background: formData.productId === p.id ? 'var(--bg-surface-hover)' : 'transparent' }}
                        onMouseDown={() => {
                          let newToDeptId = formData.toDeptId;
                          if (p.category) {
                            const matchingDept = departments.find(d => d.name_en === p.category);
                            if (matchingDept) {
                              newToDeptId = matchingDept.id;
                            }
                          }
                          setFormData({ ...formData, productId: p.id, toDeptId: newToDeptId });
                          setProductSearch(p.name);
                          setShowDropdown(false);
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = formData.productId === p.id ? 'var(--bg-surface-hover)' : 'transparent'}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span> <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>({p.quantity} {(p[`unit_${lang}`] || p.unit_en)})</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('transfersPage.qtyLabel')}</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type="number" required min={minVal} step={stepVal} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder={t('transfersPage.qtyPlaceholder')} style={{ paddingRight: '56px' }} />
              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', pointerEvents: 'none' }}>
                {selectedProduct ? (selectedProduct[`unit_${lang}`] || selectedProduct.unit_en) : ''}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary">{t('transfersPage.transferBtn')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

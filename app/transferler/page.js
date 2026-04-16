'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDateTime } from '@/data/mockData';
import Modal from '@/components/Modal';

export default function TransferlerPage() {
  const { products, departments, transfersList, addTransfer, getProductName, getDeptName, getDeptIcon, getUserName, loading, todayTransfers } = useApp();
  const { t, tData } = useLanguage();

  const [showModal, setShowModal] = useState(false);
  const [filterDept, setFilterDept] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [formData, setFormData] = useState({
    productId: '', fromDeptId: '', toDeptId: '', quantity: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredModalProducts = useMemo(() => {
    if (!productSearch || !showDropdown) return products;
    const q = productSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, productSearch, showDropdown]);

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
    return result;
  }, [transfersList, filterDept, startDate, endDate]);

  const openModal = () => {
    const defaultProduct = products[0];
    setFormData({
      productId: defaultProduct?.id || '',
      fromDeptId: departments.find(d => d.name === 'Depo')?.id || departments[0]?.id || '',
      toDeptId: departments[0]?.id || '',
      quantity: ''
    });
    setProductSearch(defaultProduct?.name || '');
    setShowDropdown(false);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.fromDeptId === formData.toDeptId) {
      setErrorMsg(t('transfersPage.errSameDept'));
      return;
    }

    const selectedProduct = products.find(p => p.id === formData.productId);
    const transferQty = Number(formData.quantity);

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

  return (
    <div className="slide-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>{t('transfersPage.title')}</h2>
            <p>{t('transfersPage.subtitle')}</p>
          </div>
          <button className="btn btn-primary" onClick={openModal}>
            🔄 {t('transfersPage.newTransfer')}
          </button>
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

      {/* Filter */}
      <div className="toolbar" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <select className="filter-select" style={{ width: '100%', border: '1px solid var(--border-color)', padding: '12px', borderRadius: 'var(--radius-sm)' }} value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            <option value="all">{t('productsPage.allDepartments')}</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.icon} {tData(d.name, 'departments')}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('transfersPage.dateRange')}</span>
          <input className="form-input" style={{ width: '140px', background: 'var(--bg-surface)' }} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input className="form-input" style={{ width: '140px', background: 'var(--bg-surface)' }} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
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
                    <span style={{ color: 'var(--text-muted)' }}>{tData(getDeptName(tItem.fromDeptId), 'departments')}</span>
                    <span style={{ color: 'var(--accent-secondary)', margin: '0 4px' }}>→</span>
                    <span style={{ color: 'var(--text-muted)' }}>{tData(getDeptName(tItem.toDeptId), 'departments')}</span>
                  </div>
                  <div className="activity-time">{getUserName(tItem.transferredBy)} • {formatDateTime(tItem.transferredAt)}</div>
                </div>
              </div>
            ))
          )}
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
                        {getDeptIcon(tItem.fromDeptId)} {tData(getDeptName(tItem.fromDeptId), 'departments')}
                      </span>
                    </td>
                    <td style={{ fontSize: '18px', color: 'var(--accent-secondary)', textAlign: 'center' }}>→</td>
                    <td>
                      <span className="badge badge-info">
                        {getDeptIcon(tItem.toDeptId)} {tData(getDeptName(tItem.toDeptId), 'departments')}
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
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">{t('transfersPage.productLabel')}</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="form-input" 
                type="text" 
                placeholder="Ürün adı yazın..." 
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
              {formData.productId && !showDropdown && productSearch && (
                <div style={{ position: 'absolute', right: '14px', top: '10px', color: 'var(--color-success)', fontSize: '14px', pointerEvents: 'none' }}>
                  ✓
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
                          setFormData({ ...formData, productId: p.id });
                          setProductSearch(p.name);
                          setShowDropdown(false);
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-surface-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = formData.productId === p.id ? 'var(--bg-surface-hover)' : 'transparent'}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span> <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>({p.quantity} {tData(p.unit, 'units')})</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('transfersPage.sourceLabel')}</label>
              <select className="form-select" value={formData.fromDeptId} onChange={(e) => setFormData({ ...formData, fromDeptId: e.target.value })}>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.icon} {tData(d.name, 'departments')}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('transfersPage.targetLabel')}</label>
              <select className="form-select" value={formData.toDeptId} onChange={(e) => setFormData({ ...formData, toDeptId: e.target.value })}>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.icon} {tData(d.name, 'departments')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{t('transfersPage.qtyLabel')}</label>
            <input className="form-input" type="number" required min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder={t('transfersPage.qtyPlaceholder')} />
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

'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDateTime } from '@/data/mockData';
import Modal from '@/components/Modal';

export default function GelenStoklarPage() {
  const { products, inboundsList, addInbound, getProductName, getUserName, loading } = useApp();
  const { hasPermission } = useAuth();
  const { t, lang } = useLanguage();

  const canAdd = hasPermission('add');

  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: '', quantity: '', supplier: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const [productSearch, setProductSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Inbounds list safely assigned
  const inbounds = inboundsList || [];

  const filteredModalProducts = useMemo(() => {
    if (!productSearch || !showDropdown) return products;
    const q = productSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q));
  }, [products, productSearch, showDropdown]);

  const filtered = useMemo(() => {
    let result = inbounds;
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0,0,0,0);
      result = result.filter(i => new Date(i.receivedAt) >= sDate);
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23,59,59,999);
      result = result.filter(i => new Date(i.receivedAt) <= eDate);
    }
    return result;
  }, [inbounds, startDate, endDate]);

  const openModal = () => {
    const defaultProduct = products[0];
    setFormData({
      productId: defaultProduct?.id || '',
      quantity: '',
      supplier: ''
    });
    setProductSearch(defaultProduct?.name || '');
    setShowDropdown(false);
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const inboundQty = Number(formData.quantity);

    if (inboundQty <= 0) {
      setErrorMsg('Quantity must be greater than zero.');
      return;
    }

    setErrorMsg('');
    addInbound({
      productId: formData.productId,
      quantity: inboundQty,
      supplier: formData.supplier
    });
    setShowModal(false);
  };

  // Stats
  const totalInbounds = inbounds.length;
  const totalQtyInbound = inbounds.reduce((sum, i) => sum + i.quantity, 0);
  const uniqueSuppliers = new Set(inbounds.map(i => i.supplier).filter(Boolean)).size;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('inboundsPage.loading') || "Loading..."}</p>
      </div>
    );
  }

  const selectedProduct = products.find(p => p.id === formData.productId);
  const isKiloOrLiters = selectedProduct && (selectedProduct.unit_en === 'kg' || selectedProduct.unit_en === 'liters');
  const stepVal = isKiloOrLiters ? "0.001" : "0.1";
  const minVal = isKiloOrLiters ? "0.001" : "0.1";

  return (
    <div className="slide-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>{t('inboundsPage.title') || "Incoming Stocks"}</h2>
            <p>{t('inboundsPage.subtitle') || "Track new stock from suppliers"}</p>
          </div>
          {canAdd && (
            <button className="btn btn-primary" onClick={openModal}>
              📥 {t('inboundsPage.newInbound') || "New Stock Entry"}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon blue">📥</div>
          </div>
          <div className="stat-card-value">{totalInbounds}</div>
          <div className="stat-card-label">{t('inboundsPage.totalInbounds') || "Total Incoming"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon green">📦</div>
          </div>
          <div className="stat-card-value">{totalQtyInbound}</div>
          <div className="stat-card-label">{t('inboundsPage.qtyInbound') || "Total Quantity"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon purple">🚚</div>
          </div>
          <div className="stat-card-value">{uniqueSuppliers}</div>
          <div className="stat-card-label">{t('inboundsPage.activeSuppliers') || "Active Suppliers"}</div>
        </div>
      </div>

      {/* Filter */}
      <div className="toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', width: '100%', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            className="btn btn-secondary mobile-only" 
            onClick={() => setShowMobileDatePicker(!showMobileDatePicker)}
            style={{ padding: '0 14px', height: '45px', display: 'flex', alignItems: 'center' }}
            title="Toggle Date Filter"
          >
            📅
          </button>
        </div>
        
        <div className={showMobileDatePicker ? '' : 'mobile-hidden'} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('transfersPage.dateRange')}</span>
          <input 
            className="form-input" 
            style={{ width: '140px', background: 'var(--bg-surface)' }} 
            type={startDate ? "date" : "text"} 
            placeholder="Select Date"
            onFocus={(e) => e.target.type = 'date'}
            onBlur={(e) => { if (!startDate) e.target.type = 'text'; }}
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input 
            className="form-input" 
            style={{ width: '140px', background: 'var(--bg-surface)' }} 
            type={endDate ? "date" : "text"} 
            placeholder="Select Date"
            onFocus={(e) => e.target.type = 'date'}
            onBlur={(e) => { if (!endDate) e.target.type = 'text'; }}
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
      </div>

      {/* Table */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>{t('inboundsPage.historyTitle') || "Inbound History"}</h3>
          <span className="badge badge-info">{filtered.length} {t('inboundsPage.historyCount') || "records"}</span>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('inboundsPage.table.date') || "Date"}</th>
                <th>{t('inboundsPage.table.product') || "Product"}</th>
                <th>{t('inboundsPage.table.supplier') || "Supplier"}</th>
                <th>{t('inboundsPage.table.qty') || "Quantity"}</th>
                <th>{t('inboundsPage.table.user') || "Received By"}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <div className="empty-state-text">{t('inboundsPage.emptyState') || "No records."}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(iItem => (
                  <tr key={iItem.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(iItem.receivedAt)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getProductName(iItem.productId)}</td>
                    <td>
                      <span className="badge badge-purple">
                        {iItem.supplier || '-'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>+{iItem.quantity}</td>
                    <td>{getUserName(iItem.receivedBy)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={t('inboundsPage.modalTitle') || "New Stock Entry"}>

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
            <label className="form-label">{t('inboundsPage.productLabel') || "Product"}</label>
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
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</span> <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>({p.quantity} {(p[`unit_${lang}`] || p.unit_en)})</span>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">{t('inboundsPage.supplierLabel') || "Supplier"}</label>
            <input className="form-input" type="text" required value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} placeholder={t('inboundsPage.supplierPlaceholder') || "Supplier name"} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('inboundsPage.qtyLabel') || "Quantity"}</label>
            <input className="form-input" type="number" required min={minVal} step={stepVal} value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="0" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary">{t('inboundsPage.saveBtn') || "Add Stock"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

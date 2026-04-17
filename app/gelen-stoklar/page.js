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

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showMobileDatePicker, setShowMobileDatePicker] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  // Inbounds list safely assigned
  const inbounds = inboundsList || [];



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
    
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(a.receivedAt) - new Date(b.receivedAt);
      } else if (sortBy === 'name') {
        const nameA = getProductName(a.productId) || '';
        const nameB = getProductName(b.productId) || '';
        cmp = nameA.localeCompare(nameB, 'tr');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [inbounds, startDate, endDate, sortBy, sortDir, getProductName]);



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



  return (
    <div className="slide-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>{t('inboundsPage.title') || "Incoming Stocks"}</h2>
            <p>{t('inboundsPage.subtitle') || "Track new stock from suppliers"}</p>
          </div>

        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon blue">📥</div>
          </div>
          <div className="stat-card-value">{totalInbounds}</div>
          <div className="stat-card-label">{t('inboundsPage.totalInbounds') || "Total Incoming"}</div>
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
        <div style={{ display: 'flex', width: '100%', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
        
        <div className={showMobileDatePicker ? '' : 'mobile-hidden'} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
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
                filtered.map(iItem => {
                  const p = products.find(prod => prod.id === iItem.productId);
                  const unit = p ? (p[`unit_${lang}`] || p.unit_en) : '';
                  return (
                    <tr key={iItem.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(iItem.receivedAt)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getProductName(iItem.productId)}</td>
                      <td>
                        <span className="badge badge-purple">
                          {iItem.supplier || '-'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--color-success)' }}>
                        +{iItem.quantity} <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', marginLeft: '4px' }}>{unit}</span>
                      </td>
                      <td>{getUserName(iItem.receivedBy)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

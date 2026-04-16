'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDateTime } from '@/data/mockData';
import Modal from '@/components/Modal';

function AlarmlarContent() {
  const { activeAlerts, products, getProductById, loading, updateProduct } = useApp();
  const { t, lang } = useLanguage();
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'all';
  
  const [filter, setFilter] = useState(initialFilter);
  const [search, setSearch] = useState('');
  
  // Stock Editing Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');

  const handleEditStock = (productId) => {
    const p = getProductById(productId);
    if (!p) return;
    setEditingProduct(p);
    setNewQuantity(p.quantity);
    setShowEditModal(true);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const saveStock = async (e) => {
    e.preventDefault();
    if (editingProduct) {
      await updateProduct(editingProduct.id, { quantity: Number(newQuantity) });
      setShowEditModal(false);
    }
  };

  const criticalCount = activeAlerts.filter(a => a.alertType === 'critical_stock').length;
  const expiryCount = activeAlerts.filter(a => a.alertType === 'expiry_warning').length;

  const filteredAlerts = useMemo(() => {
    let result = activeAlerts;
    if (filter !== 'all') {
      result = result.filter(a => a.alertType === filter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(alert => {
        const p = getProductById(alert.productId);
        return p && p.name.toLowerCase().includes(q);
      });
    }
    return result;
  }, [activeAlerts, search, filter, getProductById]);

  // Hacky effect hook alternative from useMemo.
  useMemo(() => {
    setCurrentPage(1);
  }, [search, filter]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('alarmsPage.loading')}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const displayedAlerts = filteredAlerts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="slide-up">
      <div className="page-header">
        <h2>{t('alarmsPage.title')}</h2>
        <p>{t('alarmsPage.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-danger)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon red">🚨</div>
          </div>
          <div className="stat-card-value">{criticalCount}</div>
          <div className="stat-card-label">{t('alarmsPage.criticalAlarms')}</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-warning)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon yellow">⏰</div>
          </div>
          <div className="stat-card-value">{expiryCount}</div>
          <div className="stat-card-label">{t('alarmsPage.expiryAlarms')}</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-info)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon blue">📦</div>
          </div>
          <div className="stat-card-value">{activeAlerts.length}</div>
          <div className="stat-card-label">{t('alarmsPage.totalAlarms')}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t('alarmsPage.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <select 
            className="filter-select"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">{t('alarmsPage.filterAll')}</option>
            <option value="critical_stock">{t('alarmsPage.filterCritical')}</option>
            <option value="low_stock">{t('alarmsPage.filterLow')}</option>
            <option value="expiry_warning">{t('alarmsPage.filterExpiry')}</option>
          </select>
        </div>
      </div>

      {/* Active Alerts */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>🔔 {t('alarmsPage.activeAlarms')}</h3>
          {filteredAlerts.length > 0 && (
            <span className="badge badge-danger">{filteredAlerts.length} {t('alarmsPage.alarmsCount')}</span>
          )}
        </div>
        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎉</div>
            <div className="empty-state-text">
              {search ? t('alarmsPage.emptyStateSearch') : t('alarmsPage.emptyStateAll')}
            </div>
          </div>
        ) : (
          <div className="alert-list">
            {displayedAlerts.map(alert => {
              const product = getProductById(alert.productId);
              const isCritical = alert.alertType === 'critical_stock';
              const isLow = alert.alertType === 'low_stock';
              const isExpiry = alert.alertType === 'expiry_warning';
              
              let icon = '⏰'; let cls = 'warning'; let desc = '';
              if (isCritical) {
                icon = '🚨'; cls = 'critical';
                desc = `${t('alarmsPage.descCritical')}: ${product?.quantity} ${(product?.[`unit_${lang}`] || product?.unit_en)} (${t('alarmsPage.threshold')}: ${product?.criticalThreshold})`;
              } else if (isLow) {
                icon = '⚠️'; cls = 'warning';
                desc = `${t('alarmsPage.descLow')}: ${product?.quantity} ${(product?.[`unit_${lang}`] || product?.unit_en)} (${t('alarmsPage.thresholdApproaching')}: ${product?.criticalThreshold})`;
              } else if (isExpiry) {
                icon = '⏰'; cls = 'warning';
                desc = `${t('alarmsPage.descExpiry')}: ${product?.expiryDate}`;
              }

              return (
                <div key={alert.id} className={`alert-item ${cls}`}>
                  <div className="alert-item-icon">{icon}</div>
                  <div className="alert-item-content">
                    <div className="alert-item-title">{product?.name || t('alarmsPage.unknownProduct')}</div>
                    <div className="alert-item-desc">{desc}</div>
                  </div>
                  <div className="alert-action-group" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="alert-item-time">{formatDateTime(alert.triggeredAt)}</div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleEditStock(alert.productId)}
                    >
                      ✏️ {t('alarmsPage.editBtn')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn" 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              {t('productsPage.pagePrevious')}
            </button>
            <span className="page-info">{t('productsPage.pageNumber')} {currentPage} / {totalPages}</span>
            <button 
              className="page-btn" 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              {t('productsPage.pageNext')}
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title={t('alarmsPage.editModalTitle')}>
        {editingProduct && (
          <form onSubmit={saveStock}>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)', fontSize: '14px' }}>
              {t('alarmsPage.editModalDesc1')} <strong>{editingProduct.name}</strong>.
              {t('alarmsPage.editModalDesc2')} <strong>{editingProduct.criticalThreshold} {(editingProduct[`unit_${lang}`] || editingProduct.unit_en)}</strong>
            </p>
            <div className="form-group">
              <label className="form-label">{t('alarmsPage.newQuantity')} ({(editingProduct[`unit_${lang}`] || editingProduct.unit_en)})</label>
              <input
                className="form-input"
                type="number"
                required
                min="0"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>{t('common.cancel')}</button>
              <button type="submit" className="btn btn-primary">{t('alarmsPage.saveBtn')}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default function AlarmlarPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('alarmsPage.loading')}</p>
      </div>
    }>
      <AlarmlarContent />
    </Suspense>
  );
}

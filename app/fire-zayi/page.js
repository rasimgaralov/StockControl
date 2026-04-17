'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { formatDateTime } from '@/data/mockData';
import Modal from '@/components/Modal';

export default function FireZayiPage() {
  const { products, departments, wasteLogsList, addWasteLog, getProductName, getDeptName, getDeptIcon, getUserName, loading } = useApp();
  const { hasPermission } = useAuth();
  const { t, lang } = useLanguage();

  const canAdd = hasPermission('add');

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: '', deptId: '', quantity: '', reason_en: '', reason_ar: ''
  });

  const totalWaste = wasteLogsList.reduce((sum, w) => sum + w.quantity, 0);
  const wasteByDept = useMemo(() => {
    const map = {};
    wasteLogsList.forEach(w => {
      map[w.deptId] = (map[w.deptId] || 0) + w.quantity;
    });
    return map;
  }, [wasteLogsList]);

  const openModal = () => {
    setFormData({
      productId: products[0]?.id || '',
      deptId: departments[0]?.id || '',
      quantity: '',
      reason_en: '',
      reason_ar: ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addWasteLog({
      productId: formData.productId,
      deptId: formData.deptId,
      quantity: Number(formData.quantity),
      reason_en: formData.reason_en,
      reason_ar: formData.reason_ar,
    });
    setShowModal(false);
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

  return (
    <div className="slide-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>{t('wastePage.title')}</h2>
            <p>{t('wastePage.subtitle')}</p>
          </div>
          {canAdd && (
            <button className="btn btn-primary" onClick={openModal}>
              ➕ {t('wastePage.newRecord')}
            </button>
          )}
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
                wasteLogsList.map(w => (
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
          <div className="form-group">
            <label className="form-label">{t('wastePage.productLabel')}</label>
            <select className="form-select" value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })}>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.quantity} {(p[`unit_${lang}`] || p.unit_en)})</option>
              ))}
            </select>
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
    </div>
  );
}

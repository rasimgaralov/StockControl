'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getDeptName, getDeptIcon, getProductName, getUserName, formatDateTime } from '@/data/mockData';
import Modal from '@/components/Modal';

export default function FireZayiPage() {
  const { products, departments, wasteLogsList, addWasteLog } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    productId: '', deptId: '', quantity: '', reason: ''
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
      reason: ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addWasteLog({
      productId: formData.productId,
      deptId: formData.deptId,
      quantity: Number(formData.quantity),
      reason: formData.reason,
    });
    setShowModal(false);
  };

  return (
    <div className="slide-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>Fire / Zayi</h2>
            <p>Kayıp ve fire takibi</p>
          </div>
          <button className="btn btn-primary" onClick={openModal}>
            ➕ Yeni Fire Kaydı
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-danger)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon red">🗑️</div>
          </div>
          <div className="stat-card-value">{wasteLogsList.length}</div>
          <div className="stat-card-label">Toplam Fire Kaydı</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-warning)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon yellow">📊</div>
          </div>
          <div className="stat-card-value">{totalWaste}</div>
          <div className="stat-card-label">Toplam Fire Miktarı</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--accent-primary)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon purple">🏢</div>
          </div>
          <div className="stat-card-value">{Object.keys(wasteByDept).length}</div>
          <div className="stat-card-label">Etkilenen Departman</div>
        </div>
      </div>

      {/* Table */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>Fire Geçmişi</h3>
          <span className="badge badge-danger">{wasteLogsList.length} kayıt</span>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Ürün</th>
                <th>Departman</th>
                <th>Miktar</th>
                <th>Sebep</th>
                <th>Kaydeden</th>
              </tr>
            </thead>
            <tbody>
              {wasteLogsList.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <div className="empty-state-icon">✅</div>
                      <div className="empty-state-text">Fire kaydı bulunamadı</div>
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
                        {getDeptIcon(w.deptId)} {getDeptName(w.deptId)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-danger)' }}>-{w.quantity}</td>
                    <td style={{ maxWidth: '250px' }}>{w.reason}</td>
                    <td>{getUserName(w.loggedBy)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Yeni Fire Kaydı">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ürün</label>
            <select className="form-select" value={formData.productId} onChange={(e) => setFormData({ ...formData, productId: e.target.value })}>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.quantity} {p.unit})</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Departman</label>
              <select className="form-select" value={formData.deptId} onChange={(e) => setFormData({ ...formData, deptId: e.target.value })}>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Miktar</label>
              <input className="form-input" type="number" required min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Sebep</label>
            <textarea className="form-textarea" required value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Fire sebebini açıklayın..." />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
            <button type="submit" className="btn btn-primary">Kaydet</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

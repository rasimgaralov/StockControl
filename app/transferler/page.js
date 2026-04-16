'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getDeptName, getDeptIcon, getProductName, getUserName, formatDateTime } from '@/data/mockData';
import Modal from '@/components/Modal';

export default function TransferlerPage() {
  const { products, departments, transfersList, addTransfer } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [filterDept, setFilterDept] = useState('all');
  const [formData, setFormData] = useState({
    productId: '', fromDeptId: '', toDeptId: '', quantity: ''
  });
  const [errorMsg, setErrorMsg] = useState('');

  const filtered = useMemo(() => {
    if (filterDept === 'all') return transfersList;
    return transfersList.filter(t => t.fromDeptId === filterDept || t.toDeptId === filterDept);
  }, [transfersList, filterDept]);

  const openModal = () => {
    setFormData({
      productId: products[0]?.id || '',
      fromDeptId: departments.find(d => d.name === 'Depo')?.id || departments[0]?.id || '',
      toDeptId: departments[0]?.id || '',
      quantity: ''
    });
    setErrorMsg('');
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.fromDeptId === formData.toDeptId) {
      setErrorMsg('Kaynak ve hedef departman aynı olamaz!');
      return;
    }

    const selectedProduct = products.find(p => p.id === formData.productId);
    const transferQty = Number(formData.quantity);

    if (selectedProduct && transferQty > selectedProduct.quantity) {
      setErrorMsg('Yeterli Stok mevcut değil! Stokta ' + selectedProduct.quantity + ' adet var.');
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

  return (
    <div className="slide-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>Transferler</h2>
            <p>Departmanlar arası stok transferi</p>
          </div>
          <button className="btn btn-primary" onClick={openModal}>
            🔄 Yeni Transfer
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
          <div className="stat-card-label">Toplam Transfer</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon green">📦</div>
          </div>
          <div className="stat-card-value">{totalQtyTransferred}</div>
          <div className="stat-card-label">Transfer Edilen Miktar</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-header">
            <div className="stat-card-icon purple">🏢</div>
          </div>
          <div className="stat-card-value">{departments.length}</div>
          <div className="stat-card-label">Aktif Departman</div>
        </div>
      </div>

      {/* Filter */}
      <div className="toolbar">
        <select className="filter-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="all">Tüm Departmanlar</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>Transfer Geçmişi</h3>
          <span className="badge badge-info">{filtered.length} kayıt</span>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Ürün</th>
                <th>Kaynak</th>
                <th></th>
                <th>Hedef</th>
                <th>Miktar</th>
                <th>İşlemi Yapan</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <div className="empty-state-text">Transfer kaydı bulunamadı</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(t.transferredAt)}</td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getProductName(t.productId)}</td>
                    <td>
                      <span className="badge badge-purple">
                        {getDeptIcon(t.fromDeptId)} {getDeptName(t.fromDeptId)}
                      </span>
                    </td>
                    <td style={{ fontSize: '18px', color: 'var(--accent-secondary)', textAlign: 'center' }}>→</td>
                    <td>
                      <span className="badge badge-info">
                        {getDeptIcon(t.toDeptId)} {getDeptName(t.toDeptId)}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.quantity}</td>
                    <td>{getUserName(t.transferredBy)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Yeni Transfer">
        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div className="alert-item critical" style={{ marginBottom: '16px', background: 'var(--color-danger-bg)' }}>
              <div className="alert-item-icon" style={{ color: 'var(--color-danger)' }}>⚠️</div>
              <div className="alert-item-content">
                <div className="alert-item-title" style={{ color: 'var(--color-danger)', fontSize: '13px' }}>{errorMsg}</div>
              </div>
            </div>
          )}
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
              <label className="form-label">Kaynak Departman</label>
              <select className="form-select" value={formData.fromDeptId} onChange={(e) => setFormData({ ...formData, fromDeptId: e.target.value })}>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Hedef Departman</label>
              <select className="form-select" value={formData.toDeptId} onChange={(e) => setFormData({ ...formData, toDeptId: e.target.value })}>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Miktar</label>
            <input className="form-input" type="number" required min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} placeholder="Transfer miktarı" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>İptal</button>
            <button type="submit" className="btn btn-primary">Transfer Et</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

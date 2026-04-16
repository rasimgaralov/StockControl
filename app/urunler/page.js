'use client';

import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { getDeptName, getStockStatus, formatDate } from '@/data/mockData';
import Modal from '@/components/Modal';

export default function UrunlerPage() {
  const { products, departments, addProduct, updateProduct, deleteProduct } = useApp();

  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '', quantity: '', unit: 'kg', supplier: '', expiryDate: '', criticalThreshold: '', deptId: ''
  });

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || p.supplier.toLowerCase().includes(q)
      );
    }

    if (filterDept !== 'all') {
      result = result.filter(p => p.deptId === filterDept);
    }

    if (filterStatus === 'critical') {
      result = result.filter(p => p.quantity <= p.criticalThreshold);
    } else if (filterStatus === 'warning') {
      result = result.filter(p => p.quantity > p.criticalThreshold && p.quantity <= p.criticalThreshold * 2);
    } else if (filterStatus === 'normal') {
      result = result.filter(p => p.quantity > p.criticalThreshold * 2);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.name.localeCompare(b.name, 'tr');
      else if (sortBy === 'quantity') cmp = a.quantity - b.quantity;
      else if (sortBy === 'expiry') cmp = (a.expiryDate || 'z').localeCompare(b.expiryDate || 'z');
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [products, search, filterDept, filterStatus, sortBy, sortDir]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', quantity: '', unit: 'kg', supplier: '', expiryDate: '', criticalThreshold: '', deptId: departments[0]?.id || '' });
    setEditProduct(null);
    setShowAddModal(true);
  };

  const openEditModal = (product) => {
    setFormData({
      name: product.name,
      quantity: product.quantity,
      unit: product.unit,
      supplier: product.supplier,
      expiryDate: product.expiryDate || '',
      criticalThreshold: product.criticalThreshold,
      deptId: product.deptId,
    });
    setEditProduct(product);
    setShowAddModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      quantity: Number(formData.quantity),
      criticalThreshold: Number(formData.criticalThreshold),
      expiryDate: formData.expiryDate || null,
    };
    if (editProduct) {
      updateProduct(editProduct.id, data);
    } else {
      addProduct(data);
    }
    setShowAddModal(false);
  };

  const getStatusBadge = (product) => {
    const status = getStockStatus(product);
    if (status === 'critical') return <span className="badge badge-danger">Kritik</span>;
    if (status === 'warning') return <span className="badge badge-warning">Düşük</span>;
    return <span className="badge badge-success">Normal</span>;
  };

  return (
    <div className="slide-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>Ürünler</h2>
            <p>{products.length} ürün kayıtlı</p>
          </div>
          <button className="btn btn-primary" onClick={openAddModal}>
            ➕ Yeni Ürün
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Ürün veya tedarikçi ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="all">Tüm Departmanlar</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
          ))}
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">Tüm Durumlar</option>
          <option value="critical">Kritik</option>
          <option value="warning">Düşük</option>
          <option value="normal">Normal</option>
        </select>
      </div>

      {/* Table */}
      <div className="content-card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  Ürün Adı {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                  Miktar {sortBy === 'quantity' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th>Birim</th>
                <th>Tedarikçi</th>
                <th>Departman</th>
                <th onClick={() => handleSort('expiry')} style={{ cursor: 'pointer' }}>
                  SKT {sortBy === 'expiry' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <div className="empty-state-text">Sonuç bulunamadı</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                    <td style={{
                      fontWeight: 700,
                      color: getStockStatus(p) === 'critical' ? 'var(--color-danger)' : getStockStatus(p) === 'warning' ? 'var(--color-warning)' : 'var(--text-primary)'
                    }}>
                      {p.quantity}
                    </td>
                    <td>{p.unit}</td>
                    <td>{p.supplier}</td>
                    <td><span className="badge badge-purple">{getDeptName(p.deptId)}</span></td>
                    <td>{formatDate(p.expiryDate)}</td>
                    <td>{getStatusBadge(p)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(p)}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editProduct ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ürün Adı</label>
            <input className="form-input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ürün adını girin" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Miktar</label>
              <input className="form-input" type="number" required min="0" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Birim</label>
              <select className="form-select" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })}>
                <option value="kg">kg</option>
                <option value="litre">litre</option>
                <option value="adet">adet</option>
                <option value="paket">paket</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tedarikçi</label>
            <input className="form-input" required value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} placeholder="Tedarikçi firma adı" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Son Kullanma Tarihi</label>
              <input className="form-input" type="date" value={formData.expiryDate} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Kritik Eşik</label>
              <input className="form-input" type="number" required min="0" value={formData.criticalThreshold} onChange={(e) => setFormData({ ...formData, criticalThreshold: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Departman</label>
            <select className="form-select" value={formData.deptId} onChange={(e) => setFormData({ ...formData, deptId: e.target.value })}>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.icon} {d.name}</option>
              ))}
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
            <button type="submit" className="btn btn-primary">{editProduct ? 'Güncelle' : 'Ekle'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { getStockStatus, formatDate } from '@/data/mockData';
import Modal from '@/components/Modal';
import { useLanguage } from '@/context/LanguageContext';

export default function UrunlerPage() {
const { products, departments, addProduct, updateProduct, deleteProduct, getDeptName, loading, addBatch, deptStockList, getProductName, transfersList } = useApp();
  const { currentUser, hasPermission } = useAuth();
  const { t, lang } = useLanguage();

  const isEditor = currentUser?.role === 'editor';
  const warehouseDept = useMemo(() => departments.find(d => d.name_en === 'Warehouse' || d.name_en === 'Depo') || departments[0], [departments]);

  const canAdd = hasPermission('add');
  const canEdit = hasPermission('edit') || currentUser?.role === 'editor';
  const canDelete = hasPermission('delete');

  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [activeTab, setActiveTab] = useState('warehouse'); // 'warehouse' or 'departments'

  useEffect(() => {
    // Editors can view all warehouse products
    setFilterDept('all');
  }, []);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [quickAddProduct, setQuickAddProduct] = useState(null);
  const [quickAddQty, setQuickAddQty] = useState("");
  const [quickAddExpiry, setQuickAddExpiry] = useState("");
  const [formData, setFormData] = useState({
    name: '', quantity: '', unit_en: 'kg', unit_ar: 'كجم', supplier_en: '', supplier_ar: '', expiryDate: '', criticalThreshold: '', deptId: 'd5', category: ''
  });

  // Today's date for 'min' attribute in YYYY-MM-DD format based on local timezone
  const todayDateStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) || (p.supplier_en && p.supplier_en.toLowerCase().includes(q))
      );
    }

    if (filterDept !== 'all') {
      const deptNameEn = departments.find(d => d.id === filterDept)?.name_en;
      result = result.filter(p => p.category === deptNameEn);
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
      else if (sortBy === 'date') cmp = a.id.localeCompare(b.id, 'en');
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [products, search, filterDept, filterStatus, sortBy, sortDir, departments]);

  const filteredDeptStock = useMemo(() => {
    let result = [...deptStockList];
    if (filterDept !== 'all') {
      result = result.filter(ds => ds.deptId === filterDept);
    }
    
    result.sort((a, b) => {
      const latestA = transfersList.find(t => t.productId === a.productId && t.toDeptId === a.deptId)?.transferredAt || 0;
      const latestB = transfersList.find(t => t.productId === b.productId && t.toDeptId === b.deptId)?.transferredAt || 0;
      return new Date(latestB) - new Date(latestA);
    });

    return result;
  }, [deptStockList, filterDept, transfersList]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterDept, filterStatus, sortBy, sortDir]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const openAddModal = () => {
    setFormData({ name: '', quantity: '', unit_en: 'kg', unit_ar: 'كجم', supplier_en: '', supplier_ar: '', expiryDate: '', criticalThreshold: '', deptId: 'd5', category: departments[0]?.name_en || '' });
    setEditProduct(null);
    setShowAddModal(true);
  };

  const openEditModal = (product) => {
    setFormData({
      name: product.name || '',
      quantity: product.quantity || '',
      unit_en: product.unit_en || 'kg',
      unit_ar: product.unit_ar || 'كجم',
      supplier_en: product.supplier_en || '',
      supplier_ar: product.supplier_ar || '',
      expiryDate: product.expiryDate || '',
      criticalThreshold: product.criticalThreshold || '',
      deptId: 'd5',
      category: product.category || departments[0]?.name_en || '',
    });
    setEditProduct(product);
    setShowAddModal(true);
  };

  const openQuickAddModal = (product) => {
    setQuickAddProduct(product);
    setQuickAddQty("");
    setQuickAddExpiry("");
    setShowQuickAddModal(true);
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    if (quickAddQty === "" || quickAddQty === null) return;
    const qtyToAdd = Number(String(quickAddQty).replace(',', '.'));
    if (qtyToAdd < 0) return;

    await addBatch({
      productId: quickAddProduct.id,
      quantity: qtyToAdd,
      expiryDate: quickAddExpiry || null,
      supplier: quickAddProduct.supplier_en
    });

    setShowQuickAddModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.expiryDate && formData.expiryDate < todayDateStr) {
      alert(lang === 'ar' ? 'لا يمكن اختيار تاريخ في الماضي.' : 'Expiry date cannot be in the past.');
      return;
    }
    const data = {
      ...formData,
      quantity: Number(String(formData.quantity).replace(',', '.')),
      criticalThreshold: Number(String(formData.criticalThreshold).replace(',', '.')),
      expiryDate: formData.expiryDate || null,
    };
    const { ...primaryData } = data;
    if (editProduct) {
      updateProduct(editProduct.id, primaryData).catch(err => alert("DB Edit Error: " + err));
    } else {
      addProduct(primaryData).catch(err => alert("DB Add Error: " + err));
    }
    setShowAddModal(false);
  };

  const getStatusBadge = (product) => {
    const status = getStockStatus(product);
    if (status === 'critical') return <span className="badge badge-danger">{t('productsPage.status.critical')}</span>;
    if (status === 'warning') return <span className="badge badge-warning">{t('productsPage.status.warning')}</span>;
    return <span className="badge badge-success">{t('productsPage.status.normal')}</span>;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('dashboard.preparing')}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="slide-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>{t('productsPage.title')}</h2>
            <p>
              {filterDept === 'all'
                ? `${products.length} ${t('productsPage.productsRegistered')}`
                : `${t('productsPage.productsListedIn')} ${getDeptName(filterDept, lang)}: ${filteredProducts.length}`}
            </p>
          </div>
          {canAdd && activeTab === 'warehouse' && (
            <button className="btn btn-primary" onClick={openAddModal}>
              ➕ {t('productsPage.newProduct')}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button 
          className={`btn ${activeTab === 'warehouse' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => { setActiveTab('warehouse'); setCurrentPage(1); }}
        >
          {lang === 'ar' ? 'مخزون المستودع' : 'Warehouse Stock'}
        </button>
        <button 
          className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-secondary'}`} 
          onClick={() => { setActiveTab('departments'); setCurrentPage(1); }}
        >
          {lang === 'ar' ? 'مخزون الأقسام' : 'Department Stocks'}
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={t('productsPage.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="all">{t('productsPage.allDepartments')}</option>
          {departments.filter(d => d.id !== 'd5').map(d => (
            <option key={d.id} value={d.id}>{d.icon} {d[`name_${lang}`] || d.name_en}</option>
          ))}
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">{t('productsPage.allStatuses')}</option>
          <option value="critical">{t('productsPage.status.critical')}</option>
          <option value="warning">{t('productsPage.status.warning')}</option>
          <option value="normal">{t('productsPage.status.normal')}</option>
        </select>
        <select className="filter-select" value={`${sortBy}-${sortDir}`} onChange={(e) => {
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

      {/* Table */}
      <div className="content-card">
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  {t('productsPage.table.productName')} {sortBy === 'name' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                  {t('productsPage.table.quantity')} {sortBy === 'quantity' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th>{t('productsPage.table.unit')}</th>
                <th>{t('productsPage.table.supplier')}</th>
                <th>{t('productsPage.table.department')} (Category)</th>
                <th onClick={() => handleSort('expiry')} style={{ cursor: 'pointer' }}>
                  {t('productsPage.table.expiry')} {sortBy === 'expiry' && (sortDir === 'asc' ? '↑' : '↓')}
                </th>
                <th>{t('productsPage.table.status')}</th>
                {activeTab === 'warehouse' && <th>{t('productsPage.table.action')}</th>}
              </tr>
            </thead>
            <tbody>
              {activeTab === 'warehouse' ? (
                filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <div className="empty-state-text">{t('productsPage.noResults')}</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedProducts.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {canAdd && (
                            <button className="btn btn-primary btn-sm" style={{ padding: '2px 8px', fontSize: '16px', fontWeight: 'bold', color: '#ffffff', borderRadius: '4px', lineHeight: '1' }} onClick={() => openQuickAddModal(p)} title={lang === 'ar' ? 'إضافة' : 'Add'}>+</button>
                          )}
                          <span>{p.name}</span>
                        </div>
                      </td>
                      <td style={{
                        fontWeight: 700,
                        color: getStockStatus(p) === 'critical' ? 'var(--color-danger)' : getStockStatus(p) === 'warning' ? 'var(--color-warning)' : 'var(--text-primary)'
                      }}>
                        {p.quantity}
                      </td>
                      <td>{p[`unit_${lang}`] || p.unit_en}</td>
                      <td>{p[`supplier_${lang}`] || p.supplier_en}</td>
                      <td><span className="badge badge-purple">{p.category || 'N/A'}</span></td>
                      <td>{formatDate(p.expiryDate)}</td>
                      <td>{getStatusBadge(p)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {canEdit && (
                            <button className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }} onClick={() => openEditModal(p)}>✏️</button>
                          )}
                          {canDelete && (
                            <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} onClick={() => setProductToDelete(p)}>🗑️</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                filteredDeptStock.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <div className="empty-state-text">{t('productsPage.noResults')}</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDeptStock.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(ds => {
                    const prod = products.find(p => p.id === ds.productId);
                    return (
                      <tr key={`${ds.productId}-${ds.deptId}`}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {prod ? prod.name : 'Unknown Product'}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {ds.quantity}
                        </td>
                        <td>{prod ? (prod[`unit_${lang}`] || prod.unit_en) : ''}</td>
                        <td>{prod ? (prod[`supplier_${lang}`] || prod.supplier_en) : ''}</td>
                        <td><span className="badge badge-purple">{getDeptName(ds.deptId, lang)}</span></td>
                        <td>-</td>
                        <td><span className="badge badge-success">OK</span></td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>

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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editProduct ? t('productsPage.editTitle') : t('productsPage.addTitle')}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('productsPage.nameLabel')}</label>
            <input className="form-input" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t('productsPage.namePlaceholder')} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('productsPage.supplierLabel')}</label>
            <input className="form-input" required value={formData.supplier_en} onChange={(e) => setFormData({ ...formData, supplier_en: e.target.value, supplier_ar: e.target.value })} placeholder={t('productsPage.supplierPlaceholder')} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">{t('productsPage.unitLabel')}</label>
              <select className="form-select" value={formData.unit_en} onChange={(e) => {
                const opts = [
                  { en: 'kg', ar: 'كجم' },
                  { en: 'pcs', ar: 'قطع' },
                  { en: 'liters', ar: 'لتر' },
                  { en: 'pack', ar: 'عبوة' }
                ];
                const selected = opts.find(u => u.en === e.target.value) || opts[0];
                setFormData({ ...formData, unit_en: selected.en, unit_ar: selected.ar });
              }}>
                <option value="kg">{lang === 'ar' ? 'كجم' : 'kg'}</option>
                <option value="liters">{lang === 'ar' ? 'لتر' : 'liters'}</option>
                <option value="pcs">{lang === 'ar' ? 'قطع' : 'pcs'}</option>
                <option value="pack">{lang === 'ar' ? 'عبوة' : 'pack'}</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{t('productsPage.thresholdLabel')}</label>
              <input
                className="form-input"
                type="number"
                required
                min={['kg', 'liters'].includes(formData.unit_en) ? "0.001" : "0.1"}
                step={['kg', 'liters'].includes(formData.unit_en) ? "0.001" : "0.1"}
                value={formData.criticalThreshold}
                onChange={(e) => setFormData({ ...formData, criticalThreshold: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{lang === 'ar' ? 'فئة' : 'Category'}</label>
            <select className="form-select" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
              {departments.filter(d => d.id !== 'd5').map(d => (
                <option key={d.id} value={d.name_en}>{d.icon} {d[`name_${lang}`] || d.name_en}</option>
              ))}
            </select>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary">{editProduct ? t('productsPage.updateBtn') : t('common.add')}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setProductToDelete(null)}
          title={lang === 'ar' ? 'هل أنت متأكد؟' : 'Are you sure?'}
        >
          <div style={{ padding: '10px 0 20px 0', fontSize: '15px', color: 'var(--text-secondary)' }}>
            {lang === 'ar'
              ? `هل أنت متأكد أنك تريد حذف "${productToDelete.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
              : `Are you sure you want to delete "${productToDelete.name}"? This action cannot be undone.`}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setProductToDelete(null)}>{t('common.cancel')}</button>
            <button type="button" className="btn btn-danger" onClick={() => {
              deleteProduct(productToDelete.id);
              setProductToDelete(null);
            }}>{lang === 'ar' ? 'حذف' : 'Delete'}</button>
          </div>
        </Modal>
      )}

      {/* Quick Add Modal */}
      <Modal
        isOpen={showQuickAddModal}
        onClose={() => setShowQuickAddModal(false)}
        title={lang === 'ar' ? 'إضافة سريعة للمخزون' : 'Quick Add Stock'}
      >
        <form onSubmit={handleQuickAddSubmit}>
          <div style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '14px' }}>
              {lang === 'ar' ? 'الكمية المضافة لـ' : 'Add stock to'} <strong style={{ color: 'var(--text-primary)' }}>{quickAddProduct?.name}</strong>
            </span>
          </div>
          <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              className="form-input"
              type="number"
              required
              min="0"
              step={quickAddProduct?.unit_en === 'kg' || quickAddProduct?.unit_en === 'liters' ? "0.001" : "0.1"}
              value={quickAddQty}
              onChange={(e) => setQuickAddQty(e.target.value)}
              placeholder="0"
              style={{ flex: 1 }}
            />
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
              {quickAddProduct ? (quickAddProduct[`unit_${lang}`] || quickAddProduct.unit_en) : ''}
            </span>
          </div>
          <div className="form-group" style={{ marginTop: '15px' }}>
            <label className="form-label">{t('productsPage.expiryLabel') || "Expiry Date"}</label>
            <input
              className="form-input"
              type="date"
              min={todayDateStr}
              value={quickAddExpiry}
              onChange={(e) => setQuickAddExpiry(e.target.value)}
            />
          </div>
          <div className="modal-footer" style={{ marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowQuickAddModal(false)}>{t('common.cancel')}</button>
            <button type="submit" className="btn btn-primary">➕ {t('common.add')}</button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

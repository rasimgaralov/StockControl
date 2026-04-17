'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';

export default function FaturalarPage() {
  const { currentUser, hasPermission } = useAuth();
  const { t, lang } = useLanguage();
  const { invoicesList, addInvoice, deleteInvoice, logActivity } = useApp();

  // Role Based UI Flags
  const canAdd = hasPermission('add');
  const canDelete = hasPermission('delete'); 

  const [showAddModal, setShowAddModal] = useState(false);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [formData, setFormData] = useState({ supplier: '', description: '' });

  // Filtering Array
  const displayedInvoices = useMemo(() => {
    let result = [...invoicesList];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv => 
        (inv.supplier && inv.supplier.toLowerCase().includes(query)) ||
        (inv.description && inv.description.toLowerCase().includes(query))
      );
    }
    
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0,0,0,0);
      result = result.filter(inv => new Date(inv.uploaded_at) >= sDate);
    }
    
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23,59,59,999);
      result = result.filter(inv => new Date(inv.uploaded_at) <= eDate);
    }

    return result;
  }, [invoicesList, searchQuery, startDate, endDate]);

  // Unique Suppliers for Auto-complete
  const uniqueSuppliers = useMemo(() => [...new Set(invoicesList.map(inv => inv.supplier))].filter(Boolean), [invoicesList]);

  // Grouping by Date
  const groupedInvoices = useMemo(() => {
    const groups = {};
    displayedInvoices.forEach(inv => {
      const dateKey = new Date(inv.uploaded_at).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(inv);
    });
    return groups;
  }, [displayedInvoices, lang]);

  const handleFileCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const openEditModal = (inv) => {
    setInvoiceToEdit(inv);
    setFormData({ supplier: inv.supplier, description: inv.description || '' });
    setPreviewUrl(inv.image_url);
    setUploadFile(null);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setInvoiceToEdit(null);
    setUploadFile(null);
    setPreviewUrl(null);
    setFormData({ supplier: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.supplier.trim()) return;
    if (!invoiceToEdit && !uploadFile) return;

    setIsUploading(true);
    
    try {
      let finalImageUrl = invoiceToEdit ? invoiceToEdit.image_url : null;
      if (uploadFile) {
        const fileExt = uploadFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `receipts/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('invoices').upload(filePath, uploadFile);
        if (uploadError) throw uploadError;
        const { data: pUrl } = supabase.storage.from('invoices').getPublicUrl(filePath);
        finalImageUrl = pUrl.publicUrl;
      }

      const dbPayload = {
        image_url: finalImageUrl,
        supplier: formData.supplier,
        description: formData.description || ''
      };

      if (invoiceToEdit) {
        await updateInvoice(invoiceToEdit.id, dbPayload);
        logActivity('edit', 'invoice', invoiceToEdit.id, `Updated invoice for supplier ${formData.supplier}`);
        alert(t('invoicesPage.updateSuccess'));
      } else {
        dbPayload.uploaded_by = currentUser.id;
        await addInvoice(dbPayload);
        logActivity('add', 'invoice', null, `Uploaded invoice for supplier ${formData.supplier}`);
        alert(t('invoicesPage.uploadSuccess'));
      }
      
      handleCloseModal();
    } catch (err) {
      alert((invoiceToEdit ? t('invoicesPage.updateFailed') : t('invoicesPage.uploadFailed')) + ": " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!invoiceToDelete) return;
    try {
      // First extract filepath from the public URL to drop off the bucket
      const pattern = /invoices\/(.+)$/;
      const match = invoiceToDelete.image_url.match(pattern);
      if (match && match[1]) {
        await supabase.storage.from('invoices').remove([match[1]]);
      }
      // Drop row from db
      await deleteInvoice(invoiceToDelete.id);
      logActivity('delete', 'invoice', invoiceToDelete.id, `Removed invoice representing ${invoiceToDelete.supplier}`);
      setInvoiceToDelete(null);
    } catch(err) {
      console.error(err);
    }
  };

  const handleDownload = async (inv) => {
    try {
      const resp = await fetch(inv.image_url);
      const blob = await resp.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      const fileExt = inv.image_url.split('.').pop() || 'jpg';
      a.download = `invoice_${inv.supplier.replace(/\\s+/g, '_')}_${new Date(inv.uploaded_at).getTime()}.${fileExt}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objUrl);
    } catch (err) {
      alert("İndirme başarısız / Download failed: " + err.message);
    }
  };

  return (
    <div className="slide-up">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h2>{t('invoicesPage.title')}</h2>
            <p>{t('invoicesPage.subtitle')}</p>
          </div>
          <div className="page-actions">
            {canAdd && (
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                📸 {t('invoicesPage.uploadBtn')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder={t('invoicesPage.searchPlaceholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('invoicesPage.dateRange')}</span>
          <input 
            className="form-input" 
            style={{ width: '140px' }} 
            type="date"
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input 
            className="form-input" 
            style={{ width: '140px' }} 
            type="date"
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        {Object.keys(groupedInvoices).length === 0 ? (
          <div className="content-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
            {t('invoicesPage.noInvoices')}
          </div>
        ) : (
          Object.keys(groupedInvoices).sort((a,b) => new Date(b) - new Date(a)).map(dateLabel => (
            <div key={dateLabel} style={{ marginBottom: '32px' }}>
              <h3 style={{ paddingBottom: '10px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', color: 'var(--accent-primary)', fontSize: '18px' }}>
                🗓️ {dateLabel}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {groupedInvoices[dateLabel].map(inv => (
                  <div key={inv.id} className="stat-card" style={{ padding: '16px', position: 'relative' }}>
                    <div 
                      onClick={() => setViewImage(inv)}
                      style={{ width: '100%', height: '220px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-secondary)', marginBottom: '12px', cursor: 'pointer' }}
                    >
                      <img src={inv.image_url} alt="Invoice" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '15px', marginBottom: '4px' }}>{inv.supplier}</div>
                        {inv.description && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{inv.description}</div>}
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                          {new Date(inv.uploaded_at).toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {canEdit && (
                          <button 
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '6px', borderRadius: '8px' }}
                            onClick={() => openEditModal(inv)}
                          >
                            ✏️
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="btn btn-danger btn-sm"
                            style={{ padding: '6px', borderRadius: '8px' }}
                            onClick={() => setInvoiceToDelete(inv)}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {(showAddModal || invoiceToEdit) && (
        <Modal isOpen={true} onClose={handleCloseModal} title={invoiceToEdit ? t('invoicesPage.editModalTitle') : t('invoicesPage.uploadModalTitle')}>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ textAlign: 'center' }}>
              {!previewUrl ? (
                <label style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '30px',
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '32px' }}>📸</span>
                  <span>{t('invoicesPage.capturePhoto')}</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileCapture} style={{ display: 'none' }} />
                </label>
              ) : (
                <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
                  <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  <button type="button" className="btn btn-danger" style={{ position: 'absolute', top: 10, right: 10, padding: '4px 8px' }} onClick={() => { setPreviewUrl(null); setUploadFile(null); }}>
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">{t('invoicesPage.supplierLabel')} *</label>
              <input 
                className="form-input" 
                required 
                list="supplier-opts"
                value={formData.supplier} 
                onChange={(e) => setFormData({...formData, supplier: e.target.value})} 
                placeholder={t('invoicesPage.supplierPlaceholder')}
              />
              <datalist id="supplier-opts">
                {uniqueSuppliers.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">{t('invoicesPage.descLabel')}</label>
              <textarea 
                className="form-input" 
                style={{ resize: 'vertical', minHeight: '80px' }}
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder={t('invoicesPage.descPlaceholder')}
              />
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>{t('common.cancel') || 'Cancel'}</button>
              <button type="submit" className="btn btn-primary" disabled={isUploading || (!invoiceToEdit && !uploadFile)}>
                {isUploading ? '...' : t('common.save') || 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {invoiceToDelete && (
        <Modal isOpen={true} onClose={() => setInvoiceToDelete(null)} title={t('invoicesPage.title')}>
          <div style={{ padding: '10px 0 20px 0', fontSize: '15px' }}>
            {t('invoicesPage.deleteConfirm')} <br/>
            <strong>{invoiceToDelete.supplier}</strong>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setInvoiceToDelete(null)}>{t('common.cancel')}</button>
            <button className="btn btn-danger" onClick={confirmDelete}>{lang==='ar'?'حذف':'Delete'}</button>
          </div>
        </Modal>
      )}

      {viewImage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            position: 'absolute', top: '20px', right: '20px', 
            display: 'flex', gap: '10px', zIndex: 10000
          }}>
            <button 
              className="btn btn-primary"
              style={{ fontSize: '20px', padding: '8px 16px', borderRadius: '8px' }}
              onClick={() => handleDownload(viewImage)}
              title={lang === 'ar' ? 'تحميل' : 'Download'}
            >
              ⬇️
            </button>
            <button 
              className="btn btn-danger"
              style={{ fontSize: '20px', padding: '8px 16px', borderRadius: '8px' }}
              onClick={() => setViewImage(null)}
              title={t('common.cancel') || 'Close'}
            >
              ✕
            </button>
          </div>
          <img 
            src={viewImage.image_url} 
            alt="Invoice preview" 
            style={{ maxWidth: '95%', maxHeight: '85vh', objectFit: 'contain', borderRadius: '8px' }} 
          />
          <div style={{ color: 'white', marginTop: '16px', fontSize: '18px', fontWeight: '600' }}>
            {viewImage.supplier}
          </div>
        </div>
      )}

    </div>
  );
}

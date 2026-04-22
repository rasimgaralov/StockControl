'use client';

import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import Modal from '@/components/Modal';

export default function AyarlarPage() {
  const { theme, changeTheme, users, addUser, updateUser, updateUserPassword, deleteUser } = useApp();
  const { currentUser, hasPermission } = useAuth();
  const { t, language } = useLanguage();

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', username: '', email: '', password: '' });
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', username: '', email: '', password: '', role: 'user' });
  const [userToDelete, setUserToDelete] = useState(null);

  const themes = [
    {
      id: 'light-mint',
      name: t('settingsPage.themes.lightMint'),
      mode: t('settingsPage.modes.light'),
      colors: ['#f2f2f2', '#33cdb0', '#ffffff']
    },
    {
      id: 'light-blue',
      name: t('settingsPage.themes.iceBlue'),
      mode: t('settingsPage.modes.light'),
      colors: ['#f1f5f9', '#3b82f6', '#ffffff']
    },
    {
      id: 'dark-emerald',
      name: t('settingsPage.themes.darkEmerald'),
      mode: t('settingsPage.modes.dark'),
      colors: ['#0c1c18', '#059669', '#1a3830']
    },
    {
      id: 'dark-midnight',
      name: t('settingsPage.themes.midnight'),
      mode: t('settingsPage.modes.dark'),
      colors: ['#020617', '#6366f1', '#1e293b']
    }
  ];

  const roleLabels = {
    admin: 'Admin',
    manager: 'Manager',
    editor: 'Editor',
    user: 'User',
  };

  const roleBadgeColors = {
    admin: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' },
    manager: { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', border: 'rgba(99,102,241,0.2)' },
    editor: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
    user: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', border: 'rgba(107,114,128,0.2)' },
  };

  const openEditUser = (user) => {
    setEditForm({ name: user.name, username: user.username || '', email: user.email || '', password: '' });
    setEditingUser(user);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editingUser) {
      const { password, ...updates } = editForm;
      let success = await updateUser(editingUser.id, updates);
      
      if (password) {
        success = await updateUserPassword(editingUser.id, password);
      }
      
      if (success) setEditingUser(null);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const res = await addUser(addForm);
    if (res.success) {
      setIsAddingUser(false);
      setAddForm({ name: '', username: '', email: '', password: '', role: 'user' });
    } else {
      alert(res.error);
    }
  };

  const handleDeleteUser = async () => {
    if (userToDelete) {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="slide-up">
      <div className="page-header">
        <h2>{t('settingsPage.title')}</h2>
        <p>{t('settingsPage.subtitle')}</p>
      </div>

      {/* Theme Selection */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>{t('settingsPage.themeSelection')}</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '20px' }}>
          {themes.map(themeObj => {
            const isActive = theme === themeObj.id;

            return (
              <div
                key={themeObj.id}
                onClick={() => changeTheme(themeObj.id)}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  border: isActive ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? 'var(--shadow-glow)' : 'var(--shadow-sm)'
                }}
              >
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'var(--accent-primary)',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}>
                    ✓
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  {themeObj.colors.map((c, i) => (
                    <div key={i} style={{ width: '32px', height: '32px', borderRadius: '8px', background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                  ))}
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-primary)' }}>{themeObj.name}</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{themeObj.mode} {t('settingsPage.themeSuffix')}</div>
              </div>
            );
          })}
        </div>
      </div>

      {isAdmin && (
        <>
          {/* Users Section */}
          <div className="content-card" style={{ marginTop: '24px' }}>
            <div className="content-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ display: 'inline-block', marginRight: '10px' }}>👥 {t('settingsPage.usersTitle')}</h3>
                <span className="badge badge-purple">{users.length} {t('settingsPage.usersCount')}</span>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAddingUser(true)}>
                ➕ {language === 'ar' ? 'إضافة مستخدم' : 'Yeni Kullanıcı'}
              </button>
            </div>
            
            <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('settingsPage.colName')}</th>
                <th>{t('settingsPage.colUsername')}</th>
                <th>{t('settingsPage.colEmail')}</th>
                <th>{t('settingsPage.colRole')}</th>
                {isAdmin && <th>{t('settingsPage.colActions')}</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const roleStyle = roleBadgeColors[user.role] || roleBadgeColors.user;
                const isSelf = currentUser?.id === user.id;
                
                return (
                  <tr key={user.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: '700',
                          color: 'white',
                          flexShrink: 0,
                        }}>
                          {user.name?.split(' ')?.map(w => w[0])?.join('')?.slice(0, 2)?.toUpperCase() || 'U'}
                        </div>
                        <span>{user.name}</span>
                        {isSelf && (
                          <span style={{
                            fontSize: '10px',
                            fontWeight: '600',
                            color: 'var(--accent-primary)',
                            background: 'rgba(5,150,105,0.1)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                          }}>
                            {t('settingsPage.you')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '13px' }}>
                      {user.username || '-'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {user.email || '-'}
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        background: roleStyle.bg,
                        color: roleStyle.color,
                        border: `1px solid ${roleStyle.border}`,
                        fontSize: '12px',
                        fontWeight: '600',
                      }}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditUser(user)}>
                            ✏️
                          </button>
                          {!isSelf && (
                            <button className="btn btn-danger btn-sm" onClick={() => setUserToDelete(user)}>
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddingUser && (
        <Modal
          isOpen={true}
          onClose={() => setIsAddingUser(false)}
          title={language === 'ar' ? 'إضافة مستخدم جديد' : 'Yeni Kullanıcı Ekle'}
        >
          <form onSubmit={handleAddSubmit}>
            <div className="form-group">
              <label className="form-label">{t('settingsPage.colName')}</label>
              <input className="form-input" required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settingsPage.colUsername')}</label>
              <input className="form-input" required value={addForm.username} onChange={(e) => setAddForm({ ...addForm, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settingsPage.colEmail')}</label>
              <input className="form-input" type="email" required value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settingsPage.colPassword') || 'Password'}</label>
              <input className="form-input" type="password" required value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settingsPage.colRole') || 'Role'}</label>
              <select className="form-select" value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
                <option value="user">User</option>
                <option value="editor">Editor</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddingUser(false)}>{t('common.cancel')}</button>
              <button type="submit" className="btn btn-primary">{t('common.add') || 'Ekle'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <Modal
          isOpen={true}
          onClose={() => setEditingUser(null)}
          title={t('settingsPage.editUserTitle')}
        >
          <form onSubmit={handleEditSubmit}>
            <div className="form-group">
              <label className="form-label">{t('settingsPage.colName')}</label>
              <input className="form-input" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settingsPage.colUsername')}</label>
              <input className="form-input" required value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settingsPage.colEmail')}</label>
              <input className="form-input" type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('settingsPage.colPassword') || 'New Password'}</label>
              <input className="form-input" type="password" placeholder={t('settingsPage.passwordPlaceholder') || 'Leave blank to keep current'} value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)}>{t('common.cancel')}</button>
              <button type="submit" className="btn btn-primary">{t('common.save')}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete User Confirm Modal */}
      {userToDelete && (
        <Modal
          isOpen={true}
          onClose={() => setUserToDelete(null)}
          title={t('settingsPage.deleteUserTitle')}
        >
          <div style={{ padding: '10px 0 20px 0', fontSize: '15px', color: 'var(--text-secondary)' }}>
            {t('settingsPage.deleteUserConfirm').replace('{name}', userToDelete.name)}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setUserToDelete(null)}>{t('common.cancel')}</button>
            <button type="button" className="btn btn-danger" onClick={handleDeleteUser}>{t('common.delete')}</button>
          </div>
          </Modal>
        )}
      </>
      )}
    </div>
  );
}

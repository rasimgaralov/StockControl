'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import { useLanguage } from '@/context/LanguageContext';

const ACTION_ICONS = {
  add: '➕',
  edit: '✏️',
  delete: '🗑️',
  transfer: '🔄',
  waste: '🔥',
};

const ACTION_COLORS = {
  add: 'var(--color-success)',
  edit: 'var(--color-info)',
  delete: 'var(--color-danger)',
  transfer: 'var(--color-warning)',
  waste: 'var(--color-danger)',
};

const ACTION_BG = {
  add: 'var(--color-success-bg, rgba(34,197,94,0.1))',
  edit: 'var(--color-info-bg)',
  delete: 'var(--color-danger-bg)',
  transfer: 'var(--color-warning-bg)',
  waste: 'var(--color-danger-bg)',
};

function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
    ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function IslemGecmisiPage() {
  const { getUserName } = useApp();
  const { t } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      const [{ data: logsData }, { data: usersData }] = await Promise.all([
        supabase.from('activity_logs').select('*').order('createdAt', { ascending: false }).limit(500),
        supabase.from('users').select('id, name'),
      ]);
      setLogs(logsData || []);
      setUsers(usersData || []);
      setLoading(false);
    }
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    let result = [...logs];
    if (filterAction !== 'all') {
      result = result.filter(l => l.action === filterAction);
    }
    if (filterUser !== 'all') {
      result = result.filter(l => l.userId === filterUser);
    }
    if (startDate) {
      const sDate = new Date(startDate);
      sDate.setHours(0,0,0,0);
      result = result.filter(l => new Date(l.createdAt) >= sDate);
    }
    if (endDate) {
      const eDate = new Date(endDate);
      eDate.setHours(23,59,59,999);
      result = result.filter(l => new Date(l.createdAt) <= eDate);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'name') {
        const uA = users.find(u => u.id === a.userId)?.name || '';
        const uB = users.find(u => u.id === b.userId)?.name || '';
        cmp = uA.localeCompare(uB, 'tr');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [logs, filterAction, filterUser, startDate, endDate, sortBy, sortDir, users]);

  const getTargetTypeLabel = (type) => {
    const labels = {
      product: t('activityPage.targetProduct'),
      transfer: t('activityPage.targetTransfer'),
      waste: t('activityPage.targetWaste'),
      user: t('activityPage.targetUser'),
    };
    return labels[type] || type;
  };

  const getActionLabel = (action) => {
    const labels = {
      add: t('activityPage.actionAdd'),
      edit: t('activityPage.actionEdit'),
      delete: t('activityPage.actionDelete'),
      transfer: t('activityPage.actionTransfer'),
      waste: t('activityPage.actionWaste'),
    };
    return labels[action] || action;
  };

  const parseDetails = (details) => {
    if (!details) return null;
    try {
      return typeof details === 'string' ? JSON.parse(details) : details;
    } catch {
      return { raw: details };
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>{t('activityPage.loading')}</p>
      </div>
    );
  }

  return (
    <div className="slide-up">
      <div className="page-header">
        <div>
          <h2>{t('activityPage.title')}</h2>
          <p>{t('activityPage.subtitle')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card" style={{ '--card-accent': 'var(--accent-primary)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon purple">📝</div>
          </div>
          <div className="stat-card-value">{logs.length}</div>
          <div className="stat-card-label">{t('activityPage.totalLogs')}</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-success)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon green">➕</div>
          </div>
          <div className="stat-card-value">{logs.filter(l => l.action === 'add').length}</div>
          <div className="stat-card-label">{t('activityPage.addCount')}</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-info)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon blue">✏️</div>
          </div>
          <div className="stat-card-value">{logs.filter(l => l.action === 'edit').length}</div>
          <div className="stat-card-label">{t('activityPage.editCount')}</div>
        </div>
        <div className="stat-card" style={{ '--card-accent': 'var(--color-danger)' }}>
          <div className="stat-card-header">
            <div className="stat-card-icon red">🗑️</div>
          </div>
          <div className="stat-card-value">{logs.filter(l => l.action === 'delete').length}</div>
          <div className="stat-card-label">{t('activityPage.deleteCount')}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select className="filter-select" style={{ minWidth: '150px' }} value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
            <option value="all">{t('activityPage.allActions')}</option>
            <option value="add">{t('activityPage.actionAdd')}</option>
            <option value="edit">{t('activityPage.actionEdit')}</option>
            <option value="delete">{t('activityPage.actionDelete')}</option>
            <option value="transfer">{t('activityPage.actionTransfer')}</option>
            <option value="waste">{t('activityPage.actionWaste')}</option>
          </select>
          <select className="filter-select" style={{ minWidth: '150px' }} value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
            <option value="all">{t('activityPage.allUsers')}</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <select className="filter-select" style={{ minWidth: '150px' }} value={`${sortBy}-${sortDir}`} onChange={(e) => {
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('transfersPage.dateRange') || "Tarih Aralığı:"}</span>
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

      {/* Logs Table */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>{t('activityPage.historyTitle')}</h3>
          <span className="badge badge-purple">{filteredLogs.length} {t('activityPage.records')}</span>
        </div>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('activityPage.colDate')}</th>
                <th>{t('activityPage.colUser')}</th>
                <th>{t('activityPage.colAction')}</th>
                <th>{t('activityPage.colTarget')}</th>
                <th>{t('activityPage.colDetails')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-state-icon">📭</div>
                      <div className="empty-state-text">{t('activityPage.empty')}</div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const details = parseDetails(log.details);
                  const userName = users.find(u => u.id === log.userId)?.name || 'Unknown';
                  
                  return (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '13px' }}>
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td>
                        <span style={{ 
                          fontWeight: '600', 
                          color: 'var(--text-primary)',
                          fontSize: '13px',
                        }}>
                          {userName}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          background: ACTION_BG[log.action] || 'var(--bg-surface)',
                          fontSize: '12px',
                          fontWeight: '600',
                          color: ACTION_COLORS[log.action] || 'var(--text-primary)',
                        }}>
                          {ACTION_ICONS[log.action] || '📌'} {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: '12px' }}>
                          {getTargetTypeLabel(log.targetType)}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px' }}>
                        {details?.name && <strong>{details.name}</strong>}
                        {details?.quantity && ` (${details.quantity})`}
                        {details?.reason && ` — ${details.reason}`}
                        {details?.product && <strong>{details.product}</strong>}
                        {details?.changes && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {' '}— {Object.keys(details.changes).join(', ')} {t('activityPage.updated')}
                          </span>
                        )}
                        {!details && '-'}
                      </td>
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

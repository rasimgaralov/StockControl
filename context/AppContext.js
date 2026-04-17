'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [transfersList, setTransfers] = useState([]);
  const [wasteLogsList, setWasteLogs] = useState([]);
  const [inboundsList, setInbounds] = useState([]);
  const [deptStockList, setDeptStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('light-mint');

  const fetchData = async () => {
    setLoading(true);
    const [
      { data: dData },
      { data: uData },
      { data: pData },
      { data: dsData },
      { data: tData },
      { data: wData },
      { data: iData }
    ] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('users').select('id, name, username, email, role, deptId'),
      supabase.from('products').select('*'),
      supabase.from('deptStock').select('*'),
      supabase.from('transfers').select('*'),
      supabase.from('wasteLogs').select('*'),
      supabase.from('inbounds').select('*')
    ]);

    setDepartments(dData || []);
    setUsers(uData || []);
    setProducts(pData || []);
    setDeptStock(dsData || []);
    setTransfers(tData || []);
    setWasteLogs(wData || []);
    setInbounds(iData || []);
    setLoading(false);
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem('app-theme') || 'light-mint';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);
    fetchData();
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // ═══════════ Activity Logging ═══════════
  const logActivity = useCallback(async (action, targetType, targetId, details) => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;
    const logEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      userId,
      action,
      targetType,
      targetId: targetId || null,
      details: typeof details === 'object' ? JSON.stringify(details) : (details || null),
      createdAt: new Date().toISOString(),
    };

    // Fire and forget — don't block the UI
    supabase.from('activity_logs').insert([logEntry]).then(({ error }) => {
      if (error) console.error('Activity log error:', error.message);
    });
  }, [currentUser]);

  // ═══════════ Helpers (Dependent on state) ═══════════
  const getDeptName = useCallback((id, lang = 'en') => {
    const dept = departments.find(d => d.id === id);
    if(!dept) return 'Unknown';
    return dept[`name_${lang}`] || dept.name_en || 'Unknown';
  }, [departments]);
  
  const getDeptIcon = useCallback((id) => departments.find(d => d.id === id)?.icon || '📋', [departments]);
  const getDeptColor = useCallback((id) => departments.find(d => d.id === id)?.color || '#059669', [departments]);
  
  const getUserName = useCallback((id, lang = 'en') => {
    const user = users.find(u => u.id === id);
    if (!user) return 'Unknown';
    return user.name || 'Unknown';
  }, [users]);
  
  const getUserRole = useCallback((id, lang = 'en') => {
    const user = users.find(u => u.id === id);
    if (!user) return 'Unknown';
    return user[`role_${lang}`] || user.role_en || user.role || 'Unknown';
  }, [users]);

  const getProductName = useCallback((id, lang = 'en') => {
    const prod = products.find(p => p.id === id);
    if (!prod) return 'Unknown';
    return prod.name || 'Unknown';
  }, [products]);
  
  const getProductById = useCallback((id) => products.find(p => p.id === id), [products]);

  // ═══════════ Product Actions ═══════════
  const addProduct = useCallback(async (product) => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;
    const newProduct = {
      ...product,
      id: 'p' + Date.now(),
      createdBy: userId,
    };
    const { error } = await supabase.from('products').insert([newProduct]);
    if (!error) {
      setProducts(prev => [...prev, newProduct]);
      logActivity('add', 'product', newProduct.id, { name: newProduct.name, quantity: newProduct.quantity });
    }
    return newProduct;
  }, [currentUser, logActivity]);

  const updateProduct = useCallback(async (id, updates) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (!error) {
      const oldProduct = products.find(p => p.id === id);
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      logActivity('edit', 'product', id, { name: oldProduct?.name, changes: updates });
    }
  }, [products, logActivity]);

  const deleteProduct = useCallback(async (id) => {
    const oldProduct = products.find(p => p.id === id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
      logActivity('delete', 'product', id, { name: oldProduct?.name });
    }
  }, [products, logActivity]);

  // ═══════════ Transfer Actions ═══════════
  const addTransfer = useCallback(async (transfer) => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;
    const newTransfer = {
      ...transfer,
      id: 't' + Date.now(),
      transferredBy: userId,
    };

    const { error } = await supabase.from('transfers').insert([newTransfer]);
    if (error) return;

    setTransfers(prev => [newTransfer, ...prev]);

    const product = products.find(p => p.id === transfer.productId);
    if (product) {
      const newQty = Math.max(0, product.quantity - transfer.quantity);
      await supabase.from('products').update({ quantity: newQty }).eq('id', transfer.productId);
      setProducts(prev => prev.map(p => p.id === transfer.productId ? { ...p, quantity: newQty } : p));
    }

    logActivity('transfer', 'transfer', newTransfer.id, {
      product: product?.name,
      quantity: transfer.quantity,
      from: transfer.fromDeptId,
      to: transfer.toDeptId,
    });

    fetchData();
    return newTransfer;
  }, [products, currentUser, logActivity]);

  // ═══════════ Inbound Actions ═══════════
  const addInbound = useCallback(async (inbound) => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;
    const newInbound = {
      ...inbound,
      id: 'i' + Date.now(),
      receivedBy: userId,
    };

    const { error } = await supabase.from('inbounds').insert([newInbound]);
    if (error) return;

    setInbounds(prev => [newInbound, ...prev]);

    const product = products.find(p => p.id === inbound.productId);
    if (product) {
      const newQty = product.quantity + inbound.quantity;
      await supabase.from('products').update({ quantity: newQty }).eq('id', inbound.productId);
      setProducts(prev => prev.map(p => p.id === inbound.productId ? { ...p, quantity: newQty } : p));
    }

    logActivity('add', 'product', inbound.productId, {
      name: product?.name,
      quantity: inbound.quantity,
      reason: 'Mal Kabul (Inbound)',
      supplier: inbound.supplier,
    });

    fetchData();
    return newInbound;
  }, [products, currentUser, logActivity]);

  // ═══════════ Waste Actions ═══════════
  const addWasteLog = useCallback(async (wasteLog) => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;
    const newWaste = {
      ...wasteLog,
      id: 'w' + Date.now(),
      loggedBy: userId,
    };

    const { error } = await supabase.from('wasteLogs').insert([newWaste]);
    if (error) return;

    setWasteLogs(prev => [newWaste, ...prev]);

    const product = products.find(p => p.id === wasteLog.productId);
    if (product) {
      const newQty = Math.max(0, product.quantity - wasteLog.quantity);
      await supabase.from('products').update({ quantity: newQty }).eq('id', wasteLog.productId);
      setProducts(prev => prev.map(p => p.id === wasteLog.productId ? { ...p, quantity: newQty } : p));
    }

    logActivity('waste', 'waste', newWaste.id, {
      product: product?.name,
      quantity: wasteLog.quantity,
      reason: wasteLog.reason,
    });

    return newWaste;
  }, [products, currentUser, logActivity]);

  // ═══════════ User Management (Admin only) ═══════════
  const updateUser = useCallback(async (id, updates) => {
    const { error } = await supabase.from('users').update(updates).eq('id', id);
    if (!error) {
      const oldUser = users.find(u => u.id === id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
      logActivity('edit', 'user', id, { name: oldUser?.name, changes: updates });
    }
    return !error;
  }, [users, logActivity]);

  const updateUserPassword = useCallback(async (id, newPassword) => {
    try {
      const res = await fetch(`/api/users/${id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      });
      if (!res.ok) throw new Error('Password update failed');
      
      const oldUser = users.find(u => u.id === id);
      logActivity('edit', 'user', id, { name: oldUser?.name, changes: { password: 'updated' } });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }, [users, logActivity]);

  const deleteUser = useCallback(async (id) => {
    const oldUser = users.find(u => u.id === id);
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (!error) {
      setUsers(prev => prev.filter(u => u.id !== id));
      logActivity('delete', 'user', id, { name: oldUser?.name });
    }
    return !error;
  }, [users, logActivity]);

  // ═══════════ Computed Values ═══════════
  const criticalProducts = products.filter(p => p.quantity <= p.criticalThreshold);

  const activeAlerts = products.flatMap(p => {
    const pAlerts = [];
    if (p.quantity <= p.criticalThreshold) {
      pAlerts.push({ id: 'crit_' + p.id, productId: p.id, alertType: 'critical_stock', triggeredAt: new Date().toISOString() });
    } else if (p.quantity <= p.criticalThreshold * 1.5) {
      pAlerts.push({ id: 'low_' + p.id, productId: p.id, alertType: 'low_stock', triggeredAt: new Date().toISOString() });
    }

    if (p.expiryDate) {
      const diff = new Date(p.expiryDate) - new Date();
      if (diff > 0 && diff < 15 * 24 * 60 * 60 * 1000) {
        pAlerts.push({ id: 'exp_' + p.id, productId: p.id, alertType: 'expiry_warning', triggeredAt: new Date().toISOString() });
      }
    }
    return pAlerts;
  });
  const todayTransfers = transfersList.filter(t => {
    const today = new Date().toDateString();
    return new Date(t.transferredAt).toDateString() === today;
  });

  const value = {
    products,
    departments,
    users,
    transfersList,
    wasteLogsList,
    inboundsList,
    deptStockList,
    criticalProducts,
    activeAlerts,
    todayTransfers,
    theme,
    changeTheme,
    loading,
    getDeptName,
    getDeptIcon,
    getDeptColor,
    getUserName,
    getProductName,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    updateUser,
    updateUserPassword,
    deleteUser,
    addTransfer,
    addWasteLog,
    addInbound,
    logActivity,
    refreshData: fetchData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
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

  // ═══════════ Multi-Batch FEFO Utilities ═══════════
  const recalculateAndApplyProductStock = async (productId) => {
    const { data: activeBatches } = await supabase
      .from('stock_batches')
      .select('*')
      .eq('productId', productId)
      .gt('quantity', 0)
      .order('expiryDate', { ascending: true, nullsFirst: false });
      
    let newSum = 0;
    let newEarliest = null;
    if (activeBatches && activeBatches.length > 0) {
      newSum = activeBatches.reduce((acc, b) => acc + Number(b.quantity), 0);
      newEarliest = activeBatches[0].expiryDate;
    }
    
    await supabase.from('products').update({ quantity: newSum, expiryDate: newEarliest }).eq('id', productId);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, quantity: newSum, expiryDate: newEarliest } : p));
  };

  const processFEFODeduction = async (productId, amountToRemove) => {
    const { data: batches } = await supabase
      .from('stock_batches')
      .select('*')
      .eq('productId', productId)
      .gt('quantity', 0)
      .order('expiryDate', { ascending: true, nullsFirst: false });
      
    let remaining = Number(amountToRemove);
    const updates = [];
    for (const b of (batches || [])) {
      if (remaining <= 0) break;
      const deduction = Math.min(Number(b.quantity), remaining);
      b.quantity = Number(b.quantity) - deduction;
      remaining -= deduction;
      updates.push(b);
    }
    
    for (const b of updates) {
      await supabase.from('stock_batches').update({ quantity: b.quantity }).eq('id', b.id);
    }
    await recalculateAndApplyProductStock(productId);
  };

  const addBatch = useCallback(async (batchData) => {
    if (!currentUser?.id) return;
    
    // 1. Insert Inbounds (for tracking history)
    const newInbound = {
      id: 'i' + Date.now(),
      productId: batchData.productId,
      quantity: batchData.quantity,
      supplier: batchData.supplier || 'Stock Update',
      receivedBy: currentUser?.id,
    };
    await supabase.from('inbounds').insert([newInbound]);
    setInbounds(prev => [newInbound, ...prev]);

    // 2. Insert Stock Batch (for FEFO tracking)
    const newBatch = {
      id: 'b_' + Date.now(),
      productId: batchData.productId,
      quantity: batchData.quantity,
      expiryDate: batchData.expiryDate || null,
    };
    await supabase.from('stock_batches').insert([newBatch]);

    // 3. Recalculate
    await recalculateAndApplyProductStock(batchData.productId);
  }, [currentUser]);

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
      
      if (newProduct.quantity && newProduct.quantity > 0) {
        // Initial Batch Creation
        const newBatch = {
          id: 'b_' + Date.now(),
          productId: newProduct.id,
          quantity: newProduct.quantity,
          expiryDate: newProduct.expiryDate || null,
        };
        supabase.from('stock_batches').insert([newBatch]);

        const newInbound = {
          id: 'i' + Date.now(),
          productId: newProduct.id,
          quantity: newProduct.quantity,
          supplier: newProduct.supplier_en || newProduct.supplier_ar || 'Initial Stock',
          receivedBy: userId,
        };
        supabase.from('inbounds').insert([newInbound]).then(({error: inError}) => {
          if (!inError) setInbounds(prev => [newInbound, ...prev]);
        });
      }
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
  }, [products, logActivity, currentUser]);

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
      await processFEFODeduction(transfer.productId, transfer.quantity);
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
      await processFEFODeduction(wasteLog.productId, wasteLog.quantity);
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

  const activeAlerts = useMemo(() => {
    return products.flatMap(p => {
      const pAlerts = [];
      const threshold = Number(p.criticalThreshold) || 0;
      const qty = Number(p.quantity) || 0;

      if (qty <= threshold) {
        pAlerts.push({ id: 'crit_' + p.id, productId: p.id, alertType: 'critical_stock', triggeredAt: new Date().toISOString() });
      } else if (threshold > 0 && qty <= threshold * 1.5) {
        pAlerts.push({ id: 'low_' + p.id, productId: p.id, alertType: 'low_stock', triggeredAt: new Date().toISOString() });
      }

      if (p.expiryDate) {
        const diff = new Date(p.expiryDate).setHours(23,59,59,999) - new Date();
        const daysToExpiry = diff / (1000 * 60 * 60 * 24);
        if (daysToExpiry <= 15) {
          pAlerts.push({ id: 'exp_' + p.id, productId: p.id, alertType: 'expiry_warning', triggeredAt: new Date().toISOString() });
        }
      }
      return pAlerts;
    });
  }, [products]);
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
    addBatch,
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

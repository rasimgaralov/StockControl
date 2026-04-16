'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [transfersList, setTransfers] = useState([]);
  const [wasteLogsList, setWasteLogs] = useState([]);
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
      { data: wData }
    ] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('users').select('*'),
      supabase.from('products').select('*'),
      supabase.from('deptStock').select('*'),
      supabase.from('transfers').select('*'),
      supabase.from('wasteLogs').select('*')
    ]);

    setDepartments(dData || []);
    setUsers(uData || []);
    setProducts(pData || []);
    setDeptStock(dsData || []);
    setTransfers(tData || []);
    setWasteLogs(wData || []);
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

  // ═══════════ Helpers (Dependent on state) ═══════════
  const getDeptName = useCallback((id) => departments.find(d => d.id === id)?.name || 'Bilinmiyor', [departments]);
  const getDeptIcon = useCallback((id) => departments.find(d => d.id === id)?.icon || '📋', [departments]);
  const getDeptColor = useCallback((id) => departments.find(d => d.id === id)?.color || '#059669', [departments]);
  const getUserName = useCallback((id) => users.find(u => u.id === id)?.name || 'Bilinmiyor', [users]);
  const getProductName = useCallback((id) => products.find(p => p.id === id)?.name || 'Bilinmiyor', [products]);
  const getProductById = useCallback((id) => products.find(p => p.id === id), [products]);

  // ═══════════ Product Actions ═══════════
  const addProduct = useCallback(async (product) => {
    const newProduct = {
      ...product,
      id: 'p' + Date.now(),
      createdBy: 'u1',
    };
    const { error } = await supabase.from('products').insert([newProduct]);
    if (!error) {
      setProducts(prev => [...prev, newProduct]);
    }
    return newProduct;
  }, []);

  const updateProduct = useCallback(async (id, updates) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  }, []);

  // ═══════════ Transfer Actions ═══════════
  const addTransfer = useCallback(async (transfer) => {
    const newTransfer = {
      ...transfer,
      id: 't' + Date.now(),
      transferredBy: 'u1',
    };

    // For a real app, this should be a stored procedure to be transactional.
    // For now, we replicate the mock behavior asynchronously.
    const { error } = await supabase.from('transfers').insert([newTransfer]);
    if (error) return;

    setTransfers(prev => [newTransfer, ...prev]);

    // Update product quantity remotely and locally
    const product = products.find(p => p.id === transfer.productId);
    if (product) {
      const newQty = Math.max(0, product.quantity - transfer.quantity);
      await supabase.from('products').update({ quantity: newQty }).eq('id', transfer.productId);
      setProducts(prev => prev.map(p => p.id === transfer.productId ? { ...p, quantity: newQty } : p));
    }

    fetchData(); // Refresh all related deptStock tables just to be safe
    return newTransfer;
  }, [products]);

  // ═══════════ Waste Actions ═══════════
  const addWasteLog = useCallback(async (wasteLog) => {
    const newWaste = {
      ...wasteLog,
      id: 'w' + Date.now(),
      loggedBy: 'u1',
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

    return newWaste;
  }, [products]);

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
      if (diff > 0 && diff < 15 * 24 * 60 * 60 * 1000) { // 15 days warning
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
    transfersList,
    wasteLogsList,
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
    addTransfer,
    addWasteLog,
    refreshData: fetchData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}


'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import {
  products as initialProducts,
  departments,
  transfers as initialTransfers,
  wasteLogs as initialWasteLogs,
  stockAlerts as initialAlerts,
  deptStock as initialDeptStock,
} from '@/data/mockData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState(initialProducts);
  const [transfersList, setTransfers] = useState(initialTransfers);
  const [wasteLogsList, setWasteLogs] = useState(initialWasteLogs);
  const [alerts, setAlerts] = useState(initialAlerts);
  const [deptStockList, setDeptStock] = useState(initialDeptStock);

  // ═══════════ Product Actions ═══════════
  const addProduct = useCallback((product) => {
    const newProduct = {
      ...product,
      id: 'p' + Date.now(),
      createdBy: 'u1',
    };
    setProducts(prev => [...prev, newProduct]);
    return newProduct;
  }, []);

  const updateProduct = useCallback((id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const deleteProduct = useCallback((id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  }, []);

  // ═══════════ Transfer Actions ═══════════
  const addTransfer = useCallback((transfer) => {
    const newTransfer = {
      ...transfer,
      id: 't' + Date.now(),
      transferredBy: 'u1',
      transferredAt: new Date().toISOString(),
    };
    setTransfers(prev => [newTransfer, ...prev]);

    // Update product quantities
    setProducts(prev => prev.map(p => {
      if (p.id === transfer.productId) {
        return { ...p, quantity: Math.max(0, p.quantity - transfer.quantity) };
      }
      return p;
    }));

    // Update dept stock
    setDeptStock(prev => {
      const existing = prev.find(
        ds => ds.productId === transfer.productId && ds.deptId === transfer.toDeptId
      );
      if (existing) {
        return prev.map(ds =>
          ds.productId === transfer.productId && ds.deptId === transfer.toDeptId
            ? { ...ds, quantity: ds.quantity + transfer.quantity }
            : ds
        );
      }
      return [...prev, { productId: transfer.productId, deptId: transfer.toDeptId, quantity: transfer.quantity }];
    });

    return newTransfer;
  }, []);

  // ═══════════ Waste Actions ═══════════
  const addWasteLog = useCallback((wasteLog) => {
    const newWaste = {
      ...wasteLog,
      id: 'w' + Date.now(),
      loggedBy: 'u1',
      loggedAt: new Date().toISOString(),
    };
    setWasteLogs(prev => [newWaste, ...prev]);

    // Reduce product quantity
    setProducts(prev => prev.map(p => {
      if (p.id === wasteLog.productId) {
        return { ...p, quantity: Math.max(0, p.quantity - wasteLog.quantity) };
      }
      return p;
    }));

    return newWaste;
  }, []);

  // ═══════════ Alert Actions ═══════════
  const resolveAlert = useCallback((id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
  }, []);

  // ═══════════ Computed Values ═══════════
  const criticalProducts = products.filter(p => p.quantity <= p.criticalThreshold);
  const activeAlerts = alerts.filter(a => !a.resolved);
  const todayTransfers = transfersList.filter(t => {
    const today = new Date().toDateString();
    return new Date(t.transferredAt).toDateString() === today;
  });

  const value = {
    products,
    departments,
    transfersList,
    wasteLogsList,
    alerts,
    deptStockList,
    criticalProducts,
    activeAlerts,
    todayTransfers,
    addProduct,
    updateProduct,
    deleteProduct,
    addTransfer,
    addWasteLog,
    resolveAlert,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

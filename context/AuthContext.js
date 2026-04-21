'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const AuthContext = createContext(null);

const ROLE_PERMISSIONS = {
  admin:   { view: true, add: true, edit: true, delete: true, manageUsers: true },
  manager: { view: true, add: true, edit: true, delete: true, manageUsers: false },
  editor:  { view: true, add: true, edit: false, delete: false, manageUsers: false },
  user:    { view: true, add: false, edit: false, delete: false, manageUsers: false },
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check localStorage for existing session
    try {
      const stored = localStorage.getItem('stockcontrol-user');
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch (e) {
      localStorage.removeItem('stockcontrol-user');
    }
    setAuthLoading(false);
  }, []);

  // Redirect logic
  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser && pathname !== '/login') {
      router.push('/login');
    }
  }, [currentUser, authLoading, pathname, router]);

  const login = useCallback(async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Giriş başarısız');
    }

    setCurrentUser(data.user);
    localStorage.setItem('stockcontrol-user', JSON.stringify(data.user));
    router.push('/');
    return data.user;
  }, [router]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('stockcontrol-user');
    router.push('/login');
  }, [router]);

  const hasPermission = useCallback((action) => {
    if (!currentUser) return false;
    const perms = ROLE_PERMISSIONS[currentUser.role] || ROLE_PERMISSIONS.user;
    return perms[action] || false;
  }, [currentUser]);

  const getRoleName = useCallback(() => {
    if (!currentUser) return '';
    const roleNames = {
      admin: 'Admin',
      manager: 'Manager',
      editor: 'Editor',
      user: 'User',
    };
    return roleNames[currentUser.role] || currentUser.role;
  }, [currentUser]);

  const value = {
    currentUser,
    authLoading,
    login,
    logout,
    hasPermission,
    getRoleName,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

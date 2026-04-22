'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

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
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    let mounted = true;

    async function getUserProfile(userId) {
      if (!userId) return null;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        if (error) {
           console.error("Error fetching user profile:", error);
           return null;
        }
        return data;
      } catch (err) {
        console.error("Error fetching mapping profile:", err);
        return null;
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
         setAuthLoading(true);
         setCurrentUser({
            ...session.user,
            role: session.user.user_metadata?.role || 'user',
            name: session.user.user_metadata?.name || session.user.email,
            deptId: session.user.user_metadata?.deptId || null,
            username: session.user.user_metadata?.username || ''
         });
         setAuthLoading(false);
      } else {
         setCurrentUser(null);
         setAuthLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (identifier, password) => {
    setAuthLoading(true);

    let loginEmail = identifier;

    // Check if identifier is a username (no @ symbol)
    if (!identifier.includes('@')) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('username', identifier)
        .single();
      
      if (userError || !userData?.email) {
        setAuthLoading(false);
        throw new Error('Geçersiz kullanıcı adı veya şifre');
      }
      loginEmail = userData.email;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    if (error) {
      setAuthLoading(false);
      throw new Error(error.message || 'Giriş başarısız');
    }

    router.push('/');
    return data.user;
  }, [router, supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    router.push('/login');
  }, [router, supabase]);

  const hasPermission = useCallback((action) => {
    if (!currentUser) return false;
    const role = currentUser.role || 'user';
    const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;
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
    const role = currentUser.role || 'user';
    return roleNames[role] || role;
  }, [currentUser]);

  const value = {
    currentUser,
    authLoading,
    login,
    logout,
    hasPermission,
    getRoleName,
    supabase,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

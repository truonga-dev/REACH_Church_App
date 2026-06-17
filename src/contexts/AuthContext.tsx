'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { ensureProfile } from '@/lib/profile-service';
import { translateAuthError } from '@/lib/auth-errors';
import type { Profile } from '@/types';
import { hasPermission, canAccessAdmin, getPermissions, type Permission } from '@/lib/permissions';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; rawError: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  resendConfirmationEmail: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Kiểm tra người dùng hiện tại có quyền cụ thể không */
  can: (permission: Permission) => boolean;
  /** Kiểm tra có thể vào Admin Panel không */
  isAdmin: boolean;
  /** Danh sách quyền hiện tại */
  permissions: Permission[];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (authUser: User) => {
    const p = await ensureProfile(authUser);
    setProfile(p);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        void loadProfile(s.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        void loadProfile(s.user);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    const raw = error?.message ?? null;
    return { error: raw ? translateAuthError(raw) : null, rawError: raw };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: translateAuthError(error.message), needsEmailConfirmation: false };
    if (data.user) await ensureProfile(data.user, fullName);
    return { error: null, needsEmailConfirmation: !data.session };
  };

  const resendConfirmationEmail = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined,
      },
    });
    return { error: error ? translateAuthError(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('reach_profile');
    }
  };

  const refreshProfile = async () => {
    if (user) await loadProfile(user);
  };

  const can = useCallback((permission: Permission): boolean => {
    return hasPermission(profile?.role, permission);
  }, [profile?.role]);

  const isAdmin = canAccessAdmin(profile?.role);
  const permissions = getPermissions(profile?.role);

  return (
    <AuthContext.Provider value={{
      user, session, profile, loading,
      signIn, signUp, resendConfirmationEmail, signOut, refreshProfile,
      can, isAdmin, permissions,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

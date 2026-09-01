import { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabaseAdmin as supabase } from '../lib/supabase';

export interface AdminProfile {
  id: string;
  email: string;
  full_name: string | null;
  admin_role: 'super_admin' | 'admin' | 'manager' | null;
}

interface AdminAuthContextType {
  session: Session | null;
  adminProfile: AdminProfile | null;
  isSuperAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  session: null,
  adminProfile: null,
  isSuperAdmin: false,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (!session) setLoading(false);
      })
      .catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setAdminProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setAdminProfile(null);
      return;
    }
    let mounted = true;
    supabase
      .from('profiles')
      .select('id, email, full_name, admin_role')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error || !data || !data.admin_role) {
          setAdminProfile(null);
        } else {
          setAdminProfile(data as AdminProfile);
        }
        setLoading(false);
      });
    return () => { mounted = false; };
  }, [session]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setAdminProfile(null);
  }

  return (
    <AdminAuthContext.Provider
      value={{
        session,
        adminProfile,
        isSuperAdmin: adminProfile?.admin_role === 'super_admin',
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import { Loader2, ShieldAlert } from 'lucide-react';

export function AdminRoute() {
  const { session, loading } = useAdminAuth();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setProfileLoading(false);
      setIsAdmin(false);
      return;
    }
    let mounted = true;
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error || !data) {
          setIsAdmin(false);
        } else {
          setIsAdmin(Boolean(data.is_admin));
        }
        setProfileLoading(false);
      });
    return () => { mounted = false; };
  }, [session, loading]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?next=${next}`} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 ring-1 ring-red-500/20 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Access denied</h1>
          <p className="text-slate-400 text-sm mb-6">
            Your account doesn't have administrator access. Please contact an administrator if you believe this is an error.
          </p>
          <a
            href="/account"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Go to my account
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

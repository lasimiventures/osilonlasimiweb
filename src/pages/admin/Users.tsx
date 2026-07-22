import { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Users, Search, Shield, ShieldCheck, Loader2, AlertCircle, Mail, Phone, Building2,
  ToggleLeft, ToggleRight, ChevronRight, X,
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  customer_type: string;
  is_admin: boolean;
  created_at: string;
}

export function AdminUsers() {
  const { session } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'admins' | 'customers'>('all');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, company, customer_type, is_admin, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setUsers((data ?? []) as AdminUser[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function toggleAdmin(user: AdminUser) {
    if (user.id === session?.user?.id) return;
    setToggling(user.id);
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !user.is_admin, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) {
      setError(error.message);
    } else {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_admin: !u.is_admin } : u));
      setSelected(prev => prev && prev.id === user.id ? { ...prev, is_admin: !prev.is_admin } : prev);
    }
    setToggling(null);
  }

  const filtered = users.filter(u => {
    if (filter === 'admins' && !u.is_admin) return false;
    if (filter === 'customers' && u.is_admin) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.email.toLowerCase().includes(q)
        || (u.full_name?.toLowerCase().includes(q) ?? false)
        || (u.company?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const adminCount = users.filter(u => u.is_admin).length;

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          User Management
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">
          {users.length} accounts · {adminCount} administrators
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, or company…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {([
            { id: 'all', label: 'All' },
            { id: 'admins', label: 'Admins' },
            { id: 'customers', label: 'Customers' },
          ] as const).map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-sm">
                    No users found.
                  </td>
                </tr>
              )}
              {filtered.map(u => (
                <tr
                  key={u.id}
                  className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors cursor-pointer"
                  onClick={() => setSelected(u)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                        {(u.full_name || u.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{u.full_name || u.email}</p>
                        <p className="text-slate-500 text-xs truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-slate-300 text-sm">{u.company || '—'}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-slate-400 text-sm capitalize">{u.customer_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                        <ShieldCheck className="w-3 h-3" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        Customer
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => toggleAdmin(u)}
                      disabled={toggling === u.id || u.id === session?.user?.id}
                      title={u.id === session?.user?.id ? 'You cannot change your own role' : ''}
                      className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                        u.is_admin
                          ? 'text-amber-400 hover:bg-amber-500/10'
                          : 'text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      {toggling === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : u.is_admin ? (
                        <><ToggleRight className="w-4 h-4" /> Revoke admin</>
                      ) : (
                        <><ToggleLeft className="w-4 h-4" /> Make admin</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setSelected(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 z-50 overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h2 className="text-sm font-semibold text-white">User Details</h2>
              <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-lg font-bold text-slate-300">
                  {(selected.full_name || selected.email).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-semibold truncate">{selected.full_name || 'Unnamed'}</p>
                  <p className="text-slate-400 text-sm truncate">{selected.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selected.is_admin ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-sm font-medium">
                    <ShieldCheck className="w-4 h-4" /> Administrator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 text-sm font-medium">
                    <Shield className="w-4 h-4" /> Customer
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 text-sm font-medium capitalize">
                  {selected.customer_type}
                </span>
              </div>

              <div className="space-y-3">
                <DetailRow icon={Mail} label="Email" value={selected.email} />
                <DetailRow icon={Phone} label="Phone" value={selected.phone || '—'} />
                <DetailRow icon={Building2} label="Company" value={selected.company || '—'} />
                <DetailRow icon={Users} label="Joined" value={new Date(selected.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })} />
              </div>

              {selected.id !== session?.user?.id && (
                <button
                  onClick={() => toggleAdmin(selected)}
                  disabled={toggling === selected.id}
                  className={`w-full flex items-center justify-center gap-2 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 ${
                    selected.is_admin
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {toggling === selected.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : selected.is_admin ? (
                    <><Shield className="w-4 h-4" /> Revoke admin access</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4" /> Grant admin access</>
                  )}
                </button>
              )}
              {selected.id === session?.user?.id && (
                <p className="text-slate-500 text-xs text-center bg-slate-800/50 rounded-lg p-3">
                  You cannot modify your own role.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-800/50">
      <Icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-slate-500 text-xs">{label}</p>
        <p className="text-slate-200 text-sm truncate">{value}</p>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  Users, Search, Shield, ShieldCheck, Loader2, AlertCircle, Mail, Phone, Building2,
  ToggleLeft, ToggleRight, ChevronRight, X, UserPlus, Crown, Ban, Check, Lock,
} from 'lucide-react';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  customer_type: string;
  is_admin: boolean;
  admin_role: 'super_admin' | 'admin' | 'manager' | null;
  created_at: string;
}

type Tab = 'customers' | 'admins';

export function AdminUsers() {
  const { adminProfile, isSuperAdmin, session } = useAdminAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('customers');
  const [selected, setSelected] = useState<Profile | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  const loadProfiles = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, phone, company, customer_type, is_admin, admin_role, created_at')
      .order('created_at', { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setProfiles((data ?? []) as Profile[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  async function callManageAdmin(method: string, body: Record<string, unknown>) {
    const { data: { session: s } } = await supabase.auth.getSession();
    if (!s) throw new Error('Not authenticated');
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-admin`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${s.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Request failed');
    return json;
  }

  async function updateAdminRole(user: Profile, newRole: 'super_admin' | 'admin' | 'manager' | null) {
    if (user.id === session?.user?.id && newRole !== 'super_admin') return;
    setToggling(user.id);
    try {
      await callManageAdmin('PUT', { id: user.id, admin_role: newRole });
      await loadProfiles();
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
    setToggling(null);
  }

  async function deleteAdmin(user: Profile) {
    if (user.id === session?.user?.id) return;
    setToggling(user.id);
    try {
      await callManageAdmin('DELETE', { id: user.id });
      await loadProfiles();
      setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove admin');
    }
    setToggling(null);
  }

  const filtered = profiles.filter(u => {
    if (tab === 'admins' && !u.admin_role) return false;
    if (tab === 'customers' && u.admin_role) return false;
    if (search) {
      const q = search.toLowerCase();
      return u.email.toLowerCase().includes(q)
        || (u.full_name?.toLowerCase().includes(q) ?? false)
        || (u.company?.toLowerCase().includes(q) ?? false);
    }
    return true;
  });

  const customerCount = profiles.filter(p => !p.admin_role).length;
  const adminCount = profiles.filter(p => p.admin_role).length;

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
          {customerCount} client accounts · {adminCount} administrators
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => { setTab('customers'); setSelected(null); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'customers' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Client Users
          </button>
          <button
            onClick={() => { setTab('admins'); setSelected(null); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === 'admins' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Administrators
          </button>
        </div>

        {tab === 'admins' && isSuperAdmin && (
          <button
            onClick={() => setShowCreateAdmin(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Administrator
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${tab === 'customers' ? 'clients' : 'administrators'} by name, email, or company…`}
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">{tab === 'customers' ? 'Company' : 'Role'}</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">{tab === 'customers' ? 'Type' : 'Joined'}</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500 text-sm">
                    No {tab === 'customers' ? 'client users' : 'administrators'} found.
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
                        <p className="text-white text-sm font-medium truncate">{u.full_name || 'Unnamed'}</p>
                        <p className="text-slate-500 text-xs truncate md:hidden">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-slate-300 text-sm">{u.email}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {tab === 'customers' ? (
                      <span className="text-slate-300 text-sm">{u.company || '—'}</span>
                    ) : (
                      <RoleBadge role={u.admin_role} />
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {tab === 'customers' ? (
                      <span className="text-slate-400 text-sm capitalize">{u.customer_type}</span>
                    ) : (
                      <span className="text-slate-400 text-sm">{new Date(u.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    {tab === 'admins' && isSuperAdmin && u.id !== session?.user?.id ? (
                      <button
                        onClick={() => deleteAdmin(u)}
                        disabled={toggling === u.id}
                        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                      >
                        {toggling === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Ban className="w-4 h-4" /> Revoke</>}
                      </button>
                    ) : tab === 'admins' && u.id === session?.user?.id ? (
                      <span className="text-xs text-slate-500">You</span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600 inline" />
                    )}
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
              <h2 className="text-sm font-semibold text-white">
                {selected.admin_role ? 'Administrator Details' : 'Client User Details'}
              </h2>
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

              <div className="flex items-center gap-2 flex-wrap">
                {selected.admin_role ? (
                  <RoleBadge role={selected.admin_role} />
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 text-sm font-medium">
                    <Shield className="w-4 h-4" /> Client
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

              {selected.admin_role && isSuperAdmin && selected.id !== session?.user?.id && (
                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assign Role</p>
                  {(['super_admin', 'admin', 'manager'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => updateAdminRole(selected, role)}
                      disabled={toggling === selected.id || selected.admin_role === role}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
                        selected.admin_role === role
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {role === 'super_admin' && <Crown className="w-4 h-4" />}
                        {role === 'admin' && <ShieldCheck className="w-4 h-4" />}
                        {role === 'manager' && <Shield className="w-4 h-4" />}
                        {role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Administrator' : 'Manager'}
                      </span>
                      {selected.admin_role === role && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                  <button
                    onClick={() => deleteAdmin(selected)}
                    disabled={toggling === selected.id}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors disabled:opacity-50"
                  >
                    {toggling === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Ban className="w-4 h-4" /> Revoke Admin Access</>}
                  </button>
                </div>
              )}

              {selected.admin_role && !isSuperAdmin && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg p-3">
                  <Lock className="w-3.5 h-3.5 flex-shrink-0" />
                  Only Super Admins can modify administrator roles.
                </div>
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

      {/* Create Admin Modal */}
      {showCreateAdmin && isSuperAdmin && (
        <CreateAdminModal
          onClose={() => setShowCreateAdmin(false)}
          onCreated={() => { setShowCreateAdmin(false); loadProfiles(); }}
          callManageAdmin={callManageAdmin}
        />
      )}

      {/* Non-super-admin notice */}
      {tab === 'admins' && !isSuperAdmin && (
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 bg-slate-900 border border-slate-800 rounded-xl p-4">
          <Lock className="w-4 h-4 flex-shrink-0" />
          Only Super Admins can create or modify administrator accounts.
        </div>
      )}
    </div>
  );
}

function RoleBadge({ role }: { role: string | null }) {
  if (role === 'super_admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium">
        <Crown className="w-3 h-3" /> Super Admin
      </span>
    );
  }
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
        <ShieldCheck className="w-3 h-3" /> Admin
      </span>
    );
  }
  if (role === 'manager') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium">
        <Shield className="w-3 h-3" /> Manager
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium">
      <Shield className="w-3 h-3" /> Client
    </span>
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

function CreateAdminModal({
  onClose,
  onCreated,
  callManageAdmin,
}: {
  onClose: () => void;
  onCreated: () => void;
  callManageAdmin: (method: string, body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'manager'>('admin');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      await callManageAdmin('POST', { email, password, full_name: fullName, phone, admin_role: role });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin');
    }
    setSubmitting(false);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-900 border-l border-slate-800 z-50 overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-blue-400" />
            Create Administrator
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
            <input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email <span className="text-red-400">*</span></label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@osil.co.ke"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password <span className="text-red-400">*</span></label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minimum 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Phone</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="+254 700 000 000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Role <span className="text-red-400">*</span></label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  role === 'admin' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <div className="text-left">
                  <p className="font-medium">Administrator</p>
                  <p className={`text-xs ${role === 'admin' ? 'text-blue-200' : 'text-slate-500'}`}>Full catalog, order, and customer management</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setRole('manager')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  role === 'manager' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                <div className="text-left">
                  <p className="font-medium">Manager</p>
                  <p className={`text-xs ${role === 'manager' ? 'text-blue-200' : 'text-slate-500'}`}>Limited admin portal access</p>
                </div>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-800/50 rounded-lg p-3">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            Super Admin role can only be assigned to existing admins from the user detail panel.
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create Admin
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

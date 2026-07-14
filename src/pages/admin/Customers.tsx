import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Search, TrendingUp, ShoppingBag, FileText, Mail,
  ChevronRight, Building2, Phone, ArrowUpRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CustomerRow {
  email: string;
  customer_name: string | null;
  phone: string | null;
  company: string | null;
  total_orders: number;
  total_quotes: number;
  total_revenue: number;
  last_activity: string;
}

function fmtKES(v: number) {
  return `KES ${v.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

function timeAgo(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime()) || d.getFullYear() < 1950) return '—';
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_customers')
      .select('*')
      .order('last_activity', { ascending: false });
    if (!error && data) setCustomers(data as CustomerRow[]);
    setLoading(false);
  }

  const filtered = search.trim()
    ? customers.filter(c =>
        [c.email, c.customer_name, c.company, c.phone]
          .some(v => v?.toLowerCase().includes(search.toLowerCase()))
      )
    : customers;

  const totalRevenue = customers.reduce((s, c) => s + (c.total_revenue || 0), 0);
  const totalOrders  = customers.reduce((s, c) => s + (c.total_orders || 0), 0);
  const totalQuotes  = customers.reduce((s, c) => s + (c.total_quotes || 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Customers</h1>
          <p className="text-slate-400 text-sm mt-0.5">Sales history and activity per customer</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Customers', value: customers.length.toString(), icon: Users, color: 'text-blue-400' },
          { label: 'Total Orders',    value: totalOrders.toString(),       icon: ShoppingBag, color: 'text-emerald-400' },
          { label: 'Total Quotes',    value: totalQuotes.toString(),        icon: FileText, color: 'text-amber-400' },
          { label: 'Total Revenue',   value: fmtKES(totalRevenue),         icon: TrendingUp, color: 'text-purple-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-400 font-medium">{label}</span>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, company or phone..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No customers found</p>
            <p className="text-slate-500 text-sm mt-1">Customers appear here once orders or quotes are submitted.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Orders</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Quotes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Last Active</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filtered.map(c => (
                  <tr key={c.email} className="hover:bg-slate-750 transition-colors group">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-900/60 border border-blue-700/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-300 uppercase">
                          {(c.customer_name ?? c.email).slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{c.customer_name ?? '—'}</p>
                          <p className="text-slate-400 text-xs truncate">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {c.company && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-300">
                            <Building2 className="w-3 h-3 text-slate-500" />
                            <span className="truncate max-w-[160px]">{c.company}</span>
                          </div>
                        )}
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        {!c.company && !c.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail className="w-3 h-3" />
                            <span>No extra contact info</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${c.total_orders > 0 ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-700 text-slate-500'}`}>
                        {c.total_orders}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${c.total_quotes > 0 ? 'bg-amber-900/40 text-amber-300' : 'bg-slate-700 text-slate-500'}`}>
                        {c.total_quotes}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                      <span className="text-white font-medium">{c.total_revenue > 0 ? fmtKES(c.total_revenue) : '—'}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                      <span className="text-slate-400 text-xs">{timeAgo(c.last_activity)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/admin/customers/${encodeURIComponent(c.email)}`}
                        className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-700 text-slate-400 hover:bg-blue-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-500 text-right">{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}

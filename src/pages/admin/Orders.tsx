import { useEffect, useState } from 'react';
import {
  Package, Search, Filter, RefreshCcw, ChevronDown, AlertCircle,
  Eye, CheckCircle2, Clock, Truck, XCircle, RotateCcw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { OrderStatus } from '../../types';

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  company_name: string | null;
  email: string;
  phone: string;
  county: string | null;
  order_status: string;
  created_at: string;
  order_items: { id: string; product_name: string; quantity: number }[];
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'awaiting_customer_confirmation', label: 'Awaiting Confirmation' },
  { value: 'processing', label: 'Processing' },
  { value: 'ready_for_delivery', label: 'Ready for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; icon: React.ElementType }> = {
  pending:                      { label: 'Pending',                   dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-300', icon: Clock },
  confirmed:                    { label: 'Confirmed',                  dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    text: 'text-blue-300',  icon: CheckCircle2 },
  awaiting_customer_confirmation:{ label: 'Awaiting Confirmation',     dot: 'bg-violet-400',  bg: 'bg-violet-500/10',  text: 'text-violet-300',icon: RotateCcw },
  processing:                   { label: 'Processing',                 dot: 'bg-sky-400',     bg: 'bg-sky-500/10',     text: 'text-sky-300',   icon: Package },
  ready_for_delivery:           { label: 'Ready for Delivery',         dot: 'bg-teal-400',    bg: 'bg-teal-500/10',    text: 'text-teal-300',  icon: Truck },
  delivered:                    { label: 'Delivered',                  dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-300',icon: CheckCircle2 },
  cancelled:                    { label: 'Cancelled',                  dot: 'bg-red-400',     bg: 'bg-red-500/10',     text: 'text-red-300',   icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className}`} />;
}

export function AdminOrders() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(id, product_name, quantity)')
        .order('created_at', { ascending: false });
      if (statusFilter) query = query.eq('order_status', statusFilter);
      const { data, error: err } = await query;
      if (err) throw err;
      setOrders((data ?? []) as OrderRow[]);
    } catch {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    setStatusMenuId(null);
    const { error: err } = await supabase
      .from('orders')
      .update({ order_status: newStatus })
      .eq('id', orderId);
    if (!err) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
    }
    setUpdatingId(null);
  }

  const filtered = orders.filter(o => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      (o.company_name ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Order Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">B2C direct purchase orders</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order number, name, email..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Order</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Items</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-16 rounded-lg" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <Package className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{search || statusFilter ? 'No orders match your filters' : 'No orders yet'}</p>
                  </td>
                </tr>
              ) : (
                filtered.map(order => (
                  <>
                    <tr
                      key={order.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="text-sm font-mono font-medium text-white">{order.order_number}</span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-white">{order.customer_name}</p>
                        {order.company_name && <p className="text-xs text-slate-500">{order.company_name}</p>}
                        <p className="text-xs text-slate-500">{order.email}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-slate-300">{order.order_items?.length ?? 0}</span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={order.order_status} />
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="text-xs text-slate-400">
                          {new Date(order.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Status change */}
                          <div className="relative">
                            <button
                              onClick={() => setStatusMenuId(statusMenuId === order.id ? null : order.id)}
                              disabled={updatingId === order.id}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2 py-1.5 rounded-lg transition-all disabled:opacity-40"
                            >
                              Update <ChevronDown className="w-3 h-3" />
                            </button>
                            {statusMenuId === order.id && (
                              <div className="absolute right-0 top-full mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                                {STATUS_OPTIONS.filter(o => o.value).map(opt => (
                                  <button
                                    key={opt.value}
                                    onClick={() => handleStatusChange(order.id, opt.value)}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${order.order_status === opt.value ? 'text-blue-300 bg-blue-500/10' : 'text-slate-300 hover:bg-slate-700'}`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded detail row */}
                    {expandedId === order.id && (
                      <tr key={`${order.id}-detail`} className="border-b border-slate-800/50 bg-slate-800/20">
                        <td colSpan={6} className="px-5 py-4">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Contact</p>
                              <p className="text-slate-200">{order.phone}</p>
                              <p className="text-slate-400">{order.email}</p>
                              {order.county && <p className="text-slate-400">{order.county}</p>}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Order Items</p>
                              {order.order_items?.map(item => (
                                <p key={item.id} className="text-slate-300 text-xs">{item.quantity}× {item.product_name}</p>
                              ))}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Placed</p>
                              <p className="text-slate-300">{new Date(order.created_at).toLocaleString('en-KE')}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
            Showing {filtered.length} of {orders.length} order{orders.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
              <span className="text-xs text-slate-500">{cfg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

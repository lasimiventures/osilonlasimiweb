import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Search, Filter, RefreshCcw, ChevronDown, AlertCircle,
  Eye, CheckCircle2, Clock, Truck, XCircle, RotateCcw, FileText,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number | null;
  subtotal: number | null;
}

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  company_name: string | null;
  email: string;
  phone: string;
  county: string | null;
  delivery_address: string | null;
  notes: string | null;
  order_status: string;
  created_at: string;
  total_value: number | null;
  quote_id: string | null;
  quote_number_ref: string | null;  // populated from a separate fetch if needed
  order_items: OrderItem[];
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '',                              label: 'All Statuses' },
  { value: 'processing',                   label: 'Processing' },
  { value: 'pending',                      label: 'Pending' },
  { value: 'confirmed',                    label: 'Confirmed' },
  { value: 'awaiting_customer_confirmation', label: 'Awaiting Confirmation' },
  { value: 'ready_for_delivery',           label: 'Ready for Delivery' },
  { value: 'delivered',                    label: 'Delivered' },
  { value: 'cancelled',                    label: 'Cancelled' },
];

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string; icon: React.ElementType }> = {
  pending:                       { label: 'Pending',                dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-300',  icon: Clock },
  confirmed:                     { label: 'Confirmed',               dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    text: 'text-blue-300',   icon: CheckCircle2 },
  awaiting_customer_confirmation:{ label: 'Awaiting Confirmation',  dot: 'bg-violet-400',  bg: 'bg-violet-500/10',  text: 'text-violet-300', icon: RotateCcw },
  processing:                    { label: 'Processing',              dot: 'bg-sky-400',     bg: 'bg-sky-500/10',     text: 'text-sky-300',    icon: Package },
  ready_for_delivery:            { label: 'Ready for Delivery',      dot: 'bg-teal-400',    bg: 'bg-teal-500/10',    text: 'text-teal-300',   icon: Truck },
  delivered:                     { label: 'Delivered',               dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-300', icon: CheckCircle2 },
  cancelled:                     { label: 'Cancelled',               dot: 'bg-red-400',     bg: 'bg-red-500/10',     text: 'text-red-300',    icon: XCircle },
};

function fmtKES(n: number | null | undefined) {
  if (n == null) return '—';
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

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
  const [sourceFilter, setSourceFilter] = useState<'all' | 'quote' | 'direct'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('orders')
        .select('*, order_items(id, product_name, product_sku, quantity, unit_price, subtotal)')
        .order('created_at', { ascending: false });
      if (statusFilter) query = query.eq('order_status', statusFilter);
      const { data, error: err } = await query;
      if (err) throw err;
      // Fetch quote numbers for converted orders
      const quoteIds = (data ?? []).filter(o => o.quote_id).map(o => o.quote_id);
      if (quoteIds.length > 0) {
        const { data: quotes } = await supabase
          .from('quote_requests')
          .select('id, quote_number')
          .in('id', quoteIds);
        const qMap = Object.fromEntries((quotes ?? []).map(q => [q.id, q.quote_number]));
        setOrders((data ?? []).map(o => ({ ...o, quote_number_ref: o.quote_id ? (qMap[o.quote_id] ?? null) : null })) as OrderRow[]);
      } else {
        setOrders((data ?? []) as OrderRow[]);
      }
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
    if (!err) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
    setUpdatingId(null);
  }

  const filtered = orders.filter(o => {
    if (sourceFilter === 'quote' && !o.quote_id) return false;
    if (sourceFilter === 'direct' && o.quote_id) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      (o.company_name ?? '').toLowerCase().includes(q)
    );
  });

  const fromQuoteCount = orders.filter(o => o.quote_id).length;
  const directCount = orders.filter(o => !o.quote_id).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto" onClick={() => setStatusMenuId(null)}>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Order Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Purchase orders from direct checkout and converted quotes</p>
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

      {/* Source tabs */}
      <div className="flex gap-2 mb-5">
        {([
          { key: 'all',    label: 'All Orders',      count: orders.length },
          { key: 'quote',  label: 'From Quotes',     count: fromQuoteCount },
          { key: 'direct', label: 'Direct Checkout', count: directCount },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setSourceFilter(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              sourceFilter === t.key
                ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
          >
            {t.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${
              sourceFilter === t.key ? 'bg-blue-600/30 text-blue-200' : 'bg-slate-800 text-slate-500'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by order number, name, email..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Total</th>
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
                    <td className="px-5 py-4 hidden lg:table-cell"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-6 w-24 rounded-lg" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-8 w-16 rounded-lg" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Package className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{search || statusFilter ? 'No orders match your filters' : 'No orders yet'}</p>
                  </td>
                </tr>
              ) : (
                filtered.flatMap(order => {
                  const rows = [];
                  rows.push(
                    <tr
                      key={order.id}
                      className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          <span className="text-sm font-mono font-medium text-white">{order.order_number}</span>
                          {order.quote_id && (
                            <span className="flex items-center gap-1 text-xs text-emerald-400">
                              <FileText className="w-3 h-3" />
                              {order.quote_number_ref ?? 'From Quote'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-white">{order.customer_name}</p>
                        {order.company_name && <p className="text-xs text-slate-500">{order.company_name}</p>}
                        <p className="text-xs text-slate-500">{order.email}</p>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-sm text-slate-300">{order.order_items?.length ?? 0}</span>
                      </td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className="text-sm font-medium text-slate-200">{fmtKES(order.total_value)}</span>
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
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {order.quote_id && (
                            <Link
                              to={`/admin/quotes/${order.quote_id}`}
                              className="text-slate-400 hover:text-emerald-400 transition-colors"
                              title="View source quote"
                            >
                              <FileText className="w-4 h-4" />
                            </Link>
                          )}
                          <div className="relative">
                            <button
                              onClick={() => setStatusMenuId(statusMenuId === order.id ? null : order.id)}
                              disabled={updatingId === order.id}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2 py-1.5 rounded-lg transition-all disabled:opacity-40"
                            >
                              Update <ChevronDown className="w-3 h-3" />
                            </button>
                            {statusMenuId === order.id && (
                              <div className="absolute right-0 top-full mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-1">
                                {STATUS_OPTIONS.filter(o => o.value).map(opt => (
                                  <button
                                    key={opt.value}
                                    onClick={() => handleStatusChange(order.id, opt.value)}
                                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                      order.order_status === opt.value
                                        ? 'text-blue-300 bg-blue-500/10'
                                        : 'text-slate-300 hover:bg-slate-700'
                                    }`}
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
                  );

                  if (expandedId === order.id) {
                    rows.push(
                      <tr key={`${order.id}-detail`} className="border-b border-slate-800/50 bg-slate-800/20">
                        <td colSpan={7} className="px-5 py-5">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-sm">
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Contact</p>
                              <p className="text-slate-200">{order.customer_name}</p>
                              {order.company_name && <p className="text-slate-400">{order.company_name}</p>}
                              <p className="text-slate-400 mt-1">{order.phone}</p>
                              <p className="text-slate-400">{order.email}</p>
                              {order.county && <p className="text-slate-400 mt-1">{order.county}</p>}
                              {order.delivery_address && <p className="text-slate-400">{order.delivery_address}</p>}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Order Items</p>
                              <div className="space-y-1">
                                {order.order_items?.map(item => (
                                  <div key={item.id} className="flex items-center justify-between gap-2">
                                    <span className="text-slate-300 text-xs">{item.quantity}× {item.product_name}</span>
                                    {item.subtotal != null && (
                                      <span className="text-slate-400 text-xs font-mono flex-shrink-0">{fmtKES(item.subtotal)}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                              {order.total_value != null && (
                                <div className="mt-3 pt-2 border-t border-slate-700 flex justify-between">
                                  <span className="text-xs font-semibold text-slate-400">Order Total</span>
                                  <span className="text-sm font-bold text-white">{fmtKES(order.total_value)}</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Order Details</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Order #</span>
                                  <span className="text-slate-200 font-mono">{order.order_number}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Placed</span>
                                  <span className="text-slate-200">{new Date(order.created_at).toLocaleString('en-KE')}</span>
                                </div>
                                {order.quote_id && (
                                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700">
                                    <span className="text-slate-500">Source Quote</span>
                                    <Link
                                      to={`/admin/quotes/${order.quote_id}`}
                                      className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-mono font-semibold"
                                    >
                                      <FileText className="w-3 h-3" />
                                      {order.quote_number_ref ?? 'View Quote'}
                                    </Link>
                                  </div>
                                )}
                              </div>
                              {order.notes && (
                                <div className="mt-3">
                                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Notes</p>
                                  <p className="text-xs text-slate-400">{order.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return rows;
                })
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
    </div>
  );
}

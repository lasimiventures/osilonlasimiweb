import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingBag, FileText, ShoppingCart, Clock, MessageSquare,
  Building2, Phone, Mail, Globe, ChevronRight, Package, Plus, X,
  CheckCircle, AlertCircle, Send, StickyNote, PhoneCall, Loader2,
  TrendingUp, Calendar, Hash,
} from 'lucide-react';
import { supabaseAdmin as supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  total_value: number | null;
  created_at: string;
  source: string;
  quote_number_ref: string | null;
  order_items: Array<{ id: string; product_name: string; product_sku: string | null; quantity: number; unit_price: number | null; subtotal: number | null }>;
}

interface QuoteRow {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company: string | null;
  status: string;
  total_value: number | null;
  total_items: number;
  submitted_at: string | null;
  created_at: string;
  source: string;
  linked_order_number: string | null;
  message: string | null;
  quote_items: Array<{ id: string; product_name: string; product_sku: string | null; quantity: number; unit_price: number | null; subtotal: number | null }>;
}

interface OrderHistory {
  id: string;
  order_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  actor: string | null;
  created_at: string;
}

interface QuoteHistory {
  id: string;
  quote_request_id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  actor: string | null;
  created_at: string;
}

interface Communication {
  id: string;
  customer_email: string;
  type: 'email' | 'note' | 'call';
  subject: string | null;
  body_preview: string | null;
  actor: string | null;
  quote_id: string | null;
  order_id: string | null;
  sent_at: string;
}

type Tab = 'overview' | 'orders' | 'quotes' | 'bulk' | 'cart' | 'order-status' | 'quote-status' | 'comms';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtKES(v: number | null) {
  if (v == null) return '—';
  return `KES ${v.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending:                       'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  confirmed:                     'bg-blue-900/40 text-blue-300 border-blue-700/40',
  awaiting_customer_confirmation:'bg-orange-900/40 text-orange-300 border-orange-700/40',
  processing:                    'bg-purple-900/40 text-purple-300 border-purple-700/40',
  ready_for_delivery:            'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
  delivered:                     'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  cancelled:                     'bg-red-900/40 text-red-300 border-red-700/40',
};

const QUOTE_STATUS_COLORS: Record<string, string> = {
  draft:                 'bg-slate-700 text-slate-300 border-slate-600',
  submitted:             'bg-blue-900/40 text-blue-300 border-blue-700/40',
  under_review:          'bg-purple-900/40 text-purple-300 border-purple-700/40',
  quoted:                'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
  awaiting_customer:     'bg-amber-900/40 text-amber-300 border-amber-700/40',
  accepted:              'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  rejected:              'bg-red-900/40 text-red-300 border-red-700/40',
  expired:               'bg-slate-700 text-slate-400 border-slate-600',
  converted_to_order:    'bg-teal-900/40 text-teal-300 border-teal-700/40',
};

function statusLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function StatusBadge({ status, map }: { status: string; map: Record<string, string> }) {
  const cls = map[status] ?? 'bg-slate-700 text-slate-300 border-slate-600';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {statusLabel(status)}
    </span>
  );
}

// ─── Tabs definition ──────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview',      label: 'Overview',           icon: TrendingUp },
  { id: 'orders',        label: 'Orders',             icon: ShoppingBag },
  { id: 'quotes',        label: 'Quotes',             icon: FileText },
  { id: 'bulk',          label: 'Bulk Quotes',        icon: Package },
  { id: 'cart',          label: 'Cart History',       icon: ShoppingCart },
  { id: 'order-status',  label: 'Order Status',       icon: Clock },
  { id: 'quote-status',  label: 'Quote Status',       icon: Clock },
  { id: 'comms',         label: 'Communications',     icon: MessageSquare },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminCustomerDetail() {
  const { email: encodedEmail } = useParams<{ email: string }>();
  const navigate = useNavigate();
  const email = encodedEmail ? decodeURIComponent(encodedEmail) : '';

  const [tab, setTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [quoteHistory, setQuoteHistory] = useState<QuoteHistory[]>([]);
  const [comms, setComms] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);

  // New communication form
  const [showAddComm, setShowAddComm] = useState(false);
  const [commForm, setCommForm] = useState({ type: 'note' as 'email' | 'note' | 'call', subject: '', body_preview: '' });
  const [savingComm, setSavingComm] = useState(false);

  const load = useCallback(async () => {
    if (!email) return;
    setLoading(true);

    const [ordersRes, quotesRes] = await Promise.all([
      supabase
        .from('orders')
        .select('*, order_items(*)')
        .ilike('email', email)
        .order('created_at', { ascending: false }),
      supabase
        .from('quote_requests')
        .select('*, quote_items(*)')
        .ilike('customer_email', email)
        .order('created_at', { ascending: false }),
    ]);

    const ordersData: OrderRow[] = (ordersRes.data ?? []) as OrderRow[];
    const quotesData: QuoteRow[] = (quotesRes.data ?? []) as QuoteRow[];
    setOrders(ordersData);
    setQuotes(quotesData);

    const orderIds = ordersData.map(o => o.id);
    const quoteIds = quotesData.map(q => q.id);

    const [ohRes, qhRes, commsRes] = await Promise.all([
      orderIds.length > 0
        ? supabase.from('order_history').select('*').in('order_id', orderIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      quoteIds.length > 0
        ? supabase.from('quote_history').select('*').in('quote_request_id', quoteIds).order('created_at', { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase.from('customer_communications').select('*').ilike('customer_email', email).order('sent_at', { ascending: false }),
    ]);

    setOrderHistory((ohRes.data ?? []) as OrderHistory[]);
    setQuoteHistory((qhRes.data ?? []) as QuoteHistory[]);
    setComms((commsRes.data ?? []) as Communication[]);
    setLoading(false);
  }, [email]);

  useEffect(() => { load(); }, [load]);

  async function addCommunication() {
    if (!commForm.subject.trim()) return;
    setSavingComm(true);
    const { error } = await supabase.from('customer_communications').insert({
      customer_email: email,
      type: commForm.type,
      subject: commForm.subject,
      body_preview: commForm.body_preview || null,
    });
    if (!error) {
      setCommForm({ type: 'note', subject: '', body_preview: '' });
      setShowAddComm(false);
      await load();
    }
    setSavingComm(false);
  }

  if (!email) {
    navigate('/admin/customers');
    return null;
  }

  // Derived data
  const regularQuotes = quotes.filter(q => q.source !== 'bulk_pricing');
  const bulkQuotes    = quotes.filter(q => q.source === 'bulk_pricing');
  const cartOrders    = orders.filter(o => o.source === 'cart');
  const customerName  = orders[0]?.customer_name ?? quotes[0]?.customer_name ?? email;
  const company       = orders[0]?.company_name  ?? quotes[0]?.company ?? null;
  const phone         = orders[0]?.phone         ?? quotes[0]?.customer_phone ?? null;
  const totalRevenue  = orders.reduce((s, o) => s + (o.total_value ?? 0), 0);

  // ─── Tab Contents ────────────────────────────────────────────────────────────

  function renderOverview() {
    const stats = [
      { label: 'Total Orders',   value: orders.length.toString(),        icon: ShoppingBag, color: 'text-emerald-400' },
      { label: 'Total Quotes',   value: quotes.length.toString(),        icon: FileText,    color: 'text-amber-400' },
      { label: 'Bulk Quotes',    value: bulkQuotes.length.toString(),    icon: Package,     color: 'text-purple-400' },
      { label: 'Cart Orders',    value: cartOrders.length.toString(),    icon: ShoppingCart,color: 'text-cyan-400' },
      { label: 'Lifetime Value', value: fmtKES(totalRevenue),            icon: TrendingUp,  color: 'text-blue-400' },
      { label: 'Communications', value: comms.length.toString(),         icon: MessageSquare,color:'text-rose-400' },
    ];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="px-5 py-4 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
          </div>
          <div className="divide-y divide-slate-700/60">
            {[
              ...orders.slice(0, 3).map(o => ({ type: 'order' as const, label: `Order ${o.order_number}`, sub: statusLabel(o.order_status), date: o.created_at, link: '/admin/orders' })),
              ...quotes.slice(0, 3).map(q => ({ type: 'quote' as const, label: `Quote ${q.quote_number}`, sub: statusLabel(q.status), date: q.created_at, link: `/admin/quotes/${q.id}/build` })),
            ]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 6)
              .map((item, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${item.type === 'order' ? 'bg-emerald-900/40' : 'bg-amber-900/40'}`}>
                    {item.type === 'order'
                      ? <ShoppingBag className="w-4 h-4 text-emerald-400" />
                      : <FileText className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.sub}</p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{fmtDate(item.date)}</span>
                  <Link to={item.link} className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700 text-slate-400 hover:bg-blue-600 hover:text-white transition-colors flex-shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            {orders.length === 0 && quotes.length === 0 && (
              <p className="px-5 py-8 text-center text-slate-500 text-sm">No activity yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderOrdersTable(rows: OrderRow[], emptyMsg: string) {
    if (rows.length === 0) return <Empty message={emptyMsg} />;
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Order #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Value</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {rows.map(o => (
                <tr key={o.id} className="hover:bg-slate-750 transition-colors">
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-white font-mono font-semibold text-xs">{o.order_number}</p>
                      {o.quote_number_ref && <p className="text-slate-500 text-xs">from {o.quote_number_ref}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <p className="text-slate-300 text-xs">{o.order_items?.length ?? 0} item{o.order_items?.length !== 1 ? 's' : ''}</p>
                    <p className="text-slate-500 text-xs truncate max-w-[180px]">{o.order_items?.[0]?.product_name}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={o.order_status} map={ORDER_STATUS_COLORS} />
                  </td>
                  <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                    <span className="text-white font-medium">{fmtKES(o.total_value)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-slate-400 text-xs">{fmtDate(o.created_at)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function renderQuotesTable(rows: QuoteRow[], emptyMsg: string) {
    if (rows.length === 0) return <Empty message={emptyMsg} />;
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Quote #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Items</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Value</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60">
              {rows.map(q => (
                <tr key={q.id} className="hover:bg-slate-750 transition-colors group">
                  <td className="px-4 py-3.5">
                    <div>
                      <p className="text-white font-mono font-semibold text-xs">{q.quote_number}</p>
                      {q.linked_order_number && <p className="text-emerald-400 text-xs">→ {q.linked_order_number}</p>}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <p className="text-slate-300 text-xs">{q.total_items} item{q.total_items !== 1 ? 's' : ''}</p>
                    <p className="text-slate-500 text-xs truncate max-w-[180px]">{q.quote_items?.[0]?.product_name}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={q.status} map={QUOTE_STATUS_COLORS} />
                  </td>
                  <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                    <span className="text-white font-medium">{fmtKES(q.total_value)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="text-slate-400 text-xs">{fmtDate(q.created_at)}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      to={`/admin/quotes/${q.id}/build`}
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
      </div>
    );
  }

  function renderTimeline(events: Array<{ id: string; event_type: string; from_status: string | null; to_status: string | null; actor: string | null; created_at: string; label?: string }>, emptyMsg: string, statusMap: Record<string, string>) {
    if (events.length === 0) return <Empty message={emptyMsg} />;
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="divide-y divide-slate-700/60">
          {events.map((e, i) => (
            <div key={e.id} className="flex gap-4 px-5 py-4">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i === 0 ? 'bg-blue-600' : 'bg-slate-700'}`}>
                  <Clock className={`w-4 h-4 ${i === 0 ? 'text-white' : 'text-slate-400'}`} />
                </div>
                {i < events.length - 1 && <div className="flex-1 w-px bg-slate-700 my-1" />}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-white font-medium">{statusLabel(e.event_type)}</p>
                    {e.label && <p className="text-xs text-slate-400 font-mono">{e.label}</p>}
                    {e.from_status && e.to_status && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <StatusBadge status={e.from_status} map={statusMap} />
                        <span className="text-slate-500 text-xs">→</span>
                        <StatusBadge status={e.to_status} map={statusMap} />
                      </div>
                    )}
                    {e.actor && <p className="text-xs text-slate-500 mt-1">by {e.actor}</p>}
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0">{fmtDateTime(e.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderOrderStatus() {
    const events = orderHistory.map(h => {
      const order = orders.find(o => o.id === h.order_id);
      return { ...h, label: order?.order_number };
    });
    return renderTimeline(events, 'No order status changes recorded yet.', ORDER_STATUS_COLORS);
  }

  function renderQuoteStatus() {
    const events = quoteHistory.map(h => {
      const quote = quotes.find(q => q.id === h.quote_request_id);
      return { ...h, label: quote?.quote_number };
    });
    return renderTimeline(events, 'No quote status changes recorded yet.', QUOTE_STATUS_COLORS);
  }

  function renderComms() {
    const typeIcons = { email: Mail, note: StickyNote, call: PhoneCall };
    const typeColors = { email: 'bg-blue-900/40 text-blue-400', note: 'bg-amber-900/40 text-amber-400', call: 'bg-emerald-900/40 text-emerald-400' };

    return (
      <div className="space-y-4">
        {/* Add communication */}
        {showAddComm ? (
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Log Communication</h3>
              <button onClick={() => setShowAddComm(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              {(['email', 'note', 'call'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setCommForm(p => ({ ...p, type: t }))}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors capitalize ${commForm.type === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-700 border-slate-600 text-slate-400 hover:text-white'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Subject / Title *</label>
              <input
                value={commForm.subject}
                onChange={e => setCommForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="e.g. Sent quote PDF, Follow-up call, Discount agreed"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Notes</label>
              <textarea
                value={commForm.body_preview}
                onChange={e => setCommForm(p => ({ ...p, body_preview: e.target.value }))}
                rows={3}
                placeholder="Details, follow-up actions, agreed items..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddComm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={addCommunication}
                disabled={savingComm || !commForm.subject.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingComm ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddComm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Log Communication
          </button>
        )}

        {/* Communications list */}
        {comms.length === 0 ? (
          <Empty message="No communications logged yet." />
        ) : (
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-700/60">
              {comms.map(c => {
                const Icon = typeIcons[c.type];
                const cls  = typeColors[c.type];
                return (
                  <div key={c.id} className="flex gap-4 px-5 py-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-white font-medium">{c.subject}</p>
                          {c.body_preview && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{c.body_preview}</p>}
                          {c.actor && <p className="text-xs text-slate-500 mt-1">by {c.actor}</p>}
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">{fmtDateTime(c.sent_at)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link to="/admin/customers" className="flex-shrink-0 mt-1 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors border border-slate-700">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-white truncate">{customerName}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span className="flex items-center gap-1.5 text-sm text-slate-400">
              <Mail className="w-3.5 h-3.5" /> {email}
            </span>
            {phone && (
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <Phone className="w-3.5 h-3.5" /> {phone}
              </span>
            )}
            {company && (
              <span className="flex items-center gap-1.5 text-sm text-slate-400">
                <Building2 className="w-3.5 h-3.5" /> {company}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-2xl font-bold text-white">{fmtKES(totalRevenue)}</span>
          <span className="text-xs text-slate-500">lifetime value</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700 scrollbar-hide">
        {TABS.map(({ id, label, icon: Icon }) => {
          const counts: Partial<Record<Tab, number>> = {
            orders: orders.length,
            quotes: regularQuotes.length,
            bulk: bulkQuotes.length,
            cart: cartOrders.length,
            'order-status': orderHistory.length,
            'quote-status': quoteHistory.length,
            comms: comms.length,
          };
          const count = counts[id];
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                tab === id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {count !== undefined && count > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs leading-none ${tab === id ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div>
          {tab === 'overview'     && renderOverview()}
          {tab === 'orders'       && renderOrdersTable(orders, 'No orders for this customer yet.')}
          {tab === 'quotes'       && renderQuotesTable(regularQuotes, 'No quotes submitted yet.')}
          {tab === 'bulk'         && renderQuotesTable(bulkQuotes, 'No bulk pricing requests yet.')}
          {tab === 'cart'         && renderOrdersTable(cartOrders, 'No cart orders yet. Cart orders are created via the online checkout.')}
          {tab === 'order-status' && renderOrderStatus()}
          {tab === 'quote-status' && renderQuoteStatus()}
          {tab === 'comms'        && renderComms()}
        </div>
      )}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 py-16 text-center">
      <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

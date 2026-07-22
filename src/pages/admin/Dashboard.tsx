import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package, Layers, Tag, FileText, Clock,
  ArrowRight, CheckCircle2, XCircle, Circle,
  AlertCircle, Search, RefreshCcw, ShoppingBag,
  Image, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../context/AdminAuthContext';

// ─── types ────────────────────────────────────────────────────────────────────

interface Stats {
  products: number;
  categories: number;
  brands: number;
  quotes: number;
  pendingQuotes: number;
  orders: number;
  pendingOrders: number;
}

interface DayBucket { date: string; label: string; quotes: number; orders: number }
interface AvailabilityBreakdown { 'in-stock': number; 'low-stock': number; 'out-of-stock': number; 'pre-order': number }
interface QuoteStatusBreakdown { [key: string]: number }
interface OrderStatusBreakdown { [key: string]: number }

interface RecentQuote {
  id: string; reference: string; customer_name: string;
  company: string | null; total_items: number; status: string; submitted_at: string;
}

// ─── config ───────────────────────────────────────────────────────────────────

const QUOTE_STATUS: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  draft:              { label: 'Draft',              dot: 'bg-slate-400',   bg: 'bg-slate-500/10',   text: 'text-slate-300' },
  submitted:          { label: 'Submitted',          dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-300' },
  under_review:       { label: 'Under Review',       dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    text: 'text-blue-300' },
  quoted:             { label: 'Quoted',             dot: 'bg-sky-400',     bg: 'bg-sky-500/10',     text: 'text-sky-300' },
  awaiting_customer:  { label: 'Awaiting Customer',  dot: 'bg-orange-400',  bg: 'bg-orange-500/10',  text: 'text-orange-300' },
  accepted:           { label: 'Accepted',           dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
  rejected:           { label: 'Rejected',           dot: 'bg-red-400',     bg: 'bg-red-500/10',     text: 'text-red-300' },
  expired:            { label: 'Expired',            dot: 'bg-zinc-400',    bg: 'bg-zinc-500/10',    text: 'text-zinc-300' },
  converted_to_order: { label: 'Converted to Order', dot: 'bg-teal-400',    bg: 'bg-teal-500/10',    text: 'text-teal-300' },
  // backward compat for any pre-migration rows
  pending:            { label: 'Submitted',          dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-300' },
  reviewing:          { label: 'Under Review',       dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    text: 'text-blue-300' },
  declined:           { label: 'Rejected',           dot: 'bg-red-400',     bg: 'bg-red-500/10',     text: 'text-red-300' },
};

const ORDER_STATUS: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  pending:                        { label: 'Pending',              dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-300' },
  confirmed:                      { label: 'Confirmed',            dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    text: 'text-blue-300' },
  awaiting_customer_confirmation: { label: 'Awaiting Confirm.',    dot: 'bg-cyan-400',    bg: 'bg-cyan-500/10',    text: 'text-cyan-300' },
  processing:                     { label: 'Processing',           dot: 'bg-teal-400',    bg: 'bg-teal-500/10',    text: 'text-teal-300' },
  ready_for_delivery:             { label: 'Ready for Delivery',   dot: 'bg-indigo-400',  bg: 'bg-indigo-500/10',  text: 'text-indigo-300' },
  delivered:                      { label: 'Delivered',            dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
  cancelled:                      { label: 'Cancelled',            dot: 'bg-red-400',     bg: 'bg-red-500/10',     text: 'text-red-300' },
};

const AVAIL_CONFIG: Record<string, { label: string; color: string; bar: string }> = {
  'in-stock':     { label: 'In Stock',     color: 'text-emerald-400', bar: 'bg-emerald-500' },
  'low-stock':    { label: 'Low Stock',    color: 'text-amber-400',   bar: 'bg-amber-500' },
  'out-of-stock': { label: 'Out of Stock', color: 'text-red-400',     bar: 'bg-red-500' },
  'pre-order':    { label: 'Pre-Order',    color: 'text-blue-400',    bar: 'bg-blue-500' },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' });
}

function buildDayBuckets(period: number): DayBucket[] {
  const buckets: DayBucket[] = [];
  const now = new Date();
  for (let i = period - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.push({
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric' }),
      quotes: 0,
      orders: 0,
    });
  }
  return buckets;
}

function trendIcon(current: number, prior: number) {
  if (prior === 0 && current === 0) return <Minus className="w-3.5 h-3.5 text-slate-600" />;
  if (current > prior) return <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />;
  if (current < prior) return <TrendingDown className="w-3.5 h-3.5 text-red-400" />;
  return <Minus className="w-3.5 h-3.5 text-slate-600" />;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className ?? ''}`} />;
}

function StatusBadge({ status, cfg }: { status: string; cfg: typeof QUOTE_STATUS }) {
  const c = cfg[status] ?? cfg.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}

interface StatCardProps {
  label: string; value: number | undefined; sub?: string;
  icon: React.ElementType; iconColor: string; iconBg: string; ring: string; loading: boolean;
}
function StatCard({ label, value, sub, icon: Icon, iconColor, iconBg, ring, loading }: StatCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ring-1 flex items-center justify-center ${iconBg} ${ring}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      {loading ? (
        <><Skeleton className="h-8 w-16 mb-1" /><Skeleton className="h-3 w-24" /></>
      ) : (
        <>
          <p className="text-3xl font-bold text-white tabular-nums">{value?.toLocaleString()}</p>
          <p className="text-slate-400 text-sm mt-0.5">{label}</p>
          {sub && <p className="text-xs mt-1.5 text-slate-500">{sub}</p>}
        </>
      )}
    </div>
  );
}

// ─── trend chart ──────────────────────────────────────────────────────────────

const CHART_HEIGHT = 72; // px for bars area

function TrendChart({ data, loading }: { data: DayBucket[]; loading: boolean }) {
  const maxVal = Math.max(...data.flatMap(d => [d.quotes, d.orders]), 1);
  const totalQuotes = data.reduce((s, d) => s + d.quotes, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  // For period-over-period indicator: split in half
  const half = Math.floor(data.length / 2);
  const recentQuotes = data.slice(half).reduce((s, d) => s + d.quotes, 0);
  const priorQuotes  = data.slice(0, half).reduce((s, d) => s + d.quotes, 0);
  const recentOrders = data.slice(half).reduce((s, d) => s + d.orders, 0);
  const priorOrders  = data.slice(0, half).reduce((s, d) => s + d.orders, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-sm font-semibold text-white">Activity — Last {data.length} Days</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500/70 flex-shrink-0" />
            <span className="text-xs text-slate-400">Quotes</span>
            <span className="text-xs font-semibold text-white tabular-nums ml-1">{totalQuotes}</span>
            {trendIcon(recentQuotes, priorQuotes)}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/70 flex-shrink-0" />
            <span className="text-xs text-slate-400">Orders</span>
            <span className="text-xs font-semibold text-white tabular-nums ml-1">{totalOrders}</span>
            {trendIcon(recentOrders, priorOrders)}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-end gap-1" style={{ height: CHART_HEIGHT + 24 }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
              <Skeleton className="w-full" style={{ height: `${20 + Math.random() * 40}px` } as React.CSSProperties} />
              <Skeleton className="w-4 h-2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Bars */}
          <div className="flex items-end gap-0.5" style={{ height: CHART_HEIGHT }}>
            {data.map(day => {
              const qH = Math.max(day.quotes > 0 ? 4 : 0, Math.round((day.quotes / maxVal) * CHART_HEIGHT));
              const oH = Math.max(day.orders > 0 ? 4 : 0, Math.round((day.orders / maxVal) * CHART_HEIGHT));
              return (
                <div key={day.date} className="flex-1 flex items-end gap-px group">
                  <div
                    style={{ height: qH }}
                    className="flex-1 bg-blue-500/60 rounded-t-sm group-hover:bg-blue-400/80 transition-colors cursor-default min-h-[2px]"
                    title={`${day.label}: ${day.quotes} quote${day.quotes !== 1 ? 's' : ''}`}
                  />
                  <div
                    style={{ height: oH }}
                    className="flex-1 bg-emerald-500/60 rounded-t-sm group-hover:bg-emerald-400/80 transition-colors cursor-default min-h-[2px]"
                    title={`${day.label}: ${day.orders} order${day.orders !== 1 ? 's' : ''}`}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis labels — show every other day to avoid crowding */}
          <div className="flex gap-0.5 mt-1.5">
            {data.map((day, i) => (
              <div key={day.date} className="flex-1 text-center">
                {i % 2 === 0 && (
                  <span className="text-[9px] text-slate-600 whitespace-nowrap">{day.label.split(' ')[1]}</span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── status breakdown widget ──────────────────────────────────────────────────

function StatusWidget({
  title, breakdown, config, loading,
}: {
  title: string;
  breakdown: Record<string, number> | null;
  config: Record<string, { label: string; dot: string; bg: string; text: string }>;
  loading: boolean;
}) {
  const total = breakdown ? Object.values(breakdown).reduce((a, b) => a + b, 0) : 0;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-6 w-24 rounded-lg" />
              <Skeleton className="h-4 w-6" />
            </div>
          ))}
        </div>
      ) : breakdown && total > 0 ? (
        <div className="space-y-2">
          {(Object.entries(breakdown) as [string, number][])
            .filter(([, v]) => v > 0)
            .sort(([, a], [, b]) => b - a)
            .map(([key, count]) => {
              const cfg = config[key] ?? config.pending;
              return (
                <div key={key} className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg} ${cfg.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    {cfg.label}
                  </span>
                  <span className="text-slate-300 text-sm font-semibold tabular-nums">{count}</span>
                </div>
              );
            })}
        </div>
      ) : (
        <p className="text-slate-500 text-xs text-center py-4">No data yet</p>
      )}
    </div>
  );
}

// ─── main dashboard ───────────────────────────────────────────────────────────

const TREND_DAYS = 14;

export function AdminDashboard() {
  const { session } = useAdminAuth();
  const navigate = useNavigate();

  const [stats, setStats]                       = useState<Stats | null>(null);
  const [availability, setAvailability]         = useState<AvailabilityBreakdown | null>(null);
  const [quoteStatus, setQuoteStatus]           = useState<QuoteStatusBreakdown | null>(null);
  const [orderStatus, setOrderStatus]           = useState<OrderStatusBreakdown | null>(null);
  const [trendData, setTrendData]               = useState<DayBucket[]>(buildDayBuckets(TREND_DAYS));
  const [recentQuotes, setRecentQuotes]         = useState<RecentQuote[] | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const trendFrom = new Date();
      trendFrom.setDate(trendFrom.getDate() - (TREND_DAYS - 1));
      trendFrom.setHours(0, 0, 0, 0);
      const trendFromStr = trendFrom.toISOString();

      const [
        pRes, cRes, bRes,
        qRes, qPendRes,
        oRes, oPendRes,
        availRes, qStatusRes, oStatusRes,
        quoteTrendRes, orderTrendRes,
        recentRes,
      ] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('brands').select('id', { count: 'exact', head: true }),
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }),
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('order_status', 'pending'),
        supabase.from('products').select('availability'),
        supabase.from('quote_requests').select('status'),
        supabase.from('orders').select('order_status'),
        supabase.from('quote_requests').select('submitted_at').gte('submitted_at', trendFromStr),
        supabase.from('orders').select('created_at').gte('created_at', trendFromStr),
        supabase
          .from('quote_requests')
          .select('id, reference, customer_name, company, total_items, status, submitted_at')
          .order('submitted_at', { ascending: false })
          .limit(8),
      ]);

      setStats({
        products: pRes.count ?? 0,
        categories: cRes.count ?? 0,
        brands: bRes.count ?? 0,
        quotes: qRes.count ?? 0,
        pendingQuotes: qPendRes.count ?? 0,
        orders: oRes.count ?? 0,
        pendingOrders: oPendRes.count ?? 0,
      });

      // Availability breakdown
      const avail: AvailabilityBreakdown = { 'in-stock': 0, 'low-stock': 0, 'out-of-stock': 0, 'pre-order': 0 };
      (availRes.data ?? []).forEach((r: { availability: string }) => {
        const k = r.availability as keyof AvailabilityBreakdown;
        if (k in avail) avail[k]++;
      });
      setAvailability(avail);

      // Quote status breakdown
      const qs: QuoteStatusBreakdown = {};
      (qStatusRes.data ?? []).forEach((r: { status: string }) => {
        const k = r.status ?? 'submitted';
        qs[k] = (qs[k] ?? 0) + 1;
      });
      setQuoteStatus(qs);

      // Order status breakdown
      const os: OrderStatusBreakdown = {};
      (oStatusRes.data ?? []).forEach((r: { order_status: string }) => {
        const k = r.order_status ?? 'pending';
        os[k] = (os[k] ?? 0) + 1;
      });
      setOrderStatus(os);

      // Trend data
      const buckets = buildDayBuckets(TREND_DAYS);
      (quoteTrendRes.data ?? []).forEach((r: { submitted_at: string }) => {
        const day = r.submitted_at?.split('T')[0];
        const b = buckets.find(d => d.date === day);
        if (b) b.quotes++;
      });
      (orderTrendRes.data ?? []).forEach((r: { created_at: string }) => {
        const day = r.created_at?.split('T')[0];
        const b = buckets.find(d => d.date === day);
        if (b) b.orders++;
      });
      setTrendData(buckets);

      setRecentQuotes((recentRes.data as RecentQuote[]) ?? []);
    } catch {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDashboardData(); }, []);

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = session?.user?.email?.split('@')[0] ?? 'Admin';

  const totalAvail = availability ? Object.values(availability).reduce((a, b) => a + b, 0) : 0;

  // Conversion rate: accepted / total quotes
  const conversionRate = stats && stats.quotes > 0
    ? Math.round(((quoteStatus?.accepted ?? 0) / stats.quotes) * 100)
    : null;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">{greeting}, {firstName}</h1>
          <p className="text-slate-400 mt-1 text-sm flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {now.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/quotes')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all"
          >
            <FileText className="w-4 h-4" /> View Quotes
          </button>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard label="Products"   value={stats?.products}   icon={Package}  iconColor="text-blue-400"    iconBg="bg-blue-500/10"    ring="ring-blue-500/20"    loading={loading} />
        <StatCard label="Categories" value={stats?.categories} icon={Layers}   iconColor="text-emerald-400" iconBg="bg-emerald-500/10" ring="ring-emerald-500/20" loading={loading} />
        <StatCard label="Brands"     value={stats?.brands}     icon={Tag}      iconColor="text-sky-400"     iconBg="bg-sky-500/10"     ring="ring-sky-500/20"     loading={loading} />
        <StatCard
          label="Quote Requests" value={stats?.quotes}
          sub={stats?.pendingQuotes ? `${stats.pendingQuotes} pending${conversionRate !== null ? ` · ${conversionRate}% converted` : ''}` : (conversionRate !== null ? `${conversionRate}% conversion rate` : undefined)}
          icon={FileText} iconColor="text-amber-400" iconBg="bg-amber-500/10" ring="ring-amber-500/20" loading={loading}
        />
        <StatCard
          label="Orders" value={stats?.orders}
          sub={stats?.pendingOrders ? `${stats.pendingOrders} pending` : undefined}
          icon={ShoppingBag} iconColor="text-teal-400" iconBg="bg-teal-500/10" ring="ring-teal-500/20" loading={loading}
        />
      </div>

      {/* ── Activity Trend Chart ── */}
      <TrendChart data={trendData} loading={loading} />

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Quotes — 2/3 width */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Recent Quote Requests</h2>
            <button
              onClick={() => navigate('/admin/quotes')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20 ml-auto" /><Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : recentQuotes && recentQuotes.length > 0 ? (
            <div className="divide-y divide-slate-800/60">
              {recentQuotes.map(q => (
                <div
                  key={q.id}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  onClick={() => navigate('/admin/quotes')}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-mono font-medium text-white">{q.reference}</span>
                      {q.company && <span className="text-xs text-slate-500 truncate">· {q.company}</span>}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{q.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-500 hidden sm:block">
                      {q.total_items} item{q.total_items !== 1 ? 's' : ''}
                    </span>
                    <StatusBadge status={q.status} cfg={QUOTE_STATUS} />
                    <span className="text-xs text-slate-600 hidden md:block w-16 text-right">
                      {relativeTime(q.submitted_at)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-700 group-hover:text-slate-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
              <Search className="w-8 h-8 text-slate-700 mb-3" />
              <p className="text-slate-400 text-sm">No quote requests yet</p>
              <p className="text-slate-600 text-xs mt-1">Quotes submitted by customers will appear here</p>
            </div>
          )}
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-4">

          {/* Product Availability */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Product Availability</h2>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between"><Skeleton className="h-3 w-20" /><Skeleton className="h-3 w-6" /></div>
                    <Skeleton className="h-1.5 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : availability && totalAvail > 0 ? (
              <div className="space-y-3">
                {(Object.entries(availability) as [keyof AvailabilityBreakdown, number][])
                  .filter(([, v]) => v > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, count]) => {
                    const cfg = AVAIL_CONFIG[key];
                    const pct = Math.round((count / totalAvail) * 100);
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-xs text-slate-400 tabular-nums">{count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${cfg.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-4">No products yet</p>
            )}
          </div>

          <StatusWidget title="Quote Status"  breakdown={quoteStatus}  config={QUOTE_STATUS}  loading={loading} />
          <StatusWidget title="Order Status"  breakdown={orderStatus}  config={ORDER_STATUS}  loading={loading} />

        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          {[
            { label: 'Add Product',    icon: Package,    color: 'text-blue-400',    bg: 'bg-blue-500/10 hover:bg-blue-500/20',    path: '/admin/products/new' },
            { label: 'Add Category',   icon: Layers,     color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', path: '/admin/categories/new' },
            { label: 'Add Brand',      icon: Tag,        color: 'text-sky-400',     bg: 'bg-sky-500/10 hover:bg-sky-500/20',       path: '/admin/brands/new' },
            { label: 'Upload Media',   icon: Image,      color: 'text-teal-400',    bg: 'bg-teal-500/10 hover:bg-teal-500/20',     path: '/admin/media' },
            { label: 'Review Quotes',  icon: FileText,   color: 'text-amber-400',   bg: 'bg-amber-500/10 hover:bg-amber-500/20',   path: '/admin/quotes' },
          ].map(({ label, icon: Icon, color, bg, path }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border border-slate-800 hover:border-slate-600 text-sm font-medium text-white transition-all ${bg}`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Footer legend ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-slate-800/60">
        {[
          { icon: CheckCircle2, color: 'text-emerald-400', label: 'Accepted quotes are archived after 90 days' },
          { icon: Circle,       color: 'text-amber-400',   label: `${stats?.pendingQuotes ?? 0} quote${stats?.pendingQuotes !== 1 ? 's' : ''} awaiting review` },
          { icon: XCircle,      color: 'text-slate-600',   label: 'Declined quotes are kept for records' },
        ].map(({ icon: Icon, color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

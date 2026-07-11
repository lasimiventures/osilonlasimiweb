import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Layers,
  Tag,
  FileText,
  Clock,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Circle,
  AlertCircle,
  Search,
  RefreshCcw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAdminAuth } from '../../context/AdminAuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Stats {
  products: number;
  categories: number;
  brands: number;
  quotes: number;
  pendingQuotes: number;
}

interface AvailabilityBreakdown {
  'in-stock': number;
  'low-stock': number;
  'out-of-stock': number;
  'pre-order': number;
}

interface StatusBreakdown {
  pending: number;
  reviewing: number;
  quoted: number;
  accepted: number;
  declined: number;
}

interface RecentQuote {
  id: string;
  reference: string;
  customer_name: string;
  company: string | null;
  total_items: number;
  status: string;
  submitted_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  pending:   { label: 'Pending',   dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-300' },
  reviewing: { label: 'Reviewing', dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    text: 'text-blue-300' },
  quoted:    { label: 'Quoted',    dot: 'bg-violet-400',  bg: 'bg-violet-500/10',  text: 'text-violet-300' },
  accepted:  { label: 'Accepted',  dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
  declined:  { label: 'Declined',  dot: 'bg-red-400',     bg: 'bg-red-500/10',     text: 'text-red-300' },
};

const AVAILABILITY_CONFIG: Record<string, { label: string; color: string; bar: string }> = {
  'in-stock':    { label: 'In Stock',    color: 'text-emerald-400', bar: 'bg-emerald-500' },
  'low-stock':   { label: 'Low Stock',   color: 'text-amber-400',   bar: 'bg-amber-500' },
  'out-of-stock':{ label: 'Out of Stock',color: 'text-red-400',     bar: 'bg-red-500' },
  'pre-order':   { label: 'Pre-Order',   color: 'text-blue-400',    bar: 'bg-blue-500' },
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className ?? ''}`} />;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | undefined;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  ring: string;
  loading: boolean;
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
        <>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-3 w-24" />
        </>
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

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { session } = useAdminAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats | null>(null);
  const [availability, setAvailability] = useState<AvailabilityBreakdown | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown | null>(null);
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchDashboardData() {
    setLoading(true);
    setError(null);
    try {
      const [pRes, cRes, bRes, qRes, qPendRes, availRes, statusRes, recentRes] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('brands').select('id', { count: 'exact', head: true }),
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }),
        supabase.from('quote_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('products').select('availability'),
        supabase.from('quote_requests').select('status'),
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
      });

      const avail: AvailabilityBreakdown = { 'in-stock': 0, 'low-stock': 0, 'out-of-stock': 0, 'pre-order': 0 };
      (availRes.data ?? []).forEach((r: { availability: string }) => {
        const k = r.availability as keyof AvailabilityBreakdown;
        if (k in avail) avail[k]++;
      });
      setAvailability(avail);

      const st: StatusBreakdown = { pending: 0, reviewing: 0, quoted: 0, accepted: 0, declined: 0 };
      (statusRes.data ?? []).forEach((r: { status: string }) => {
        const k = r.status as keyof StatusBreakdown;
        if (k in st) st[k]++;
      });
      setStatusBreakdown(st);

      setRecentQuotes((recentRes.data as RecentQuote[]) ?? []);
    } catch (e) {
      setError('Failed to load dashboard data. Please refresh.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchDashboardData(); }, []);

  const now = new Date();
  const greeting =
    now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = session?.user?.email?.split('@')[0] ?? 'Admin';

  const totalAvail = availability
    ? Object.values(availability).reduce((a, b) => a + b, 0)
    : 0;

  const totalStatus = statusBreakdown
    ? Object.values(statusBreakdown).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {greeting}, {firstName}
          </h1>
          <p className="text-slate-400 mt-1 text-sm flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {now.toLocaleDateString('en-KE', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin/quotes')}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all"
          >
            <FileText className="w-4 h-4" />
            View Quotes
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
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Products"
          value={stats?.products}
          icon={Package}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
          ring="ring-blue-500/20"
          loading={loading}
        />
        <StatCard
          label="Categories"
          value={stats?.categories}
          icon={Layers}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
          ring="ring-emerald-500/20"
          loading={loading}
        />
        <StatCard
          label="Brands"
          value={stats?.brands}
          icon={Tag}
          iconColor="text-violet-400"
          iconBg="bg-violet-500/10"
          ring="ring-violet-500/20"
          loading={loading}
        />
        <StatCard
          label="Quote Requests"
          value={stats?.quotes}
          sub={stats?.pendingQuotes ? `${stats.pendingQuotes} pending review` : undefined}
          icon={FileText}
          iconColor="text-amber-400"
          iconBg="bg-amber-500/10"
          ring="ring-amber-500/20"
          loading={loading}
        />
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent Quotes — 2/3 */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white">Recent Quote Requests</h2>
            <button
              onClick={() => navigate('/admin/quotes')}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-blue-400 transition-colors"
            >
              View all
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                  <Skeleton className="h-6 w-20" />
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
                      {q.company && (
                        <span className="text-xs text-slate-500 truncate">· {q.company}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{q.customer_name}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-500 hidden sm:block">
                      {q.total_items} item{q.total_items !== 1 ? 's' : ''}
                    </span>
                    <StatusBadge status={q.status} />
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
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-6" />
                    </div>
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
                    const cfg = AVAILABILITY_CONFIG[key];
                    const pct = Math.round((count / totalAvail) * 100);
                    return (
                      <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-xs text-slate-400 tabular-nums">{count}</span>
                        </div>
                        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <p className="text-slate-500 text-xs text-center py-4">No products yet</p>
            )}
          </div>

          {/* Quote Status Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4">Quote Status</h2>
            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24 rounded-lg" />
                    <Skeleton className="h-4 w-6" />
                  </div>
                ))}
              </div>
            ) : statusBreakdown && totalStatus > 0 ? (
              <div className="space-y-2">
                {(Object.entries(statusBreakdown) as [keyof StatusBreakdown, number][])
                  .filter(([, v]) => v > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([key, count]) => {
                    const cfg = STATUS_CONFIG[key];
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
              <p className="text-slate-500 text-xs text-center py-4">No quotes yet</p>
            )}
          </div>

        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Product', icon: Package, color: 'text-blue-400', bg: 'bg-blue-500/10 hover:bg-blue-500/20', path: '/admin/products' },
            { label: 'Add Category', icon: Layers, color: 'text-emerald-400', bg: 'bg-emerald-500/10 hover:bg-emerald-500/20', path: '/admin/categories' },
            { label: 'Add Brand', icon: Tag, color: 'text-violet-400', bg: 'bg-violet-500/10 hover:bg-violet-500/20', path: '/admin/brands' },
            { label: 'Review Quotes', icon: FileText, color: 'text-amber-400', bg: 'bg-amber-500/10 hover:bg-amber-500/20', path: '/admin/quotes' },
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

      {/* ── Status Legend ── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-slate-800/60">
        {[
          { icon: CheckCircle2, color: 'text-emerald-400', label: 'Accepted quotes are archived after 90 days' },
          { icon: Circle, color: 'text-amber-400', label: `${stats?.pendingQuotes ?? 0} quote${stats?.pendingQuotes !== 1 ? 's' : ''} awaiting review` },
          { icon: XCircle, color: 'text-slate-600', label: 'Declined quotes are kept for records' },
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

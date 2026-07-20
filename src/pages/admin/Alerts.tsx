import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCcw, AlertTriangle, CheckCircle2, Bell, BellOff, PackageX,
  PackageMinus, ShieldAlert, Truck, DollarSign, Clock, Loader2,
  Check, Eye, Archive, AlertCircle, Filter,
} from 'lucide-react';
import {
  adminGetAlerts, adminAcknowledgeAlert, adminResolveAlert,
  adminRefreshAlerts, type InventoryAlert,
} from '../../lib/database';

type StatusFilter = 'all' | 'active' | 'acknowledged' | 'resolved';
type TypeFilter = 'all' | InventoryAlert['alert_type'];

const ALERT_META: Record<InventoryAlert['alert_type'], { icon: typeof Bell; color: string; bg: string; border: string; label: string }> = {
  low_stock:          { icon: PackageMinus,  color: 'text-amber-300',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   label: 'Low Stock' },
  out_of_stock:       { icon: PackageX,      color: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     label: 'Out of Stock' },
  expiring_warranty:  { icon: ShieldAlert,   color: 'text-orange-300',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  label: 'Expiring Warranty' },
  incoming_shipment:  { icon: Truck,         color: 'text-blue-300',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    label: 'Incoming Shipment' },
  price_change:       { icon: DollarSign,    color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Price Change' },
  supplier_delay:     { icon: Clock,         color: 'text-red-300',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     label: 'Supplier Delay' },
};

const SEVERITY_DOT: Record<InventoryAlert['severity'], string> = {
  critical: 'bg-red-500',
  warning: 'bg-amber-500',
  info: 'bg-blue-500',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function entityLink(a: InventoryAlert): string | null {
  if (a.entity_type === 'product') return `/admin/products/${a.entity_id}/edit`;
  if (a.entity_type === 'purchase_order') return `/admin/procurement`;
  return null;
}

export function AdminAlerts() {
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetAlerts();
      setAlerts(data);
    } catch {
      setError('Failed to load alerts.');
    }
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await adminRefreshAlerts();
      await fetchAlerts();
    } catch {
      setError('Failed to refresh alerts.');
    }
    setRefreshing(false);
  }, [fetchAlerts]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  const counts = useMemo(() => ({
    active: alerts.filter(a => a.status === 'active').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    critical: alerts.filter(a => a.status === 'active' && a.severity === 'critical').length,
  }), [alerts]);

  const filtered = useMemo(() => {
    let list = alerts;
    if (statusFilter !== 'all') list = list.filter(a => a.status === statusFilter);
    if (typeFilter !== 'all') list = list.filter(a => a.alert_type === typeFilter);
    return list;
  }, [alerts, statusFilter, typeFilter]);

  async function ack(id: string) {
    setActing(id);
    try {
      await adminAcknowledgeAlert(id, 'admin');
      await fetchAlerts();
    } catch { setError('Failed to acknowledge alert.'); }
    setActing(null);
  }

  async function resolve(id: string) {
    setActing(id);
    try {
      await adminResolveAlert(id, 'admin');
      await fetchAlerts();
    } catch { setError('Failed to resolve alert.'); }
    setActing(null);
  }

  async function ackAll() {
    const activeIds = alerts.filter(a => a.status === 'active').map(a => a.id);
    if (activeIds.length === 0) return;
    setActing('bulk');
    try {
      await Promise.all(activeIds.map(id => adminAcknowledgeAlert(id, 'admin')));
      await fetchAlerts();
    } catch { setError('Failed to acknowledge all alerts.'); }
    setActing(null);
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" /> Inventory Alerts
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Low stock, out of stock, warranty, shipments, price changes & supplier delays</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={ackAll} disabled={counts.active === 0 || acting === 'bulk'}
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40">
            {acting === 'bulk' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Ack all
          </button>
          <button onClick={handleRefresh} disabled={refreshing}
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40">
            <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Bell} color="text-blue-400 bg-blue-500/10" value={counts.active} label="Active" />
        <StatCard icon={AlertTriangle} color="text-red-400 bg-red-500/10" value={counts.critical} label="Critical" />
        <StatCard icon={Eye} color="text-amber-400 bg-amber-500/10" value={counts.acknowledged} label="Acknowledged" />
        <StatCard icon={CheckCircle2} color="text-emerald-400 bg-emerald-500/10" value={counts.resolved} label="Resolved" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {(['active','acknowledged','resolved','all'] as StatusFilter[]).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all ${statusFilter === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TypeFilter)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 capitalize">
            <option value="all">All Types</option>
            {Object.entries(ALERT_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</div>}

      {/* Alert list */}
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
              <div className="flex-1 space-y-2"><div className="h-3.5 w-48 bg-slate-800 rounded animate-pulse" /><div className="h-3 w-72 bg-slate-800 rounded animate-pulse" /></div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-900 border border-slate-800 rounded-2xl">
            {statusFilter === 'active' ? (
              <><BellOff className="w-8 h-8 text-emerald-500/60 mx-auto mb-3" /><p className="text-white font-medium">All clear</p><p className="text-slate-400 text-sm mt-1">No active alerts. Everything looks good.</p></>
            ) : (
              <><Archive className="w-8 h-8 text-slate-700 mx-auto mb-3" /><p className="text-slate-400 text-sm">No alerts in this view.</p></>
            )}
          </div>
        ) : (
          filtered.map(a => {
            const meta = ALERT_META[a.alert_type];
            const Icon = meta.icon;
            const link = entityLink(a);
            const isResolved = a.status === 'resolved';
            return (
              <div key={a.id} className={`bg-slate-900 border rounded-2xl p-4 flex items-start gap-4 transition-all ${isResolved ? 'border-slate-800 opacity-60' : meta.border}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold ${isResolved ? 'text-slate-400' : 'text-white'}`}>{a.title}</p>
                    <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_DOT[a.severity]}`} title={a.severity} />
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}>{meta.label}</span>
                    {a.status === 'acknowledged' && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">acknowledged</span>}
                    {a.status === 'resolved' && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">resolved</span>}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{a.message}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs text-slate-500">{timeAgo(a.created_at)}</span>
                    {a.entity_ref && link && a.status !== 'resolved' && (
                      <Link to={link} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">View {a.entity_type === 'product' ? 'product' : 'order'} →</Link>
                    )}
                    {a.acknowledged_by && <span className="text-xs text-slate-500">acked by {a.acknowledged_by}</span>}
                    {a.resolved_by && <span className="text-xs text-slate-500">resolved by {a.resolved_by}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {a.status === 'active' && (
                    <button onClick={() => ack(a.id)} disabled={acting === a.id} title="Acknowledge"
                      className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-amber-300 hover:border-amber-500/40 transition-all disabled:opacity-40">
                      {acting === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  {a.status !== 'resolved' && (
                    <button onClick={() => resolve(a.id)} disabled={acting === a.id} title="Resolve"
                      className="p-2 rounded-lg border border-slate-700 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/40 transition-all disabled:opacity-40">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, color, value, label }: { icon: typeof Bell; color: string; value: number; label: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
      <div><p className="text-xl font-bold text-white tabular-nums">{value}</p><p className="text-xs text-slate-400">{label}</p></div>
    </div>
  );
}

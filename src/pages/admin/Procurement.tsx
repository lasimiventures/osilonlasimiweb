import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, RefreshCcw, Pencil, Trash2, Eye, AlertCircle,
  ShoppingCart, Truck, Package, Clock, ArrowLeft,
} from 'lucide-react';
import {
  adminGetPurchaseOrders, adminDeletePurchaseOrder,
  adminGetSupplierDeliveries, adminGetBackOrders,
  adminGetProcurementStatus,
} from '../../lib/database';

interface PO {
  id: string;
  po_number: string;
  supplier: { name: string } | null;
  warehouse: { name: string; code: string } | null;
  status: string;
  order_date: string;
  expected_delivery_date: string | null;
  currency: string;
  total: number;
  created_at: string;
}

interface Delivery {
  id: string;
  delivery_number: string;
  supplier: { name: string } | null;
  po: { po_number: string } | null;
  carrier: string | null;
  tracking_number: string | null;
  shipped_date: string | null;
  expected_delivery_date: string | null;
  actual_delivery_date: string | null;
  status: string;
  warehouse: { name: string } | null;
}

interface BackOrder {
  id: string;
  po: { po_number: string } | null;
  supplier: { name: string } | null;
  product: { name: string; sku: string } | null;
  quantity_backordered: number;
  reason: string | null;
  status: string;
  expected_date: string | null;
  created_at: string;
}

type Tab = 'pos' | 'deliveries' | 'backorders';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-700/40 text-slate-300',
  sent: 'bg-blue-500/10 text-blue-300',
  acknowledged: 'bg-cyan-500/10 text-cyan-300',
  partial: 'bg-amber-500/10 text-amber-300',
  received: 'bg-emerald-500/10 text-emerald-300',
  cancelled: 'bg-red-500/10 text-red-300',
  in_transit: 'bg-blue-500/10 text-blue-300',
  delivered: 'bg-emerald-500/10 text-emerald-300',
  delayed: 'bg-amber-500/10 text-amber-300',
  open: 'bg-amber-500/10 text-amber-300',
  fulfilled: 'bg-emerald-500/10 text-emerald-300',
};

function Badge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-slate-800 text-slate-400'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className}`} />;
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xl font-bold text-white tabular-nums">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function AdminProcurement() {
  const [tab, setTab] = useState<Tab>('pos');
  const [pos, setPOs] = useState<PO[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [backOrders, setBackOrders] = useState<BackOrder[]>([]);
  const [statusSummary, setStatusSummary] = useState<{ totals?: Record<string, number> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchAll() {
    setLoading(true);
    setError(null);
    try {
      const [poData, delData, boData, status] = await Promise.all([
        adminGetPurchaseOrders(),
        adminGetSupplierDeliveries(),
        adminGetBackOrders(),
        adminGetProcurementStatus(),
      ]);
      setPOs(poData as PO[]);
      setDeliveries(delData as Delivery[]);
      setBackOrders(boData as BackOrder[]);
      setStatusSummary(status as { totals?: Record<string, number> });
    } catch {
      setError('Failed to load procurement data.');
    }
    setLoading(false);
  }

  useEffect(() => { fetchAll(); }, []);

  const filteredPOs = useMemo(() => {
    if (!search.trim()) return pos;
    const q = search.toLowerCase();
    return pos.filter(p =>
      p.po_number.toLowerCase().includes(q) ||
      (p.supplier?.name ?? '').toLowerCase().includes(q)
    );
  }, [pos, search]);

  const filteredDeliveries = useMemo(() => {
    if (!search.trim()) return deliveries;
    const q = search.toLowerCase();
    return deliveries.filter(d =>
      d.delivery_number.toLowerCase().includes(q) ||
      (d.supplier?.name ?? '').toLowerCase().includes(q) ||
      (d.tracking_number ?? '').toLowerCase().includes(q)
    );
  }, [deliveries, search]);

  const filteredBackOrders = useMemo(() => {
    if (!search.trim()) return backOrders;
    const q = search.toLowerCase();
    return backOrders.filter(b =>
      (b.po?.po_number ?? '').toLowerCase().includes(q) ||
      (b.supplier?.name ?? '').toLowerCase().includes(q) ||
      (b.product?.name ?? '').toLowerCase().includes(q)
    );
  }, [backOrders, search]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await adminDeletePurchaseOrder(id);
      setPOs(prev => prev.filter(p => p.id !== id));
    } catch {
      setError('Failed to delete PO. Remove associated GRNs first.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  const totals = statusSummary?.totals ?? {};

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Procurement</h1>
          <p className="text-slate-400 text-sm mt-0.5">Purchase orders, deliveries, and back orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link to="/admin/procurement/new" className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Purchase Order
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={ShoppingCart} label="Open POs" value={totals.open_pos ?? 0} color="bg-blue-500/10 text-blue-400" />
        <StatCard icon={Truck} label="In Transit" value={totals.in_transit ?? 0} color="bg-cyan-500/10 text-cyan-400" />
        <StatCard icon={Clock} label="Back Orders" value={totals.open_back_orders ?? 0} color="bg-amber-500/10 text-amber-400" />
        <StatCard icon={Package} label="Pending Requisitions" value={totals.pending_requisitions ?? 0} color="bg-slate-500/10 text-slate-400" />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-slate-800">
        {[
          { key: 'pos' as Tab, label: 'Purchase Orders', count: pos.length },
          { key: 'deliveries' as Tab, label: 'Deliveries', count: deliveries.length },
          { key: 'backorders' as Tab, label: 'Back Orders', count: backOrders.length },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setSearch(''); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${tab === 'pos' ? 'purchase orders' : tab === 'deliveries' ? 'deliveries' : 'back orders'}…`}
          className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Tables */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'pos' && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">PO #</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Supplier</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">Warehouse</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">Expected</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Total</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-5 py-3.5"><Skeleton className="h-3.5 w-20" /></td>)}
                    </tr>
                  ))
                ) : filteredPOs.length === 0 ? (
                  <tr><td colSpan={7} className="px-5 py-16 text-center">
                    <ShoppingCart className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{search ? 'No POs match your search' : 'No purchase orders yet'}</p>
                    {!search && <Link to="/admin/procurement/new" className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-400 hover:text-blue-300 font-medium"><Plus className="w-3.5 h-3.5" /> Create your first PO</Link>}
                  </td></tr>
                ) : filteredPOs.map(po => {
                  const isConfirm = confirmDeleteId === po.id;
                  return (
                    <tr key={po.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link to={`/admin/procurement/${po.id}`} className="text-sm font-medium text-white hover:text-blue-300 font-mono">{po.po_number}</Link>
                        <p className="text-xs text-slate-500">{new Date(po.order_date).toLocaleDateString()}</p>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-300">{po.supplier?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-300">{po.warehouse?.name ?? '—'}</td>
                      <td className="px-5 py-3.5"><Badge status={po.status} /></td>
                      <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-300">{po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '—'}</td>
                      <td className="px-5 py-3.5 text-right text-sm text-slate-300 tabular-nums">{po.currency} {Number(po.total).toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-right">
                        {isConfirm ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-400">Delete?</span>
                            <button onClick={() => handleDelete(po.id)} disabled={deletingId === po.id} className="text-xs font-semibold text-red-400 px-2 py-1 border border-red-800/50 rounded-lg">{deletingId === po.id ? '…' : 'Yes'}</button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-slate-400 px-2 py-1">No</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <Link to={`/admin/procurement/${po.id}`} className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"><Eye className="w-3.5 h-3.5" /></Link>
                            <Link to={`/admin/procurement/${po.id}/edit`} className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"><Pencil className="w-3.5 h-3.5" /></Link>
                            <button onClick={() => setConfirmDeleteId(po.id)} className="p-1.5 rounded-lg border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-800/50 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {tab === 'deliveries' && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Delivery #</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Supplier</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">PO</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden lg:table-cell">Carrier</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">Expected</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-5 py-3.5"><Skeleton className="h-3.5 w-24" /></td>)}
                    </tr>
                  ))
                ) : filteredDeliveries.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center">
                    <Truck className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{search ? 'No deliveries match your search' : 'No deliveries yet'}</p>
                  </td></tr>
                ) : filteredDeliveries.map(d => (
                  <tr key={d.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-white font-mono">{d.delivery_number}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-300">{d.supplier?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-400 font-mono">{d.po?.po_number ?? '—'}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-slate-300">{d.carrier ?? '—'}{d.tracking_number && <span className="text-xs text-slate-500 block">{d.tracking_number}</span>}</td>
                    <td className="px-5 py-3.5"><Badge status={d.status} /></td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-300">{d.expected_delivery_date ? new Date(d.expected_delivery_date).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'backorders' && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">PO</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Product</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">Supplier</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Qty</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">Expected</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-5 py-3.5"><Skeleton className="h-3.5 w-24" /></td>)}
                    </tr>
                  ))
                ) : filteredBackOrders.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center">
                    <Clock className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{search ? 'No back orders match your search' : 'No back orders — all POs fully received'}</p>
                  </td></tr>
                ) : filteredBackOrders.map(b => (
                  <tr key={b.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-mono text-slate-300">{b.po?.po_number ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-white">{b.product?.name ?? '—'}</p>
                      <p className="text-xs text-slate-500 font-mono">{b.product?.sku}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-300">{b.supplier?.name ?? '—'}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-amber-300 tabular-nums">{b.quantity_backordered}</td>
                    <td className="px-5 py-3.5"><Badge status={b.status} /></td>
                    <td className="px-5 py-3.5 hidden md:table-cell text-sm text-slate-300">{b.expected_date ? new Date(b.expected_date).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Link to="/admin" className="inline-flex items-center gap-1.5 mt-6 text-sm text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>
    </div>
  );
}

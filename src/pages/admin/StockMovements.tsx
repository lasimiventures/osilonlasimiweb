import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCcw, Search, AlertCircle, Plus, ArrowDownCircle, ArrowUpCircle,
  Package, TrendingUp, TrendingDown, History, X, Loader2, Warehouse,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  adminGetStockMovements, adminRecordStockMovement,
  adminGetProductMovementSummary,
} from '../../lib/database';

interface Movement {
  id: string;
  movement_number: string;
  product_id: string;
  product: { name: string; sku: string } | null;
  warehouse_id: string | null;
  warehouse: { name: string; code: string } | null;
  movement_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: string | null;
  reference_number: string | null;
  reason: string | null;
  notes: string | null;
  performed_by: string | null;
  created_at: string;
}

interface ProductSummary {
  product_id: string;
  product_name: string;
  product_sku: string;
  total_in: number;
  total_out: number;
  net_change: number;
  last_movement_at: string | null;
  movement_count: number;
}

interface Warehouse { id: string; name: string; code: string }
interface Product { id: string; name: string; sku: string }

const MOVEMENT_TYPES = [
  { value: 'purchase', label: 'Purchase', icon: ArrowDownCircle, color: 'text-emerald-400', sign: '+' },
  { value: 'sale', label: 'Sale', icon: ArrowUpCircle, color: 'text-blue-400', sign: '-' },
  { value: 'quote_reservation', label: 'Quote Reservation', icon: Package, color: 'text-amber-400', sign: '-' },
  { value: 'customer_order', label: 'Customer Order', icon: ArrowUpCircle, color: 'text-cyan-400', sign: '-' },
  { value: 'manual_adjustment', label: 'Manual Adjustment', icon: Package, color: 'text-slate-400', sign: '±' },
  { value: 'warehouse_transfer_in', label: 'Transfer In', icon: ArrowDownCircle, color: 'text-emerald-400', sign: '+' },
  { value: 'warehouse_transfer_out', label: 'Transfer Out', icon: ArrowUpCircle, color: 'text-amber-400', sign: '-' },
  { value: 'damaged', label: 'Damaged', icon: ArrowUpCircle, color: 'text-red-400', sign: '-' },
  { value: 'returned', label: 'Returned', icon: ArrowDownCircle, color: 'text-emerald-400', sign: '+' },
  { value: 'opening_balance', label: 'Opening Balance', icon: Package, color: 'text-slate-400', sign: '+' },
  { value: 'correction', label: 'Correction', icon: Package, color: 'text-slate-400', sign: '±' },
];

function typeMeta(type: string) {
  return MOVEMENT_TYPES.find(t => t.value === type) ?? { value: type, label: type, icon: Package, color: 'text-slate-400', sign: '±' };
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className}`} />;
}

type Tab = 'history' | 'summary';

export function AdminStockMovements() {
  const [tab, setTab] = useState<Tab>('history');
  const [movements, setMovements] = useState<Movement[]>([]);
  const [summary, setSummary] = useState<ProductSummary[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [showAdjust, setShowAdjust] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mvData, sumData, whData, prodData] = await Promise.all([
        adminGetStockMovements({ limit: 500 }),
        adminGetProductMovementSummary(),
        supabase.from('warehouses').select('id,name,code').order('name').then(({ data }) => data as Warehouse[] | null),
        supabase.from('products').select('id,name,sku').order('name').limit(500).then(({ data }) => data as Product[] | null),
      ]);
      setMovements(mvData as Movement[]);
      setSummary(sumData as ProductSummary[]);
      if (whData) setWarehouses(whData);
      if (prodData) setProducts(prodData);
    } catch {
      setError('Failed to load stock movements.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredMovements = useMemo(() => {
    let list = movements;
    if (typeFilter !== 'all') list = list.filter(m => m.movement_type === typeFilter);
    if (warehouseFilter !== 'all') list = list.filter(m => m.warehouse_id === warehouseFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.movement_number.toLowerCase().includes(q) ||
        (m.product?.name ?? '').toLowerCase().includes(q) ||
        (m.product?.sku ?? '').toLowerCase().includes(q) ||
        (m.reference_number ?? '').toLowerCase().includes(q) ||
        (m.reason ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [movements, search, typeFilter, warehouseFilter]);

  const filteredSummary = useMemo(() => {
    if (!search.trim()) return summary;
    const q = search.toLowerCase();
    return summary.filter(s =>
      s.product_name.toLowerCase().includes(q) ||
      s.product_sku.toLowerCase().includes(q)
    );
  }, [summary, search]);

  const totalIn = movements.reduce((s, m) => s + (m.quantity_change > 0 ? m.quantity_change : 0), 0);
  const totalOut = movements.reduce((s, m) => s + (m.quantity_change < 0 ? Math.abs(m.quantity_change) : 0), 0);

  function handleRecorded() {
    setShowAdjust(false);
    fetchData();
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Stock Movements</h1>
          <p className="text-slate-400 text-sm mt-0.5">Complete inventory movement history</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setShowAdjust(true)} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Adjustment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400"><TrendingUp className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-white tabular-nums">{totalIn.toLocaleString()}</p><p className="text-xs text-slate-400">Total In</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-400"><TrendingDown className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-white tabular-nums">{totalOut.toLocaleString()}</p><p className="text-xs text-slate-400">Total Out</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400"><History className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-white tabular-nums">{movements.length}</p><p className="text-xs text-slate-400">Movements</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 border-b border-slate-800">
        {[
          { key: 'history' as Tab, label: 'Movement Log', count: movements.length },
          { key: 'summary' as Tab, label: 'Product Summary', count: summary.length },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setSearch(''); }} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}>
            {t.label}
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'history' ? 'Search by product, SKU, ref…' : 'Search products…'} className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {tab === 'history' && (
          <>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Types</option>
              {MOVEMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)} className="px-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Warehouses</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </>
        )}
      </div>

      {error && <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</div>}

      {/* Tables */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          {tab === 'history' ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Ref #</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Product</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">Type</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden lg:table-cell">Warehouse</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Change</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">Before → After</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden lg:table-cell">Reference</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden xl:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      {Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-5 py-3.5"><Skeleton className="h-3.5 w-20" /></td>)}
                    </tr>
                  ))
                ) : filteredMovements.length === 0 ? (
                  <tr><td colSpan={8} className="px-5 py-16 text-center">
                    <History className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{search || typeFilter !== 'all' || warehouseFilter !== 'all' ? 'No movements match your filters' : 'No stock movements yet'}</p>
                    {!search && typeFilter === 'all' && warehouseFilter === 'all' && <button onClick={() => setShowAdjust(true)} className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-400 hover:text-blue-300 font-medium"><Plus className="w-3.5 h-3.5" /> Record first movement</button>}
                  </td></tr>
                ) : filteredMovements.map(m => {
                  const meta = typeMeta(m.movement_type);
                  const Icon = meta.icon;
                  const positive = m.quantity_change > 0;
                  return (
                    <tr key={m.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5"><p className="text-xs font-mono text-slate-400">{m.movement_number}</p></td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-white truncate max-w-[180px]">{m.product?.name ?? '—'}</p>
                        <p className="text-xs text-slate-500 font-mono">{m.product?.sku}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${meta.color}`}>
                          <Icon className="w-3.5 h-3.5" /> {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell text-sm text-slate-300">{m.warehouse?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`text-sm font-semibold tabular-nums ${positive ? 'text-emerald-300' : m.quantity_change < 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                          {positive ? '+' : ''}{m.quantity_change}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right hidden md:table-cell">
                        <span className="text-xs text-slate-400 tabular-nums">{m.quantity_before} → {m.quantity_after}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {m.reference_number ? (
                          <span className="text-xs text-slate-300 font-mono">{m.reference_number}</span>
                        ) : <span className="text-xs text-slate-600">—</span>}
                        {m.reason && <p className="text-xs text-slate-500 truncate max-w-[140px]">{m.reason}</p>}
                      </td>
                      <td className="px-5 py-3.5 hidden xl:table-cell text-xs text-slate-400">{new Date(m.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase">Product</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Total In</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Total Out</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Net</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">Movements</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden lg:table-cell">Last Movement</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-5 py-3.5"><Skeleton className="h-3.5 w-24" /></td>)}
                    </tr>
                  ))
                ) : filteredSummary.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center">
                    <Package className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{search ? 'No products match your search' : 'No product movement data yet'}</p>
                  </td></tr>
                ) : filteredSummary.map(s => (
                  <tr key={s.product_id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-white truncate max-w-[200px]">{s.product_name}</p>
                      <p className="text-xs text-slate-500 font-mono">{s.product_sku}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-emerald-300 tabular-nums">+{s.total_in}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-amber-300 tabular-nums">{s.total_out}</td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-sm font-semibold tabular-nums ${s.net_change > 0 ? 'text-emerald-300' : s.net_change < 0 ? 'text-amber-300' : 'text-slate-400'}`}>
                        {s.net_change > 0 ? '+' : ''}{s.net_change}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right hidden md:table-cell text-sm text-slate-400 tabular-nums">{s.movement_count}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-slate-400">{s.last_movement_at ? new Date(s.last_movement_at).toLocaleString() : 'Never'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Link to="/admin" className="inline-flex items-center gap-1.5 mt-6 text-sm text-slate-400 hover:text-white transition-colors">
        <RefreshCcw className="w-4 h-4 rotate-180" /> Back to dashboard
      </Link>

      {showAdjust && (
        <AdjustmentModal
          warehouses={warehouses}
          products={products}
          onClose={() => setShowAdjust(false)}
          onRecorded={handleRecorded}
        />
      )}
    </div>
  );
}

const ADJUSTMENT_TYPES = [
  { value: 'manual_adjustment', label: 'Manual Adjustment', desc: 'Correct stock count discrepancy' },
  { value: 'damaged', label: 'Damaged Stock', desc: 'Write off damaged/unsellable units' },
  { value: 'returned', label: 'Customer Return', desc: 'Restock returned goods' },
  { value: 'opening_balance', label: 'Opening Balance', desc: 'Set initial stock level' },
  { value: 'correction', label: 'Correction', desc: 'Adjust for system error' },
];

function AdjustmentModal({ warehouses, products, onClose, onRecorded }: {
  warehouses: Warehouse[];
  products: Product[];
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [productId, setProductId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [adjustType, setAdjustType] = useState('manual_adjustment');
  const [quantity, setQuantity] = useState('0');
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) { setError('Select a product.'); return; }
    if (!warehouseId) { setError('Select a warehouse.'); return; }
    const qty = Math.abs(Number(quantity)) || 0;
    if (qty === 0 && adjustType === 'manual_adjustment') { setError('Enter a non-zero quantity.'); return; }
    setError(null);
    setSaving(true);
    try {
      const signedQty = direction === 'out' ? -qty : qty;
      await adminRecordStockMovement({
        product_id: productId,
        warehouse_id: warehouseId,
        movement_type: adjustType,
        quantity_change: signedQty,
        reference_type: 'manual',
        reason: reason.trim() || (ADJUSTMENT_TYPES.find(t => t.value === adjustType)?.label ?? null),
        notes: notes.trim() || null,
        performed_by: performedBy.trim() || null,
      });
      onRecorded();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record movement.';
      setError(msg.includes('Insufficient') ? msg : 'Failed to record movement.');
    } finally {
      setSaving(false);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5';

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2"><Plus className="w-5 h-5 text-blue-400" /><h2 className="text-base font-semibold text-white">Record Stock Movement</h2></div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-3 text-red-300 text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>}

          <div>
            <label className={labelCls}>Product <span className="text-red-400">*</span></label>
            <select value={productId} onChange={e => setProductId(e.target.value)} className={inputCls} required>
              <option value="">— Select product —</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Warehouse <span className="text-red-400">*</span></label>
            <select value={warehouseId} onChange={e => setWarehouseId(e.target.value)} className={inputCls} required>
              <option value="">— Select warehouse —</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Movement Type</label>
            <select value={adjustType} onChange={e => setAdjustType(e.target.value)} className={inputCls}>
              {ADJUSTMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label} — {t.desc}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className={labelCls}>Direction</label>
              <div className="flex gap-1 p-1 bg-slate-800 border border-slate-700 rounded-xl">
                <button type="button" onClick={() => setDirection('in')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${direction === 'in' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <ArrowDownCircle className="w-4 h-4 mx-auto" />
                </button>
                <button type="button" onClick={() => setDirection('out')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${direction === 'out' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                  <ArrowUpCircle className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
            <div className="col-span-2">
              <label className={labelCls}>Quantity</label>
              <input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputCls} placeholder="0" />
            </div>
          </div>

          <div>
            <label className={labelCls}>Reason</label>
            <input value={reason} onChange={e => setReason(e.target.value)} className={inputCls} placeholder="e.g. Stock count adjustment, water damage" />
          </div>

          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={`${inputCls} resize-none`} placeholder="Additional detail…" />
          </div>

          <div>
            <label className={labelCls}>Performed By</label>
            <input value={performedBy} onChange={e => setPerformedBy(e.target.value)} className={inputCls} placeholder="Your name" />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white px-4 py-2">Cancel</button>
            <button type="submit" disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Warehouse className="w-4 h-4" />}
              {saving ? 'Recording…' : 'Record Movement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  RefreshCcw, Search, AlertCircle, DollarSign, TrendingUp, TrendingDown,
  Tag, Percent, Pencil, History, X, Loader2,
} from 'lucide-react';
import { adminGetPricingOverview, adminGetCostHistory } from '../../lib/database';

interface PricingRow {
  id: string;
  name: string;
  sku: string;
  brand: string | null;
  category: string | null;
  cost_price: number | null;
  selling_price: number | null;
  distributor_price: number | null;
  dealer_price: number | null;
  promotional_price: number | null;
  promo_start_date: string | null;
  promo_end_date: string | null;
  promo_active: boolean;
  effective_price: number | null;
  margin_amount: number | null;
  margin_pct: number | null;
  markup_pct: number | null;
  on_hand: number;
  availability: string;
  pricing_currency: string;
}

interface CostHistoryEntry {
  id: string;
  old_cost: number | null;
  new_cost: number | null;
  change_source: string;
  reference_type: string | null;
  reference_number: string | null;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}

type SortKey = 'name' | 'margin_pct' | 'markup_pct' | 'effective_price' | 'cost_price';

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className}`} />;
}

function fmt(n: number | null, currency = 'KES') {
  if (n === null || n === undefined) return '—';
  return `${currency} ${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function pct(n: number | null) {
  if (n === null || n === undefined) return '—';
  return `${Number(n).toFixed(1)}%`;
}

export function AdminPricing() {
  const [rows, setRows] = useState<PricingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterTier, setFilterTier] = useState('all');
  const [historyProduct, setHistoryProduct] = useState<PricingRow | null>(null);

  async function fetchPricing() {
    setLoading(true);
    setError(null);
    try {
      const data = await adminGetPricingOverview();
      setRows(data as PricingRow[]);
    } catch {
      setError('Failed to load pricing data.');
    }
    setLoading(false);
  }

  useEffect(() => { fetchPricing(); }, []);

  const filtered = useMemo(() => {
    let list = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        (r.brand ?? '').toLowerCase().includes(q)
      );
    }
    if (filterTier !== 'all') {
      if (filterTier === 'has_distributor') list = list.filter(r => r.distributor_price !== null);
      if (filterTier === 'has_dealer') list = list.filter(r => r.dealer_price !== null);
      if (filterTier === 'promo_active') list = list.filter(r => r.promo_active);
      if (filterTier === 'no_cost') list = list.filter(r => r.cost_price === null || r.cost_price === 0);
    }
    list = [...list].sort((a, b) => {
      let av: string | number | null = a[sortKey];
      let bv: string | number | null = b[sortKey];
      if (typeof av === 'string' && typeof bv === 'string') {
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      av = av ?? -Infinity;
      bv = bv ?? -Infinity;
      return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [rows, search, sortKey, sortDir, filterTier]);

  const avgMargin = rows.length > 0
    ? rows.filter(r => r.margin_pct !== null).reduce((s, r) => s + (r.margin_pct ?? 0), 0) / Math.max(rows.filter(r => r.margin_pct !== null).length, 1)
    : 0;
  const promoCount = rows.filter(r => r.promo_active).length;
  const noCostCount = rows.filter(r => r.cost_price === null || r.cost_price === 0).length;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const SortHeader = ({ key: k, label }: { key: SortKey; label: string }) => (
    <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase cursor-pointer hover:text-white transition-colors select-none" onClick={() => toggleSort(k)}>
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k && <span className="text-blue-400">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Cost & Pricing</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track cost, tiered prices, margins, and mark-ups</p>
        </div>
        <button onClick={fetchPricing} disabled={loading} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40">
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-400"><DollarSign className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-white tabular-nums">{rows.length}</p><p className="text-xs text-slate-400">Products</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400"><Percent className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-white tabular-nums">{avgMargin.toFixed(1)}%</p><p className="text-xs text-slate-400">Avg Margin</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/10 text-amber-400"><Tag className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-white tabular-nums">{promoCount}</p><p className="text-xs text-slate-400">Active Promos</p></div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10 text-red-400"><AlertCircle className="w-5 h-5" /></div>
          <div><p className="text-xl font-bold text-white tabular-nums">{noCostCount}</p><p className="text-xs text-slate-400">Missing Cost</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, SKU, brand…" className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterTier} onChange={e => setFilterTier(e.target.value)} className="px-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Products</option>
          <option value="has_distributor">Has Distributor Price</option>
          <option value="has_dealer">Has Dealer Price</option>
          <option value="promo_active">Active Promotion</option>
          <option value="no_cost">Missing Cost Price</option>
        </select>
      </div>

      {error && <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</div>}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <SortHeader key="name" label="Product" />
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Cost</th>
                <SortHeader key="effective_price" label="Sell Price" />
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">Distributor</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase hidden lg:table-cell">Dealer</th>
                <SortHeader key="margin_pct" label="Margin %" />
                <SortHeader key="markup_pct" label="Mark-up %" />
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase hidden xl:table-cell">Stock</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    {Array.from({ length: 9 }).map((_, j) => <td key={j} className="px-5 py-3.5"><Skeleton className="h-3.5 w-20" /></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-16 text-center">
                  <DollarSign className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">{search || filterTier !== 'all' ? 'No products match your filters' : 'No pricing data yet'}</p>
                </td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-white truncate max-w-[200px]">{r.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{r.sku}{r.promo_active && <span className="ml-2 inline-flex items-center gap-0.5 text-amber-400"><Tag className="w-2.5 h-2.5" />promo</span>}</p>
                  </td>
                  <td className="px-5 py-3.5 text-right text-sm text-slate-300 tabular-nums">{fmt(r.cost_price, r.pricing_currency)}</td>
                  <td className="px-5 py-3.5 text-right text-sm text-white font-medium tabular-nums">{fmt(r.effective_price, r.pricing_currency)}</td>
                  <td className="px-5 py-3.5 text-right text-sm text-slate-300 tabular-nums hidden md:table-cell">{fmt(r.distributor_price, r.pricing_currency)}</td>
                  <td className="px-5 py-3.5 text-right text-sm text-slate-300 tabular-nums hidden lg:table-cell">{fmt(r.dealer_price, r.pricing_currency)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-sm font-semibold tabular-nums ${r.margin_pct !== null && r.margin_pct >= 0 ? 'text-emerald-300' : r.margin_pct !== null ? 'text-red-300' : 'text-slate-500'}`}>{pct(r.margin_pct)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className={`text-sm font-semibold tabular-nums ${r.markup_pct !== null && r.markup_pct >= 0 ? 'text-emerald-300' : r.markup_pct !== null ? 'text-red-300' : 'text-slate-500'}`}>{pct(r.markup_pct)}</span>
                  </td>
                  <td className="px-5 py-3.5 hidden xl:table-cell">
                    <span className={`text-sm tabular-nums ${r.on_hand > 0 ? 'text-slate-300' : 'text-red-300'}`}>{r.on_hand}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setHistoryProduct(r)} title="Cost history" className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"><History className="w-3.5 h-3.5" /></button>
                      <Link to={`/admin/products/${r.id}/edit`} title="Edit pricing" className="p-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"><Pencil className="w-3.5 h-3.5" /></Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Link to="/admin" className="inline-flex items-center gap-1.5 mt-6 text-sm text-slate-400 hover:text-white transition-colors">
        <RefreshCcw className="w-4 h-4 rotate-180" /> Back to dashboard
      </Link>

      {historyProduct && (
        <CostHistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
      )}
    </div>
  );
}

function CostHistoryModal({ product, onClose }: { product: PricingRow; onClose: () => void }) {
  const [history, setHistory] = useState<CostHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminGetCostHistory(product.id)
      .then(data => setHistory(data as CostHistoryEntry[]))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [product.id]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-base font-semibold text-white">Cost History — {product.name}</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{product.sku}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 text-blue-500 animate-spin" /></div>
          ) : history.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-7 h-7 text-slate-700 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No cost changes recorded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(h => {
                const change = (h.new_cost ?? 0) - (h.old_cost ?? 0);
                const isIncrease = change > 0;
                return (
                  <div key={h.id} className="flex items-center gap-4 p-3 bg-slate-800 border border-slate-700 rounded-xl">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isIncrease ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                      {isIncrease ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-slate-400 tabular-nums">{h.old_cost !== null ? fmt(h.old_cost, product.pricing_currency) : '—'}</span>
                        <span className="text-slate-600">→</span>
                        <span className="text-sm text-white font-semibold tabular-nums">{h.new_cost !== null ? fmt(h.new_cost, product.pricing_currency) : '—'}</span>
                        <span className={`text-xs font-medium ${isIncrease ? 'text-amber-300' : 'text-emerald-300'}`}>
                          {isIncrease ? '+' : ''}{change.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-slate-700 text-slate-400">{h.change_source.replace('_', ' ')}</span>
                        {h.reference_number && <span className="text-xs text-slate-500 font-mono">{h.reference_number}</span>}
                        <span className="text-xs text-slate-500">{new Date(h.created_at).toLocaleDateString()}</span>
                        {h.changed_by && <span className="text-xs text-slate-500">by {h.changed_by}</span>}
                      </div>
                      {h.notes && <p className="text-xs text-slate-500 mt-1 truncate">{h.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

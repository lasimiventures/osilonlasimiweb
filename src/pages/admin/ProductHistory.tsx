import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  History, RefreshCcw, Search, AlertCircle, ChevronDown, ChevronRight,
  DollarSign, Settings2, PackageCheck, FileEdit, ArrowRight, Package,
  Loader2, X, TrendingUp,
} from 'lucide-react';
import {
  adminGetProductRevisions,
  adminGetAllProductRevisions,
  adminGetRevisionStats,
  type ProductRevision,
} from '../../lib/database';

const CHANGE_TYPE_META: Record<string, { label: string; icon: typeof DollarSign; color: string; bg: string }> = {
  price_update: { label: 'Price Update', icon: DollarSign, color: 'text-emerald-300', bg: 'bg-emerald-500/10' },
  specification_change: { label: 'Specification Change', icon: Settings2, color: 'text-blue-300', bg: 'bg-blue-500/10' },
  availability_change: { label: 'Availability Change', icon: PackageCheck, color: 'text-amber-300', bg: 'bg-amber-500/10' },
  product_revision: { label: 'Product Revision', icon: FileEdit, color: 'text-slate-300', bg: 'bg-slate-500/10' },
};

const FIELD_LABELS: Record<string, string> = {
  name: 'Product Name',
  slug: 'URL Slug',
  brand: 'Brand',
  brand_slug: 'Brand Slug',
  category: 'Category',
  category_slug: 'Category Slug',
  description: 'Description',
  short_description: 'Short Description',
  specifications: 'Specifications',
  datasheet_url: 'Datasheet URL',
  warranty_expiry_date: 'Warranty Expiry',
  images: 'Images',
  tags: 'Tags',
  price: 'Legacy Price',
  cost_price: 'Cost Price',
  selling_price: 'Selling Price',
  distributor_price: 'Distributor Price',
  dealer_price: 'Dealer Price',
  promotional_price: 'Promotional Price',
  promo_start_date: 'Promo Start',
  promo_end_date: 'Promo End',
  pricing_currency: 'Currency',
  availability: 'Availability',
  buy_now_enabled: 'Buy Now Enabled',
  call_for_price: 'Call for Price',
  display_price: 'Display Price',
  price_visible: 'Price Visible',
  minimum_order_quantity: 'Min Order Qty',
  maximum_order_quantity: 'Max Order Qty',
  is_featured: 'Featured',
  is_new: 'New',
  is_best_seller: 'Best Seller',
};

function formatValue(field: string, val: unknown): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (Array.isArray(val)) return val.length > 0 ? `${val.length} item${val.length !== 1 ? 's' : ''}` : 'Empty';
  if (typeof val === 'object') {
    const keys = Object.keys(val as object);
    return keys.length > 0 ? `${keys.length} field${keys.length !== 1 ? 's' : ''}` : 'Empty';
  }
  if (field.includes('price') || field === 'display_price') {
    const n = Number(val);
    return isNaN(n) ? String(val) : n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  return String(val);
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function DiffRow({ field, oldVal, newVal }: { field: string; oldVal: unknown; newVal: unknown }) {
  const isBool = typeof oldVal === 'boolean' || typeof newVal === 'boolean';
  const isPrice = field.includes('price') || field === 'display_price';
  const changed = oldVal !== newVal;
  return (
    <div className="grid grid-cols-[140px_1fr_auto_1fr] gap-3 items-start py-1.5 border-b border-slate-800/30 last:border-0">
      <span className="text-xs text-slate-400 font-medium pt-0.5">{FIELD_LABELS[field] ?? field}</span>
      <span className={`text-xs font-mono pt-0.5 ${oldVal === null || oldVal === undefined ? 'text-slate-600' : 'text-slate-400 line-through opacity-70'}`}>
        {formatValue(field, oldVal)}
      </span>
      <ArrowRight className="w-3 h-3 text-slate-600 mt-1" />
      <span className={`text-xs font-mono pt-0.5 ${changed ? (isPrice ? 'text-emerald-300' : isBool ? 'text-blue-300' : 'text-white') : 'text-slate-400'}`}>
        {formatValue(field, newVal)}
      </span>
    </div>
  );
}

function RevisionCard({ rev, showProduct }: { rev: ProductRevision; showProduct: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CHANGE_TYPE_META[rev.change_type] ?? CHANGE_TYPE_META.product_revision;
  const Icon = meta.icon;
  const changedEntries = rev.changed_fields.map(f => ({
    field: f,
    oldVal: rev.old_values?.[f],
    newVal: rev.new_values?.[f],
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors text-left"
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-white">{meta.label}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500 tabular-nums">Rev #{rev.revision_number}</span>
            {showProduct && rev.product && (
              <>
                <span className="text-xs text-slate-600">·</span>
                <span className="text-xs text-slate-400 truncate max-w-[200px]">{rev.product.name}</span>
                <span className="text-xs text-slate-600 font-mono">{rev.product.sku}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500">{formatRelative(rev.created_at)}</span>
            <span className="text-xs text-slate-600">·</span>
            <span className="text-xs text-slate-500">
              {rev.changed_fields.length} field{rev.changed_fields.length !== 1 ? 's' : ''} changed
            </span>
            {rev.change_source !== 'manual_edit' && (
              <span className="text-xs text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded">{rev.change_source}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {rev.changed_fields.slice(0, 3).map(f => (
            <span key={f} className="hidden md:inline-flex text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded">
              {FIELD_LABELS[f] ?? f}
            </span>
          ))}
          {rev.changed_fields.length > 3 && <span className="hidden md:inline text-xs text-slate-600">+{rev.changed_fields.length - 3}</span>}
          {expanded ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-800/50">
          <div className="grid grid-cols-[140px_1fr_auto_1fr] gap-3 items-start pb-1.5 mb-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Field</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Old</span>
            <span className="w-3" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New</span>
          </div>
          {changedEntries.map(e => (
            <DiffRow key={e.field} field={e.field} oldVal={e.oldVal} newVal={e.newVal} />
          ))}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/30">
            <span className="text-xs text-slate-500">{new Date(rev.created_at).toLocaleString()}</span>
            {showProduct && rev.product && (
              <Link
                to={`/admin/products/${rev.product_id}/history`}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                View product history →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-800 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-40 bg-slate-800 rounded animate-pulse" />
        <div className="h-3 w-56 bg-slate-800/60 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function AdminProductHistory() {
  const { productId } = useParams();
  const isProductView = Boolean(productId);

  const [revisions, setRevisions] = useState<ProductRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stats, setStats] = useState<Record<string, number>>({ price_update: 0, specification_change: 0, availability_change: 0, product_revision: 0 });

  async function fetchRevisions() {
    setLoading(true);
    setError(null);
    try {
      const [revs, st] = await Promise.all([
        isProductView ? adminGetProductRevisions(productId!) : adminGetAllProductRevisions({ limit: 200 }),
        adminGetRevisionStats(),
      ]);
      setRevisions(revs);
      setStats(st);
    } catch {
      setError('Failed to load product revision history.');
    }
    setLoading(false);
  }

  useEffect(() => { fetchRevisions(); }, [productId, isProductView]);

  const filtered = useMemo(() => {
    let list = revisions;
    if (typeFilter !== 'all') list = list.filter(r => r.change_type === typeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.changed_fields.some(f => (FIELD_LABELS[f] ?? f).toLowerCase().includes(q)) ||
        (r.product?.name ?? '').toLowerCase().includes(q) ||
        (r.product?.sku ?? '').toLowerCase().includes(q) ||
        (r.product?.brand ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [revisions, search, typeFilter]);

  const totalRevisions = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link to="/admin/products" className="hover:text-slate-300">Products</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-400">Version Control</span>
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            {isProductView ? 'Product Revision History' : 'Product Version Control'}
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} revision${filtered.length !== 1 ? 's' : ''}${isProductView ? ' for this product' : ` across ${totalRevisions} total`}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRevisions}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {!isProductView && (
            <Link
              to="/admin/products"
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all"
            >
              <X className="w-4 h-4" /> Close
            </Link>
          )}
        </div>
      </div>

      {/* Stats cards */}
      {!isProductView && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {Object.entries(CHANGE_TYPE_META).map(([key, meta]) => {
            const Icon = meta.icon;
            const count = stats[key] ?? 0;
            const active = typeFilter === key;
            return (
              <button
                key={key}
                onClick={() => setTypeFilter(active ? 'all' : key)}
                className={`bg-slate-900 border rounded-xl p-4 flex items-center gap-3 transition-all text-left ${
                  active ? 'border-blue-600 ring-2 ring-blue-600/20' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.bg} ${meta.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-lg font-bold text-white tabular-nums">{count}</p>
                  <p className="text-xs text-slate-400">{meta.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Product header (product view) */}
      {isProductView && revisions[0]?.product && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center ring-1 ring-slate-700">
            <Package className="w-5 h-5 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{revisions[0].product!.name}</p>
            <p className="text-xs text-slate-500 font-mono">{revisions[0].product!.sku} · {revisions[0].product!.brand}</p>
          </div>
          <Link
            to={`/admin/products/${productId}/edit`}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-lg transition-all"
          >
            <FileEdit className="w-3.5 h-3.5" /> Edit Product
          </Link>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isProductView ? 'Search fields…' : 'Search by product, SKU, or field…'}
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {isProductView && (
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Changes</option>
            {Object.entries(CHANGE_TYPE_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </select>
        )}
        {typeFilter !== 'all' && (
          <button
            onClick={() => setTypeFilter('all')}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear filter
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : filtered.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center">
            <TrendingUp className="w-8 h-8 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              {search || typeFilter !== 'all'
                ? 'No revisions match your filters'
                : isProductView
                  ? 'No revisions yet — this product has not been edited since tracking began'
                  : 'No product revisions yet — edits to products will appear here automatically'}
            </p>
          </div>
        ) : (
          filtered.map(rev => (
            <RevisionCard key={rev.id} rev={rev} showProduct={!isProductView} />
          ))
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
          <History className="w-3 h-3" />
          {filtered.length} revision{filtered.length !== 1 ? 's' : ''} shown
          {!isProductView && totalRevisions > filtered.length && ` · ${totalRevisions - filtered.length} filtered out`}
        </div>
      )}
    </div>
  );
}

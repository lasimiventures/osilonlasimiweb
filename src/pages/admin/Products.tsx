import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, RefreshCcw, Pencil, Trash2,
  Package, AlertCircle, Star, Zap, TrendingUp, PhoneCall,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { adminDeleteProduct } from '../../lib/database';

// ─── types ────────────────────────────────────────────────────────────────────

interface RawProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  category: string;
  availability: string;
  images: string[];
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  buy_now_enabled: boolean;
  call_for_price: boolean;
  price_visible: boolean;
  display_price: number | null;
  created_at: string;
  product_inventory?: { stock_quantity: number; reserved_quantity: number; incoming_quantity: number } | null;
}

const AVAILABILITY_CFG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  'in-stock':    { label: 'In Stock',     dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
  'low-stock':   { label: 'Low Stock',    dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-300' },
  'out-of-stock':{ label: 'Out of Stock', dot: 'bg-red-400',     bg: 'bg-red-500/10',     text: 'text-red-300' },
  'pre-order':   { label: 'Pre-Order',    dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    text: 'text-blue-300' },
  'discontinued':{ label: 'Discontinued', dot: 'bg-slate-400',   bg: 'bg-slate-500/10',   text: 'text-slate-400' },
};

const PAGE_SIZE = 20;

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className}`} />;
}

// ─── component ────────────────────────────────────────────────────────────────

export function AdminProducts() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<RawProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [availFilter, setAvailFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function fetchProducts() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('products')
      .select('id,name,slug,sku,brand,category,availability,images,is_featured,is_new,is_best_seller,buy_now_enabled,call_for_price,price_visible,display_price,created_at,product_inventory(stock_quantity,reserved_quantity,incoming_quantity)')
      .order('created_at', { ascending: false });
    if (err) { setError('Failed to load products.'); setLoading(false); return; }
    setProducts((data ?? []) as RawProduct[]);
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, []);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [search, availFilter]);

  const filtered = useMemo(() => {
    let list = products;
    if (availFilter) list = list.filter(p => p.availability === availFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, search, availFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await adminDeleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch {
      setError('Failed to delete product. It may be referenced by orders or quotes.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Products</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} of ${products.length} product${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/products/new"
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, SKU, brand, category…"
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={availFilter}
            onChange={e => setAvailFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
          >
            <option value="">All Availability</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock</option>
            <option value="out-of-stock">Out of Stock</option>
            <option value="pre-order">Pre-Order</option>
            <option value="discontinued">Discontinued</option>
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
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Product</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Brand / Category</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Availability</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Flags</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-3.5 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-6 w-20 rounded-lg" /></td>
                    <td className="px-4 py-3 hidden lg:table-cell"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-3 text-right"><Skeleton className="h-7 w-16 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Package className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{search || availFilter ? 'No products match your filters' : 'No products yet'}</p>
                    {!search && !availFilter && (
                      <Link to="/admin/products/new" className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-400 hover:text-blue-300 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Add your first product
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map(product => {
                  const avail = AVAILABILITY_CFG[product.availability] ?? AVAILABILITY_CFG['in-stock'];
                  const isConfirmDelete = confirmDeleteId === product.id;
                  return (
                    <tr key={product.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-slate-700">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-600 m-3" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate max-w-[200px]">{product.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      {/* Brand / Category */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm text-slate-300">{product.brand}</p>
                        <p className="text-xs text-slate-500">{product.category}</p>
                      </td>
                      {/* Availability */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${avail.bg} ${avail.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${avail.dot}`} />
                          {avail.label}
                        </span>
                      </td>
                      {/* Flags */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          {product.is_featured && <Star className="w-3.5 h-3.5 text-amber-400" title="Featured" />}
                          {product.is_new && <Zap className="w-3.5 h-3.5 text-blue-400" title="New" />}
                          {product.is_best_seller && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" title="Best Seller" />}
                          {product.call_for_price && <PhoneCall className="w-3.5 h-3.5 text-orange-400" title="Call for Price" />}
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        {isConfirmDelete ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-400">Delete?</span>
                            <button
                              onClick={() => handleDelete(product.id)}
                              disabled={deletingId === product.id}
                              className="text-xs font-semibold text-red-400 hover:text-red-300 px-2 py-1 border border-red-800/50 rounded-lg transition-colors disabled:opacity-40"
                            >
                              {deletingId === product.id ? 'Deleting…' : 'Yes'}
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-slate-400 hover:text-white px-2 py-1 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(product.id)}
                              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-800/50 px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
            <span className="text-xs text-slate-500">
              Page {page} of {totalPages} · {filtered.length} results
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {!loading && filtered.length > 0 && totalPages === 1 && (
          <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-500">
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

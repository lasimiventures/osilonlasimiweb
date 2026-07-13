import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, RefreshCcw, Pencil, Trash2,
  Tag, AlertCircle, ShoppingBag, FileText, Users, Globe,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { adminDeleteBrand } from '../../lib/database';

// ─── types ────────────────────────────────────────────────────────────────────

interface RawBrand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  category: string | null;
  category_slug: string | null;
  product_count: number;
  website: string | null;
  allow_buy_now: boolean;
  allow_quote: boolean;
  allow_bulk_quote: boolean;
  created_at: string;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className}`} />;
}

function FlagBadge({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      on ? 'bg-emerald-500/10 text-emerald-300' : 'bg-slate-800 text-slate-500'
    }`}>
      {label}
    </span>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

export function AdminBrands() {
  const navigate = useNavigate();
  const [brands, setBrands] = useState<RawBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function fetchBrands() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('brands')
      .select('id,name,slug,description,logo,category,category_slug,product_count,website,allow_buy_now,allow_quote,allow_bulk_quote,created_at')
      .order('name');
    if (err) { setError('Failed to load brands.'); setLoading(false); return; }
    setBrands((data ?? []) as RawBrand[]);
    setLoading(false);
  }

  useEffect(() => { fetchBrands(); }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return brands;
    const q = search.toLowerCase();
    return brands.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      (b.category ?? '').toLowerCase().includes(q) ||
      (b.description ?? '').toLowerCase().includes(q)
    );
  }, [brands, search]);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await adminDeleteBrand(id);
      setBrands(prev => prev.filter(b => b.id !== id));
    } catch {
      setError('Failed to delete brand. Remove associated products first.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Brands</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} of ${brands.length} brand${brands.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBrands}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/brands/new"
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Brand
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search brands…"
          className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Brand</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Category</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Products</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Commerce Flags</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="px-5 py-3.5 hidden md:table-cell"><Skeleton className="h-3.5 w-8" /></td>
                    <td className="px-5 py-3.5 hidden lg:table-cell"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-5 py-3.5 text-right"><Skeleton className="h-7 w-16 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <Tag className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{search ? 'No brands match your search' : 'No brands yet'}</p>
                    {!search && (
                      <Link to="/admin/brands/new" className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-400 hover:text-blue-300 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Add your first brand
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map(brand => {
                  const isConfirmDelete = confirmDeleteId === brand.id;
                  return (
                    <tr key={brand.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      {/* Brand */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-slate-700 flex items-center justify-center">
                            {brand.logo ? (
                              <img src={brand.logo} alt={brand.name} className="w-full h-full object-contain p-1" />
                            ) : (
                              <Tag className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white">{brand.name}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-slate-500 font-mono">{brand.slug}</p>
                              {brand.website && (
                                <a
                                  href={brand.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-slate-600 hover:text-blue-400 transition-colors"
                                  title={brand.website}
                                >
                                  <Globe className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-slate-300">{brand.category ?? <span className="text-slate-600">—</span>}</span>
                      </td>
                      {/* Products */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-slate-300 tabular-nums">{brand.product_count}</span>
                      </td>
                      {/* Commerce Flags */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <FlagBadge on={brand.allow_buy_now} label="Buy Now" />
                          <FlagBadge on={brand.allow_quote} label="Quote" />
                          <FlagBadge on={brand.allow_bulk_quote} label="Bulk Quote" />
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {isConfirmDelete ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-400">Delete?</span>
                            <button
                              onClick={() => handleDelete(brand.id)}
                              disabled={deletingId === brand.id}
                              className="text-xs font-semibold text-red-400 hover:text-red-300 px-2 py-1 border border-red-800/50 rounded-lg transition-colors disabled:opacity-40"
                            >
                              {deletingId === brand.id ? 'Deleting…' : 'Yes'}
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
                              onClick={() => navigate(`/admin/brands/${brand.id}/edit`)}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(brand.id)}
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

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
            {filtered.length} brand{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Legend */}
      {!loading && brands.length > 0 && (
        <div className="flex items-center gap-5 mt-4">
          {[
            { icon: ShoppingBag, label: 'Buy Now — allows direct B2C purchase' },
            { icon: FileText, label: 'Quote — allows quote requests' },
            { icon: Users, label: 'Bulk Quote — allows bulk pricing requests' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-500">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

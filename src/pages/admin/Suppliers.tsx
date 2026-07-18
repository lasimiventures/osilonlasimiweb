import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, RefreshCcw, Pencil, Trash2, Star, Truck,
  AlertCircle, Building2, Mail, Phone, Globe, ChevronDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { adminDeleteSupplier, adminTogglePreferredSupplier } from '../../lib/database';

interface SupplierRow {
  id: string;
  name: string;
  slug: string;
  supplier_type: string;
  status: string;
  category: { name: string } | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  country: string | null;
  currency: string;
  lead_time_days: number;
  is_preferred: boolean;
  rating: number;
  rating_count: number;
  product_catalog_count: number;
}

const TYPE_LABELS: Record<string, string> = {
  distributor: 'Distributor',
  manufacturer: 'Manufacturer',
  reseller: 'Reseller',
  service_provider: 'Service Provider',
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: 'bg-emerald-500/10 text-emerald-300',
    inactive: 'bg-slate-700/40 text-slate-400',
    blacklisted: 'bg-red-500/10 text-red-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${map[status] ?? 'bg-slate-800 text-slate-400'}`}>
      {status}
    </span>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n}
          className={`w-3 h-3 ${n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
        />
      ))}
      <span className="ml-1 text-xs text-slate-400 tabular-nums">{rating.toFixed(1)}</span>
    </span>
  );
}

export function AdminSuppliers() {
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPreferredOnly, setShowPreferredOnly] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function fetchSuppliers() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('suppliers')
      .select('id,name,slug,supplier_type,status,category:supplier_categories(name),email,phone,website,city,country,currency,lead_time_days,is_preferred,rating,rating_count,product_catalog_count')
      .order('name');
    if (err) { setError('Failed to load suppliers.'); setLoading(false); return; }
    setSuppliers((data ?? []) as unknown as SupplierRow[]);
    setLoading(false);
  }

  useEffect(() => { fetchSuppliers(); }, []);

  const filtered = useMemo(() => {
    let list = suppliers;
    if (typeFilter !== 'all') list = list.filter(s => s.supplier_type === typeFilter);
    if (statusFilter !== 'all') list = list.filter(s => s.status === statusFilter);
    if (showPreferredOnly) list = list.filter(s => s.is_preferred);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.email ?? '').toLowerCase().includes(q) ||
        (s.city ?? '').toLowerCase().includes(q) ||
        (s.country ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [suppliers, search, typeFilter, statusFilter, showPreferredOnly]);

  async function handleTogglePreferred(supplier: SupplierRow) {
    try {
      await adminTogglePreferredSupplier(supplier.id, !supplier.is_preferred);
      setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, is_preferred: !s.is_preferred } : s));
    } catch {
      setError('Failed to update preferred status.');
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await adminDeleteSupplier(id);
      setSuppliers(prev => prev.filter(s => s.id !== id));
    } catch {
      setError('Failed to delete supplier. Remove associated contacts, ratings, and catalog items first.');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  const preferredCount = suppliers.filter(s => s.is_preferred).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Suppliers</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {loading ? 'Loading…' : `${filtered.length} of ${suppliers.length} supplier${suppliers.length !== 1 ? 's' : ''}`}
            {preferredCount > 0 && ` · ${preferredCount} preferred`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSuppliers}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            to="/admin/suppliers/new"
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Supplier
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers…"
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blacklisted">Blacklisted</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showPreferredOnly}
            onChange={e => setShowPreferredOnly(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500"
          />
          Preferred only
        </label>
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
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Supplier</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Type / Category</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Contact</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Lead Time</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Rating</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="px-5 py-3.5"><div className="flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-xl" /><div className="space-y-1.5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-20" /></div></div></td>
                    <td className="px-5 py-3.5 hidden md:table-cell"><Skeleton className="h-3.5 w-24" /></td>
                    <td className="px-5 py-3.5 hidden lg:table-cell"><Skeleton className="h-3.5 w-32" /></td>
                    <td className="px-5 py-3.5 hidden md:table-cell"><Skeleton className="h-3.5 w-12" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="px-5 py-3.5"><Skeleton className="h-5 w-16 rounded" /></td>
                    <td className="px-5 py-3.5 text-right"><Skeleton className="h-7 w-16 rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <Building2 className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">{search || typeFilter !== 'all' || statusFilter !== 'all' || showPreferredOnly ? 'No suppliers match your filters' : 'No suppliers yet'}</p>
                    {!search && typeFilter === 'all' && statusFilter === 'all' && !showPreferredOnly && (
                      <Link to="/admin/suppliers/new" className="inline-flex items-center gap-1.5 mt-3 text-sm text-blue-400 hover:text-blue-300 font-medium">
                        <Plus className="w-3.5 h-3.5" /> Add your first supplier
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filtered.map(supplier => {
                  const isConfirmDelete = confirmDeleteId === supplier.id;
                  return (
                    <tr key={supplier.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      {/* Supplier */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-slate-700">
                            <Building2 className="w-4 h-4 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium text-white truncate">{supplier.name}</p>
                              {supplier.is_preferred && (
                                <span title="Preferred supplier" className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300">
                                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 mr-0.5" />PREF
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono truncate">{supplier.slug}</p>
                          </div>
                        </div>
                      </td>
                      {/* Type / Category */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-sm text-slate-300">{TYPE_LABELS[supplier.supplier_type] ?? supplier.supplier_type}</span>
                        {supplier.category && (
                          <p className="text-xs text-slate-500">{supplier.category.name}</p>
                        )}
                      </td>
                      {/* Contact */}
                      <td className="px-5 py-3.5 hidden lg:table-cell">
                        {supplier.email ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Mail className="w-3 h-3 text-slate-600" />
                            <span className="truncate max-w-[160px]">{supplier.email}</span>
                          </div>
                        ) : supplier.phone ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Phone className="w-3 h-3 text-slate-600" />
                            <span>{supplier.phone}</span>
                          </div>
                        ) : supplier.website ? (
                          <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
                            <Globe className="w-3 h-3" />
                            <span className="truncate max-w-[160px]">Website</span>
                          </a>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                        {(supplier.city || supplier.country) && (
                          <p className="text-xs text-slate-500 mt-0.5">{[supplier.city, supplier.country].filter(Boolean).join(', ')}</p>
                        )}
                      </td>
                      {/* Lead Time */}
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-slate-300">
                          <Truck className="w-3.5 h-3.5 text-slate-600" />
                          <span className="tabular-nums">{supplier.lead_time_days}d</span>
                        </div>
                      </td>
                      {/* Rating */}
                      <td className="px-5 py-3.5">
                        {supplier.rating_count > 0 ? (
                          <div>
                            <Stars rating={supplier.rating} />
                            <p className="text-xs text-slate-500 mt-0.5">{supplier.rating_count} review{supplier.rating_count !== 1 ? 's' : ''}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">No ratings</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={supplier.status} />
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        {isConfirmDelete ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-xs text-red-400">Delete?</span>
                            <button
                              onClick={() => handleDelete(supplier.id)}
                              disabled={deletingId === supplier.id}
                              className="text-xs font-semibold text-red-400 hover:text-red-300 px-2 py-1 border border-red-800/50 rounded-lg transition-colors disabled:opacity-40"
                            >
                              {deletingId === supplier.id ? 'Deleting…' : 'Yes'}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-slate-400 hover:text-white px-2 py-1 transition-colors">
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleTogglePreferred(supplier)}
                              title={supplier.is_preferred ? 'Remove preferred' : 'Mark as preferred'}
                              className={`p-1.5 rounded-lg border transition-all ${supplier.is_preferred ? 'border-amber-700/50 text-amber-400 hover:text-amber-300' : 'border-slate-700 text-slate-500 hover:text-amber-400 hover:border-amber-800/50'}`}
                            >
                              <Star className={`w-3.5 h-3.5 ${supplier.is_preferred ? 'fill-amber-400' : ''}`} />
                            </button>
                            <Link
                              to={`/admin/suppliers/${supplier.id}/edit`}
                              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              <Pencil className="w-3 h-3" /> Edit
                            </Link>
                            <button
                              onClick={() => setConfirmDeleteId(supplier.id)}
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
          <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-2">
            <ChevronDown className="w-3 h-3" />
            {filtered.length} supplier{filtered.length !== 1 ? 's' : ''} shown
          </div>
        )}
      </div>
    </div>
  );
}

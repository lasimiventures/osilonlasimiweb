import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Image, Plus, Pencil, Trash2, Loader2, RefreshCcw,
  AlertCircle, Eye, EyeOff, ChevronUp, ChevronDown, GripVertical,
} from 'lucide-react';
import {
  adminGetBanners, adminDeleteBanner, adminToggleBannerActive, adminUpdateBanner,
} from '../../lib/database';
import type { Banner } from '../../types';

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className ?? ''}`} />;
}

function TypeBadge({ type }: { type: string }) {
  return type === 'hero'
    ? <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20">Hero</span>
    : <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">Promo</span>;
}

export function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Banner | null>(null);
  const [reordering, setReordering] = useState(false);
  const confirmRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setBanners(await adminGetBanners());
    } catch {
      setError('Failed to load banners.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (confirmRef.current && !confirmRef.current.contains(e.target as Node)) {
        setConfirmDelete(null);
      }
    }
    if (confirmDelete) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [confirmDelete]);

  async function handleToggle(banner: Banner) {
    setTogglingId(banner.id);
    try {
      const updated = await adminToggleBannerActive(banner.id, !banner.isActive);
      setBanners(prev => prev.map(b => b.id === banner.id ? updated : b));
    } catch {
      setError('Failed to update banner.');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await adminDeleteBanner(id);
      setBanners(prev => prev.filter(b => b.id !== id));
    } catch {
      setError('Failed to delete banner.');
    } finally {
      setDeletingId(null);
      setConfirmDelete(null);
    }
  }

  async function handleReorder(banner: Banner, direction: 'up' | 'down') {
    const sametype = banners.filter(b => b.bannerType === banner.bannerType).sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sametype.findIndex(b => b.id === banner.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sametype.length) return;

    setReordering(true);
    const a = sametype[idx];
    const b = sametype[swapIdx];
    try {
      await Promise.all([
        adminUpdateBanner(a.id, { sort_order: b.sortOrder }),
        adminUpdateBanner(b.id, { sort_order: a.sortOrder }),
      ]);
      setBanners(prev => prev.map(ban => {
        if (ban.id === a.id) return { ...ban, sortOrder: b.sortOrder };
        if (ban.id === b.id) return { ...ban, sortOrder: a.sortOrder };
        return ban;
      }));
    } catch {
      setError('Failed to reorder.');
    } finally {
      setReordering(false);
    }
  }

  const heroBanners = banners.filter(b => b.bannerType === 'hero').sort((a, b) => a.sortOrder - b.sortOrder);
  const promoBanners = banners.filter(b => b.bannerType === 'promo').sort((a, b) => a.sortOrder - b.sortOrder);

  const renderTable = (rows: Banner[], label: string) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <TypeBadge type={rows[0]?.bannerType ?? (label === 'Hero Banners' ? 'hero' : 'promo')} />
          {label}
          <span className="text-slate-600 font-normal text-xs">({rows.length})</span>
        </h2>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {rows.length === 0 ? (
          <div className="py-12 text-center">
            <Image className="w-7 h-7 text-slate-700 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No {label.toLowerCase()} yet.</p>
            <Link to="/admin/banners/new" className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300">
              <Plus className="w-3.5 h-3.5" /> Add one
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-10">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Preview</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">CTA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Active</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((banner, idx) => (
                <tr key={banner.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => handleReorder(banner, 'up')}
                        disabled={idx === 0 || reordering}
                        className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs text-slate-600 tabular-nums text-center">{banner.sortOrder}</span>
                      <button
                        onClick={() => handleReorder(banner, 'down')}
                        disabled={idx === rows.length - 1 || reordering}
                        className="text-slate-600 hover:text-slate-300 disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="w-20 h-12 rounded-lg overflow-hidden bg-slate-800 flex-shrink-0">
                      {banner.imageUrl ? (
                        <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-4 h-4 text-slate-600" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      {banner.badgeText && (
                        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide mb-0.5 block">{banner.badgeText}</span>
                      )}
                      <p className="text-sm font-semibold text-white line-clamp-1">{banner.title}</p>
                      {banner.subtitle && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{banner.subtitle}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    {banner.ctaPrimaryText && (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-blue-400 font-medium">{banner.ctaPrimaryText}</span>
                        <span className="text-[10px] text-slate-600 font-mono truncate max-w-32">{banner.ctaPrimaryLink}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleToggle(banner)}
                      disabled={togglingId === banner.id}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                        banner.isActive ? 'bg-blue-600' : 'bg-slate-700'
                      } ${togglingId === banner.id ? 'opacity-50' : ''}`}
                      title={banner.isActive ? 'Click to deactivate' : 'Click to activate'}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
                        banner.isActive ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/admin/banners/${banner.id}/edit`}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </Link>
                      <button
                        onClick={() => setConfirmDelete(banner)}
                        className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700/60 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Marketing Banners</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage homepage hero carousel and promotional strips</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <Link to="/admin/banners/new"
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Banner
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Info strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <GripVertical className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-300">Hero Banners</p>
            <p className="text-xs text-slate-400 mt-0.5">Displayed in the rotating carousel at the top of the homepage. Up to 5 recommended.</p>
          </div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Image className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300">Promo Banners</p>
            <p className="text-xs text-slate-400 mt-0.5">Displayed as a 3-card promotional grid below the hero. Best with 3 active banners.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {renderTable(heroBanners, 'Hero Banners')}
          {renderTable(promoBanners, 'Promo Banners')}
        </>
      )}

      {/* Delete confirm dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setConfirmDelete(null)} />
          <div ref={confirmRef} className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl z-10 p-6">
            <h2 className="text-sm font-semibold text-white mb-2">Delete banner?</h2>
            <p className="text-sm text-slate-400 mb-5">
              "<span className="text-slate-300">{confirmDelete.title}</span>" will be permanently removed.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={deletingId === confirmDelete.id}
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
              >
                {deletingId === confirmDelete.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deletingId === confirmDelete.id ? 'Deleting…' : 'Delete'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="px-4 text-sm text-slate-400 hover:text-white transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

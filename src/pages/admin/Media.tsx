import { useEffect, useState, useRef, useCallback } from 'react';
import type { DragEvent } from 'react';
import {
  Upload, Search, RefreshCcw, Copy, Trash2, Check,
  Image as ImageIcon, FileText, File as FileIcon, Video as VideoIcon,
  AlertCircle, Loader2, X, ExternalLink, HardDrive, Link2, Pencil,
  Package, Layers, Tag, BookOpen, FileType2,
} from 'lucide-react';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import {
  getMediaAssets, createMediaAsset, updateMediaAsset, deleteMediaAsset,
  type MediaAsset,
} from '../../lib/database';
import { getBrands, getCategories } from '../../lib/database';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function isImage(name: string): boolean {
  return /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(name);
}

function isVideoType(mime: string): boolean {
  return mime.startsWith('video/');
}

function sanitizeName(raw: string): string {
  return raw.replace(/\s+/g, '_').replace(/[^\w.\-]/g, '');
}

function isYouTube(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

function getYouTubeThumb(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

// ─── asset type config ────────────────────────────────────────────────────────

type AssetType = 'all' | 'product_image' | 'brand_logo' | 'category_banner' | 'datasheet' | 'brochure' | 'video';

const ASSET_TABS: { key: AssetType; label: string; icon: typeof ImageIcon; accept: string }[] = [
  { key: 'all',             label: 'All Assets',      icon: HardDrive,   accept: '' },
  { key: 'product_image',   label: 'Product Images',  icon: ImageIcon,   accept: 'image/*' },
  { key: 'brand_logo',      label: 'Brand Logos',     icon: Layers,      accept: 'image/*' },
  { key: 'category_banner', label: 'Category Banners',icon: Tag,         accept: 'image/*' },
  { key: 'datasheet',       label: 'Datasheets',      icon: FileText,    accept: 'application/pdf' },
  { key: 'brochure',        label: 'Brochures',       icon: BookOpen,    accept: 'application/pdf,.doc,.docx' },
  { key: 'video',           label: 'Video Links',     icon: VideoIcon,   accept: '' },
];

const ASSET_TYPE_LABELS: Record<string, string> = {
  product_image: 'Product Image',
  brand_logo: 'Brand Logo',
  category_banner: 'Category Banner',
  datasheet: 'Datasheet',
  brochure: 'Brochure',
  video: 'Video',
  other: 'Other',
};

function FileTypeIcon({ asset, className = '' }: { asset: MediaAsset; className?: string }) {
  const name = asset.public_url || asset.title;
  if (asset.asset_type === 'video' || isVideoType(asset.mime_type || '')) return <VideoIcon className={`text-purple-400 ${className}`} />;
  if (asset.mime_type?.includes('pdf') || name.endsWith('.pdf')) return <FileText className={`text-amber-400 ${className}`} />;
  if (isImage(name)) return <ImageIcon className={`text-blue-400 ${className}`} />;
  return <FileIcon className={`text-slate-500 ${className}`} />;
}

// ─── main component ───────────────────────────────────────────────────────────

export function AdminMedia() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AssetType>('all');
  const [search, setSearch] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [editAsset, setEditAsset] = useState<MediaAsset | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMediaAssets();
      setAssets(data);
    } catch {
      setError('Failed to load media assets.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const filtered = assets.filter(a => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || a.title.toLowerCase().includes(q) || (a.tags?.some(t => t.toLowerCase().includes(q)) ?? false);
    const matchesType = activeTab === 'all' || a.asset_type === activeTab;
    return matchesSearch && matchesType;
  });

  const counts: Record<string, number> = {};
  assets.forEach(a => { counts[a.asset_type] = (counts[a.asset_type] || 0) + 1; });

  async function copyUrl(asset: MediaAsset) {
    const url = asset.public_url || '';
    await navigator.clipboard.writeText(url);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(prev => (prev === asset.id ? null : prev)), 2000);
  }

  async function handleDelete(asset: MediaAsset) {
    setDeletingId(asset.id);
    try {
      if (asset.storage_path) {
        await supabase.storage.from('media').remove([asset.storage_path]);
      }
      await deleteMediaAsset(asset.id);
      setAssets(prev => prev.filter(a => a.id !== asset.id));
      if (previewAsset?.id === asset.id) setPreviewAsset(null);
    } catch {
      setError(`Failed to delete "${asset.title}".`);
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Digital Asset Management</h1>
          {loading ? (
            <p className="text-slate-500 text-sm mt-0.5">Loading…</p>
          ) : (
            <p className="text-slate-400 text-sm mt-0.5">
              {assets.length} asset{assets.length !== 1 ? 's' : ''} total
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAssets}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors"
          >
            <Upload className="w-4 h-4" />
            {activeTab === 'video' ? 'Add Video Link' : 'Upload Assets'}
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Asset type tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {ASSET_TABS.map(t => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          const count = t.key === 'all' ? assets.length : (counts[t.key] || 0);
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
              {count > 0 && <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-blue-500/30' : 'bg-slate-700'}`}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search assets…"
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {filtered.length > 0 && (
          <p className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Asset grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-xl overflow-hidden animate-pulse">
              <div className="aspect-square" />
              <div className="p-2 space-y-1.5">
                <div className="h-2.5 bg-slate-700 rounded w-3/4" />
                <div className="h-2 bg-slate-700/60 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
            {activeTab === 'video' ? <VideoIcon className="w-7 h-7 text-slate-600" /> : <HardDrive className="w-7 h-7 text-slate-600" />}
          </div>
          <p className="text-slate-300 text-sm font-medium mb-1">
            {search ? 'No assets match your search' : `No ${activeTab === 'all' ? 'assets' : ASSET_TYPE_LABELS[activeTab] || 'assets'} yet`}
          </p>
          <p className="text-slate-600 text-xs">
            {activeTab === 'video' ? 'Add YouTube or Vimeo links to showcase product videos' : 'Upload files to build your asset library'}
          </p>
          {!search && (
            <button
              onClick={() => setUploadModalOpen(true)}
              className="mt-4 flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              {activeTab === 'video' ? <Link2 className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
              {activeTab === 'video' ? 'Add your first video' : 'Upload your first file'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(asset => {
            const isConfirm = confirmDeleteId === asset.id;
            const isDeleting = deletingId === asset.id;
            const isCopied = copiedId === asset.id;
            const isImg = isImage(asset.public_url || asset.title);
            const ytThumb = asset.asset_type === 'video' ? getYouTubeThumb(asset.public_url || '') : null;
            return (
              <div
                key={asset.id}
                className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 hover:shadow-lg hover:shadow-black/20 transition-all"
              >
                {/* Thumbnail */}
                <div
                  className="aspect-square bg-slate-800 flex items-center justify-center cursor-pointer overflow-hidden relative"
                  onClick={() => { if (!isConfirm) setPreviewAsset(asset); }}
                >
                  {isImg && asset.public_url ? (
                    <>
                      <img src={asset.public_url} alt={asset.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  ) : ytThumb ? (
                    <>
                      <img src={ytThumb} alt={asset.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center">
                          <VideoIcon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileTypeIcon asset={asset} className="w-10 h-10" />
                      <span className="text-xs font-mono uppercase text-slate-500">
                        {asset.mime_type?.split('/')[1] || asset.title.split('.').pop() || 'file'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Type badge */}
                <div className="absolute top-2 left-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-900/90 text-slate-400 backdrop-blur-sm">
                    {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}
                  </span>
                </div>

                {/* Quick-action buttons (hover) */}
                {!isConfirm && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button onClick={e => { e.stopPropagation(); copyUrl(asset); }} title={isCopied ? 'Copied!' : 'Copy URL'}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs shadow-lg transition-all ${isCopied ? 'bg-emerald-600 text-white' : 'bg-slate-900/90 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); setEditAsset(asset); }} title="Edit"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900/90 text-slate-300 hover:bg-slate-700 hover:text-white transition-all shadow-lg">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(asset.id); }} title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900/90 text-slate-300 hover:bg-red-900/80 hover:text-red-300 transition-all shadow-lg">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Delete confirmation overlay */}
                {isConfirm && (
                  <div className="absolute inset-0 bg-slate-900/96 flex flex-col items-center justify-center gap-3 p-3 z-10">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <p className="text-xs text-red-300 text-center font-medium leading-snug">
                      Delete "{asset.title}"?<br />
                      <span className="text-slate-500 font-normal">This cannot be undone.</span>
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDelete(asset)} disabled={isDeleting}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5">
                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="px-2.5 py-2 border-t border-slate-800">
                  <p className="text-xs text-slate-300 truncate font-medium leading-snug" title={asset.title}>{asset.title}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-slate-600 tabular-nums">
                      {asset.file_size ? formatBytes(asset.file_size) : asset.asset_type === 'video' ? 'External' : '—'}
                    </p>
                    {asset.linked_entity_name && (
                      <span className="text-[10px] text-blue-400 truncate max-w-[80px]" title={asset.linked_entity_name}>
                        {asset.linked_entity_name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload modal */}
      {uploadModalOpen && (
        <UploadModal
          defaultType={activeTab === 'all' ? 'product_image' : activeTab}
          onClose={() => setUploadModalOpen(false)}
          onUploaded={() => { setUploadModalOpen(false); fetchAssets(); }}
        />
      )}

      {/* Edit modal */}
      {editAsset && (
        <EditAssetModal
          asset={editAsset}
          onClose={() => setEditAsset(null)}
          onSaved={() => { setEditAsset(null); fetchAssets(); }}
        />
      )}

      {/* Preview modal */}
      {previewAsset && (
        <PreviewModal asset={previewAsset} onClose={() => setPreviewAsset(null)} onCopy={() => copyUrl(previewAsset)} copied={copiedId === previewAsset.id} />
      )}
    </div>
  );
}

// ─── upload modal ─────────────────────────────────────────────────────────────

function UploadModal({ defaultType, onClose, onUploaded }: {
  defaultType: AssetType;
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [assetType, setAssetType] = useState<string>(defaultType === 'video' ? 'product_image' : defaultType);
  const [isVideo, setIsVideo] = useState(defaultType === 'video');
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Linking
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [linkType, setLinkType] = useState<string>('');
  const [linkId, setLinkId] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [title, setTitle] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getBrands().then(d => setBrands((d ?? []).map(b => ({ id: b.id, name: b.name }))));
    getCategories().then(d => setCategories((d ?? []).map(c => ({ id: c.id, name: c.name }))));
  }, []);

  // Auto-set link type based on asset type
  useEffect(() => {
    if (assetType === 'brand_logo') setLinkType('brand');
    else if (assetType === 'category_banner') setLinkType('category');
  }, [assetType]);

  function handleFileSelect(fileList: FileList | null) {
    if (!fileList) return;
    setFiles(Array.from(fileList));
    if (!title && fileList[0]) setTitle(fileList[0].name.replace(/\.[^.]+$/, ''));
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }

  const tabConfig = ASSET_TABS.find(t => t.key === assetType);
  const acceptStr = tabConfig?.accept || 'image/*,application/pdf,.doc,.docx';

  async function handleUpload() {
    setErrors([]);
    setUploading(true);

    try {
      // ─── Video link path ────────────────────────────────────────────────────
      if (isVideo) {
        if (!videoUrl.trim()) { setErrors(['Video URL is required']); setUploading(false); return; }
        if (!videoTitle.trim()) { setErrors(['Video title is required']); setUploading(false); return; }
        const linkEntity = resolveLink();
        await createMediaAsset({
          title: videoTitle.trim(),
          asset_type: 'video',
          storage_path: null,
          public_url: videoUrl.trim(),
          mime_type: 'video/external',
          file_size: null,
          linked_entity_type: linkEntity.type,
          linked_entity_id: linkEntity.id,
          linked_entity_name: linkEntity.name,
          description: null,
          tags: [],
          created_by: null,
        });
        setUploading(false);
        onUploaded();
        return;
      }

      // ─── File upload path ───────────────────────────────────────────────────
      if (files.length === 0) { setErrors(['Select at least one file to upload']); setUploading(false); return; }
      const linkEntity = resolveLink();
      const errs: string[] = [];
      let uploadedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Uploading ${i + 1} of ${files.length}…`);
        const safeName = `${assetType}/${Date.now()}_${sanitizeName(file.name)}`;
        const { error: uploadErr } = await supabase.storage.from('media').upload(safeName, file, { cacheControl: '3600', upsert: false });
        if (uploadErr) {
          errs.push(`${file.name}: ${uploadErr.message}`);
          continue;
        }
        const publicUrl = supabase.storage.from('media').getPublicUrl(safeName).data.publicUrl;
        const fileTitle = files.length === 1 ? (title.trim() || file.name.replace(/\.[^.]+$/, '')) : file.name.replace(/\.[^.]+$/, '');
        await createMediaAsset({
          title: fileTitle,
          asset_type: assetType,
          storage_path: safeName,
          public_url: publicUrl,
          mime_type: file.type,
          file_size: file.size,
          linked_entity_type: linkEntity.type,
          linked_entity_id: linkEntity.id,
          linked_entity_name: linkEntity.name,
          description: null,
          tags: [],
          created_by: null,
        });
        uploadedCount++;
      }

      // Auto-update brand logo or category image if linked
      if (uploadedCount > 0 && linkEntity.id) {
        const firstAsset = files[0];
        const safeName = `${assetType}/${Date.now()}_${sanitizeName(firstAsset.name)}`;
        const publicUrl = supabase.storage.from('media').getPublicUrl(safeName).data.publicUrl;
        if (linkEntity.type === 'brand') {
          await supabase.from('brands').update({ logo: publicUrl }).eq('id', linkEntity.id);
        } else if (linkEntity.type === 'category') {
          await supabase.from('categories').update({ image: publicUrl }).eq('id', linkEntity.id);
        }
      }

      if (errs.length > 0) setErrors(errs);
      setUploading(false);
      setProgress('');
      if (errs.length < files.length) onUploaded();
    } catch {
      setErrors(['Upload failed. Please try again.']);
      setUploading(false);
    }
  }

  function resolveLink(): { type: string | null; id: string | null; name: string | null } {
    if (!linkType || !linkId) return { type: null, id: null, name: null };
    if (linkType === 'brand') {
      const b = brands.find(b => b.id === linkId);
      return { type: 'brand', id: linkId, name: b?.name ?? null };
    }
    if (linkType === 'category') {
      const c = categories.find(c => c.id === linkId);
      return { type: 'category', id: linkId, name: c?.name ?? null };
    }
    return { type: null, id: null, name: null };
  }

  const inputCls = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">{isVideo ? 'Add Video Link' : 'Upload Assets'}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errors.length > 0 && (
            <div className="bg-red-950/50 border border-red-800/40 rounded-xl p-3 text-red-300 text-sm space-y-1">
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}

          {/* Video / File toggle */}
          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 gap-0.5">
            <button onClick={() => { setIsVideo(false); }} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${!isVideo ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Upload className="w-3.5 h-3.5 inline mr-1.5" /> Upload Files
            </button>
            <button onClick={() => { setIsVideo(true); setAssetType('video'); }} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isVideo ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
              <Link2 className="w-3.5 h-3.5 inline mr-1.5" /> Video Link
            </button>
          </div>

          {/* Asset type selector (files only) */}
          {!isVideo && (
            <div>
              <label className={labelCls}>Asset Type</label>
              <select value={assetType} onChange={e => setAssetType(e.target.value)} className={inputCls}>
                {ASSET_TABS.filter(t => t.key !== 'all' && t.key !== 'video').map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Video URL + title */}
          {isVideo && (
            <>
              <div>
                <label className={labelCls}>Video URL <span className="text-red-400">*</span></label>
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=…" className={inputCls} />
                <p className="text-xs text-slate-500 mt-1">YouTube or Vimeo links. Thumbnail auto-extracted from YouTube.</p>
              </div>
              <div>
                <label className={labelCls}>Video Title <span className="text-red-400">*</span></label>
                <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="Product demo video" className={inputCls} />
              </div>
            </>
          )}

          {/* File drop zone (files only) */}
          {!isVideo && (
            <>
              <input ref={fileInputRef} type="file" multiple accept={acceptStr} className="hidden" onChange={e => handleFileSelect(e.target.files)} onClick={e => { (e.target as HTMLInputElement).value = ''; }} />
              <div
                onDrop={handleDrop}
                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragging ? 'border-blue-500 bg-blue-950/30' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/20'
                }`}
              >
                <Upload className={`w-6 h-6 mx-auto mb-2 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
                <p className="text-sm text-slate-300 font-medium mb-1">
                  {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''} selected` : 'Drag & drop or click to browse'}
                </p>
                <p className="text-xs text-slate-600">{acceptStr === 'image/*' ? 'Images only' : 'PDF, Word docs'}</p>
              </div>

              {files.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5 text-xs text-slate-300">
                      <FileIcon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span className="truncate flex-1">{f.name}</span>
                      <span className="text-slate-500 tabular-nums">{formatBytes(f.size)}</span>
                    </div>
                  ))}
                </div>
              )}

              {files.length === 1 && (
                <div>
                  <label className={labelCls}>Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Asset title" className={inputCls} />
                </div>
              )}

              {files.length > 1 && (
                <p className="text-xs text-slate-500 bg-slate-800/50 rounded-lg p-2">Bulk upload: each file becomes a separate asset with the filename as title.</p>
              )}
            </>
          )}

          {/* Linking */}
          <div className="border-t border-slate-800 pt-4 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Link to Entity (optional)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Link Type</label>
                <select value={linkType} onChange={e => { setLinkType(e.target.value); setLinkId(''); }} className={inputCls}>
                  <option value="">None</option>
                  <option value="brand">Brand</option>
                  <option value="category">Category</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Select {linkType || 'Entity'}</label>
                <select value={linkId} onChange={e => setLinkId(e.target.value)} disabled={!linkType} className={inputCls + ' disabled:opacity-40'}>
                  <option value="">Choose…</option>
                  {linkType === 'brand' && brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  {linkType === 'category' && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            {linkType === 'brand' && <p className="text-xs text-blue-400 bg-blue-950/30 rounded-lg p-2">Uploading a brand logo will automatically update the brand's logo field.</p>}
            {linkType === 'category' && <p className="text-xs text-blue-400 bg-blue-950/30 rounded-lg p-2">Uploading a category banner will automatically update the category's image field.</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-800">
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white px-4 py-2.5 rounded-xl transition-colors">Cancel</button>
          <button
            onClick={handleUpload}
            disabled={uploading || (!isVideo && files.length === 0) || (isVideo && (!videoUrl.trim() || !videoTitle.trim()))}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? (progress || 'Uploading…') : isVideo ? 'Add Video' : `Upload ${files.length > 0 ? `${files.length} File${files.length !== 1 ? 's' : ''}` : 'Files'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── edit asset modal ─────────────────────────────────────────────────────────

function EditAssetModal({ asset, onClose, onSaved }: { asset: MediaAsset; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description || '');
  const [tags, setTags] = useState((asset.tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [linkType, setLinkType] = useState(asset.linked_entity_type || '');
  const [linkId, setLinkId] = useState(asset.linked_entity_id || '');

  useEffect(() => {
    getBrands().then(d => setBrands((d ?? []).map(b => ({ id: b.id, name: b.name }))));
    getCategories().then(d => setCategories((d ?? []).map(c => ({ id: c.id, name: c.name }))));
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      let linkedName: string | null = null;
      if (linkType === 'brand') linkedName = brands.find(b => b.id === linkId)?.name ?? null;
      else if (linkType === 'category') linkedName = categories.find(c => c.id === linkId)?.name ?? null;
      await updateMediaAsset(asset.id, {
        title: title.trim(),
        description: description.trim() || null,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        linked_entity_type: linkType || null,
        linked_entity_id: linkId || null,
        linked_entity_name: linkedName,
      });
      setSaving(false);
      onSaved();
    } catch {
      setSaving(false);
    }
  }

  const inputCls = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
  const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <h2 className="text-base font-semibold text-white">Edit Asset</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input value={tags} onChange={e => setTags(e.target.value)} placeholder="solar, panel, mono" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Link Type</label>
              <select value={linkType} onChange={e => { setLinkType(e.target.value); setLinkId(''); }} className={inputCls}>
                <option value="">None</option>
                <option value="brand">Brand</option>
                <option value="category">Category</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Entity</label>
              <select value={linkId} onChange={e => setLinkId(e.target.value)} disabled={!linkType} className={inputCls + ' disabled:opacity-40'}>
                <option value="">Choose…</option>
                {linkType === 'brand' && brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                {linkType === 'category' && categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-800">
          <button onClick={onClose} className="text-sm text-slate-400 hover:text-white px-4 py-2.5 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── preview modal ────────────────────────────────────────────────────────────

function PreviewModal({ asset, onClose, onCopy, copied }: { asset: MediaAsset; onClose: () => void; onCopy: () => void; copied: boolean }) {
  const isImg = isImage(asset.public_url || asset.title);
  const ytThumb = asset.asset_type === 'video' ? getYouTubeThumb(asset.public_url || '') : null;
  const isYouTubeVid = asset.asset_type === 'video' && isYouTube(asset.public_url || '');

  return (
    <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800 flex-shrink-0">
          <FileTypeIcon asset={asset} className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm font-medium text-white flex-1 truncate min-w-0" title={asset.title}>{asset.title}</p>
          {asset.file_size && <span className="text-xs text-slate-500 flex-shrink-0">{formatBytes(asset.file_size)}</span>}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={onCopy} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'}`}>
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy URL</>}
            </button>
            {asset.public_url && (
              <a href={asset.public_url} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg transition-all" title="Open in new tab">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Preview */}
        <div className="flex-1 overflow-hidden bg-[#0d1117] flex items-center justify-center min-h-[200px]">
          {isImg && asset.public_url ? (
            <img src={asset.public_url} alt={asset.title} className="max-w-full max-h-[50vh] object-contain" />
          ) : isYouTubeVid && asset.public_url ? (
            <div className="w-full max-w-2xl aspect-video">
              <iframe src={asset.public_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} title={asset.title} className="w-full h-full" allowFullScreen />
            </div>
          ) : ytThumb ? (
            <img src={ytThumb} alt={asset.title} className="max-w-full max-h-[50vh] object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-4 py-16">
              <FileTypeIcon asset={asset} className="w-16 h-16" />
              <div className="text-center">
                <p className="text-slate-400 text-sm font-medium">{asset.mime_type ?? 'File'}</p>
                {asset.public_url && (
                  <a href={asset.public_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                    <ExternalLink className="w-4 h-4" /> Open in new tab
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
        {/* URL bar */}
        {asset.public_url && (
          <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex-shrink-0">
            <p className="text-xs text-slate-600 mb-1.5 font-medium uppercase tracking-wide">Public URL</p>
            <div onClick={onCopy} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg px-3 py-2 cursor-pointer group/url transition-colors" title="Click to copy">
              <code className="flex-1 text-xs text-slate-400 group-hover/url:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap block transition-colors">{asset.public_url}</code>
              <Copy className="w-3.5 h-3.5 text-slate-600 group-hover/url:text-slate-400 flex-shrink-0 transition-colors" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

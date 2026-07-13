import { useEffect, useState, useRef } from 'react';
import type { DragEvent } from 'react';
import {
  Upload, Search, RefreshCcw, Copy, Trash2, Check,
  Image as ImageIcon, FileText, File as FileIcon,
  AlertCircle, Loader2, X, ExternalLink, HardDrive,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── types ────────────────────────────────────────────────────────────────────

interface MediaFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
  publicUrl: string;
}

type TypeFilter = 'all' | 'images' | 'documents';

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

function isDocument(name: string): boolean {
  return /\.(pdf|docx?|xlsx?|pptx?|txt|csv)$/i.test(name);
}

function sanitizeName(raw: string): string {
  return raw.replace(/\s+/g, '_').replace(/[^\w.\-]/g, '');
}

// ─── file type icon ───────────────────────────────────────────────────────────

function FileTypeIcon({ name, className = '' }: { name: string; className?: string }) {
  if (isImage(name)) return <ImageIcon className={`text-blue-400 ${className}`} />;
  if (isDocument(name)) return <FileText className={`text-amber-400 ${className}`} />;
  return <FileIcon className={`text-slate-500 ${className}`} />;
}

// ─── main component ───────────────────────────────────────────────────────────

export function AdminMedia() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [confirmDeleteName, setConfirmDeleteName] = useState<string | null>(null);
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<MediaFile | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchFiles() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.storage
      .from('media')
      .list('', { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });
    if (err) {
      setError('Failed to load media files.');
      setLoading(false);
      return;
    }
    const mapped: MediaFile[] = (data ?? [])
      .filter(f => f.name !== '.emptyFolderPlaceholder')
      .map(f => ({
        name: f.name,
        id: f.id ?? f.name,
        created_at: f.created_at ?? '',
        metadata: f.metadata as MediaFile['metadata'],
        publicUrl: supabase.storage.from('media').getPublicUrl(f.name).data.publicUrl,
      }));
    setFiles(mapped);
    setLoading(false);
  }

  useEffect(() => { fetchFiles(); }, []);

  const filtered = files.filter(f => {
    const q = search.trim().toLowerCase();
    const matchesSearch = !q || f.name.toLowerCase().includes(q);
    const matchesType =
      typeFilter === 'all' ||
      (typeFilter === 'images' && isImage(f.name)) ||
      (typeFilter === 'documents' && isDocument(f.name));
    return matchesSearch && matchesType;
  });

  const totalSize = files.reduce((acc, f) => acc + (f.metadata?.size ?? 0), 0);
  const imageCount = files.filter(f => isImage(f.name)).length;

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const toUpload = Array.from(fileList);
    setUploading(true);
    setError(null);
    const errors: string[] = [];

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      setUploadProgress(`Uploading ${i + 1} of ${toUpload.length}…`);
      const safeName = sanitizeName(file.name) || `file_${Date.now()}`;
      const { error: uploadErr } = await supabase.storage
        .from('media')
        .upload(safeName, file, { cacheControl: '3600', upsert: false });
      if (uploadErr) {
        const isDuplicate = uploadErr.message.toLowerCase().includes('already exists') ||
                            uploadErr.message.toLowerCase().includes('duplicate');
        errors.push(`${file.name}: ${isDuplicate ? 'A file with this name already exists — rename it and try again.' : uploadErr.message}`);
      }
    }

    setUploading(false);
    setUploadProgress('');
    if (errors.length > 0) setError(errors.join(' | '));
    await fetchFiles();
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }

  async function handleDelete(name: string) {
    setDeletingName(name);
    const { error: deleteErr } = await supabase.storage.from('media').remove([name]);
    if (deleteErr) {
      setError(`Failed to delete "${name}": ${deleteErr.message}`);
    } else {
      setFiles(prev => prev.filter(f => f.name !== name));
      if (previewFile?.name === name) setPreviewFile(null);
    }
    setDeletingName(null);
    setConfirmDeleteName(null);
  }

  async function copyUrl(file: MediaFile) {
    await navigator.clipboard.writeText(file.publicUrl);
    setCopiedName(file.name);
    setTimeout(() => setCopiedName(prev => (prev === file.name ? null : prev)), 2000);
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
        className="hidden"
        onChange={e => handleUpload(e.target.files)}
        onClick={e => { (e.target as HTMLInputElement).value = ''; }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Media Library</h1>
          {loading ? (
            <p className="text-slate-500 text-sm mt-0.5">Loading…</p>
          ) : (
            <p className="text-slate-400 text-sm mt-0.5">
              {files.length} file{files.length !== 1 ? 's' : ''}
              {files.length > 0 && <> &middot; {imageCount} image{imageCount !== 1 ? 's' : ''} &middot; {formatBytes(totalSize)}</>}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFiles}
            disabled={loading || uploading}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 px-4 py-2 rounded-xl transition-colors min-w-[130px] justify-center"
          >
            {uploading ? (
              <><Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /><span className="truncate">{uploadProgress}</span></>
            ) : (
              <><Upload className="w-4 h-4" />Upload Files</>
            )}
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

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => fileInputRef.current?.click()}
        className={`mb-5 border-2 border-dashed rounded-2xl p-7 text-center cursor-pointer select-none transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-950/30 scale-[1.01]'
            : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/20'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors ${
          isDragging ? 'bg-blue-500/20' : 'bg-slate-800'
        }`}>
          <Upload className={`w-5 h-5 ${isDragging ? 'text-blue-400' : 'text-slate-500'}`} />
        </div>
        <p className={`text-sm font-medium mb-1 transition-colors ${isDragging ? 'text-blue-300' : 'text-slate-300'}`}>
          {isDragging ? 'Release to upload' : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-xs text-slate-600">
          JPG, PNG, WebP, SVG, GIF, AVIF, PDF, Word, Excel &middot; Max 50 MB per file
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by filename…"
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 gap-0.5">
          {(['all', 'images', 'documents'] as TypeFilter[]).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                typeFilter === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {(search || typeFilter !== 'all') && !loading && (
          <p className="text-xs text-slate-500">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 18 }).map((_, i) => (
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
            <HardDrive className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-300 text-sm font-medium mb-1">
            {search || typeFilter !== 'all' ? 'No files match your filters' : 'No files uploaded yet'}
          </p>
          <p className="text-slate-600 text-xs">
            {search || typeFilter !== 'all' ? 'Try a different search or filter' : 'Upload product images, brand logos, and more'}
          </p>
          {!search && typeFilter === 'all' && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
            >
              <Upload className="w-3.5 h-3.5" /> Upload your first file
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(file => {
            const isConfirm = confirmDeleteName === file.name;
            const isDeleting = deletingName === file.name;
            const isCopied = copiedName === file.name;
            return (
              <div
                key={file.name}
                className="group relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 hover:shadow-lg hover:shadow-black/20 transition-all"
              >
                {/* Thumbnail */}
                <div
                  className="aspect-square bg-slate-800 flex items-center justify-center cursor-pointer overflow-hidden relative"
                  onClick={() => { if (!isConfirm) setPreviewFile(file); }}
                >
                  {isImage(file.name) ? (
                    <>
                      <img
                        src={file.publicUrl}
                        alt={file.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Hover gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <FileTypeIcon name={file.name} className="w-10 h-10" />
                      <span className="text-xs font-mono uppercase text-slate-500">
                        {file.name.split('.').pop()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick-action buttons (hover) */}
                {!isConfirm && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button
                      onClick={e => { e.stopPropagation(); copyUrl(file); }}
                      title={isCopied ? 'Copied!' : 'Copy URL'}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs shadow-lg transition-all ${
                        isCopied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setConfirmDeleteName(file.name); }}
                      title="Delete"
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900/90 text-slate-300 hover:bg-red-900/80 hover:text-red-300 transition-all shadow-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Delete confirmation overlay */}
                {isConfirm && (
                  <div className="absolute inset-0 bg-slate-900/96 flex flex-col items-center justify-center gap-3 p-3 z-10">
                    <Trash2 className="w-5 h-5 text-red-400" />
                    <p className="text-xs text-red-300 text-center font-medium leading-snug">
                      Delete this file?<br />
                      <span className="text-slate-500 font-normal">This cannot be undone.</span>
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(file.name)}
                        disabled={isDeleting}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1.5"
                      >
                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteName(null)}
                        className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* File info */}
                <div className="px-2.5 py-2 border-t border-slate-800">
                  <p className="text-xs text-slate-300 truncate font-medium leading-snug" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 tabular-nums">
                    {file.metadata?.size ? formatBytes(file.metadata.size) : '—'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview / detail modal */}
      {previewFile && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800 flex-shrink-0">
              <FileTypeIcon name={previewFile.name} className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm font-medium text-white flex-1 truncate min-w-0" title={previewFile.name}>
                {previewFile.name}
              </p>
              {previewFile.metadata?.size && (
                <span className="text-xs text-slate-500 flex-shrink-0">{formatBytes(previewFile.metadata.size)}</span>
              )}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => copyUrl(previewFile)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                    copiedName === previewFile.name
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {copiedName === previewFile.name
                    ? <><Check className="w-3.5 h-3.5" /> Copied!</>
                    : <><Copy className="w-3.5 h-3.5" /> Copy URL</>
                  }
                </button>
                <a
                  href={previewFile.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white rounded-lg transition-all"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Image preview */}
            <div className="flex-1 overflow-hidden bg-[#0d1117] flex items-center justify-center min-h-[200px]">
              {isImage(previewFile.name) ? (
                <img
                  src={previewFile.publicUrl}
                  alt={previewFile.name}
                  className="max-w-full max-h-[50vh] object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-4 py-16">
                  <FileTypeIcon name={previewFile.name} className="w-16 h-16" />
                  <div className="text-center">
                    <p className="text-slate-400 text-sm font-medium">{previewFile.metadata?.mimetype ?? 'File'}</p>
                    <a
                      href={previewFile.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" /> Open in new tab
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* URL bar */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex-shrink-0">
              <p className="text-xs text-slate-600 mb-1.5 font-medium uppercase tracking-wide">Public URL</p>
              <div
                onClick={() => copyUrl(previewFile)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg px-3 py-2 cursor-pointer group/url transition-colors"
                title="Click to copy"
              >
                <code className="flex-1 text-xs text-slate-400 group-hover/url:text-slate-300 overflow-hidden text-ellipsis whitespace-nowrap block transition-colors">
                  {previewFile.publicUrl}
                </code>
                <Copy className="w-3.5 h-3.5 text-slate-600 group-hover/url:text-slate-400 flex-shrink-0 transition-colors" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

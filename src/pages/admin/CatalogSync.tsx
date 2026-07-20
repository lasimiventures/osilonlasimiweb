import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  UploadCloud, FileSpreadsheet, ArrowRight, ArrowLeft, Check, X,
  AlertCircle, CheckCircle2, Loader2, Download, Eye, Database,
  RefreshCcw, RefreshCw, Building2, Search, Link2, Unlink, Trash2,
  Pencil, ChevronRight, Sparkles,
} from 'lucide-react';
import {
  adminGetSuppliersForSync,
  adminGetProductsForSync,
  adminUpsertSupplierCatalogRow,
  adminGetSupplierCatalog,
  adminDeleteSupplierCatalogRow,
  type SupplierCatalogRow,
} from '../../lib/database';

// ─── types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface ParsedRow {
  _rowNum: number;
  _raw: Record<string, string>;
  [key: string]: string | number;
}

interface MatchState {
  matched: boolean;
  productId: string | null;
  matchMethod: 'sku' | 'name' | 'manual' | null;
  confidence: 'high' | 'medium' | 'low' | null;
}

interface SyncRow {
  rowNum: number;
  supplierSku: string;
  supplierName: string;
  costPrice: number | null;
  moq: number;
  packSize: number;
  match: MatchState;
  errors: string[];
  warnings: string[];
  selected: boolean;
}

interface SyncResult {
  success: number;
  skipped: number;
  failed: number;
  errors: string[];
}

// Fields that can be mapped from a price-list spreadsheet
const MAPPABLE_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: 'supplier_sku',  label: 'Supplier SKU / Part Number', required: true },
  { key: 'name',          label: 'Product Name / Description',  required: false },
  { key: 'cost_price',    label: 'Cost Price / Unit Price',     required: true },
  { key: 'moq',           label: 'Minimum Order Qty (MOQ)',     required: false },
  { key: 'pack_size',     label: 'Pack Size',                   required: false },
  { key: 'category',      label: 'Category',                    required: false },
  { key: 'brand',         label: 'Brand / Manufacturer',        required: false },
];

function parseNum(val: string): number | null {
  if (!val || !val.trim()) return null;
  const n = parseFloat(val.replace(/[,\s$KESUSD]/g, ''));
  return isNaN(n) ? null : n;
}

function normalizeSku(sku: string): string {
  return sku.toLowerCase().replace(/[\s\-_]/g, '');
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Levenshtein-ish similarity for name matching
function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  // simple token overlap
  const tokensA = new Set(a.toLowerCase().split(/[\s\-_/]+/).filter(t => t.length > 2));
  const tokensB = new Set(b.toLowerCase().split(/[\s\-_/]+/).filter(t => t.length > 2));
  let common = 0;
  tokensA.forEach(t => { if (tokensB.has(t)) common++; });
  const maxTokens = Math.max(tokensA.size, tokensB.size);
  return maxTokens > 0 ? common / maxTokens : 0;
}

// ─── component ─────────────────────────────────────────────────────────────────

export function AdminCatalogSync() {
  const { supplierId: routeSupplierId } = useParams();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>(1);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; slug: string; currency: string }[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState(routeSupplierId || '');
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);

  const [fileName, setFileName] = useState('');
  const [fileFormat, setFileFormat] = useState('');
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [syncRows, setSyncRows] = useState<SyncRow[]>([]);
  const [validating, setValidating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  // Existing catalog view
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogRows, setCatalogRows] = useState<SupplierCatalogRow[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [confirmDeleteCatalogId, setConfirmDeleteCatalogId] = useState<string | null>(null);
  const [deletingCatalogId, setDeletingCatalogId] = useState<string | null>(null);

  // Product list for manual matching (loaded lazily in step 3)
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; sku: string; brand: string; category: string }[]>([]);

  // ─── load suppliers ──────────────────────────────────────────────────────────
  useEffect(() => {
    adminGetSuppliersForSync()
      .then(d => { setSuppliers(d); setLoadingSuppliers(false); })
      .catch(() => setLoadingSuppliers(false));
  }, []);

  // ─── file parsing ────────────────────────────────────────────────────────────
  const handleFile = useCallback(async (file: File) => {
    setParsing(true);
    setParseError(null);
    setFileName(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    setFileFormat(ext === 'xlsx' ? 'Excel' : ext === 'csv' ? 'CSV' : ext === 'tsv' ? 'TSV' : ext.toUpperCase());

    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      if (json.length === 0) {
        setParseError('The file appears to be empty.');
        setParsing(false);
        return;
      }
      const headerSet = new Set<string>();
      json.forEach(row => Object.keys(row).forEach(k => { if (k !== '__rowNum__') headerSet.add(k); }));
      const cols = Array.from(headerSet);
      setHeaders(cols);
      const rows: ParsedRow[] = json.map((r, i) => {
        const clean: ParsedRow = { _rowNum: i + 2, _raw: {} };
        cols.forEach(c => { clean._raw[c] = String(r[c] ?? '').trim(); });
        return clean;
      });
      setRawRows(rows);

      // Auto-map columns
      const autoMap: Record<string, string> = {};
      MAPPABLE_FIELDS.forEach(f => {
        const exact = cols.find(c => c.toLowerCase().replace(/[\s_-]/g, '') === f.key.toLowerCase().replace(/[\s_-]/g, ''));
        const labelMatch = cols.find(c => c.toLowerCase().replace(/[\s_-]/g, '').includes(f.label.toLowerCase().replace(/[\s_-]/g, '').split('/')[0].trim()));
        const partial = cols.find(c => c.toLowerCase().includes(f.key.toLowerCase()) || f.key.toLowerCase().includes(c.toLowerCase().replace(/[\s_-]/g, '')));
        const match = exact || labelMatch || partial;
        if (match) autoMap[f.key] = match;
      });
      setMapping(autoMap);
      setStep(2);
    } catch {
      setParseError('Failed to parse the file. Make sure it is a valid CSV, Excel (.xlsx), or TSV file.');
    }
    setParsing(false);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }
  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  // ─── matching & validation ───────────────────────────────────────────────────
  async function runValidation() {
    setValidating(true);
    let products: { id: string; name: string; sku: string; brand: string; category: string }[] = [];
    try {
      products = await adminGetProductsForSync();
      setAllProducts(products);
    } catch {
      setValidating(false);
      return;
    }

    const skuMap = new Map<string, { id: string; name: string; brand: string }>();
    products.forEach(p => skuMap.set(normalizeSku(p.sku), { id: p.id, name: p.name, brand: p.brand }));

    const mappedFields = Object.entries(mapping).filter(([, col]) => col);
    const seenSkus = new Set<string>();

    const rows: SyncRow[] = rawRows.map(r => {
      const data: Record<string, string | number> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      mappedFields.forEach(([field, col]) => {
        const val = r._raw[col] ?? '';
        if (field === 'cost_price') {
          const n = parseNum(val);
          if (n === null) errors.push('Invalid or missing cost price');
          else if (n < 0) errors.push('Negative cost price');
          data[field] = n ?? 0;
        } else if (field === 'moq' || field === 'pack_size') {
          const n = parseNum(val);
          data[field] = n ?? (field === 'moq' ? 1 : 1);
        } else {
          data[field] = val.trim();
        }
      });

      const supplierSku = String(data.supplier_sku ?? '').trim();
      const name = String(data.name ?? '').trim();
      const costPrice = data.cost_price as number | null;

      if (!supplierSku) errors.push('Missing supplier SKU');
      if (costPrice === null || costPrice <= 0) {
        if (!errors.includes('Invalid or missing cost price')) errors.push('Missing cost price');
      }

      // duplicate check within file
      if (supplierSku) {
        const norm = normalizeSku(supplierSku);
        if (seenSkus.has(norm)) errors.push('Duplicate supplier SKU in file');
        seenSkus.add(norm);
      }

      // ─── match to OSIL product ──────────────────────────────────────────────
      let match: MatchState = { matched: false, productId: null, matchMethod: null, confidence: null };

      // 1) Try exact SKU match
      if (supplierSku) {
        const hit = skuMap.get(normalizeSku(supplierSku));
        if (hit) {
          match = { matched: true, productId: hit.id, matchMethod: 'sku', confidence: 'high' };
        }
      }

      // 2) Fuzzy name match
      if (!match.matched && name) {
        let bestId: string | null = null;
        let bestScore = 0;
        for (const p of products) {
          const score = nameSimilarity(name, p.name);
          if (score > bestScore) { bestScore = score; bestId = p.id; }
        }
        if (bestScore >= 0.7 && bestId) {
          match = { matched: true, productId: bestId, matchMethod: 'name', confidence: bestScore >= 0.9 ? 'high' : 'medium' };
        } else if (bestScore >= 0.5 && bestId) {
          match = { matched: true, productId: bestId, matchMethod: 'name', confidence: 'low' };
        }
      }

      if (!match.matched) warnings.push('No auto-match — will need manual mapping');

      return {
        rowNum: r._rowNum,
        supplierSku,
        supplierName: name,
        costPrice: costPrice ?? 0,
        moq: (data.moq as number) || 1,
        packSize: (data.pack_size as number) || 1,
        match,
        errors,
        warnings,
        selected: errors.length === 0,
      };
    });

    setSyncRows(rows);
    setValidating(false);
    setStep(3);
  }

  const validRows = useMemo(() => syncRows.filter(r => r.errors.length === 0), [syncRows]);
  const matchedRows = useMemo(() => validRows.filter(r => r.match.matched), [validRows]);
  const unmatchedRows = useMemo(() => validRows.filter(r => !r.match.matched), [validRows]);
  const errorRows = useMemo(() => syncRows.filter(r => r.errors.length > 0), [syncRows]);
  const selectedValid = useMemo(() => validRows.filter(r => r.selected && r.match.matched), [validRows]);

  // ─── sync to DB ──────────────────────────────────────────────────────────────
  async function doSync() {
    if (!selectedSupplierId) return;
    setSyncing(true);
    let success = 0;
    let skipped = 0;
    let failed = 0;
    const errors: string[] = [];

    const toSync = syncRows.filter(r => r.selected && r.errors.length === 0 && r.match.matched && r.match.productId);
    for (const row of toSync) {
      try {
        await adminUpsertSupplierCatalogRow({
          supplier_id: selectedSupplierId,
          product_id: row.match.productId!,
          supplier_sku: row.supplierSku,
          cost_price: row.costPrice,
          moq: row.moq,
          pack_size: row.packSize,
        });
        success++;
      } catch (err) {
        failed++;
        errors.push(`Row ${row.rowNum} (${row.supplierSku}): ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    skipped = syncRows.length - toSync.length;

    setResult({ success, skipped, failed, errors });
    setSyncing(false);
    setStep(4);
  }

  // ─── manual match ────────────────────────────────────────────────────────────
  function toggleRowSelection(rowNum: number) {
    setSyncRows(prev => prev.map(r => r.rowNum === rowNum ? { ...r, selected: !r.selected } : r));
  }

  function setRowMatch(rowNum: number, productId: string | null) {
    setSyncRows(prev => prev.map(r => {
      if (r.rowNum !== rowNum) return r;
      return {
        ...r,
        match: productId
          ? { matched: true, productId, matchMethod: 'manual', confidence: 'high' }
          : { matched: false, productId: null, matchMethod: null, confidence: null },
        warnings: productId ? r.warnings.filter(w => !w.includes('auto-match')) : r.warnings,
      };
    }));
  }

  // ─── existing catalog view ───────────────────────────────────────────────────
  async function loadCatalog(sid: string) {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const rows = await adminGetSupplierCatalog(sid);
      setCatalogRows(rows);
      setShowCatalog(true);
    } catch {
      setCatalogError('Failed to load existing catalog.');
    }
    setCatalogLoading(false);
  }

  async function handleDeleteCatalogRow(id: string) {
    setDeletingCatalogId(id);
    try {
      await adminDeleteSupplierCatalogRow(id);
      setCatalogRows(prev => prev.filter(r => r.id !== id));
    } catch {
      setCatalogError('Failed to delete catalog entry.');
    }
    setDeletingCatalogId(null);
    setConfirmDeleteCatalogId(null);
  }

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return catalogRows;
    return catalogRows.filter(r =>
      (r.supplier_sku ?? '').toLowerCase().includes(q) ||
      (r.product?.name ?? '').toLowerCase().includes(q) ||
      (r.product?.sku ?? '').toLowerCase().includes(q) ||
      (r.product?.brand ?? '').toLowerCase().includes(q)
    );
  }, [catalogRows, catalogSearch]);

  function downloadTemplate() {
    const tmpl = ['Supplier SKU', 'Product Name', 'Unit Price', 'MOQ', 'Pack Size', 'Category', 'Brand'];
    const ws = XLSX.utils.aoa_to_sheet([tmpl, ['DELL-XPS-13', 'Dell XPS 13 Laptop', '185000', '1', '1', 'Laptops', 'Dell']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Price List');
    XLSX.writeFile(wb, 'supplier-price-list-template.xlsx');
  }

  function reset() {
    setStep(1);
    setFileName('');
    setFileFormat('');
    setRawRows([]);
    setHeaders([]);
    setMapping({});
    setSyncRows([]);
    setResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const selectedSupplier = suppliers.find(s => s.id === selectedSupplierId);
  const STEPS = [
    { n: 1, label: 'Select & Upload' },
    { n: 2, label: 'Map Columns' },
    { n: 3, label: 'Review Matches' },
    { n: 4, label: 'Sync' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Supplier Catalogue Sync</h1>
          <p className="text-slate-400 text-sm mt-0.5">Import supplier price lists & map SKUs to OSIL products</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all">
            <Download className="w-4 h-4" /> Template
          </button>
          {selectedSupplierId && (
            <button onClick={() => loadCatalog(selectedSupplierId)} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all">
              <Eye className="w-4 h-4" /> View Catalog
            </button>
          )}
          <Link to="/admin/suppliers" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all">
            <X className="w-4 h-4" /> Close
          </Link>
        </div>
      </div>

      {/* Supplier selector + existing catalog */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-500" />
          <select
            value={selectedSupplierId}
            onChange={e => { setSelectedSupplierId(e.target.value); setShowCatalog(false); setCatalogRows([]); }}
            disabled={loadingSuppliers || step > 1}
            className="px-3 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="">{loadingSuppliers ? 'Loading suppliers…' : 'Select a supplier…'}</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {selectedSupplier && <span className="text-xs text-slate-500 bg-slate-800 px-2 py-1 rounded-lg">{selectedSupplier.currency}</span>}
        </div>
        {selectedSupplierId && (
          <span className="text-xs text-slate-500">
            {showCatalog ? `${catalogRows.length} entries` : 'Click "View Catalog" to see existing entries'}
          </span>
        )}
      </div>

      {/* Existing catalog table */}
      {showCatalog && selectedSupplierId && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              {selectedSupplier?.name} — Current Catalog
            </h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-48"
                />
              </div>
              <button onClick={() => setShowCatalog(false)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {catalogError && (
            <div className="px-5 py-3 bg-red-950/30 border-b border-red-800/30 text-red-300 text-xs">{catalogError}</div>
          )}
          {catalogLoading ? (
            <div className="px-5 py-10 text-center"><Loader2 className="w-5 h-5 text-slate-500 animate-spin mx-auto" /></div>
          ) : filteredCatalog.length === 0 ? (
            <div className="px-5 py-10 text-center text-slate-500 text-sm">
              {catalogSearch ? 'No matching entries' : 'No catalog entries yet — sync a price list to populate'}
            </div>
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="border-b border-slate-800">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase">Supplier SKU</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase">OSIL Product</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">Brand</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase">Cost</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase hidden sm:table-cell">MOQ</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase">Primary</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCatalog.map(r => (
                    <tr key={r.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="px-4 py-2.5 text-sm text-slate-300 font-mono">{r.supplier_sku ?? '—'}</td>
                      <td className="px-4 py-2.5 text-sm text-white">
                        {r.product ? (
                          <div>
                            <p className="truncate max-w-[200px]">{r.product.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{r.product.sku}</p>
                          </div>
                        ) : <span className="text-slate-600">Unlinked</span>}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-slate-400 hidden md:table-cell">{r.product?.brand ?? '—'}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-300 text-right tabular-nums">{Number(r.cost_price).toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-sm text-slate-400 text-right tabular-nums hidden sm:table-cell">{r.moq}</td>
                      <td className="px-4 py-2.5">
                        {r.is_primary_supplier ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            <Sparkles className="w-3 h-3" /> Primary
                          </span>
                        ) : <span className="text-xs text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {confirmDeleteCatalogId === r.id ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button onClick={() => handleDeleteCatalogRow(r.id)} disabled={deletingCatalogId === r.id}
                              className="text-xs font-semibold text-red-400 hover:text-red-300 px-2 py-1 border border-red-800/50 rounded-lg transition-colors disabled:opacity-40">
                              {deletingCatalogId === r.id ? '…' : 'Yes'}
                            </button>
                            <button onClick={() => setConfirmDeleteCatalogId(null)} className="text-xs text-slate-400 hover:text-white px-2 py-1">No</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteCatalogId(r.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2.5 ${step >= s.n ? '' : 'opacity-40'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.n ? 'bg-emerald-600 text-white' :
                step === s.n ? 'bg-blue-600 text-white ring-4 ring-blue-600/20' :
                'bg-slate-800 text-slate-500'
              }`}>
                {step > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <span className={`text-sm font-medium ${step === s.n ? 'text-white' : 'text-slate-500'}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${step > s.n ? 'bg-emerald-600' : 'bg-slate-800'}`} />}
          </div>
        ))}
      </div>

      {parseError && (
        <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {parseError}
        </div>
      )}

      {/* Step 1: Select & Upload */}
      {step === 1 && (
        <div>
          {!selectedSupplierId && !loadingSuppliers && (
            <div className="flex items-center gap-3 bg-amber-950/40 border border-amber-800/30 rounded-xl p-4 text-amber-300 text-sm mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> Select a supplier above to begin.
            </div>
          )}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              !selectedSupplierId ? 'border-slate-800 bg-slate-900/50 opacity-60 pointer-events-none' :
              dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 bg-slate-900'
            }`}
          >
            {parsing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-slate-400 text-sm">Parsing {fileName}…</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                  <UploadCloud className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-white font-medium mb-1">Drop the supplier price list here, or click to browse</p>
                <p className="text-slate-500 text-sm mb-5">Supports CSV, Excel (.xlsx), and TSV — e.g. Dell, HP, Lenovo, Cisco price lists</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!selectedSupplierId}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Choose File
                </button>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.tsv,.txt" onChange={onFileChange} className="hidden" />
              </>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { name: 'Dell', icon: '💻', desc: 'Dell price lists' },
              { name: 'HP', icon: '🖥️', desc: 'HP price lists' },
              { name: 'Lenovo', icon: '📱', desc: 'Lenovo price lists' },
              { name: 'Cisco', icon: '🌐', desc: 'Cisco catalogues' },
            ].map(b => (
              <div key={b.name} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">{b.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{b.name}</p>
                  <p className="text-xs text-slate-500">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Map Columns */}
      {step === 2 && (
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-5">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-white font-medium">{fileName}</span>
            <span className="text-slate-600">·</span>
            <span>{fileFormat}</span>
            <span className="text-slate-600">·</span>
            <span>{rawRows.length} rows</span>
            <span className="text-slate-600">·</span>
            <span>{headers.length} columns</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" /> Map price-list columns to system fields
              </h2>
            </div>
            <div className="divide-y divide-slate-800/50">
              {MAPPABLE_FIELDS.map(f => (
                <div key={f.key} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-white">{f.label}</span>
                    {f.required && <span className="ml-2 text-xs text-red-400">required</span>}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                  <select
                    value={mapping[f.key] ?? ''}
                    onChange={e => setMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="flex-1 max-w-[240px] px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Skip —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button onClick={reset} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2.5 rounded-xl transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={runValidation}
              disabled={!mapping.supplier_sku || !mapping.cost_price || validating}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
              {validating ? 'Matching…' : 'Review Matches'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review Matches */}
      {step === 3 && (
        <div>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="w-4 h-4" /></div>
              <div><p className="text-lg font-bold text-white tabular-nums">{matchedRows.length}</p><p className="text-xs text-slate-400">Matched</p></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-400"><Link2 className="w-4 h-4" /></div>
              <div><p className="text-lg font-bold text-white tabular-nums">{unmatchedRows.length}</p><p className="text-xs text-slate-400">Needs Mapping</p></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400"><X className="w-4 h-4" /></div>
              <div><p className="text-lg font-bold text-white tabular-nums">{errorRows.length}</p><p className="text-xs text-slate-400">Errors</p></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-blue-500/10 text-blue-400"><RefreshCw className="w-4 h-4" /></div>
              <div><p className="text-lg font-bold text-white tabular-nums">{selectedValid.length}</p><p className="text-xs text-slate-400">Selected</p></div>
            </div>
          </div>

          {/* Rows table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="border-b border-slate-800">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase w-10"></th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase w-14">Row</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase">Supplier SKU</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase">Name</th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold text-slate-400 uppercase hidden sm:table-cell">Cost</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase">Match Status</th>
                  </tr>
                </thead>
                <tbody>
                  {syncRows.slice(0, 200).map(r => (
                    <tr key={r.rowNum} className={`border-b border-slate-800/50 ${r.errors.length > 0 ? 'opacity-50' : 'hover:bg-slate-800/20'}`}>
                      <td className="px-3 py-2.5">
                        {r.errors.length === 0 && (
                          <input type="checkbox" checked={r.selected} onChange={() => toggleRowSelection(r.rowNum)}
                            className="w-4 h-4 rounded accent-blue-500 cursor-pointer" />
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 font-mono tabular-nums">{r.rowNum}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-300 font-mono">{r.supplierSku || '—'}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-400 truncate max-w-[180px]">{r.supplierName || '—'}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-300 text-right tabular-nums hidden sm:table-cell">{r.costPrice > 0 ? r.costPrice.toLocaleString() : '—'}</td>
                      <td className="px-3 py-2.5">
                        {r.errors.length > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            {r.errors.slice(0, 2).map((e, i) => (
                              <span key={i} className="inline-flex items-center gap-1 text-xs text-red-400"><X className="w-3 h-3 flex-shrink-0" /> {e}</span>
                            ))}
                            {r.errors.length > 2 && <span className="text-xs text-red-400">+{r.errors.length - 2} more</span>}
                          </div>
                        ) : r.match.matched ? (
                          <MatchBadge match={r.match} />
                        ) : (
                          <ManualMatchControl products={allProducts} onSelect={(pid) => setRowMatch(r.rowNum, pid)} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {syncRows.length > 200 && (
              <div className="px-4 py-2.5 border-t border-slate-800 text-xs text-slate-500 text-center">
                Showing first 200 of {syncRows.length} rows
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2.5 rounded-xl transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Mapping
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                {selectedValid.length} ready to sync
              </span>
              <button
                onClick={doSync}
                disabled={syncing || selectedValid.length === 0}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {syncing ? 'Syncing…' : `Sync ${selectedValid.length} Items`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 4 && result && (
        <div className="text-center py-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${result.failed === 0 ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            {result.failed === 0 ? <CheckCircle2 className="w-8 h-8 text-emerald-400" /> : <AlertCircle className="w-8 h-8 text-amber-400" />}
          </div>
          <h2 className="text-lg font-bold text-white mb-1">
            {result.failed === 0 ? 'Catalog Sync Complete!' : 'Sync Finished'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {result.success} item{result.success !== 1 ? 's' : ''} synced
            {result.skipped > 0 && `, ${result.skipped} skipped`}
            {result.failed > 0 && `, ${result.failed} failed`}
          </p>

          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">{result.success}</p>
              <p className="text-xs text-slate-400 mt-0.5">Synced</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-slate-400 tabular-nums">{result.skipped}</p>
              <p className="text-xs text-slate-400 mt-0.5">Skipped</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-400 tabular-nums">{result.failed}</p>
              <p className="text-xs text-slate-400 mt-0.5">Failed</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-w-lg mx-auto mb-6 text-left max-h-40 overflow-y-auto">
              <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Errors</p>
              {result.errors.slice(0, 10).map((e, i) => (
                <p key={i} className="text-xs text-red-300 font-mono py-0.5">{e}</p>
              ))}
              {result.errors.length > 10 && <p className="text-xs text-slate-500 mt-1">…and {result.errors.length - 10} more</p>}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button onClick={reset} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2.5 rounded-xl transition-all">
              <RefreshCcw className="w-4 h-4" /> Sync Another File
            </button>
            <button onClick={() => loadCatalog(selectedSupplierId)} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl transition-colors">
              <Eye className="w-4 h-4" /> View Catalog
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function MatchBadge({ match }: { match: MatchState }) {
  if (!match.matched) return null;
  const confColor = {
    high: 'bg-emerald-500/10 text-emerald-300',
    medium: 'bg-amber-500/10 text-amber-300',
    low: 'bg-orange-500/10 text-orange-300',
  }[match.confidence ?? 'low'];
  const methodLabel = { sku: 'SKU Match', name: 'Name Match', manual: 'Manual' }[match.matchMethod ?? 'manual'];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${confColor}`}>
      <Link2 className="w-3 h-3" />
      {methodLabel}
      {match.confidence && match.confidence !== 'high' && <span className="opacity-70">· {match.confidence}</span>}
    </span>
  );
}

function ManualMatchControl({ products: sharedProducts, onSelect }: { products: { id: string; name: string; sku: string; brand: string }[]; onSelect: (productId: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sharedProducts.slice(0, 8);
    return sharedProducts.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [sharedProducts, search]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-slate-800 text-amber-300 hover:bg-slate-700 transition-colors"
      >
        <Link2 className="w-3 h-3" />
        Map Manually
      </button>
      {open && (
        <div className="absolute z-20 mt-1 right-0 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl p-2">
          <div className="flex items-center gap-1.5 mb-2">
            <Search className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="flex-1 px-2 py-1.5 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filtered.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">No products found</p>
            ) : filtered.map(p => (
              <button
                key={p.id}
                onClick={() => { onSelect(p.id); setOpen(false); }}
                className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <p className="text-xs text-white truncate">{p.name}</p>
                <p className="text-xs text-slate-500 font-mono">{p.sku} · {p.brand}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  UploadCloud, FileSpreadsheet, ArrowRight, ArrowLeft, Check, X,
  AlertCircle, CheckCircle2, Loader2, Download, Eye, Database,
  RefreshCcw, Pencil,
} from 'lucide-react';
import { adminBulkInsertProducts } from '../../lib/database';

// ─── types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface ParsedRow {
  _rowNum: number;
  _raw: Record<string, string>;
  [key: string]: string | number;
}

interface ValidatedRow {
  rowNum: number;
  data: Record<string, unknown>;
  errors: string[];
  warnings: string[];
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

// DB fields that can be mapped from spreadsheet columns
const MAPPABLE_FIELDS: { key: string; label: string; required: boolean; group: string }[] = [
  { key: 'name',              label: 'Product Name',       required: true,  group: 'Required' },
  { key: 'sku',               label: 'SKU',                required: true,  group: 'Required' },
  { key: 'brand',             label: 'Brand',              required: true,  group: 'Required' },
  { key: 'category',          label: 'Category',           required: true,  group: 'Required' },
  { key: 'description',       label: 'Description',        required: false, group: 'Details' },
  { key: 'short_description', label: 'Short Description',  required: false, group: 'Details' },
  { key: 'price',             label: 'Price (Legacy)',     required: false, group: 'Pricing' },
  { key: 'cost_price',        label: 'Cost Price',         required: false, group: 'Pricing' },
  { key: 'selling_price',     label: 'Selling Price',      required: false, group: 'Pricing' },
  { key: 'distributor_price', label: 'Distributor Price',  required: false, group: 'Pricing' },
  { key: 'dealer_price',      label: 'Dealer Price',       required: false, group: 'Pricing' },
  { key: 'promotional_price', label: 'Promotional Price',  required: false, group: 'Pricing' },
  { key: 'pricing_currency',  label: 'Currency',           required: false, group: 'Pricing' },
  { key: 'availability',      label: 'Availability',       required: false, group: 'Details' },
  { key: 'tags',              label: 'Tags (comma-sep)',   required: false, group: 'Details' },
  { key: 'datasheet_url',     label: 'Datasheet URL',      required: false, group: 'Details' },
  { key: 'warranty_expiry_date', label: 'Warranty Expiry', required: false, group: 'Details' },
  { key: 'minimum_order_quantity', label: 'Min Order Qty', required: false, group: 'Commerce' },
  { key: 'is_featured',       label: 'Featured (true/false)', required: false, group: 'Flags' },
  { key: 'is_new',            label: 'New (true/false)',      required: false, group: 'Flags' },
  { key: 'is_best_seller',    label: 'Best Seller (true/false)', required: false, group: 'Flags' },
  { key: 'buy_now_enabled',   label: 'Buy Now (true/false)',   required: false, group: 'Flags' },
  { key: 'call_for_price',    label: 'Call for Price (true/false)', required: false, group: 'Flags' },
];

const VALID_AVAILABILITY = ['in-stock', 'low-stock', 'out-of-stock', 'pre-order', 'discontinued'];

function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parseBoolean(val: string): boolean {
  const v = val.toLowerCase().trim();
  return v === 'true' || v === '1' || v === 'yes' || v === 'y';
}

function parseNum(val: string): number | null {
  if (!val || !val.trim()) return null;
  const n = parseFloat(val.replace(/[,\s]/g, ''));
  return isNaN(n) ? null : n;
}

function parseDate(val: string): string | null {
  if (!val || !val.trim()) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

// ─── component ─────────────────────────────────────────────────────────────────

export function AdminProductImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>(1);
  const [fileName, setFileName] = useState('');
  const [fileFormat, setFileFormat] = useState('');
  const [rawRows, setRawRows] = useState<ParsedRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Column mapping: dbField -> source column header
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState<ValidatedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ─── Step 1: Upload & parse ──────────────────────────────────────────────────

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

      // Collect all unique headers
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

      // Auto-map columns by fuzzy matching field labels/keys to headers
      const autoMap: Record<string, string> = {};
      MAPPABLE_FIELDS.forEach(f => {
        const exact = cols.find(c => c.toLowerCase().replace(/[\s_-]/g, '') === f.key.toLowerCase().replace(/[\s_-]/g, ''));
        const labelMatch = cols.find(c => c.toLowerCase().replace(/[\s_-]/g, '') === f.label.toLowerCase().replace(/[\s_-]/g, '').replace(/\(.*\)/, '').trim());
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

  // ─── Step 2 → 3: Validate ───────────────────────────────────────────────────

  function runValidation() {
    const mappedFields = Object.entries(mapping).filter(([, col]) => col);
    const rows: ValidatedRow[] = rawRows.map(r => {
      const data: Record<string, unknown> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      mappedFields.forEach(([field, col]) => {
        const val = r._raw[col] ?? '';
        if (field === 'name' || field === 'sku' || field === 'brand' || field === 'category') {
          if (!val.trim()) errors.push(`${field} is required`);
          data[field] = val.trim();
        } else if (field === 'price' || field === 'cost_price' || field === 'selling_price' ||
                   field === 'distributor_price' || field === 'dealer_price' || field === 'promotional_price') {
          data[field] = parseNum(val);
        } else if (field === 'minimum_order_quantity') {
          data[field] = parseNum(val) ?? 1;
        } else if (field === 'is_featured' || field === 'is_new' || field === 'is_best_seller' ||
                   field === 'buy_now_enabled' || field === 'call_for_price') {
          data[field] = parseBoolean(val);
        } else if (field === 'tags') {
          data[field] = val.split(',').map(t => t.trim()).filter(Boolean);
        } else if (field === 'availability') {
          const norm = val.toLowerCase().replace(/[\s_]/g, '-');
          if (val && !VALID_AVAILABILITY.includes(norm)) {
            warnings.push(`availability "${val}" → defaulting to in-stock`);
            data[field] = 'in-stock';
          } else {
            data[field] = norm || 'in-stock';
          }
        } else if (field === 'warranty_expiry_date') {
          data[field] = parseDate(val);
          if (val && !data[field]) warnings.push(`invalid date "${val}"`);
        } else {
          data[field] = val.trim();
        }
      });

      // Auto-generate slugs
      if (data.name) {
        data.slug = slugify(String(data.name));
        data.brand_slug = data.brand ? slugify(String(data.brand)) : '';
        data.category_slug = data.category ? slugify(String(data.category)) : '';
      }

      // Ensure required booleans have defaults
      if (data.buy_now_enabled === undefined) data.buy_now_enabled = true;
      if (data.call_for_price === undefined) data.call_for_price = false;
      if (data.availability === undefined) data.availability = 'in-stock';
      if (data.pricing_currency === undefined || !data.pricing_currency) data.pricing_currency = 'KES';
      if (data.minimum_order_quantity === undefined) data.minimum_order_quantity = 1;

      return { rowNum: r._rowNum, data, errors, warnings };
    });

    setValidated(rows);
    setStep(3);
  }

  const validRows = useMemo(() => validated.filter(r => r.errors.length === 0), [validated]);
  const errorRows = useMemo(() => validated.filter(r => r.errors.length > 0), [validated]);
  const warningRows = useMemo(() => validated.filter(r => r.warnings.length > 0 && r.errors.length === 0), [validated]);

  // ─── Step 3 → 4: Import ──────────────────────────────────────────────────────

  async function doImport() {
    setImporting(true);
    const toInsert = validRows.map(r => r.data);
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Insert in batches of 50
    const BATCH = 50;
    for (let i = 0; i < toInsert.length; i += BATCH) {
      const batch = toInsert.slice(i, i + BATCH);
      try {
        const res = await adminBulkInsertProducts(batch);
        success += res.inserted;
        if (res.errors.length > 0) {
          failed += res.errors.length;
          errors.push(...res.errors);
        }
      } catch (err) {
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    setResult({ success, failed, errors });
    setImporting(false);
    setStep(4);
  }

  function downloadTemplate() {
    const tmpl = MAPPABLE_FIELDS.map(f => f.label);
    const ws = XLSX.utils.aoa_to_sheet([tmpl, ['Sample Solar Panel', 'SOL-001', 'Osil', 'Solar Panels', 'High-efficiency panel', 'Efficient panel', '25000', '18000', '22000', '', '', '', 'KES', 'in-stock', 'solar, panel', '', '2026-12-31', '1', 'true', 'false', 'false', 'true', 'false']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'product-import-template.xlsx');
  }

  function reset() {
    setStep(1);
    setFileName('');
    setFileFormat('');
    setRawRows([]);
    setHeaders([]);
    setMapping({});
    setValidated([]);
    setResult(null);
    setParseError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ─── render ──────────────────────────────────────────────────────────────────

  const STEPS = [
    { n: 1, label: 'Upload' },
    { n: 2, label: 'Map Columns' },
    { n: 3, label: 'Preview' },
    { n: 4, label: 'Import' },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Import Products</h1>
          <p className="text-slate-400 text-sm mt-0.5">Bulk import from CSV, Excel (.xlsx), or TSV</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all">
            <Download className="w-4 h-4" /> Template
          </button>
          <Link to="/admin/products" className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all">
            <X className="w-4 h-4" /> Cancel
          </Link>
        </div>
      </div>

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

      {/* Step 1: Upload */}
      {step === 1 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${dragOver ? 'border-blue-500 bg-blue-500/5' : 'border-slate-700 bg-slate-900'}`}
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
              <p className="text-white font-medium mb-1">Drop your file here, or click to browse</p>
              <p className="text-slate-500 text-sm mb-5">Supports CSV, Excel (.xlsx), and TSV files</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" /> Choose File
              </button>
              <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.tsv,.txt" onChange={onFileChange} className="hidden" />

              <div className="flex items-center justify-center gap-4 mt-8 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" /> .csv</span>
                <span className="flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" /> .xlsx</span>
                <span className="flex items-center gap-1.5"><FileSpreadsheet className="w-3.5 h-3.5" /> .tsv</span>
              </div>
            </>
          )}
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
            <span>{rawRows.length} rows detected</span>
            <span className="text-slate-600">·</span>
            <span>{headers.length} columns</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-400" /> Map spreadsheet columns to product fields
              </h2>
            </div>
            <div className="divide-y divide-slate-800/50">
              {(['Required', 'Details', 'Pricing', 'Commerce', 'Flags'] as const).map(group => {
                const fields = MAPPABLE_FIELDS.filter(f => f.group === group);
                if (fields.length === 0) return null;
                return (
                  <div key={group}>
                    <div className="px-5 py-2 bg-slate-800/30 text-xs font-semibold text-slate-500 uppercase tracking-wide">{group}</div>
                    {fields.map(f => (
                      <div key={f.key} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-800/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-white">{f.label}</span>
                          {f.required && <span className="ml-2 text-xs text-red-400">required</span>}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                        <select
                          value={mapping[f.key] ?? ''}
                          onChange={e => setMapping(prev => ({ ...prev, [f.key]: e.target.value }))}
                          className="flex-1 max-w-[200px] px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Skip —</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button onClick={reset} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2.5 rounded-xl transition-all">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={runValidation}
              disabled={!mapping.name || !mapping.sku || !mapping.brand || !mapping.category}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Eye className="w-4 h-4" /> Preview Records
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Validate */}
      {step === 3 && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400"><CheckCircle2 className="w-4 h-4" /></div>
              <div><p className="text-lg font-bold text-white tabular-nums">{validRows.length}</p><p className="text-xs text-slate-400">Valid</p></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-400"><AlertCircle className="w-4 h-4" /></div>
              <div><p className="text-lg font-bold text-white tabular-nums">{warningRows.length}</p><p className="text-xs text-slate-400">Warnings</p></div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400"><X className="w-4 h-4" /></div>
              <div><p className="text-lg font-bold text-white tabular-nums">{errorRows.length}</p><p className="text-xs text-slate-400">Errors</p></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-900 z-10">
                  <tr className="border-b border-slate-800">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase w-16">Row</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase">Product</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase hidden md:table-cell">SKU</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase hidden lg:table-cell">Brand / Category</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {validated.slice(0, 200).map(r => (
                    <tr key={r.rowNum} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                      <td className="px-3 py-2.5 text-xs text-slate-500 font-mono tabular-nums">{r.rowNum}</td>
                      <td className="px-3 py-2.5 text-sm text-white truncate max-w-[200px]">{String(r.data.name ?? '—')}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-400 font-mono hidden md:table-cell">{String(r.data.sku ?? '—')}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-400 hidden lg:table-cell">
                        <span>{String(r.data.brand ?? '—')}</span>
                        <span className="text-slate-600 mx-1">/</span>
                        <span>{String(r.data.category ?? '—')}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        {r.errors.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-red-400"><X className="w-3 h-3" /> {r.errors[0]}{r.errors.length > 1 && ` +${r.errors.length - 1}`}</span>
                        ) : r.warnings.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400"><AlertCircle className="w-3 h-3" /> {r.warnings[0]}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="w-3 h-3" /> OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {validated.length > 200 && (
              <div className="px-4 py-2.5 border-t border-slate-800 text-xs text-slate-500 text-center">
                Showing first 200 of {validated.length} rows
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6">
            <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-4 py-2.5 rounded-xl transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Mapping
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-400">
                {validRows.length} ready to import
                {errorRows.length > 0 && <span className="text-red-400"> · {errorRows.length} will be skipped</span>}
              </span>
              <button
                onClick={doImport}
                disabled={importing || validRows.length === 0}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                {importing ? 'Importing…' : `Import ${validRows.length} Products`}
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
            {result.failed === 0 ? 'Import Complete!' : 'Import Finished'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {result.success} product{result.success !== 1 ? 's' : ''} imported successfully
            {result.failed > 0 && `, ${result.failed} failed`}
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mb-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-2xl font-bold text-emerald-400 tabular-nums">{result.success}</p>
              <p className="text-xs text-slate-400 mt-0.5">Imported</p>
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
              <RefreshCcw className="w-4 h-4" /> Import Another File
            </button>
            <button onClick={() => navigate('/admin/products')} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-xl transition-colors">
              <Pencil className="w-4 h-4" /> View Products
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

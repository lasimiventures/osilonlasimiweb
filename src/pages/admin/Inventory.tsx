import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Search, RefreshCw, Plus, Minus, AlertTriangle,
  TrendingUp, TrendingDown, Save, X, Loader2, Edit3,
  PackageCheck, PackageX, Clock, ShieldCheck, Download,
} from 'lucide-react';
import { supabaseAdmin as supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface InventoryRow {
  id: string;
  product_id: string;
  stock_quantity: number;
  reserved_quantity: number;
  incoming_quantity: number;
  reorder_level: number;
  safety_stock: number;
  discontinued: boolean;
  restock_expected_date: string | null;
  last_stock_update: string;
  notes: string | null;
  available_quantity: number;
  inventory_status: string;
}

interface ProductInfo {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  availability: string;
}

const STATUS_CFG: Record<string, { label: string; dot: string; bg: string; text: string; border: string }> = {
  'in-stock':     { label: 'In Stock',    dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-700/40' },
  'low-stock':    { label: 'Low Stock',   dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-300',   border: 'border-amber-700/40' },
  'out-of-stock': { label: 'Out of Stock',dot: 'bg-red-400',     bg: 'bg-red-500/10',     text: 'text-red-300',     border: 'border-red-700/40' },
  'pre-order':    { label: 'Pre-Order',   dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    text: 'text-blue-300',    border: 'border-blue-700/40' },
  'discontinued': { label: 'Discontinued',dot: 'bg-slate-400',   bg: 'bg-slate-500/10',   text: 'text-slate-400',   border: 'border-slate-600' },
};

const STATUS_FILTERS = ['all', 'in-stock', 'low-stock', 'out-of-stock', 'pre-order', 'discontinued'];

function fmtDate(iso: string | null) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtDateTime(iso: string) { return new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); }

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminInventory() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [products, setProducts] = useState<Map<string, ProductInfo>>(new Map());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<InventoryRow>>({});
  const [saving, setSaving] = useState(false);
  const [adjusting, setAdjusting] = useState<{ id: string; delta: number } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [invRes, prodRes] = await Promise.all([
      supabase.from('product_inventory_view').select('*').order('product_id'),
      supabase.from('products').select('id, name, sku, brand, category, availability'),
    ]);
    if (invRes.data) setRows(invRes.data as InventoryRow[]);
    if (prodRes.data) {
      const map = new Map<string, ProductInfo>();
      (prodRes.data as ProductInfo[]).forEach(p => map.set(p.id, p));
      setProducts(map);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit(row: InventoryRow) {
    setEditingId(row.product_id);
    setEditForm({
      stock_quantity: row.stock_quantity,
      reserved_quantity: row.reserved_quantity,
      incoming_quantity: row.incoming_quantity,
      reorder_level: row.reorder_level,
      safety_stock: row.safety_stock,
      discontinued: row.discontinued,
      restock_expected_date: row.restock_expected_date,
      notes: row.notes,
    });
  }

  function cancelEdit() { setEditingId(null); setEditForm({}); }

  async function saveEdit(productId: string) {
    setSaving(true);
    await supabase.from('product_inventory').update({
      stock_quantity: editForm.stock_quantity ?? 0,
      reserved_quantity: editForm.reserved_quantity ?? 0,
      incoming_quantity: editForm.incoming_quantity ?? 0,
      reorder_level: editForm.reorder_level ?? 5,
      safety_stock: editForm.safety_stock ?? 2,
      discontinued: editForm.discontinued ?? false,
      restock_expected_date: editForm.restock_expected_date || null,
      notes: editForm.notes || null,
    }).eq('product_id', productId);
    setSaving(false);
    setEditingId(null);
    setEditForm({});
    await load();
  }

  async function quickAdjust(row: InventoryRow, delta: number) {
    setAdjusting({ id: row.product_id, delta });
    const newStock = Math.max(0, row.stock_quantity + delta);
    await supabase.from('product_inventory').update({ stock_quantity: newStock }).eq('product_id', row.product_id);
    setAdjusting(null);
    await load();
  }

  async function createInventoryForProduct(productId: string) {
    await supabase.from('product_inventory').insert({ product_id: productId, stock_quantity: 0 });
    await load();
  }

  async function exportCSV() {
    const headers = ['Product Name', 'SKU', 'Brand', 'Category', 'Stock Qty', 'Reserved', 'Incoming', 'Available', 'Reorder Level', 'Safety Stock', 'Status', 'Discontinued', 'Restock Date', 'Last Updated'];
    const lines = rows.map(r => {
      const p = products.get(r.product_id);
      return [p?.name ?? '', p?.sku ?? '', p?.brand ?? '', p?.category ?? '',
        r.stock_quantity, r.reserved_quantity, r.incoming_quantity, r.available_quantity,
        r.reorder_level, r.safety_stock, r.inventory_status,
        r.discontinued ? 'Yes' : 'No', r.restock_expected_date ?? '', fmtDate(r.last_stock_update)]
        .map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
    });
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `OSIL_Inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Stats
  const stats = {
    total: rows.length,
    inStock: rows.filter(r => r.inventory_status === 'in-stock').length,
    lowStock: rows.filter(r => r.inventory_status === 'low-stock').length,
    outOfStock: rows.filter(r => r.inventory_status === 'out-of-stock').length,
    preOrder: rows.filter(r => r.inventory_status === 'pre-order').length,
    discontinued: rows.filter(r => r.inventory_status === 'discontinued').length,
    totalStockUnits: rows.reduce((s, r) => s + r.stock_quantity, 0),
    totalReserved: rows.reduce((s, r) => s + r.reserved_quantity, 0),
    totalIncoming: rows.reduce((s, r) => s + r.incoming_quantity, 0),
    belowReorder: rows.filter(r => r.stock_quantity <= r.reorder_level && r.stock_quantity > 0).length,
  };

  // Products without inventory rows
  const productsWithoutInventory: ProductInfo[] = [];
  products.forEach(p => { if (!rows.some(r => r.product_id === p.id)) productsWithoutInventory.push(p); });

  const filtered = rows.filter(r => {
    const p = products.get(r.product_id);
    const q = search.toLowerCase();
    const matchSearch = !q || [p?.name, p?.sku, p?.brand, p?.category].some(v => v?.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || r.inventory_status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Track stock, reservations, incoming, and reorder levels across all products</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={rows.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-sm text-slate-300 font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-sm text-slate-300 font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'In Stock',       value: stats.inStock,       icon: PackageCheck,   color: 'text-emerald-400', sub: 'ready to ship' },
          { label: 'Low Stock',      value: stats.lowStock,      icon: AlertTriangle,  color: 'text-amber-400',   sub: 'below reorder' },
          { label: 'Out of Stock',   value: stats.outOfStock,    icon: PackageX,       color: 'text-red-400',     sub: '0 units' },
          { label: 'Pre-Order',      value: stats.preOrder,      icon: Clock,          color: 'text-blue-400',    sub: 'incoming only' },
          { label: 'Discontinued',   value: stats.discontinued,  icon: PackageX,       color: 'text-slate-400',   sub: 'retired' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1"><Package className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs text-slate-400">Total Stock Units</span></div>
          <p className="text-lg font-bold text-white">{stats.totalStockUnits.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs text-slate-400">Reserved Units</span></div>
          <p className="text-lg font-bold text-white">{stats.totalReserved.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-3.5 h-3.5 text-cyan-400" /><span className="text-xs text-slate-400">Incoming Units</span></div>
          <p className="text-lg font-bold text-white">{stats.totalIncoming.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs text-slate-400">Need Reorder</span></div>
          <p className="text-lg font-bold text-white">{stats.belowReorder}</p>
        </div>
      </div>

      {/* Products without inventory */}
      {productsWithoutInventory.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-700/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-semibold text-amber-300">
              {productsWithoutInventory.length} product{productsWithoutInventory.length !== 1 ? 's' : ''} without inventory tracking
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {productsWithoutInventory.slice(0, 12).map(p => (
              <button key={p.id} onClick={() => createInventoryForProduct(p.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:border-amber-500/50 hover:text-white transition-colors">
                <Plus className="w-3 h-3" /> {p.name}
              </button>
            ))}
            {productsWithoutInventory.length > 12 && (
              <span className="text-xs text-slate-500 px-3 py-1.5">+{productsWithoutInventory.length - 12} more…</span>
            )}
          </div>
        </div>
      )}

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(s => {
          const count = s === 'all' ? rows.length : rows.filter(r => r.inventory_status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${statusFilter === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}>
              {s === 'all' ? 'All' : STATUS_CFG[s]?.label ?? s}
              <span className={`px-1.5 py-0.5 rounded-full text-xs leading-none ${statusFilter === s ? 'bg-blue-500' : 'bg-slate-700 text-slate-400'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by product name, SKU, brand, category…"
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No inventory records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-800">Product</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Reserved</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Incoming</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Available</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Reorder</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Safety</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Updated</th>
                  <th className="px-3 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map(row => {
                  const p = products.get(row.product_id);
                  const isEditing = editingId === row.product_id;
                  const cfg = STATUS_CFG[row.inventory_status] ?? STATUS_CFG['in-stock'];
                  const isLow = row.stock_quantity <= row.reorder_level && row.stock_quantity > 0;

                  if (isEditing) {
                    return (
                      <tr key={row.product_id} className="bg-slate-750">
                        <td className="px-3 py-3 sticky left-0 bg-slate-750">
                          <p className="text-white text-xs font-medium truncate max-w-[160px]">{p?.name ?? 'Unknown'}</p>
                          <p className="text-slate-500 text-xs">{p?.sku}</p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input type="number" min={0} value={editForm.stock_quantity ?? 0}
                            onChange={e => setEditForm(f => ({ ...f, stock_quantity: parseInt(e.target.value) || 0 }))}
                            className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input type="number" min={0} value={editForm.reserved_quantity ?? 0}
                            onChange={e => setEditForm(f => ({ ...f, reserved_quantity: parseInt(e.target.value) || 0 }))}
                            className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input type="number" min={0} value={editForm.incoming_quantity ?? 0}
                            onChange={e => setEditForm(f => ({ ...f, incoming_quantity: parseInt(e.target.value) || 0 }))}
                            className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span className="text-slate-400 text-xs">{(editForm.stock_quantity ?? 0) - (editForm.reserved_quantity ?? 0)}</span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input type="number" min={0} value={editForm.reorder_level ?? 5}
                            onChange={e => setEditForm(f => ({ ...f, reorder_level: parseInt(e.target.value) || 0 }))}
                            className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input type="number" min={0} value={editForm.safety_stock ?? 2}
                            onChange={e => setEditForm(f => ({ ...f, safety_stock: parseInt(e.target.value) || 0 }))}
                            className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-3 py-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={editForm.discontinued ?? false}
                              onChange={e => setEditForm(f => ({ ...f, discontinued: e.target.checked }))}
                              className="w-4 h-4 rounded border-slate-600 bg-slate-700" />
                            <span className="text-xs text-slate-400">Discontinued</span>
                          </label>
                        </td>
                        <td className="px-3 py-3 hidden lg:table-cell">
                          <input type="date" value={editForm.restock_expected_date ?? ''}
                            onChange={e => setEditForm(f => ({ ...f, restock_expected_date: e.target.value }))}
                            className="w-32 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5 justify-end">
                            <button onClick={() => saveEdit(row.product_id)} disabled={saving}
                              className="w-7 h-7 flex items-center justify-center bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={cancelEdit}
                              className="w-7 h-7 flex items-center justify-center bg-slate-700 text-slate-400 rounded-lg hover:text-white transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={row.product_id} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="px-3 py-3.5 sticky left-0 bg-slate-800 group-hover:bg-slate-700/30 transition-colors">
                        <Link to={`/admin/products/${row.product_id}/edit`} className="text-white text-xs font-medium hover:text-blue-400 truncate block max-w-[160px]">
                          {p?.name ?? 'Unknown product'}
                        </Link>
                        <p className="text-slate-500 text-xs">{p?.sku ?? '—'}</p>
                        <p className="text-slate-600 text-[11px]">{p?.brand} · {p?.category}</p>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => quickAdjust(row, -1)} disabled={adjusting?.id === row.product_id}
                            className="w-5 h-5 flex items-center justify-center bg-slate-700 text-slate-400 rounded hover:bg-red-600 hover:text-white transition-colors text-xs">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className={`text-xs font-bold w-8 text-center ${row.stock_quantity === 0 ? 'text-red-400' : isLow ? 'text-amber-400' : 'text-white'}`}>
                            {row.stock_quantity}
                          </span>
                          <button onClick={() => quickAdjust(row, 1)} disabled={adjusting?.id === row.product_id}
                            className="w-5 h-5 flex items-center justify-center bg-slate-700 text-slate-400 rounded hover:bg-emerald-600 hover:text-white transition-colors text-xs">
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`text-xs ${row.reserved_quantity > 0 ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>
                          {row.reserved_quantity}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`text-xs ${row.incoming_quantity > 0 ? 'text-cyan-400 font-medium' : 'text-slate-500'}`}>
                          {row.incoming_quantity}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className={`text-xs font-bold ${row.available_quantity < 0 ? 'text-red-400' : row.available_quantity === 0 ? 'text-red-400' : 'text-white'}`}>
                          {row.available_quantity}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="text-xs text-slate-400">{row.reorder_level}</span>
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        <span className="text-xs text-slate-400">{row.safety_stock}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 text-right hidden lg:table-cell">
                        <span className="text-xs text-slate-500">{fmtDate(row.last_stock_update)}</span>
                      </td>
                      <td className="px-3 py-3.5">
                        <button onClick={() => startEdit(row)}
                          className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-700 text-slate-400 hover:bg-blue-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100 mx-auto">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-500 text-right">{filtered.length} of {rows.length} inventory records</p>
      )}
    </div>
  );
}

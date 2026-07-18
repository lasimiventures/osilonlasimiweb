import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Plus, Search, RefreshCw, Loader2,
  TrendingUp, Package, Truck, CheckCircle, XCircle, Clock,
  FileText, Trash2, Save, AlertCircle, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type View = 'list' | 'create' | 'detail';
type TransferStatus = 'draft' | 'pending' | 'in_transit' | 'received' | 'cancelled';

interface TransferRow {
  id: string;
  transfer_number: string;
  from_warehouse_id: string | null;
  to_warehouse_id: string | null;
  status: TransferStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  fromWarehouse?: { name: string; code: string } | null;
  toWarehouse?: { name: string; code: string } | null;
  itemCount?: number;
  totalQuantity?: number;
}

interface TransferItemRow {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity: number;
  received_quantity: number;
  notes: string | null;
  product?: { name: string; sku: string } | null;
}

interface WarehouseOption {
  id: string;
  name: string;
  code: string;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string;
}

const STATUS_CFG: Record<TransferStatus, { label: string; dot: string; bg: string; text: string; border: string; icon: typeof Clock }> = {
  draft:       { label: 'Draft',       dot: 'bg-slate-400',   bg: 'bg-slate-500/10',   text: 'text-slate-300',   border: 'border-slate-600',      icon: FileText },
  pending:     { label: 'Pending',     dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-300',   border: 'border-amber-700/40',   icon: Clock },
  in_transit:  { label: 'In Transit',  dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    text: 'text-blue-300',    border: 'border-blue-700/40',    icon: Truck },
  received:    { label: 'Received',    dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-700/40', icon: CheckCircle },
  cancelled:   { label: 'Cancelled',   dot: 'bg-red-400',     bg: 'bg-red-500/10',     text: 'text-red-300',     border: 'border-red-700/40',     icon: XCircle },
};

const STATUS_FILTERS: (TransferStatus | 'all')[] = ['all', 'draft', 'pending', 'in_transit', 'received', 'cancelled'];

const inputCls = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40';
const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider';

function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }); }

export function AdminStockTransfers() {
  const [view, setView] = useState<View>('list');
  const [transfers, setTransfers] = useState<TransferRow[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TransferStatus | 'all'>('all');
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRow | null>(null);
  const [transferItems, setTransferItems] = useState<TransferItemRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [createForm, setCreateForm] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    notes: '',
  });
  const [createItems, setCreateItems] = useState<{ product_id: string; quantity: string; notes: string }[]>([{ product_id: '', quantity: '', notes: '' }]);

  const load = useCallback(async () => {
    setLoading(true);
    const [tRes, whRes, prodRes] = await Promise.all([
      supabase.from('stock_transfers').select('*').order('created_at', { ascending: false }),
      supabase.from('warehouses').select('id, name, code').eq('is_active', true).order('name'),
      supabase.from('products').select('id, name, sku').order('name').limit(500),
    ]);

    const whMap = new Map<string, WarehouseOption>();
    (whRes.data ?? []).forEach((w: WarehouseOption) => whMap.set(w.id, w));

    // Load item counts
    const transferIds = (tRes.data ?? []).map((t: TransferRow) => t.id);
    let itemCounts = new Map<string, { count: number; total: number }>();
    if (transferIds.length > 0) {
      const itemsRes = await supabase.from('stock_transfer_items').select('transfer_id, quantity').in('transfer_id', transferIds);
      (itemsRes.data ?? []).forEach((it: { transfer_id: string; quantity: number }) => {
        const existing = itemCounts.get(it.transfer_id) ?? { count: 0, total: 0 };
        existing.count++;
        existing.total += it.quantity;
        itemCounts.set(it.transfer_id, existing);
      });
    }

    const rows: TransferRow[] = (tRes.data ?? []).map((t: TransferRow) => ({
      ...t,
      fromWarehouse: t.from_warehouse_id ? whMap.get(t.from_warehouse_id) : null,
      toWarehouse: t.to_warehouse_id ? whMap.get(t.to_warehouse_id) : null,
      itemCount: itemCounts.get(t.id)?.count ?? 0,
      totalQuantity: itemCounts.get(t.id)?.total ?? 0,
    }));

    setTransfers(rows);
    setWarehouses(whRes.data as WarehouseOption[]);
    setProducts(prodRes.data as ProductOption[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadTransferDetail(t: TransferRow) {
    setSelectedTransfer(t);
    setView('detail');
    const [itemsRes] = await Promise.all([
      supabase.from('stock_transfer_items').select('*').eq('transfer_id', t.id),
    ]);
    // Enrich with product info
    const productIds = (itemsRes.data ?? []).map((it: TransferItemRow) => it.product_id);
    let prodMap = new Map<string, ProductOption>();
    if (productIds.length > 0) {
      const prodRes = await supabase.from('products').select('id, name, sku').in('id', productIds);
      (prodRes.data ?? []).forEach((p: ProductOption) => prodMap.set(p.id, p));
    }
    setTransferItems((itemsRes.data ?? []).map((it: TransferItemRow) => ({
      ...it,
      product: it.product_id ? prodMap.get(it.product_id) ?? null : null,
    })));
  }

  // ─── Create transfer ──────────────────────────────────────────────────────────

  function addItem() {
    setCreateItems([...createItems, { product_id: '', quantity: '', notes: '' }]);
  }

  function removeItem(idx: number) {
    setCreateItems(createItems.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: 'product_id' | 'quantity' | 'notes', value: string) {
    setCreateItems(createItems.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  }

  async function createTransfer() {
    if (!createForm.from_warehouse_id || !createForm.to_warehouse_id) {
      setError('Both source and destination warehouses are required.');
      return;
    }
    if (createForm.from_warehouse_id === createForm.to_warehouse_id) {
      setError('Source and destination warehouses must be different.');
      return;
    }
    const validItems = createItems.filter(it => it.product_id && parseInt(it.quantity) > 0);
    if (validItems.length === 0) {
      setError('Add at least one product with a quantity greater than 0.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const { data: transfer, error: tErr } = await supabase.from('stock_transfers').insert({
        from_warehouse_id: createForm.from_warehouse_id,
        to_warehouse_id: createForm.to_warehouse_id,
        status: 'pending',
        notes: createForm.notes || null,
      }).select('*').single();

      if (tErr || !transfer) throw new Error(tErr?.message ?? 'Failed to create transfer');

      const itemPayload = validItems.map(it => ({
        transfer_id: transfer.id,
        product_id: it.product_id,
        quantity: parseInt(it.quantity),
        notes: it.notes || null,
      }));
      await supabase.from('stock_transfer_items').insert(itemPayload);

      // Reset form
      setCreateForm({ from_warehouse_id: '', to_warehouse_id: '', notes: '' });
      setCreateItems([{ product_id: '', quantity: '', notes: '' }]);
      setSaving(false);
      await load();
      setView('list');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create transfer.');
      setSaving(false);
    }
  }

  // ─── Update transfer status ───────────────────────────────────────────────────

  async function updateStatus(newStatus: TransferStatus) {
    if (!selectedTransfer) return;
    setSaving(true);
    await supabase.from('stock_transfers').update({ status: newStatus }).eq('id', selectedTransfer.id);

    // If receiving, move stock: deduct from source warehouse, add to destination
    if (newStatus === 'received' && selectedTransfer.from_warehouse_id && selectedTransfer.to_warehouse_id) {
      for (const item of transferItems) {
        // Deduct from source
        const { data: srcStock } = await supabase.from('warehouse_stock')
          .select('id, quantity_on_hand').eq('product_id', item.product_id).eq('warehouse_id', selectedTransfer.from_warehouse_id).maybeSingle();
        if (srcStock) {
          const newQty = Math.max(0, (srcStock as { quantity_on_hand: number }).quantity_on_hand - item.quantity);
          await supabase.from('warehouse_stock').update({ quantity_on_hand: newQty }).eq('id', (srcStock as { id: string }).id);
        }
        // Add to destination
        const { data: destStock } = await supabase.from('warehouse_stock')
          .select('id, quantity_on_hand').eq('product_id', item.product_id).eq('warehouse_id', selectedTransfer.to_warehouse_id).maybeSingle();
        if (destStock) {
          await supabase.from('warehouse_stock').update({
            quantity_on_hand: (destStock as { quantity_on_hand: number }).quantity_on_hand + item.quantity,
          }).eq('id', (destStock as { id: string }).id);
        } else {
          await supabase.from('warehouse_stock').insert({
            product_id: item.product_id,
            warehouse_id: selectedTransfer.to_warehouse_id,
            quantity_on_hand: item.quantity,
          });
        }
        // Mark received quantity
        await supabase.from('stock_transfer_items').update({ received_quantity: item.quantity }).eq('id', item.id);
      }
    }

    // Reload
    const { data: updated } = await supabase.from('stock_transfers').select('*').eq('id', selectedTransfer.id).single();
    if (updated) {
      const whMap = new Map<string, WarehouseOption>();
      warehouses.forEach(w => whMap.set(w.id, w));
      setSelectedTransfer({
        ...updated as TransferRow,
        fromWarehouse: updated.from_warehouse_id ? whMap.get(updated.from_warehouse_id) : null,
        toWarehouse: updated.to_warehouse_id ? whMap.get(updated.to_warehouse_id) : null,
      });
    }
    setSaving(false);
    await load();
  }

  async function deleteTransfer(tid: string) {
    if (!confirm('Delete this stock transfer? This cannot be undone.')) return;
    await supabase.from('stock_transfers').delete().eq('id', tid);
    setView('list');
    setSelectedTransfer(null);
    await load();
  }

  // ─── Filtered list ────────────────────────────────────────────────────────────

  const filtered = transfers.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || [t.transfer_number, t.fromWarehouse?.name, t.toWarehouse?.name, t.notes]
      .some(v => v?.toLowerCase().includes(q));
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: transfers.length,
    draft: transfers.filter(t => t.status === 'draft').length,
    pending: transfers.filter(t => t.status === 'pending').length,
    inTransit: transfers.filter(t => t.status === 'in_transit').length,
    received: transfers.filter(t => t.status === 'received').length,
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  if (view === 'create') {
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => { setView('list'); setError(null); }}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Transfers
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">New Stock Transfer</h1>
          <p className="text-slate-400 text-sm mt-0.5">Move stock between warehouses</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded-xl text-sm text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>From Warehouse *</label>
              <select value={createForm.from_warehouse_id} onChange={e => setCreateForm(f => ({ ...f, from_warehouse_id: e.target.value }))}
                className={inputCls}>
                <option value="">Select source…</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>To Warehouse *</label>
              <select value={createForm.to_warehouse_id} onChange={e => setCreateForm(f => ({ ...f, to_warehouse_id: e.target.value }))}
                className={inputCls}>
                <option value="">Select destination…</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={createForm.notes} onChange={e => setCreateForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} className={inputCls + ' resize-none'} placeholder="Optional transfer notes…" />
          </div>
        </div>

        {/* Items */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Transfer Items</h3>
            <button onClick={addItem}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 text-xs text-slate-300 font-semibold rounded-lg hover:bg-slate-600 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>
          <div className="space-y-2">
            {createItems.map((it, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                <div className="col-span-12 sm:col-span-6">
                  <select value={it.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)}
                    className={inputCls}>
                    <option value="">Select product…</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div className="col-span-6 sm:col-span-2">
                  <input type="number" min={1} value={it.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)}
                    className={inputCls} placeholder="Qty" />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <input value={it.notes} onChange={e => updateItem(idx, 'notes', e.target.value)}
                    className={inputCls} placeholder="Notes" />
                </div>
                <div className="col-span-1 flex justify-end">
                  {createItems.length > 1 && (
                    <button onClick={() => removeItem(idx)}
                      className="w-8 h-8 flex items-center justify-center bg-slate-700 text-slate-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={() => { setView('list'); setError(null); }}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 text-sm text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button onClick={createTransfer} disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-sm text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Transfer
          </button>
        </div>
      </div>
    );
  }

  if (view === 'detail' && selectedTransfer) {
    const cfg = STATUS_CFG[selectedTransfer.status];
    const StatusIcon = cfg.icon;
    return (
      <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <button onClick={() => { setView('list'); setSelectedTransfer(null); }}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Transfers
          </button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{selectedTransfer.transfer_number}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                <StatusIcon className="w-3.5 h-3.5" /> {cfg.label}
              </span>
              <span className="text-xs text-slate-500">{fmtDate(selectedTransfer.created_at)}</span>
            </div>
          </div>
          {selectedTransfer.status !== 'received' && selectedTransfer.status !== 'cancelled' && (
            <button onClick={() => deleteTransfer(selectedTransfer.id)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700 text-sm text-red-400 font-semibold rounded-lg hover:bg-red-900/30 transition-colors">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>

        {/* Route */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">From</p>
              <div className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">{selectedTransfer.fromWarehouse?.name ?? '—'}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{selectedTransfer.fromWarehouse?.code ?? ''}</p>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-px bg-slate-600" />
              <ArrowRight className="w-5 h-5 text-slate-500 -ml-2" />
            </div>
            <div className="flex-1 text-center">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">To</p>
              <div className="flex items-center justify-center gap-2">
                <Package className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">{selectedTransfer.toWarehouse?.name ?? '—'}</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{selectedTransfer.toWarehouse?.code ?? ''}</p>
            </div>
          </div>
        </div>

        {selectedTransfer.notes && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-slate-300">{selectedTransfer.notes}</p>
          </div>
        )}

        {/* Items */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-white">Transfer Items ({transferItems.length})</h3>
          </div>
          {transferItems.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">No items in this transfer</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Received</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {transferItems.map(it => (
                  <tr key={it.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/admin/products/${it.product_id}/edit`} className="text-white text-sm font-medium hover:text-blue-400">
                        {it.product?.name ?? 'Unknown'}
                      </Link>
                      <p className="text-xs text-slate-500">{it.product?.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-white">{it.quantity}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm ${it.received_quantity === it.quantity ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                        {it.received_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-400">{it.notes ?? '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Status actions */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Update Status</h3>
          <div className="flex flex-wrap gap-2">
            {selectedTransfer.status === 'pending' && (
              <button onClick={() => updateStatus('in_transit')} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />} Mark In Transit
              </button>
            )}
            {selectedTransfer.status === 'in_transit' && (
              <button onClick={() => updateStatus('received')} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-sm text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />} Mark Received & Move Stock
              </button>
            )}
            {selectedTransfer.status !== 'received' && selectedTransfer.status !== 'cancelled' && (
              <button onClick={() => updateStatus('cancelled')} disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-sm text-red-400 font-semibold rounded-lg hover:bg-red-900/30 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Cancel Transfer
              </button>
            )}
            {selectedTransfer.status === 'received' && (
              <p className="text-sm text-emerald-400 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> Stock has been moved and this transfer is complete.
              </p>
            )}
            {selectedTransfer.status === 'cancelled' && (
              <p className="text-sm text-slate-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" /> This transfer was cancelled.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Stock Transfers</h1>
          <p className="text-slate-400 text-sm mt-0.5">Move stock between warehouses and track shipments</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setView('create'); setError(null); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-sm text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> New Transfer
          </button>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-sm text-slate-300 font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {([
          { label: 'Total', value: stats.total, icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Draft', value: stats.draft, icon: FileText, color: 'text-slate-400' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-400' },
          { label: 'In Transit', value: stats.inTransit, icon: Truck, color: 'text-blue-400' },
          { label: 'Received', value: stats.received, icon: CheckCircle, color: 'text-emerald-400' },
        ]).map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(s => {
          const count = s === 'all' ? transfers.length : transfers.filter(t => t.status === s).length;
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${statusFilter === s ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}>
              {s === 'all' ? 'All' : STATUS_CFG[s as TransferStatus].label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs leading-none ${statusFilter === s ? 'bg-blue-500' : 'bg-slate-700 text-slate-400'}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by transfer number, warehouse, notes…"
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
            <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">No stock transfers found</p>
            <button onClick={() => { setView('create'); setError(null); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Create a transfer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Transfer #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Route</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map(t => {
                  const cfg = STATUS_CFG[t.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <tr key={t.id} onClick={() => loadTransferDetail(t)}
                      className="hover:bg-slate-700/30 transition-colors cursor-pointer group">
                      <td className="px-4 py-3.5">
                        <span className="text-white text-sm font-medium group-hover:text-blue-400">{t.transfer_number}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-300">{t.fromWarehouse?.name ?? '—'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-600" />
                          <span className="text-slate-300">{t.toWarehouse?.name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs text-slate-300">{t.itemCount ?? 0}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs font-bold text-white">{t.totalQuantity ?? 0}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                          <StatusIcon className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                        <span className="text-xs text-slate-500">{fmtDate(t.created_at)}</span>
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
        <p className="text-xs text-slate-500 text-right">{filtered.length} of {transfers.length} transfers</p>
      )}
    </div>
  );
}

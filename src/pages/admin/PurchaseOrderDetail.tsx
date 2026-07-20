import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, AlertCircle, Loader2, ShoppingCart, Truck, Package,
  Check, X, Pencil, Plus,
} from 'lucide-react';
import {
  adminGetPurchaseOrderById, adminGetGRNsForPO, adminUpdatePurchaseOrderStatus,
  adminCreateGRN,
} from '../../lib/database';

interface POItem {
  id: string;
  product_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  line_total: number;
  supplier_sku: string | null;
  notes: string | null;
  product: { id: string; name: string; sku: string } | null;
}

interface PODetail {
  id: string;
  po_number: string;
  status: string;
  order_date: string;
  expected_delivery_date: string | null;
  currency: string;
  subtotal: number;
  tax_total: number;
  shipping_total: number;
  total: number;
  notes: string | null;
  created_at: string;
  supplier: { id: string; name: string; slug: string } | null;
  warehouse: { id: string; name: string; code: string } | null;
  payment_terms: { id: string; name: string; code: string } | null;
  purchase_order_items: POItem[];
}

interface GRN {
  id: string;
  grn_number: string;
  received_by: string | null;
  received_date: string;
  status: string;
  notes: string | null;
  warehouse: { name: string; code: string } | null;
  goods_received_note_items: {
    id: string;
    quantity_received: number;
    quantity_rejected: number;
    rejection_reason: string | null;
    po_item_id: string;
    product_id: string;
  }[];
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-slate-700/40 text-slate-300',
  sent: 'bg-blue-500/10 text-blue-300',
  acknowledged: 'bg-cyan-500/10 text-cyan-300',
  partial: 'bg-amber-500/10 text-amber-300',
  received: 'bg-emerald-500/10 text-emerald-300',
  cancelled: 'bg-red-500/10 text-red-300',
  received_grn: 'bg-emerald-500/10 text-emerald-300',
};

const STATUS_FLOW = ['draft', 'sent', 'acknowledged', 'partial', 'received', 'cancelled'];

export function AdminPurchaseOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [po, setPO] = useState<PODetail | null>(null);
  const [grns, setGRNs] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReceive, setShowReceive] = useState(false);
  const [receiving, setReceiving] = useState(false);

  async function fetchPO() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [poData, grnData] = await Promise.all([
        adminGetPurchaseOrderById(id),
        adminGetGRNsForPO(id),
      ]);
      setPO(poData as PODetail);
      setGRNs(grnData as GRN[]);
    } catch {
      setError('Failed to load purchase order.');
    }
    setLoading(false);
  }

  useEffect(() => { fetchPO(); }, [id]);

  async function handleStatusChange(newStatus: string) {
    if (!id) return;
    try {
      await adminUpdatePurchaseOrderStatus(id, newStatus);
      setPO(prev => prev ? { ...prev, status: newStatus } : prev);
    } catch {
      setError('Failed to update PO status.');
    }
  }

  if (loading) return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  if (error || !po) return (
    <div className="p-8 max-w-4xl mx-auto">
      {error && <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5"><AlertCircle className="w-4 h-4" /> {error}</div>}
      <Link to="/admin/procurement" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Back to procurement</Link>
    </div>
  );

  const allReceived = po.purchase_order_items.every(i => i.quantity_received >= i.quantity_ordered);
  const canReceive = po.status !== 'cancelled' && po.status !== 'received' && po.purchase_order_items.length > 0;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          <Link to="/admin/procurement" className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-all"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-white font-mono">{po.po_number}</h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[po.status] ?? 'bg-slate-800 text-slate-400'}`}>{po.status}</span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">{po.supplier?.name ?? '—'} · ordered {new Date(po.order_date).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/admin/procurement/${po.id}/edit`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all"><Pencil className="w-3.5 h-3.5" /> Edit</Link>
          {canReceive && (
            <button onClick={() => setShowReceive(true)} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-colors"><Package className="w-4 h-4" /> Receive Goods</button>
          )}
        </div>
      </div>

      {error && <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5"><AlertCircle className="w-4 h-4" /> {error}</div>}

      {/* Status actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-5">
        <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Procurement Status</p>
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_FLOW.map(status => {
            const active = po.status === status;
            const isCancelled = status === 'cancelled';
            return (
              <button
                key={status}
                onClick={() => !active && handleStatusChange(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active ? (isCancelled ? 'bg-red-500/20 text-red-300 border border-red-800/50' : 'bg-blue-500/20 text-blue-300 border border-blue-700/50') :
                  isCancelled ? 'text-slate-400 hover:text-red-400 border border-slate-700 hover:border-red-800/50' :
                  'text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>
      </div>

      {/* Order meta */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Supplier', value: po.supplier?.name ?? '—' },
          { label: 'Warehouse', value: po.warehouse ? `${po.warehouse.name} (${po.warehouse.code})` : '—' },
          { label: 'Expected', value: po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString() : '—' },
          { label: 'Payment Terms', value: po.payment_terms ? `${po.payment_terms.name} (${po.payment_terms.code})` : '—' },
        ].map(m => (
          <div key={m.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-400 mb-1">{m.label}</p>
            <p className="text-sm text-white font-medium">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Items */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-5">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Line Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Product</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Ordered</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Received</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Unit Cost</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Line Total</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {po.purchase_order_items.map(item => {
                const fullyReceived = item.quantity_received >= item.quantity_ordered;
                const partial = item.quantity_received > 0 && item.quantity_received < item.quantity_ordered;
                return (
                  <tr key={item.id} className="border-b border-slate-800/50">
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-white">{item.product?.name ?? '—'}</p>
                      <p className="text-xs text-slate-500 font-mono">{item.product?.sku}{item.supplier_sku ? ` · supplier SKU: ${item.supplier_sku}` : ''}</p>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-300 tabular-nums">{item.quantity_ordered}</td>
                    <td className="px-5 py-3.5 text-right text-sm tabular-nums">
                      <span className={fullyReceived ? 'text-emerald-300' : partial ? 'text-amber-300' : 'text-slate-400'}>{item.quantity_received}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-300 tabular-nums">{po.currency} {Number(item.unit_cost).toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right text-sm text-slate-300 tabular-nums">{po.currency} {Number(item.line_total).toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      {fullyReceived ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-300"><Check className="w-3 h-3" /> Received</span>
                      ) : partial ? (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-300"><Package className="w-3 h-3" /> Partial</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500"><Clock className="w-3 h-3" /> Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* Totals */}
        <div className="px-5 py-4 border-t border-slate-800 flex justify-end">
          <div className="space-y-1 text-right">
            <div className="flex items-center gap-8 text-sm"><span className="text-slate-400">Subtotal</span><span className="text-white tabular-nums w-32 text-right">{po.currency} {Number(po.subtotal).toLocaleString()}</span></div>
            <div className="flex items-center gap-8 text-sm"><span className="text-slate-400">Tax</span><span className="text-white tabular-nums w-32 text-right">{po.currency} {Number(po.tax_total).toLocaleString()}</span></div>
            <div className="flex items-center gap-8 text-sm"><span className="text-slate-400">Shipping</span><span className="text-white tabular-nums w-32 text-right">{po.currency} {Number(po.shipping_total).toLocaleString()}</span></div>
            <div className="flex items-center gap-8 text-sm pt-2 border-t border-slate-700 mt-2"><span className="text-slate-300 font-medium">Total</span><span className="text-blue-300 font-bold text-lg tabular-nums w-32 text-right">{po.currency} {Number(po.total).toLocaleString()}</span></div>
          </div>
        </div>
      </div>

      {/* GRN history */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-blue-400" /><h2 className="text-sm font-semibold text-white">Goods Received Notes</h2></div>
          {canReceive && <button onClick={() => setShowReceive(true)} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"><Plus className="w-3 h-3" /> Receive</button>}
        </div>
        {grns.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Truck className="w-7 h-7 text-slate-700 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No goods received yet</p>
            {canReceive && <p className="text-xs text-slate-500 mt-1">Click "Receive Goods" to record a delivery against this PO.</p>}
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {grns.map(grn => (
              <div key={grn.id} className="px-5 py-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-mono text-white">{grn.grn_number}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${STATUS_STYLES[grn.status === 'received' ? 'received_grn' : grn.status] ?? 'bg-slate-800 text-slate-400'}`}>{grn.status}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {grn.warehouse?.name} · {new Date(grn.received_date).toLocaleDateString()}{grn.received_by && ` · by ${grn.received_by}`}
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  {grn.goods_received_note_items.map(gi => (
                    <div key={gi.id} className="flex items-center justify-between text-xs text-slate-400 pl-3">
                      <span>Line {gi.po_item_id.slice(0, 8)}</span>
                      <span className="tabular-nums">Received: <span className="text-emerald-300">{gi.quantity_received}</span>{gi.quantity_rejected > 0 && <span className="text-red-300"> · Rejected: {gi.quantity_rejected}</span>}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {po.notes && (
        <div className="mt-5 p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Notes</p>
          <p className="text-sm text-slate-300">{po.notes}</p>
        </div>
      )}

      {/* Receive Goods modal */}
      {showReceive && (
        <ReceiveGoodsModal
          po={po}
          onClose={() => setShowReceive(false)}
          onReceived={() => { setShowReceive(false); fetchPO(); }}
          receiving={receiving}
          setReceiving={setReceiving}
        />
      )}
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

function ReceiveGoodsModal({ po, onClose, onReceived, receiving, setReceiving }: {
  po: PODetail;
  onClose: () => void;
  onReceived: () => void;
  receiving: boolean;
  setReceiving: (v: boolean) => void;
}) {
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [rejected, setRejected] = useState<Record<string, string>>({});
  const [receivedBy, setReceivedBy] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const receivableItems = po.purchase_order_items.filter(i => i.quantity_received < i.quantity_ordered);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const items = receivableItems
      .filter(i => Number(quantities[i.id]) > 0)
      .map(i => ({
        po_item_id: i.id,
        product_id: i.product_id,
        quantity_received: Number(quantities[i.id]),
        quantity_rejected: Number(rejected[i.id]) || 0,
      }));
    if (items.length === 0) { setError('Enter at least one received quantity.'); return; }
    setError(null);
    setReceiving(true);
    try {
      await adminCreateGRN(
        { po_id: po.id, warehouse_id: po.warehouse?.id, received_by: receivedBy || null, notes: notes || null, status: 'received' },
        items,
      );
      onReceived();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to record receipt.');
    } finally {
      setReceiving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2"><Package className="w-5 h-5 text-emerald-400" /><h2 className="text-base font-semibold text-white">Receive Goods — {po.po_number}</h2></div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-3 text-red-300 text-sm"><AlertCircle className="w-4 h-4" /> {error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Received By</label>
              <input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Warehouse</label>
              <div className="px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-sm text-slate-400">{po.warehouse?.name ?? 'No warehouse set on PO'}</div>
            </div>
          </div>
          <div className="space-y-2">
            {receivableItems.map(item => {
              const remaining = item.quantity_ordered - item.quantity_received;
              return (
                <div key={item.id} className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-white">{item.product?.name ?? '—'}</p>
                      <p className="text-xs text-slate-500 font-mono">{item.product?.sku} · ordered {item.quantity_ordered}, received {item.quantity_received}</p>
                    </div>
                    <span className="text-xs text-amber-300">{remaining} remaining</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Qty Received</label>
                      <input type="number" min="0" max={remaining} value={quantities[item.id] ?? ''} onChange={e => setQuantities(prev => ({ ...prev, [item.id]: e.target.value }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Qty Rejected</label>
                      <input type="number" min="0" value={rejected[item.id] ?? ''} onChange={e => setRejected(prev => ({ ...prev, [item.id]: e.target.value }))} className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Receiving notes…" />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-slate-400 hover:text-white px-4 py-2">Cancel</button>
            <button type="submit" disabled={receiving} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all">
              {receiving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {receiving ? 'Recording…' : 'Record Receipt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

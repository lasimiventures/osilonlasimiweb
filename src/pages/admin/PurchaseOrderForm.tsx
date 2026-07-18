import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, AlertCircle, Loader2, ShoppingCart, Trash2, Plus, Info,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  adminGetPurchaseOrderById, adminCreatePurchaseOrder, adminUpdatePurchaseOrder,
  adminGetSupplierPaymentTerms,
} from '../../lib/database';

interface Supplier { id: string; name: string }
interface Warehouse { id: string; name: string; code: string }
interface Product { id: string; name: string; sku: string; cost_price: number | null }
interface PaymentTerm { id: string; name: string; code: string }

interface LineItem {
  product_id: string;
  quantity_ordered: string;
  unit_cost: string;
  supplier_sku: string;
  notes: string;
}

interface FormState {
  supplier_id: string;
  warehouse_id: string;
  status: string;
  order_date: string;
  expected_delivery_date: string;
  currency: string;
  tax_total: string;
  shipping_total: string;
  payment_terms_id: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  supplier_id: '', warehouse_id: '', status: 'draft',
  order_date: new Date().toISOString().slice(0, 10),
  expected_delivery_date: '', currency: 'KES',
  tax_total: '0', shipping_total: '0', payment_terms_id: '', notes: '',
};

const inputCls = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all';
const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5';

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2"><Icon className="w-4 h-4 text-blue-400" /> {title}</h2>
      {children}
    </div>
  );
}

export function AdminPurchaseOrderForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [items, setItems] = useState<LineItem[]>([{ product_id: '', quantity_ordered: '1', unit_cost: '0', supplier_sku: '', notes: '' }]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('suppliers').select('id,name').order('name').then(({ data }) => data as Supplier[] | null),
      supabase.from('warehouses').select('id,name,code').order('name').then(({ data }) => data as Warehouse[] | null),
      supabase.from('products').select('id,name,sku,cost_price').order('name').then(({ data }) => data as Product[] | null),
      adminGetSupplierPaymentTerms(),
    ]).then(([s, w, p, terms]) => {
      if (s) setSuppliers(s);
      if (w) setWarehouses(w);
      if (p) setProducts(p);
      setPaymentTerms(terms as PaymentTerm[]);
    });
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      adminGetPurchaseOrderById(id).then(raw => {
        if (raw) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const r = raw as any;
          setForm({
            supplier_id: r.supplier_id ?? '',
            warehouse_id: r.warehouse_id ?? '',
            status: r.status ?? 'draft',
            order_date: r.order_date ?? new Date().toISOString().slice(0, 10),
            expected_delivery_date: r.expected_delivery_date ?? '',
            currency: r.currency ?? 'KES',
            tax_total: String(r.tax_total ?? 0),
            shipping_total: String(r.shipping_total ?? 0),
            payment_terms_id: r.payment_terms_id ?? '',
            notes: r.notes ?? '',
          });
          if (r.purchase_order_items && r.purchase_order_items.length > 0) {
            setItems(r.purchase_order_items.map((i: any) => ({
              product_id: i.product_id ?? '',
              quantity_ordered: String(i.quantity_ordered ?? 1),
              unit_cost: String(i.unit_cost ?? 0),
              supplier_sku: i.supplier_sku ?? '',
              notes: i.notes ?? '',
            })));
          }
        }
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  function updateItem(index: number, field: keyof LineItem, value: string) {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, [field]: value } : it));
  }

  function handleProductChange(index: number, productId: string) {
    const product = products.find(p => p.id === productId);
    setItems(prev => prev.map((it, i) => i === index ? {
      ...it, product_id: productId,
      unit_cost: product?.cost_price ? String(product.cost_price) : it.unit_cost,
    } : it));
  }

  function addItem() {
    setItems(prev => [...prev, { product_id: '', quantity_ordered: '1', unit_cost: '0', supplier_sku: '', notes: '' }]);
  }

  function removeItem(index: number) {
    setItems(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  }

  const subtotal = items.reduce((sum, it) => sum + (Number(it.quantity_ordered) || 0) * (Number(it.unit_cost) || 0), 0);
  const taxTotal = Number(form.tax_total) || 0;
  const shippingTotal = Number(form.shipping_total) || 0;
  const grandTotal = subtotal + taxTotal + shippingTotal;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.supplier_id) { setError('Supplier is required.'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const validItems = items.filter(it => it.product_id);
    if (validItems.length === 0) { setError('Add at least one line item.'); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setError(null);
    setSaving(true);
    try {
      const header = {
        supplier_id: form.supplier_id,
        warehouse_id: form.warehouse_id || null,
        status: form.status,
        order_date: form.order_date,
        expected_delivery_date: form.expected_delivery_date || null,
        currency: form.currency,
        tax_total: taxTotal,
        shipping_total: shippingTotal,
        payment_terms_id: form.payment_terms_id || null,
        notes: form.notes.trim() || null,
      };
      const itemPayload = validItems.map(it => ({
        product_id: it.product_id,
        quantity_ordered: Number(it.quantity_ordered) || 1,
        unit_cost: Number(it.unit_cost) || 0,
        supplier_sku: it.supplier_sku.trim() || null,
        notes: it.notes.trim() || null,
      }));
      if (isEdit && id) {
        await adminUpdatePurchaseOrder(id, header, itemPayload);
      } else {
        await adminCreatePurchaseOrder(header, itemPayload);
      }
      navigate('/admin/procurement');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save purchase order.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-7">
        <Link to="/admin/procurement" className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-all"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="text-xl font-bold text-white">{isEdit ? 'Edit Purchase Order' : 'New Purchase Order'}</h1>
          <p className="text-slate-400 text-sm">Order stock from a supplier</p>
        </div>
      </div>

      {error && <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-6"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Order details */}
        <SectionCard title="Order Details" icon={ShoppingCart}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Supplier <span className="text-red-400">*</span></label>
              <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} className={inputCls} required>
                <option value="">— Select supplier —</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Receiving Warehouse</label>
              <select value={form.warehouse_id} onChange={e => set('warehouse_id', e.target.value)} className={inputCls}>
                <option value="">— Select warehouse —</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="acknowledged">Acknowledged</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Payment Terms</label>
              <select value={form.payment_terms_id} onChange={e => set('payment_terms_id', e.target.value)} className={inputCls}>
                <option value="">— Select terms —</option>
                {paymentTerms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Order Date</label>
              <input type="date" value={form.order_date} onChange={e => set('order_date', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Expected Delivery</label>
              <input type="date" value={form.expected_delivery_date} onChange={e => set('expected_delivery_date', e.target.value)} className={inputCls} />
            </div>
          </div>
        </SectionCard>

        {/* Line items */}
        <SectionCard title="Line Items" icon={Plus}>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="p-4 bg-slate-800 border border-slate-700 rounded-xl">
                <div className="grid grid-cols-12 gap-3 items-start">
                  <div className="col-span-12 md:col-span-5">
                    <label className="text-xs text-slate-400 mb-1 block">Product</label>
                    <select value={item.product_id} onChange={e => handleProductChange(index, e.target.value)} className={inputCls}>
                      <option value="">— Select product —</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Qty</label>
                    <input type="number" min="1" value={item.quantity_ordered} onChange={e => updateItem(index, 'quantity_ordered', e.target.value)} className={inputCls} />
                  </div>
                  <div className="col-span-4 md:col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Unit Cost</label>
                    <input type="number" min="0" step="0.01" value={item.unit_cost} onChange={e => updateItem(index, 'unit_cost', e.target.value)} className={inputCls} />
                  </div>
                  <div className="col-span-3 md:col-span-2">
                    <label className="text-xs text-slate-400 mb-1 block">Line Total</label>
                    <div className="px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-300 tabular-nums">
                      {((Number(item.quantity_ordered) || 0) * (Number(item.unit_cost) || 0)).toLocaleString()}
                    </div>
                  </div>
                  <div className="col-span-1 flex items-end justify-end pb-1">
                    <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1} className="p-2 text-slate-500 hover:text-red-400 disabled:opacity-30 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium"><Plus className="w-3.5 h-3.5" /> Add line item</button>
          </div>

          {/* Totals */}
          <div className="mt-5 pt-5 border-t border-slate-700 grid grid-cols-2 gap-4 max-w-md ml-auto">
            <div>
              <label className={labelCls}>Tax Total</label>
              <input type="number" min="0" step="0.01" value={form.tax_total} onChange={e => set('tax_total', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Shipping</label>
              <input type="number" min="0" step="0.01" value={form.shipping_total} onChange={e => set('shipping_total', e.target.value)} className={inputCls} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <div className="text-right">
              <p className="text-xs text-slate-400">Subtotal</p>
              <p className="text-lg font-semibold text-white tabular-nums">{form.currency} {subtotal.toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-2">Grand Total</p>
              <p className="text-2xl font-bold text-blue-300 tabular-nums">{form.currency} {grandTotal.toLocaleString()}</p>
            </div>
          </div>
        </SectionCard>

        {/* Notes */}
        <SectionCard title="Notes" icon={Info}>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Internal notes about this PO…" />
        </SectionCard>

        {/* Save bar */}
        <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur border-t border-slate-800 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/admin/procurement" className="text-sm text-slate-400 hover:text-white transition-colors">Cancel</Link>
          <button type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create PO'}
          </button>
        </div>
      </form>
    </div>
  );
}

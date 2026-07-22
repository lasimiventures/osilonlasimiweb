import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft, Package, Loader2, AlertCircle, Calendar, Truck, MapPin,
  CheckCircle2, Clock, User, Building2, Mail, Phone, FileText,
  ShieldCheck, Box, Navigation, ClipboardList, Info,
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { supabase } from '../lib/supabase';

interface OrderItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number | null;
  subtotal: number | null;
}

interface OrderDetail {
  id: string;
  order_number: string;
  customer_name: string;
  company_name: string | null;
  email: string;
  phone: string;
  county: string | null;
  delivery_address: string | null;
  notes: string | null;
  order_status: string;
  delivery_status: string;
  tracking_number: string | null;
  courier: string | null;
  shipped_at: string | null;
  estimated_delivery: string | null;
  delivered_at: string | null;
  delivery_notes: string | null;
  total_value: number | null;
  vat_amount: number | null;
  discount_amount: number | null;
  source: string;
  created_at: string;
  updated_at: string | null;
  quote_id: string | null;
}

interface HistoryEvent {
  id: string;
  event_type: string;
  from_status: string | null;
  to_status: string | null;
  actor: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const ORDER_PIPELINE: { key: string; label: string; icon: typeof Package }[] = [
  { key: 'processing', label: 'Processing', icon: ClipboardList },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: Package },
];

const DELIVERY_PIPELINE: { key: string; label: string; icon: typeof Truck }[] = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'processing', label: 'Processing', icon: ClipboardList },
  { key: 'shipped', label: 'Dispatched', icon: Box },
  { key: 'in_transit', label: 'In Transit', icon: Navigation },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-slate-600', bg: 'bg-slate-100' },
  processing: { label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-50' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-50' },
  shipped: { label: 'Shipped', color: 'text-amber-700', bg: 'bg-amber-50' },
  delivered: { label: 'Delivered', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  completed: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50' },
  failed_delivery: { label: 'Delivery Failed', color: 'text-red-700', bg: 'bg-red-50' },
  in_transit: { label: 'In Transit', color: 'text-blue-700', bg: 'bg-blue-50' },
  out_for_delivery: { label: 'Out for Delivery', color: 'text-amber-700', bg: 'bg-amber-50' },
};

function statusLabel(s: string): string {
  return STATUS_META[s]?.label ?? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { session, loading: authLoading } = useCustomerAuth();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: o, error: oErr }, { data: its }, { data: hist }] = await Promise.all([
      supabase.from('orders').select('*').eq('id', id).maybeSingle(),
      supabase.from('order_items').select('*').eq('order_id', id).order('created_at'),
      supabase.from('order_history').select('*').eq('order_id', id).order('created_at', { ascending: false }),
    ]);
    if (oErr) { setError('Failed to load order.'); setLoading(false); return; }
    if (!o) { setError('Order not found.'); setLoading(false); return; }
    setOrder(o as OrderDetail);
    setItems((its ?? []) as OrderItem[]);
    setHistory((hist ?? []) as HistoryEvent[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  if (!session) return <Navigate to={`/login?next=/account/orders/${id}`} replace />;
  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-1/3" /><div className="h-48 bg-slate-100 rounded-2xl" /><div className="h-64 bg-slate-100 rounded-2xl" /></div></div>;
  if (error || !order) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-600 mb-4">{error ?? 'Order not found'}</p>
      <Link to="/account" className="text-blue-600 font-medium text-sm">Back to account</Link>
    </div>
  );

  if (session.user.email && order.email !== session.user.email) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 mb-4">You don't have access to this order.</p>
        <Link to="/account" className="text-blue-600 font-medium text-sm">Back to account</Link>
      </div>
    );
  }

  const orderStatusMeta = STATUS_META[order.order_status] ?? { label: statusLabel(order.order_status), color: 'text-slate-600', bg: 'bg-slate-100' };
  const deliveryStatusMeta = STATUS_META[order.delivery_status] ?? { label: statusLabel(order.delivery_status), color: 'text-slate-600', bg: 'bg-slate-100' };

  const orderStepIdx = ORDER_PIPELINE.findIndex(s => s.key === order.order_status);
  const deliveryStepIdx = DELIVERY_PIPELINE.findIndex(s => s.key === order.delivery_status);

  const subtotal = items.reduce((acc, i) => acc + Number(i.subtotal ?? (i.quantity * Number(i.unit_price ?? 0))), 0);
  const discount = Number(order.discount_amount ?? 0);
  const vat = Number(order.vat_amount ?? 0);
  const total = Number(order.total_value ?? (subtotal - discount + vat));

  const isDelivered = order.delivery_status === 'delivered' || order.order_status === 'delivered' || order.order_status === 'completed';
  const isShipped = ['shipped', 'in_transit', 'out_for_delivery', 'delivered'].includes(order.delivery_status) || order.order_status === 'shipped';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link to="/account" className="hover:text-slate-700">Account</Link>
        <span>/</span>
        <span className="hover:text-slate-700">My Orders</span>
        <span>/</span>
        <span className="text-slate-900 font-medium">{order.order_number}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{order.order_number}</h1>
              <p className="text-xs text-slate-500">
                Placed {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                {order.source === 'quote_conversion' && <span className="ml-2 text-blue-500">· From quote</span>}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${orderStatusMeta.bg} ${orderStatusMeta.color}`}>
              {orderStatusMeta.label}
            </span>
            {order.delivery_status !== 'pending' && order.delivery_status !== order.order_status && (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${deliveryStatusMeta.bg} ${deliveryStatusMeta.color}`}>
                {deliveryStatusMeta.label}
              </span>
            )}
          </div>
        </div>

        {/* Order status pipeline */}
        <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
          {ORDER_PIPELINE.map((step, idx) => {
            const done = idx < orderStepIdx;
            const active = idx === orderStepIdx;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
                {idx > 0 && <div className={`w-6 h-0.5 ${done || active ? 'bg-blue-500' : 'bg-slate-200'}`} />}
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Delivery tracking card */}
      {isShipped && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-slate-900">Delivery Progress</h2>
          </div>

          {/* Delivery pipeline */}
          <div className="flex items-center gap-1 mb-6 overflow-x-auto">
            {DELIVERY_PIPELINE.map((step, idx) => {
              const done = idx < deliveryStepIdx;
              const active = idx === deliveryStepIdx;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
                  {idx > 0 && <div className={`w-5 h-0.5 ${done || active ? 'bg-blue-500' : 'bg-slate-200'}`} />}
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Shipment details grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
            <ShipmentCell icon={Truck} label="Courier" value={order.courier ?? '—'} />
            <ShipmentCell icon={Navigation} label="Tracking #" value={order.tracking_number ?? '—'} />
            <ShipmentCell
              icon={Clock}
              label="Shipped"
              value={order.shipped_at ? new Date(order.shipped_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
            />
            <ShipmentCell
              icon={Calendar}
              label="Est. Delivery"
              value={order.estimated_delivery ? new Date(order.estimated_delivery).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}
            />
          </div>

          {/* Tracking link */}
          {order.tracking_number && order.courier && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(order.courier + ' tracking ' + order.tracking_number)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                <Navigation className="w-3.5 h-3.5" />
                Track with {order.courier}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Delivery confirmation */}
      {isDelivered && order.delivered_at && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">Order Delivered</p>
            <p className="text-xs text-emerald-600">
              Delivered on {new Date(order.delivered_at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* Delivery failed */}
      {order.delivery_status === 'failed_delivery' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Delivery Attempt Failed</p>
            <p className="text-xs text-red-600">Our team will contact you to rearrange delivery.</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Items */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Order Items ({items.length})</h2>
            </div>
            {items.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No items in this order.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item, idx) => (
                  <div key={item.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-slate-400">#{idx + 1}</span>
                          <p className="text-sm font-semibold text-slate-900">{item.product_name}</p>
                        </div>
                        {item.product_sku && <p className="text-xs text-slate-400 mt-0.5 ml-5">SKU: {item.product_sku}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs text-slate-400">{item.quantity} × KSh {Number(item.unit_price ?? 0).toLocaleString()}</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">KSh {Math.round(Number(item.subtotal ?? item.quantity * Number(item.unit_price ?? 0))).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery notes */}
          {order.delivery_notes?.trim() && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <ClipboardList className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">Delivery Notes</h3>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.delivery_notes}</p>
            </div>
          )}

          {/* Order notes */}
          {order.notes?.trim() && !order.delivery_notes?.trim() && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-semibold text-slate-900">Order Notes</h3>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}

          {/* Timeline */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Order Timeline</h3>
              <div className="space-y-4">
                {history.map((ev, idx) => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${idx === 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                      {idx < history.length - 1 && <div className="w-px h-8 bg-slate-200" />}
                    </div>
                    <div className="flex-1 min-w-0 pb-1">
                      <p className="text-sm font-medium text-slate-700 capitalize">
                        {ev.event_type.replace(/_/g, ' ')}
                        {ev.from_status && ev.to_status && (
                          <span className="text-slate-400 font-normal"> · {statusLabel(ev.from_status)} → {statusLabel(ev.to_status)}</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(ev.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at{' '}
                        {new Date(ev.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        {ev.actor && <span className="capitalize"> · by {ev.actor}</span>}
                      </p>
                      {ev.metadata && typeof ev.metadata === 'object' && 'note' in ev.metadata && (
                        <p className="text-xs text-slate-500 mt-1">{String(ev.metadata.note)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Items ({items.length})</span>
                <span className="font-medium text-slate-900 tabular-nums">KSh {Math.round(subtotal).toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-medium text-red-600 tabular-nums">-KSh {Math.round(discount).toLocaleString()}</span>
                </div>
              )}
              {vat > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">VAT</span>
                  <span className="font-medium text-slate-900 tabular-nums">KSh {Math.round(vat).toLocaleString()}</span>
                </div>
              )}
              <div className="pt-3 mt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Total</span>
                  <span className="text-lg font-bold text-blue-600 tabular-nums">KSh {Math.round(total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Delivery Address</h3>
            </div>
            <div className="space-y-1.5 text-sm text-slate-600">
              <p className="font-medium text-slate-700">{order.customer_name}</p>
              {order.company_name && <p>{order.company_name}</p>}
              {order.delivery_address && <p>{order.delivery_address}</p>}
              {order.county && <p>{order.county}</p>}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Contact</h3>
            <div className="space-y-2">
              <ContactLine icon={User} value={order.customer_name} />
              {order.company_name && <ContactLine icon={Building2} value={order.company_name} />}
              <ContactLine icon={Mail} value={order.email} />
              <ContactLine icon={Phone} value={order.phone} />
            </div>
          </div>

          {/* Linked quote */}
          {order.quote_id && (
            <Link
              to={`/account/quotes/${order.quote_id}`}
              className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 hover:bg-blue-50/50 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">Linked Quote</h3>
              </div>
              <p className="text-xs text-slate-500">This order was converted from a quote. View original quote details.</p>
            </Link>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link to="/account" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Back to account
        </Link>
      </div>
    </div>
  );
}

function ShipmentCell({ icon: Icon, label, value }: { icon: typeof Truck; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-sm font-semibold text-slate-900 truncate">{value}</p>
    </div>
  );
}

function ContactLine({ icon: Icon, value }: { icon: typeof User; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, CheckCircle2, AlertCircle, Loader2, Plus, Trash2,
  User, Building2, Mail, Phone, ArrowRight, Package, Wrench,
  Truck, ShieldCheck, FileText, StickyNote, Percent, DollarSign, Info,
  Ban, Hourglass, Clock, RotateCcw, Send, Eye,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── types ────────────────────────────────────────────────────────────────────

interface QuoteItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  discount_amount: number;
  is_optional: boolean;
  item_type: 'product' | 'additional';
  notes: string | null;
  isNew?: boolean;
  toDelete?: boolean;
}

interface QuoteRow {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company: string | null;
  status: string;
  sales_person: string | null;
  expiry_date: string | null;
  notes: string | null;
  discount_pct: number;
  discount_amount: number;
  vat_pct: number;
  delivery_charge: number;
  installation_charge: number;
  warranty_charge: number;
  customer_notes: string | null;
  total_value: number | null;
  total_items: number;
  submitted_at: string;
  is_archived: boolean;
}

// ─── status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  draft:              { label: 'Draft',              dot: 'bg-slate-400',   bg: 'bg-slate-500/10',   text: 'text-slate-300' },
  submitted:          { label: 'Submitted',          dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-300' },
  under_review:       { label: 'Under Review',       dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    text: 'text-blue-300' },
  quoted:             { label: 'Quoted',             dot: 'bg-sky-400',     bg: 'bg-sky-500/10',     text: 'text-sky-300' },
  awaiting_customer:  { label: 'Awaiting Customer',  dot: 'bg-orange-400',  bg: 'bg-orange-500/10',  text: 'text-orange-300' },
  accepted:           { label: 'Accepted',           dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-300' },
  rejected:           { label: 'Rejected',           dot: 'bg-red-400',     bg: 'bg-red-500/10',     text: 'text-red-300' },
  expired:            { label: 'Expired',            dot: 'bg-zinc-400',    bg: 'bg-zinc-500/10',    text: 'text-zinc-300' },
  converted_to_order: { label: 'Converted to Order', dot: 'bg-teal-400',    bg: 'bg-teal-500/10',    text: 'text-teal-300' },
};

const STATUS_TRANSITIONS: Record<string, { label: string; to: string; icon: React.ElementType; variant: 'primary' | 'danger' | 'neutral' }[]> = {
  draft:             [{ label: 'Submit',         to: 'submitted',         icon: Send,        variant: 'primary' }],
  submitted:         [{ label: 'Start Review',   to: 'under_review',      icon: Eye,         variant: 'primary' }, { label: 'Reject', to: 'rejected', icon: Ban, variant: 'danger' }],
  under_review:      [{ label: 'Issue Quote',    to: 'quoted',            icon: FileText,    variant: 'primary' }, { label: 'Reject', to: 'rejected', icon: Ban, variant: 'danger' }],
  quoted:            [{ label: 'Awaiting',       to: 'awaiting_customer', icon: Hourglass,   variant: 'primary' }, { label: 'Accept', to: 'accepted', icon: CheckCircle2, variant: 'primary' }, { label: 'Reject', to: 'rejected', icon: Ban, variant: 'danger' }],
  awaiting_customer: [{ label: 'Accept',         to: 'accepted',          icon: CheckCircle2,variant: 'primary' }, { label: 'Expire', to: 'expired', icon: Clock, variant: 'neutral' }, { label: 'Reject', to: 'rejected', icon: Ban, variant: 'danger' }],
  accepted:          [{ label: 'Convert',        to: 'converted_to_order',icon: RotateCcw,   variant: 'primary' }],
  rejected:          [], expired: [], converted_to_order: [],
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtKES(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function computeLineNet(item: QuoteItem): number {
  const gross = (item.quantity ?? 0) * (item.unit_price ?? 0);
  const discPct = Math.max(0, Math.min(100, item.discount_pct ?? 0));
  const discAmt = Math.max(0, item.discount_amount ?? 0);
  return Math.max(0, gross - (discPct / 100 * gross) - discAmt);
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className ?? ''}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CONFIG[status];
  if (!c) return <span className="text-xs text-slate-500">{status}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function NumInput({ value, onChange, placeholder, min = 0, step = 1, className = '' }: {
  value: number; onChange: (v: number) => void;
  placeholder?: string; min?: number; step?: number; className?: string;
}) {
  return (
    <input
      type="number" min={min} step={step}
      value={value === 0 ? '' : value}
      onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      placeholder={placeholder ?? '0'}
      className={`w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 tabular-nums ${className}`}
    />
  );
}

// ─── pricing row component ─────────────────────────────────────────────────

function PricingRow({ label, value, sub, bold, negative, muted, indent = false }: {
  label: string; value: string; sub?: string;
  bold?: boolean; negative?: boolean; muted?: boolean; indent?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-1 ${indent ? 'pl-3' : ''}`}>
      <span className={`text-sm ${muted ? 'text-slate-600' : bold ? 'text-white' : 'text-slate-400'}`}>
        {label}{sub && <span className="text-slate-600 ml-1 text-xs">{sub}</span>}
      </span>
      <span className={`text-sm tabular-nums font-medium ${
        muted ? 'text-slate-600' : negative ? 'text-red-400' : bold ? 'text-white' : 'text-slate-300'
      }`}>
        {negative && value !== fmtKES(0) ? `−${value}` : value}
      </span>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export function AdminQuoteBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [quote, setQuote] = useState<QuoteRow | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [discountPct, setDiscountPct] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [vatPct, setVatPct] = useState(16);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [installationCharge, setInstallationCharge] = useState(0);
  const [warrantyCharge, setWarrantyCharge] = useState(0);
  const [customerNotes, setCustomerNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [savedOk, setSavedOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('quote_requests')
      .select('*, quote_items(*)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) { setError('Quote not found.'); setLoading(false); return; }
        const q = data as QuoteRow & { quote_items: QuoteItem[] };
        setQuote(q);
        setItems((q.quote_items ?? []).map(i => ({
          ...i,
          discount_pct: i.discount_pct ?? 0,
          discount_amount: i.discount_amount ?? 0,
          is_optional: i.is_optional ?? false,
          item_type: (i.item_type as 'product' | 'additional') ?? 'product',
          unit_price: i.unit_price ?? 0,
          quantity: i.quantity ?? 1,
        })));
        setDiscountPct(q.discount_pct ?? 0);
        setDiscountAmount(q.discount_amount ?? 0);
        setVatPct(q.vat_pct ?? 16);
        setDeliveryCharge(q.delivery_charge ?? 0);
        setInstallationCharge(q.installation_charge ?? 0);
        setWarrantyCharge(q.warranty_charge ?? 0);
        setCustomerNotes(q.customer_notes ?? '');
        setLoading(false);
      });
  }, [id]);

  // ── item helpers ─────────────────────────────────────────────────────────

  function addItem(type: 'product' | 'additional') {
    setItems(prev => [...prev, {
      id: `new-${Date.now()}`, product_name: '', product_sku: null,
      quantity: 1, unit_price: 0, discount_pct: 0, discount_amount: 0,
      is_optional: false, item_type: type, notes: null, isNew: true,
    }]);
  }

  function updateItem<K extends keyof QuoteItem>(idx: number, field: K, value: QuoteItem[K]) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  function removeItem(idx: number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, toDelete: true } : item));
  }

  // ── computed pricing ─────────────────────────────────────────────────────

  const pricing = useMemo(() => {
    const visible = items.filter(i => !i.toDelete);
    const required = visible.filter(i => !i.is_optional);
    const optional = visible.filter(i => i.is_optional);

    const reqNets = required.map(computeLineNet);
    const subtotal = reqNets.reduce((a, b) => a + b, 0);

    const lineDiscountTotal = required.reduce((acc, item) => {
      const gross = (item.quantity ?? 0) * (item.unit_price ?? 0);
      return acc + (gross - computeLineNet(item));
    }, 0);

    const quotePctDiscount = discountPct / 100 * subtotal;
    const totalQuoteDiscount = quotePctDiscount + discountAmount;
    const discountedSubtotal = Math.max(0, subtotal - totalQuoteDiscount);

    const totalCharges = deliveryCharge + installationCharge + warrantyCharge;
    const preVat = discountedSubtotal + totalCharges;
    const vatAmount = vatPct / 100 * preVat;
    const grandTotal = preVat + vatAmount;

    const optionalTotal = optional.map(computeLineNet).reduce((a, b) => a + b, 0);

    return {
      subtotal, lineDiscountTotal, quotePctDiscount, totalQuoteDiscount,
      discountedSubtotal, totalCharges, preVat, vatAmount, grandTotal, optionalTotal,
    };
  }, [items, discountPct, discountAmount, vatPct, deliveryCharge, installationCharge, warrantyCharge]);

  // ── save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!id || !quote) return;
    setSaving(true);
    setError(null);
    try {
      const nonDeleted = items.filter(i => !i.toDelete);

      const { error: upErr } = await supabase.from('quote_requests').update({
        discount_pct: discountPct,
        discount_amount: discountAmount,
        vat_pct: vatPct,
        delivery_charge: deliveryCharge,
        installation_charge: installationCharge,
        warranty_charge: warrantyCharge,
        customer_notes: customerNotes || null,
        total_value: pricing.grandTotal,
        total_items: nonDeleted.length,
      }).eq('id', id);
      if (upErr) throw upErr;

      const toDelete = items.filter(i => i.toDelete && !i.isNew).map(i => i.id);
      if (toDelete.length) {
        const { error: delErr } = await supabase.from('quote_items').delete().in('id', toDelete);
        if (delErr) throw delErr;
      }

      const toInsert = items.filter(i => i.isNew && !i.toDelete && i.product_name.trim());
      if (toInsert.length) {
        const { error: insErr } = await supabase.from('quote_items').insert(
          toInsert.map(i => ({
            quote_request_id: id,
            product_name: i.product_name,
            product_sku: i.product_sku || null,
            quantity: i.quantity,
            unit_price: i.unit_price,
            subtotal: computeLineNet(i),
            discount_pct: i.discount_pct,
            discount_amount: i.discount_amount,
            is_optional: i.is_optional,
            item_type: i.item_type,
            notes: i.notes || null,
          }))
        );
        if (insErr) throw insErr;
      }

      const toUpdate = items.filter(i => !i.isNew && !i.toDelete);
      for (const item of toUpdate) {
        await supabase.from('quote_items').update({
          product_name: item.product_name,
          product_sku: item.product_sku || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: computeLineNet(item),
          discount_pct: item.discount_pct,
          discount_amount: item.discount_amount,
          is_optional: item.is_optional,
          item_type: item.item_type,
          notes: item.notes || null,
        }).eq('id', item.id);
      }

      // Refresh items list (resolve new IDs)
      const { data: freshItems } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_request_id', id);
      if (freshItems) {
        setItems((freshItems as QuoteItem[]).map(i => ({
          ...i,
          discount_pct: i.discount_pct ?? 0,
          discount_amount: i.discount_amount ?? 0,
          is_optional: i.is_optional ?? false,
          item_type: (i.item_type as 'product' | 'additional') ?? 'product',
          unit_price: i.unit_price ?? 0,
          quantity: i.quantity ?? 1,
        })));
      }
      setQuote(prev => prev ? { ...prev, total_value: pricing.grandTotal, total_items: nonDeleted.length } : prev);
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTransition(toStatus: string) {
    if (!id || !quote) return;
    setTransitioning(true);
    const now = new Date().toISOString();
    const extras: Record<string, string> = {};
    if (toStatus === 'quoted') extras.quoted_at = now;
    if (toStatus === 'accepted') extras.accepted_at = now;
    if (toStatus === 'converted_to_order') extras.converted_at = now;
    const { error: err } = await supabase.from('quote_requests').update({ status: toStatus, ...extras }).eq('id', id);
    if (!err) setQuote(prev => prev ? { ...prev, status: toStatus } : prev);
    else setError(err.message);
    setTransitioning(false);
  }

  // ── render ────────────────────────────────────────────────────────────────

  const visibleItems = items.filter(i => !i.toDelete);
  const requiredItems = visibleItems.filter(i => !i.is_optional);
  const optionalItems = visibleItems.filter(i => i.is_optional);
  const transitions = STATUS_TRANSITIONS[quote?.status ?? ''] ?? [];

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-screen-xl mx-auto space-y-5">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-5">
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="p-8 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-8 h-8 text-red-400" />
        <p className="text-slate-300 text-sm">{error}</p>
        <button onClick={() => navigate('/admin/quotes')} className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back to quotes
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-slate-950">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur border-b border-slate-800">
        <div className="px-5 lg:px-8 py-3 flex items-center gap-3 flex-wrap max-w-screen-xl mx-auto">
          <button
            onClick={() => navigate('/admin/quotes')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quotes</span>
          </button>

          <div className="w-px h-5 bg-slate-700 hidden sm:block" />

          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-sm font-bold font-mono text-white">{quote?.quote_number}</span>
            {quote && <StatusBadge status={quote.status} />}
          </div>

          {quote?.customer_name && (
            <span className="text-slate-500 text-sm truncate hidden md:block">
              · {quote.customer_name}{quote.company ? ` (${quote.company})` : ''}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {/* Status transitions */}
            {transitions.map(t => (
              <button
                key={t.to}
                onClick={() => handleTransition(t.to)}
                disabled={transitioning || saving}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
                  t.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                  t.variant === 'danger'  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-700/40' :
                  'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                {transitioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <t.icon className="w-3 h-3" />}
                {t.label}
              </button>
            ))}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : savedOk ? 'Saved!' : 'Save Quote'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="mx-5 lg:mx-8 mt-4 flex items-center gap-2 bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-sm max-w-screen-xl mx-auto">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* ── Main Grid ── */}
      <div className="p-5 lg:p-8 max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">

          {/* ── Left Column: Builder ── */}
          <div className="xl:col-span-2 space-y-5">

            {/* Customer Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Customer</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {[
                  { icon: User,      value: quote?.customer_name },
                  { icon: Building2, value: quote?.company },
                  { icon: Mail,      value: quote?.customer_email },
                  { icon: Phone,     value: quote?.customer_phone },
                ].filter(r => r.value).map(({ icon: Icon, value }, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Icon className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    <span className="text-slate-300 truncate">{value}</span>
                  </div>
                ))}
              </div>
              {quote?.sales_person && (
                <p className="text-xs text-slate-500 mt-2">Sales: {quote.sales_person}</p>
              )}
            </div>

            {/* ── Line Items ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-white">Line Items</h2>
                <div className="flex items-center gap-2">
                  <button onClick={() => addItem('product')}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors border border-blue-500/30 hover:border-blue-400/50 px-2.5 py-1.5 rounded-lg">
                    <Plus className="w-3.5 h-3.5" /><Package className="w-3 h-3" /> Product
                  </button>
                  <button onClick={() => addItem('additional')}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-medium transition-colors border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg">
                    <Plus className="w-3.5 h-3.5" /><Wrench className="w-3 h-3" /> Item
                  </button>
                </div>
              </div>

              {/* Required items */}
              {requiredItems.length === 0 && optionalItems.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center px-6">
                  <Package className="w-9 h-9 text-slate-700 mb-3" />
                  <p className="text-slate-400 text-sm mb-1">No line items yet</p>
                  <p className="text-slate-600 text-xs mb-4">Add products or services to build the quotation</p>
                  <button onClick={() => addItem('product')}
                    className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium border border-blue-500/30 hover:border-blue-400/50 px-4 py-2 rounded-xl transition-all">
                    <Plus className="w-4 h-4" /> Add first item
                  </button>
                </div>
              ) : (
                <div>
                  {/* Table header (desktop) */}
                  <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_80px_110px_110px_80px_110px_110px_36px] gap-2 px-4 py-2 border-b border-slate-800/60 bg-slate-900/50">
                    {['Item', 'SKU', 'Qty', 'Unit Price', 'Disc%', 'Disc Amt', 'Net', ''].map(h => (
                      <div key={h} className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</div>
                    ))}
                  </div>

                  {/* Required items */}
                  {items.map((item, idx) => {
                    if (item.toDelete || item.is_optional) return null;
                    const gross = (item.quantity ?? 0) * (item.unit_price ?? 0);
                    const net = computeLineNet(item);
                    const hasDiscount = item.discount_pct > 0 || item.discount_amount > 0;
                    return (
                      <div key={item.id} className={`border-b border-slate-800/50 last:border-0 ${
                        item.item_type === 'additional' ? 'bg-slate-800/20' : ''
                      }`}>
                        {/* Desktop row */}
                        <div className="hidden lg:grid grid-cols-[minmax(0,1fr)_80px_110px_110px_80px_110px_110px_36px] gap-2 px-4 py-3 items-center">
                          {/* Name + type badge */}
                          <div>
                            <input
                              value={item.product_name}
                              onChange={e => updateItem(idx, 'product_name', e.target.value)}
                              placeholder={item.item_type === 'additional' ? 'Additional item…' : 'Product name…'}
                              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                item.item_type === 'additional'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {item.item_type === 'additional' ? 'Additional' : 'Product'}
                              </span>
                              {item.notes && <span className="text-[10px] text-slate-600 truncate">{item.notes}</span>}
                            </div>
                          </div>
                          <input
                            value={item.product_sku ?? ''}
                            onChange={e => updateItem(idx, 'product_sku', e.target.value || null)}
                            placeholder="SKU"
                            className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <NumInput value={item.quantity} min={1} onChange={v => updateItem(idx, 'quantity', v)} />
                          <NumInput value={item.unit_price} min={0} step={0.01} onChange={v => updateItem(idx, 'unit_price', v)} placeholder="0.00" />
                          <NumInput value={item.discount_pct} min={0} max={100} step={0.5} onChange={v => updateItem(idx, 'discount_pct', v)} placeholder="0" />
                          <NumInput value={item.discount_amount} min={0} step={0.01} onChange={v => updateItem(idx, 'discount_amount', v)} placeholder="0.00" />
                          <div className="text-sm font-semibold text-right">
                            {hasDiscount ? (
                              <div>
                                <span className="text-slate-500 line-through text-xs">{fmtKES(gross)}</span>
                                <span className="text-white block">{fmtKES(net)}</span>
                              </div>
                            ) : (
                              <span className="text-white">{fmtKES(net)}</span>
                            )}
                          </div>
                          <button onClick={() => removeItem(idx)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Mobile card */}
                        <div className="lg:hidden p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <input
                                value={item.product_name}
                                onChange={e => updateItem(idx, 'product_name', e.target.value)}
                                placeholder={item.item_type === 'additional' ? 'Additional item…' : 'Product name…'}
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <button onClick={() => removeItem(idx)} className="text-slate-600 hover:text-red-400 transition-colors mt-2">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <div><label className="block text-xs text-slate-500 mb-1">Qty</label>
                              <NumInput value={item.quantity} min={1} onChange={v => updateItem(idx, 'quantity', v)} />
                            </div>
                            <div><label className="block text-xs text-slate-500 mb-1">Unit Price</label>
                              <NumInput value={item.unit_price} min={0} step={0.01} onChange={v => updateItem(idx, 'unit_price', v)} />
                            </div>
                            <div><label className="block text-xs text-slate-500 mb-1">Disc%</label>
                              <NumInput value={item.discount_pct} min={0} max={100} onChange={v => updateItem(idx, 'discount_pct', v)} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-slate-500">Disc Amt:</label>
                              <div className="w-28"><NumInput value={item.discount_amount} min={0} step={0.01} onChange={v => updateItem(idx, 'discount_amount', v)} /></div>
                            </div>
                            <span className="text-sm font-bold text-white">{fmtKES(net)}</span>
                          </div>
                        </div>

                        {/* Notes input (shared) */}
                        <div className="px-4 pb-3 flex items-center gap-2">
                          <StickyNote className="w-3 h-3 text-slate-700 flex-shrink-0" />
                          <input
                            value={item.notes ?? ''}
                            onChange={e => updateItem(idx, 'notes', e.target.value || null)}
                            placeholder="Line note…"
                            className="flex-1 px-2.5 py-1 bg-transparent border-b border-slate-800 text-slate-400 placeholder-slate-700 text-xs focus:outline-none focus:border-slate-600 transition-colors"
                          />
                          <button
                            onClick={() => updateItem(idx, 'is_optional', true)}
                            className="text-[10px] text-slate-600 hover:text-amber-400 border border-slate-800 hover:border-amber-500/40 px-2 py-0.5 rounded transition-all"
                          >
                            Mark optional
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Optional items section */}
                  {optionalItems.length > 0 && (
                    <>
                      <div className="px-4 py-2.5 bg-amber-500/5 border-t border-amber-500/10 flex items-center gap-2">
                        <Info className="w-3.5 h-3.5 text-amber-500/70" />
                        <span className="text-xs font-medium text-amber-500/70 uppercase tracking-wide">Optional Items</span>
                        <span className="text-xs text-slate-600">— not included in totals</span>
                      </div>
                      {items.map((item, idx) => {
                        if (item.toDelete || !item.is_optional) return null;
                        const net = computeLineNet(item);
                        return (
                          <div key={item.id} className="border-b border-slate-800/50 last:border-0 bg-amber-500/5">
                            <div className="px-4 py-3 space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  value={item.product_name}
                                  onChange={e => updateItem(idx, 'product_name', e.target.value)}
                                  placeholder="Optional item…"
                                  className="flex-1 px-2.5 py-1.5 bg-slate-800/60 border border-slate-700/60 text-slate-300 placeholder-slate-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                                />
                                <span className="text-xs text-amber-400/70 border border-amber-500/20 px-2 py-1 rounded-lg flex-shrink-0">Optional</span>
                                <button onClick={() => removeItem(idx)} className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="grid grid-cols-4 gap-2">
                                <div><label className="block text-xs text-slate-600 mb-1">Qty</label>
                                  <NumInput value={item.quantity} min={1} onChange={v => updateItem(idx, 'quantity', v)} />
                                </div>
                                <div><label className="block text-xs text-slate-600 mb-1">Unit Price</label>
                                  <NumInput value={item.unit_price} min={0} step={0.01} onChange={v => updateItem(idx, 'unit_price', v)} />
                                </div>
                                <div><label className="block text-xs text-slate-600 mb-1">Disc%</label>
                                  <NumInput value={item.discount_pct} min={0} max={100} onChange={v => updateItem(idx, 'discount_pct', v)} />
                                </div>
                                <div className="flex items-end justify-end pb-0.5">
                                  <div className="text-right">
                                    <div className="text-xs text-slate-600 mb-1">Net</div>
                                    <span className="text-sm font-semibold text-slate-400">{fmtKES(net)}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => updateItem(idx, 'is_optional', false)}
                                  className="text-[10px] text-slate-600 hover:text-blue-400 border border-slate-800 hover:border-blue-500/40 px-2 py-0.5 rounded transition-all"
                                >
                                  Move to required
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}

                  {/* Add optional button */}
                  <div className="px-4 py-3 border-t border-slate-800/40 flex gap-3">
                    <button onClick={() => {
                      setItems(prev => [...prev, {
                        id: `new-${Date.now()}`, product_name: '', product_sku: null,
                        quantity: 1, unit_price: 0, discount_pct: 0, discount_amount: 0,
                        is_optional: true, item_type: 'additional', notes: null, isNew: true,
                      }]);
                    }}
                      className="flex items-center gap-1.5 text-xs text-amber-400/70 hover:text-amber-300 font-medium transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add optional item
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Charges ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Additional Charges</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                    <Truck className="w-3.5 h-3.5 text-slate-500" /> Delivery
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">KES</span>
                    <input type="number" min={0} step={0.01}
                      value={deliveryCharge === 0 ? '' : deliveryCharge}
                      onChange={e => setDeliveryCharge(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                    <Wrench className="w-3.5 h-3.5 text-slate-500" /> Installation
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">KES</span>
                    <input type="number" min={0} step={0.01}
                      value={installationCharge === 0 ? '' : installationCharge}
                      onChange={e => setInstallationCharge(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums" />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500" /> Warranty Extension
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">KES</span>
                    <input type="number" min={0} step={0.01}
                      value={warrantyCharge === 0 ? '' : warrantyCharge}
                      onChange={e => setWarrantyCharge(e.target.value === '' ? 0 : Number(e.target.value))}
                      placeholder="0.00"
                      className="w-full pl-10 pr-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tabular-nums" />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Customer Notes ── */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
                <StickyNote className="w-4 h-4 text-slate-400" /> Customer-Facing Notes
                <span className="text-xs text-slate-600 font-normal">(printed on quote document)</span>
              </label>
              <textarea
                value={customerNotes}
                onChange={e => setCustomerNotes(e.target.value)}
                rows={4}
                placeholder="Terms, delivery notes, special conditions, validity period, etc."
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* ── Right Column: Pricing Summary ── */}
          <div className="xl:col-span-1">
            <div className="sticky top-20 space-y-4">

              {/* Pricing Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-white">Pricing Summary</h2>
                </div>

                <div className="px-5 py-4 space-y-1">
                  <PricingRow label={`Items (${requiredItems.length})`} value={fmtKES(pricing.subtotal)} />

                  {pricing.lineDiscountTotal > 0 && (
                    <PricingRow label="Line discounts" value={fmtKES(pricing.lineDiscountTotal)} negative indent />
                  )}

                  {/* Quote-level discount controls */}
                  <div className="py-3 space-y-2">
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">Quote Discount</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                          <Percent className="w-3 h-3" /> Percentage
                        </label>
                        <NumInput value={discountPct} min={0} max={100} step={0.5}
                          onChange={setDiscountPct} placeholder="0%" />
                      </div>
                      <div>
                        <label className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                          <DollarSign className="w-3 h-3" /> Fixed Amt
                        </label>
                        <NumInput value={discountAmount} min={0} step={0.01}
                          onChange={setDiscountAmount} placeholder="0.00" />
                      </div>
                    </div>
                  </div>

                  {pricing.totalQuoteDiscount > 0 && (
                    <PricingRow
                      label={`Discount${discountPct > 0 ? ` (${discountPct}%)` : ''}`}
                      value={fmtKES(pricing.totalQuoteDiscount)}
                      negative indent
                    />
                  )}

                  {(pricing.lineDiscountTotal > 0 || pricing.totalQuoteDiscount > 0) && (
                    <>
                      <div className="border-t border-slate-800 my-1" />
                      <PricingRow label="Net amount" value={fmtKES(pricing.discountedSubtotal)} />
                    </>
                  )}

                  {deliveryCharge > 0 && (
                    <PricingRow label="Delivery" value={fmtKES(deliveryCharge)} indent />
                  )}
                  {installationCharge > 0 && (
                    <PricingRow label="Installation" value={fmtKES(installationCharge)} indent />
                  )}
                  {warrantyCharge > 0 && (
                    <PricingRow label="Warranty extension" value={fmtKES(warrantyCharge)} indent />
                  )}

                  <div className="border-t border-slate-800 my-1" />

                  {/* VAT control */}
                  <div className="py-2 flex items-center gap-3">
                    <label className="text-xs text-slate-500 flex-shrink-0 flex items-center gap-1">
                      <Percent className="w-3 h-3" /> VAT
                    </label>
                    <NumInput value={vatPct} min={0} max={100} step={0.5}
                      onChange={setVatPct} className="w-20 text-xs" />
                    <span className="text-xs text-slate-500 flex-shrink-0">%</span>
                    <span className="ml-auto text-sm text-slate-300 tabular-nums font-medium">{fmtKES(pricing.vatAmount)}</span>
                  </div>

                  <div className="border-t border-slate-700 mt-1" />

                  {/* Grand total */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-base font-bold text-white">Grand Total</span>
                    <span className="text-xl font-bold text-white tabular-nums">{fmtKES(pricing.grandTotal)}</span>
                  </div>

                  {/* Optional items (below the fold) */}
                  {pricing.optionalTotal > 0 && (
                    <div className="border-t border-slate-800 pt-3 mt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-400/70">Optional items</span>
                        <span className="text-xs text-amber-400/70 tabular-nums">{fmtKES(pricing.optionalTotal)}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">Not included in grand total</p>
                    </div>
                  )}
                </div>

                {/* Save button */}
                <div className="px-5 pb-5">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold py-3 rounded-xl transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Saving…' : savedOk ? 'Saved!' : 'Save Quote'}
                  </button>
                </div>
              </div>

              {/* Status Transitions (mobile / repeat) */}
              {transitions.length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Move Status</div>
                  <div className="space-y-2">
                    {transitions.map(t => (
                      <button
                        key={t.to}
                        onClick={() => handleTransition(t.to)}
                        disabled={transitioning || saving}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 ${
                          t.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                          t.variant === 'danger'  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-700/40' :
                          'bg-slate-700 hover:bg-slate-600 text-slate-300'
                        }`}
                      >
                        {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <t.icon className="w-4 h-4" />}
                        {t.label}
                        <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SKU input note */}
              <p className="text-xs text-slate-700 text-center px-2">
                Grand total auto-saves to the quote record.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

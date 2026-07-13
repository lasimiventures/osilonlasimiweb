import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Search, RefreshCcw, Plus, X, ChevronDown, AlertCircle,
  Loader2, Save, User, Building2, Mail, Phone, MapPin,
  Calendar, UserCheck, DollarSign, StickyNote, Package,
  ArrowRight, CheckCircle2, Clock, Ban, Hourglass, RotateCcw,
  Send, Eye, Trash2, Copy, Archive, ArchiveRestore, MoreHorizontal,
  Hammer, Download,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateQuotePdf } from '../../lib/quotePdf';
import type { PdfQuoteData } from '../../lib/quotePdf';
import { SendQuoteModal } from '../../components/admin/SendQuoteModal';

// ─── types ────────────────────────────────────────────────────────────────────

interface QuoteItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number | null;
  subtotal: number | null;
  notes: string | null;
  discount_pct: number;
  discount_amount: number;
  is_optional: boolean;
  item_type: string;
  isNew?: boolean;
  toDelete?: boolean;
}

interface QuoteRow {
  id: string;
  quote_number: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company: string | null;
  position: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  message: string | null;
  status: string;
  total_items: number;
  notes: string | null;
  sales_person: string | null;
  expiry_date: string | null;
  total_value: number | null;
  quoted_at: string | null;
  accepted_at: string | null;
  converted_at: string | null;
  submitted_at: string;
  created_at: string;
  is_archived: boolean;
  discount_pct: number;
  discount_amount: number;
  vat_pct: number;
  delivery_charge: number;
  installation_charge: number;
  warranty_charge: number;
  customer_notes: string | null;
  quote_items: QuoteItem[];
}

// ─── status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, {
  label: string; dot: string; bg: string; text: string;
  icon: React.ElementType; group: 'draft' | 'active' | 'closed';
}> = {
  draft:              { label: 'Draft',              dot: 'bg-slate-400',   bg: 'bg-slate-500/10',   text: 'text-slate-300',   icon: FileText,    group: 'draft' },
  submitted:          { label: 'Submitted',          dot: 'bg-amber-400',   bg: 'bg-amber-500/10',   text: 'text-amber-300',   icon: Send,        group: 'active' },
  under_review:       { label: 'Under Review',       dot: 'bg-blue-400',    bg: 'bg-blue-500/10',    text: 'text-blue-300',    icon: Eye,         group: 'active' },
  quoted:             { label: 'Quoted',             dot: 'bg-sky-400',     bg: 'bg-sky-500/10',     text: 'text-sky-300',     icon: FileText,    group: 'active' },
  awaiting_customer:  { label: 'Awaiting Customer',  dot: 'bg-orange-400',  bg: 'bg-orange-500/10',  text: 'text-orange-300',  icon: Hourglass,   group: 'active' },
  accepted:           { label: 'Accepted',           dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', text: 'text-emerald-300', icon: CheckCircle2,group: 'closed' },
  rejected:           { label: 'Rejected',           dot: 'bg-red-400',     bg: 'bg-red-500/10',     text: 'text-red-300',     icon: Ban,         group: 'closed' },
  expired:            { label: 'Expired',            dot: 'bg-zinc-400',    bg: 'bg-zinc-500/10',    text: 'text-zinc-300',    icon: Clock,       group: 'closed' },
  converted_to_order: { label: 'Converted to Order', dot: 'bg-teal-400',    bg: 'bg-teal-500/10',    text: 'text-teal-300',    icon: RotateCcw,   group: 'closed' },
};

const STATUS_TRANSITIONS: Record<string, { label: string; to: string; variant: 'primary' | 'danger' | 'neutral' }[]> = {
  draft:             [{ label: 'Submit Quote',     to: 'submitted',         variant: 'primary' }],
  submitted:         [{ label: 'Start Review',     to: 'under_review',      variant: 'primary' }, { label: 'Reject', to: 'rejected', variant: 'danger' }],
  under_review:      [{ label: 'Issue Quote',      to: 'quoted',            variant: 'primary' }, { label: 'Reject', to: 'rejected', variant: 'danger' }],
  quoted:            [{ label: 'Mark Awaiting',    to: 'awaiting_customer', variant: 'primary' }, { label: 'Accept', to: 'accepted', variant: 'primary' }, { label: 'Reject', to: 'rejected', variant: 'danger' }],
  awaiting_customer: [{ label: 'Accept',           to: 'accepted',          variant: 'primary' }, { label: 'Reject', to: 'rejected', variant: 'danger' }, { label: 'Expire', to: 'expired', variant: 'neutral' }],
  accepted:          [{ label: 'Convert to Order', to: 'converted_to_order', variant: 'primary' }],
  rejected:          [],
  expired:           [],
  converted_to_order:[],
};

const GROUP_FILTERS = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'draft',    label: 'Drafts' },
  { key: 'closed',   label: 'Closed' },
  { key: 'archived', label: 'Archived' },
] as const;

type GroupKey = typeof GROUP_FILTERS[number]['key'];

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtCurrency(n: number | null | undefined): string {
  if (n == null) return '—';
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-800 rounded animate-pulse ${className ?? ''}`} />;
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return <span className="text-xs text-slate-500">{status}</span>;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel, loading }: {
  title: string; message: string; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl z-10 p-6">
        <h2 className="text-sm font-semibold text-white mb-2">{title}</h2>
        <p className="text-sm text-slate-400 mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {loading ? 'Deleting…' : confirmLabel}
          </button>
          <button onClick={onCancel} className="px-4 text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── slide-over panel ────────────────────────────────────────────────────────

interface SlideOverProps {
  quote: QuoteRow;
  onClose: () => void;
  onSaved: (updated: QuoteRow) => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onBuild: () => void;
  onSend: () => void;
  onDownloadPdf: () => void;
  duplicating: boolean;
  archiving: boolean;
  downloadingPdf: boolean;
}

function QuoteSlideOver({ quote, onClose, onSaved, onDuplicate, onArchive, onDelete, onBuild, onSend, onDownloadPdf, duplicating, archiving, downloadingPdf }: SlideOverProps) {
  const [salesPerson, setSalesPerson] = useState(quote.sales_person ?? '');
  const [expiryDate, setExpiryDate] = useState(quote.expiry_date ?? '');
  const [totalValue, setTotalValue] = useState(quote.total_value?.toString() ?? '');
  const [notes, setNotes] = useState(quote.notes ?? '');
  const [items, setItems] = useState<QuoteItem[]>(quote.quote_items ?? []);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'items'>('overview');

  function updateItem(idx: number, field: keyof QuoteItem, value: string | number) {
    setItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? Number(value) : item.quantity;
        const price = field === 'unit_price' ? Number(value) : (item.unit_price ?? 0);
        updated.subtotal = qty * price;
      }
      return updated;
    }));
  }

  function addItem() {
    setItems(prev => [...prev, {
      id: `new-${Date.now()}`, product_name: '', product_sku: '', quantity: 1,
      unit_price: null, subtotal: null, notes: null, isNew: true,
    }]);
  }

  function removeItem(idx: number) {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, toDelete: true } : item));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from('quote_requests')
        .update({
          sales_person: salesPerson || null,
          expiry_date: expiryDate || null,
          total_value: totalValue ? Number(totalValue) : null,
          notes: notes || null,
        })
        .eq('id', quote.id);
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
            quote_request_id: quote.id,
            product_name: i.product_name,
            product_sku: i.product_sku || null,
            quantity: i.quantity,
            unit_price: i.unit_price,
            subtotal: i.subtotal,
            notes: i.notes || null,
          }))
        );
        if (insErr) throw insErr;
      }

      for (const item of items.filter(i => !i.isNew && !i.toDelete)) {
        await supabase.from('quote_items').update({
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          quantity: item.quantity,
          notes: item.notes,
        }).eq('id', item.id);
      }

      onSaved({
        ...quote,
        sales_person: salesPerson || null,
        expiry_date: expiryDate || null,
        total_value: totalValue ? Number(totalValue) : null,
        notes: notes || null,
        quote_items: items.filter(i => !i.toDelete),
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTransition(toStatus: string) {
    setTransitioning(true);
    setError(null);
    const now = new Date().toISOString();
    const extras: Record<string, string | null> = {};
    if (toStatus === 'quoted') extras.quoted_at = now;
    if (toStatus === 'accepted') extras.accepted_at = now;
    if (toStatus === 'converted_to_order') extras.converted_at = now;

    const { error: tErr } = await supabase
      .from('quote_requests')
      .update({ status: toStatus, ...extras })
      .eq('id', quote.id);

    if (tErr) { setError(tErr.message); }
    else { onSaved({ ...quote, status: toStatus, ...extras }); }
    setTransitioning(false);
  }

  const visibleItems = items.filter(i => !i.toDelete);
  const transitions = STATUS_TRANSITIONS[quote.status] ?? [];
  const computedTotal = visibleItems.reduce((s, i) => s + (i.subtotal ?? 0), 0);

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/60" onClick={onClose} />
      <div className="w-full sm:w-[560px] bg-slate-950 border-l border-slate-800 flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 flex-shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-base font-bold text-white font-mono">{quote.quote_number}</span>
              <StatusBadge status={quote.status} />
              {quote.is_archived && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-400">
                  <Archive className="w-3 h-3" /> Archived
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{quote.customer_name}{quote.company ? ` · ${quote.company}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors flex-shrink-0 ml-4">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 flex-shrink-0 px-6">
          {(['overview', 'items'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-1 py-3 mr-6 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab ? 'border-blue-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab === 'items' ? `Line Items (${visibleItems.length})` : 'Overview'}
            </button>
          ))}
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-xs flex-shrink-0">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {activeTab === 'overview' && (
            <>
              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Customer</h3>
                <div className="space-y-2">
                  {[
                    { icon: User,      value: quote.customer_name },
                    { icon: Building2, value: quote.company },
                    { icon: Mail,      value: quote.customer_email },
                    { icon: Phone,     value: quote.customer_phone },
                    { icon: MapPin,    value: [quote.address, quote.city, quote.country].filter(Boolean).join(', ') },
                  ].filter(r => r.value).map(({ icon: Icon, value }, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm">
                      <Icon className="w-3.5 h-3.5 text-slate-600 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{value}</span>
                    </div>
                  ))}
                  {quote.position && <p className="text-xs text-slate-500 ml-6">{quote.position}</p>}
                  {quote.message && (
                    <div className="mt-2 bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 italic">
                      "{quote.message}"
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quote Details</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Sales Person
                      </label>
                      <input
                        value={salesPerson}
                        onChange={e => setSalesPerson(e.target.value)}
                        placeholder="Assign sales rep..."
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Expiry Date
                      </label>
                      <input
                        type="date"
                        value={expiryDate}
                        onChange={e => setExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3" /> Total Value (KES)
                    </label>
                    <input
                      type="number"
                      value={totalValue}
                      onChange={e => setTotalValue(e.target.value)}
                      placeholder={computedTotal > 0 ? `Computed: ${computedTotal.toLocaleString()}` : 'Enter quote total...'}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                      <StickyNote className="w-3 h-3" /> Internal Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Notes visible to admin only..."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 text-white placeholder-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Timeline</h3>
                <div className="space-y-1.5 text-xs">
                  {[
                    { label: 'Submitted', value: fmtDate(quote.submitted_at) },
                    { label: 'Quoted',    value: fmtDate(quote.quoted_at) },
                    { label: 'Accepted',  value: fmtDate(quote.accepted_at) },
                    { label: 'Converted', value: fmtDate(quote.converted_at) },
                    { label: 'Expires',   value: fmtDate(quote.expiry_date) },
                  ].filter(r => r.value !== '—').map(({ label, value }) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-slate-500">{label}</span>
                      <span className="text-slate-300">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Value</span>
                    <span className="text-slate-200 font-medium">{fmtCurrency(quote.total_value ?? (computedTotal > 0 ? computedTotal : null))}</span>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeTab === 'items' && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Line Items</h3>
                <button onClick={addItem} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Add Line
                </button>
              </div>

              {visibleItems.length === 0 ? (
                <div className="text-center py-10">
                  <Package className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No items</p>
                  <button onClick={addItem} className="mt-2 text-xs text-blue-400 hover:text-blue-300">Add a line item</button>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item, idx) => {
                    if (item.toDelete) return null;
                    return (
                      <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1">
                            <input
                              value={item.product_name}
                              onChange={e => updateItem(idx, 'product_name', e.target.value)}
                              placeholder="Product name..."
                              className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <button onClick={() => removeItem(idx)} className="text-slate-600 hover:text-red-400 transition-colors mt-1 flex-shrink-0">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">SKU</label>
                            <input
                              value={item.product_sku ?? ''}
                              onChange={e => updateItem(idx, 'product_sku', e.target.value)}
                              placeholder="SKU"
                              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Qty</label>
                            <input
                              type="number" min={1} value={item.quantity}
                              onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 text-white rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-600 mb-1">Unit Price</label>
                            <input
                              type="number" min={0} value={item.unit_price ?? ''}
                              onChange={e => updateItem(idx, 'unit_price', e.target.value === '' ? 0 : Number(e.target.value))}
                              placeholder="0.00"
                              className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        {item.subtotal != null && item.subtotal > 0 && (
                          <div className="text-right text-xs text-slate-400">
                            Subtotal: <span className="text-white font-medium">{fmtCurrency(item.subtotal)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {computedTotal > 0 && (
                    <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                      <span className="text-sm text-slate-400">Computed Total</span>
                      <span className="text-base font-bold text-white">{fmtCurrency(computedTotal)}</span>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-4 flex-shrink-0 space-y-3">
          {/* Status transitions */}
          {transitions.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 mr-1">Move to:</span>
              {transitions.map(t => (
                <button
                  key={t.to}
                  onClick={() => handleTransition(t.to)}
                  disabled={transitioning}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 ${
                    t.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                    t.variant === 'danger'  ? 'bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-700/40' :
                    'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {transitioning ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {/* Save + Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors disabled:opacity-40"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={onClose} className="px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors">
              Close
            </button>
          </div>

          {/* Secondary actions */}
          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
            <button
              onClick={onSend}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 transition-all"
            >
              <Send className="w-3.5 h-3.5" /> Send Quote
            </button>
            <button
              onClick={onBuild}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-blue-400 hover:text-blue-300 border border-blue-500/30 hover:border-blue-400/50 transition-all"
            >
              <Hammer className="w-3.5 h-3.5" /> Build Quote
            </button>
            <button
              onClick={onDownloadPdf}
              disabled={downloadingPdf}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 transition-all disabled:opacity-40"
            >
              {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {downloadingPdf ? 'Generating…' : 'Download PDF'}
            </button>
            <button
              onClick={onDuplicate}
              disabled={duplicating}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 transition-all disabled:opacity-40"
            >
              {duplicating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Copy className="w-3.5 h-3.5" />}
              Duplicate
            </button>
            <button
              onClick={onArchive}
              disabled={archiving}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white border border-slate-800 hover:border-slate-600 transition-all disabled:opacity-40"
            >
              {archiving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : quote.is_archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
              {quote.is_archived ? 'Unarchive' : 'Archive'}
            </button>
            <button
              onClick={onDelete}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-700/60 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── new quote modal ──────────────────────────────────────────────────────────

interface NewQuoteModalProps {
  onClose: () => void;
  onCreate: (q: QuoteRow) => void;
}

function NewQuoteModal({ onClose, onCreate }: NewQuoteModalProps) {
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    company: '', sales_person: '', expiry_date: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('quote_requests')
      .insert({
        customer_name: form.customer_name,
        customer_email: form.customer_email,
        customer_phone: form.customer_phone,
        company: form.company || null,
        sales_person: form.sales_person || null,
        expiry_date: form.expiry_date || null,
        notes: form.notes || null,
        status: 'draft',
        total_items: 0,
        is_archived: false,
      })
      .select('*, quote_items(*)')
      .maybeSingle();

    if (err) { setError(err.message); setSaving(false); return; }
    if (data) onCreate(data as QuoteRow);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h2 className="text-sm font-semibold text-white">New Draft Quote</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Customer Name *</label>
              <input required value={form.customer_name} onChange={e => set('customer_name', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Full name" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Email *</label>
              <input required type="email" value={form.customer_email} onChange={e => set('customer_email', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@company.com" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Phone *</label>
              <input required type="tel" value={form.customer_phone} onChange={e => set('customer_phone', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+254..." />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Company</label>
              <input value={form.company} onChange={e => set('company', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Company name" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sales Person</label>
              <input value={form.sales_person} onChange={e => set('sales_person', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Sales rep name" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Expiry Date</label>
              <input type="date" value={form.expiry_date} onChange={e => set('expiry_date', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-slate-400 mb-1">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => set('notes', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Internal notes..." />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Creating…' : 'Create Draft Quote'}
            </button>
            <button type="button" onClick={onClose} className="px-4 text-sm text-slate-400 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function AdminQuotes() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState<GroupKey>('all');
  const [slideOver, setSlideOver] = useState<QuoteRow | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<QuoteRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState<string | null>(null);
  const [sendingQuote, setSendingQuote] = useState<QuoteRow | null>(null);
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [actionsMenuId, setActionsMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  async function fetchQuotes() {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('quote_requests')
      .select('*, quote_items(*)')
      .order('created_at', { ascending: false });
    if (err) { setError('Failed to load quotes.'); }
    else { setQuotes((data ?? []) as QuoteRow[]); }
    setLoading(false);
  }

  useEffect(() => { fetchQuotes(); }, []);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setStatusMenuId(null);
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) setActionsMenuId(null);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function quickStatusChange(id: string, newStatus: string) {
    setUpdatingStatus(id);
    setStatusMenuId(null);
    const now = new Date().toISOString();
    const extras: Record<string, string> = {};
    if (newStatus === 'quoted') extras.quoted_at = now;
    if (newStatus === 'accepted') extras.accepted_at = now;
    if (newStatus === 'converted_to_order') extras.converted_at = now;

    const { error: err } = await supabase
      .from('quote_requests').update({ status: newStatus, ...extras }).eq('id', id);
    if (!err) {
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, status: newStatus, ...extras } : q));
      setSlideOver(prev => prev?.id === id ? { ...prev, status: newStatus, ...extras } : prev);
    }
    setUpdatingStatus(null);
  }

  async function handleDuplicate(quote: QuoteRow) {
    setDuplicatingId(quote.id);
    const { data: newRow, error: err } = await supabase
      .from('quote_requests')
      .insert({
        customer_name: quote.customer_name,
        customer_email: quote.customer_email,
        customer_phone: quote.customer_phone,
        company: quote.company,
        position: quote.position,
        address: quote.address,
        city: quote.city,
        country: quote.country,
        message: quote.message,
        status: 'draft',
        total_items: quote.total_items,
        sales_person: quote.sales_person,
        notes: quote.notes ? `[Copy] ${quote.notes}` : null,
        expiry_date: quote.expiry_date,
        total_value: quote.total_value,
        is_archived: false,
      })
      .select('*')
      .maybeSingle();

    if (err || !newRow) { setDuplicatingId(null); return; }

    const sourceItems = quote.quote_items ?? [];
    if (sourceItems.length > 0) {
      await supabase.from('quote_items').insert(
        sourceItems.map(item => ({
          quote_request_id: newRow.id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal,
          notes: item.notes,
        }))
      );
    }

    const { data: fullQuote } = await supabase
      .from('quote_requests')
      .select('*, quote_items(*)')
      .eq('id', newRow.id)
      .maybeSingle();

    if (fullQuote) {
      const q = fullQuote as QuoteRow;
      setQuotes(prev => [q, ...prev]);
      setSlideOver(q);
    }
    setDuplicatingId(null);
  }

  async function handleArchive(id: string, archive: boolean) {
    setArchivingId(id);
    const { error: err } = await supabase
      .from('quote_requests')
      .update({ is_archived: archive })
      .eq('id', id);
    if (!err) {
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, is_archived: archive } : q));
      setSlideOver(prev => prev?.id === id ? { ...prev, is_archived: archive } : prev);
    }
    setArchivingId(null);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await supabase.from('quote_items').delete().eq('quote_request_id', id);
    const { error: err } = await supabase.from('quote_requests').delete().eq('id', id);
    if (!err) {
      setQuotes(prev => prev.filter(q => q.id !== id));
      if (slideOver?.id === id) setSlideOver(null);
    }
    setDeletingId(null);
    setConfirmDelete(null);
  }

  async function handleDownloadPdf(quote: QuoteRow) {
    setDownloadingPdfId(quote.id);
    try {
      const pdfData: PdfQuoteData = {
        quote_number:       quote.quote_number,
        customer_name:      quote.customer_name,
        customer_email:     quote.customer_email,
        customer_phone:     quote.customer_phone,
        company:            quote.company,
        position:           quote.position,
        address:            quote.address,
        city:               quote.city,
        country:            quote.country,
        status:             quote.status,
        sales_person:       quote.sales_person,
        expiry_date:        quote.expiry_date,
        submitted_at:       quote.submitted_at || quote.created_at,
        notes:              quote.notes,
        discount_pct:       quote.discount_pct ?? 0,
        discount_amount:    quote.discount_amount ?? 0,
        vat_pct:            quote.vat_pct ?? 16,
        delivery_charge:    quote.delivery_charge ?? 0,
        installation_charge: quote.installation_charge ?? 0,
        warranty_charge:    quote.warranty_charge ?? 0,
        customer_notes:     quote.customer_notes,
        quote_items: (quote.quote_items ?? []).map(i => ({
          product_name:    i.product_name,
          product_sku:     i.product_sku,
          quantity:        i.quantity,
          unit_price:      i.unit_price ?? 0,
          discount_pct:    i.discount_pct ?? 0,
          discount_amount: i.discount_amount ?? 0,
          is_optional:     i.is_optional ?? false,
          item_type:       i.item_type ?? 'product',
          notes:           i.notes,
        })),
      };
      await generateQuotePdf(pdfData);
    } finally {
      setDownloadingPdfId(null);
    }
  }

  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Filtering
  const grouped = quotes.filter(q => {
    if (group === 'archived') return q.is_archived;
    if (q.is_archived) return false;
    if (group === 'all') return true;
    return STATUS_CONFIG[q.status]?.group === group;
  });
  const filtered = grouped.filter(q => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (q.quote_number ?? '').toLowerCase().includes(s) ||
      q.customer_name.toLowerCase().includes(s) ||
      (q.company ?? '').toLowerCase().includes(s) ||
      q.customer_email.toLowerCase().includes(s) ||
      (q.sales_person ?? '').toLowerCase().includes(s)
    );
  });

  const counts = {
    all:      quotes.filter(q => !q.is_archived).length,
    active:   quotes.filter(q => !q.is_archived && STATUS_CONFIG[q.status]?.group === 'active').length,
    draft:    quotes.filter(q => !q.is_archived && STATUS_CONFIG[q.status]?.group === 'draft').length,
    closed:   quotes.filter(q => !q.is_archived && STATUS_CONFIG[q.status]?.group === 'closed').length,
    archived: quotes.filter(q => q.is_archived).length,
  };

  const statusOptions = Object.entries(STATUS_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label }));

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Quote Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Professional B2B quotation workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchQuotes} disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-all disabled:opacity-40">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" /> New Quote
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Group tabs + search */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex bg-slate-900 border border-slate-700 rounded-xl p-1 gap-0.5">
          {GROUP_FILTERS.map(g => (
            <button key={g.key} onClick={() => setGroup(g.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                group === g.key ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}>
              {g.label}
              {counts[g.key] > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  group === g.key ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-400'
                }`}>{counts[g.key]}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search quote #, customer, company, rep..."
            className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Quote #</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Customer</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Sales Person</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Items</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Created</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Expiry</th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-5 py-4"><div className="space-y-1.5"><Skeleton className="h-3.5 w-28" /><Skeleton className="h-3 w-20" /></div></td>
                    <td className="px-5 py-4 hidden md:table-cell"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-6 w-28 rounded-lg" /></td>
                    <td className="px-5 py-4 hidden sm:table-cell"><Skeleton className="h-3.5 w-6" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skeleton className="h-3.5 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-7 w-24 rounded-lg" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <FileText className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      {search || group !== 'all' ? 'No quotes match your filters' : 'No quotes yet'}
                    </p>
                    {!search && group === 'all' && (
                      <button onClick={() => setShowNewModal(true)}
                        className="mt-3 text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1.5 mx-auto">
                        <Plus className="w-3.5 h-3.5" /> Create your first quote
                      </button>
                    )}
                  </td>
                </tr>
              ) : filtered.map(quote => (
                <tr key={quote.id} className={`border-b border-slate-800/50 transition-colors ${
                  quote.is_archived ? 'opacity-60 hover:opacity-80' : 'hover:bg-slate-800/20'
                }`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-semibold text-white">{quote.quote_number}</span>
                      {quote.is_archived && <Archive className="w-3 h-3 text-slate-600" />}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-white">{quote.customer_name}</p>
                    {quote.company && <p className="text-xs text-slate-500">{quote.company}</p>}
                    <p className="text-xs text-slate-600">{quote.customer_email}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    {quote.sales_person
                      ? <span className="text-sm text-slate-300">{quote.sales_person}</span>
                      : <span className="text-slate-600 text-xs">—</span>
                    }
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={quote.status} />
                  </td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <span className="text-sm text-slate-400 tabular-nums">{quote.quote_items?.length ?? quote.total_items}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-xs text-slate-400">{fmtDate(quote.submitted_at || quote.created_at)}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className={`text-xs ${
                      quote.expiry_date && new Date(quote.expiry_date) < new Date() ? 'text-red-400' : 'text-slate-400'
                    }`}>{fmtDate(quote.expiry_date)}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {/* View */}
                      <button
                        onClick={() => setSlideOver(quote)}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 border border-slate-700 hover:border-slate-500 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      {/* Build */}
                      <button
                        onClick={() => navigate(`/admin/quotes/${quote.id}/build`)}
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 border border-blue-500/30 hover:border-blue-400/50 px-2.5 py-1.5 rounded-lg transition-all"
                      >
                        <Hammer className="w-3.5 h-3.5" /> Build
                      </button>

                      {/* Quick status dropdown */}
                      <div className="relative" ref={statusMenuId === quote.id ? menuRef : undefined}>
                        <button
                          onClick={() => { setStatusMenuId(statusMenuId === quote.id ? null : quote.id); setActionsMenuId(null); }}
                          disabled={updatingStatus === quote.id}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2 py-1.5 rounded-lg transition-all disabled:opacity-40"
                        >
                          {updatingStatus === quote.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {statusMenuId === quote.id && (
                          <div className="absolute right-0 top-full mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                            {statusOptions.map(opt => (
                              <button key={opt.value} onClick={() => quickStatusChange(quote.id, opt.value)}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                  quote.status === opt.value ? 'text-blue-300 bg-blue-500/10' : 'text-slate-300 hover:bg-slate-700'
                                }`}>
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* More actions */}
                      <div className="relative" ref={actionsMenuId === quote.id ? actionsMenuRef : undefined}>
                        <button
                          onClick={() => { setActionsMenuId(actionsMenuId === quote.id ? null : quote.id); setStatusMenuId(null); }}
                          className="flex items-center text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-2 py-1.5 rounded-lg transition-all"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                        {actionsMenuId === quote.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                            <button
                              onClick={() => { setActionsMenuId(null); handleDuplicate(quote); }}
                              disabled={duplicatingId === quote.id}
                              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-40"
                            >
                              {duplicatingId === quote.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Copy className="w-3.5 h-3.5" />}
                              Duplicate
                            </button>
                            <button
                              onClick={() => { setActionsMenuId(null); handleArchive(quote.id, !quote.is_archived); }}
                              disabled={archivingId === quote.id}
                              className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2 disabled:opacity-40"
                            >
                              {archivingId === quote.id
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : quote.is_archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
                              {quote.is_archived ? 'Unarchive' : 'Archive'}
                            </button>
                            <div className="border-t border-slate-700/60 my-1" />
                            <button
                              onClick={() => { setActionsMenuId(null); setConfirmDelete(quote); }}
                              className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800 text-xs text-slate-500">
            Showing {filtered.length} of {quotes.length} quote{quotes.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Status legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-5">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <Icon className={`w-3.5 h-3.5 ${cfg.text}`} />
              <span className="text-xs text-slate-500">{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Slide-over detail panel */}
      {slideOver && (
        <QuoteSlideOver
          quote={slideOver}
          onClose={() => setSlideOver(null)}
          onSaved={updated => {
            setQuotes(prev => prev.map(q => q.id === updated.id ? { ...q, ...updated } : q));
            setSlideOver(updated);
          }}
          onDuplicate={() => handleDuplicate(slideOver)}
          onArchive={() => handleArchive(slideOver.id, !slideOver.is_archived)}
          onDelete={() => setConfirmDelete(slideOver)}
          onBuild={() => navigate(`/admin/quotes/${slideOver.id}/build`)}
          onSend={() => setSendingQuote(slideOver)}
          onDownloadPdf={() => handleDownloadPdf(slideOver)}
          duplicating={duplicatingId === slideOver.id}
          archiving={archivingId === slideOver.id}
          downloadingPdf={downloadingPdfId === slideOver.id}
        />
      )}

      {/* New quote modal */}
      {showNewModal && (
        <NewQuoteModal
          onClose={() => setShowNewModal(false)}
          onCreate={q => {
            setQuotes(prev => [q, ...prev]);
            setShowNewModal(false);
            setSlideOver(q);
          }}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.quote_number}?`}
          message={`This will permanently delete the quote for ${confirmDelete.customer_name}${confirmDelete.company ? ` (${confirmDelete.company})` : ''}. This cannot be undone.`}
          confirmLabel="Delete Quote"
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
          loading={deletingId === confirmDelete.id}
        />
      )}

      {/* Send quote modal */}
      {sendingQuote && (
        <SendQuoteModal
          quote={{
            quote_number:        sendingQuote.quote_number,
            customer_name:       sendingQuote.customer_name,
            customer_email:      sendingQuote.customer_email,
            customer_phone:      sendingQuote.customer_phone,
            company:             sendingQuote.company,
            position:            sendingQuote.position,
            address:             sendingQuote.address,
            city:                sendingQuote.city,
            country:             sendingQuote.country,
            status:              sendingQuote.status,
            sales_person:        sendingQuote.sales_person,
            expiry_date:         sendingQuote.expiry_date,
            submitted_at:        sendingQuote.submitted_at || sendingQuote.created_at,
            notes:               sendingQuote.notes,
            discount_pct:        sendingQuote.discount_pct ?? 0,
            discount_amount:     sendingQuote.discount_amount ?? 0,
            vat_pct:             sendingQuote.vat_pct ?? 16,
            delivery_charge:     sendingQuote.delivery_charge ?? 0,
            installation_charge: sendingQuote.installation_charge ?? 0,
            warranty_charge:     sendingQuote.warranty_charge ?? 0,
            customer_notes:      sendingQuote.customer_notes,
            quote_items: (sendingQuote.quote_items ?? []).map(i => ({
              product_name:    i.product_name,
              product_sku:     i.product_sku,
              quantity:        i.quantity,
              unit_price:      i.unit_price ?? 0,
              discount_pct:    i.discount_pct ?? 0,
              discount_amount: i.discount_amount ?? 0,
              is_optional:     i.is_optional ?? false,
              item_type:       i.item_type ?? 'product',
              notes:           i.notes,
            })),
          }}
          onClose={() => setSendingQuote(null)}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import {
  ArrowLeft, Download, CheckCircle2, RotateCcw, MessageSquare, Loader2,
  AlertCircle, FileText, Package, ShoppingCart, Clock, X, Send,
  Calendar, User, Building2, Mail, Phone, ShieldCheck,
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { supabase } from '../lib/supabase';
import { generateQuotePdf, type PdfQuoteData } from '../lib/quotePdf';
import type { PdfQuoteItem } from '../lib/quotePdf';

interface QuoteItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  discount_amount: number;
  is_optional: boolean;
  item_type: string;
  notes: string | null;
}

interface QuoteDetail {
  id: string;
  reference: string;
  quote_number: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company: string | null;
  position: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: string;
  sales_person: string | null;
  expiry_date: string | null;
  submitted_at: string;
  notes: string | null;
  discount_pct: number;
  discount_amount: number;
  vat_pct: number;
  delivery_charge: number;
  installation_charge: number;
  warranty_charge: number;
  customer_notes: string | null;
  currency: string | null;
  payment_terms: string | null;
  delivery_terms: string | null;
  installation_required: boolean;
  warranty: string | null;
  subtotal: number | null;
  grand_total: number | null;
  linked_order_number: string | null;
  converted_order_id: string | null;
  total_items: number;
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

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: 'text-amber-700', bg: 'bg-amber-50' },
  under_review: { label: 'Under Review', color: 'text-blue-700', bg: 'bg-blue-50' },
  quoted: { label: 'Quoted', color: 'text-blue-700', bg: 'bg-blue-50' },
  awaiting_customer: { label: 'Awaiting Your Response', color: 'text-orange-700', bg: 'bg-orange-50' },
  accepted: { label: 'Accepted', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50' },
  expired: { label: 'Expired', color: 'text-slate-500', bg: 'bg-slate-100' },
  converted_to_order: { label: 'Converted to Order', color: 'text-teal-700', bg: 'bg-teal-50' },
  revision_requested: { label: 'Revision Requested', color: 'text-purple-700', bg: 'bg-purple-50' },
};

function lineNet(i: QuoteItem): number {
  const gross = (i.quantity ?? 0) * (i.unit_price ?? 0);
  const d = Math.max(0, Math.min(100, i.discount_pct ?? 0));
  return Math.max(0, gross - (d / 100 * gross) - (i.discount_amount ?? 0));
}

export function QuoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, loading: authLoading } = useCustomerAuth();
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'approve' | 'revision' | 'convert' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [revisionNote, setRevisionNote] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const [{ data: q, error: qErr }, { data: its, error: iErr }, { data: hist }] = await Promise.all([
      supabase.from('quote_requests').select('*').eq('id', id).maybeSingle(),
      supabase.from('quote_items').select('*').eq('quote_request_id', id).order('created_at'),
      supabase.from('quote_history').select('*').eq('quote_request_id', id).order('created_at', { ascending: false }),
    ]);
    if (qErr || iErr) { setError('Failed to load quote.'); setLoading(false); return; }
    if (!q) { setError('Quote not found.'); setLoading(false); return; }
    setQuote(q as QuoteDetail);
    setItems((its ?? []) as QuoteItem[]);
    setHistory((hist ?? []) as HistoryEvent[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  if (!session) return <Navigate to={`/login?next=/account/quotes/${id}`} replace />;
  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-1/3" /><div className="h-48 bg-slate-100 rounded-2xl" /><div className="h-64 bg-slate-100 rounded-2xl" /></div></div>;
  if (error || !quote) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-600 mb-4">{error ?? 'Quote not found'}</p>
      <Link to="/account" className="text-blue-600 font-medium text-sm">Back to account</Link>
    </div>
  );

  // Verify ownership
  if (session.user.email && quote.customer_email !== session.user.email) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 mb-4">You don't have access to this quote.</p>
        <Link to="/account" className="text-blue-600 font-medium text-sm">Back to account</Link>
      </div>
    );
  }

  const statusMeta = STATUS_META[quote.status] ?? { label: quote.status, color: 'text-slate-600', bg: 'bg-slate-100' };
  const requiredItems = items.filter(i => !i.is_optional);
  const optionalItems = items.filter(i => i.is_optional);
  const subtotal = requiredItems.reduce((a, i) => a + lineNet(i), 0);
  const totalDiscount = (quote.discount_pct / 100) * subtotal + (quote.discount_amount ?? 0);
  const discSubtotal = Math.max(0, subtotal - totalDiscount);
  const charges = (quote.delivery_charge ?? 0) + (quote.installation_charge ?? 0) + (quote.warranty_charge ?? 0);
  const vat = (quote.vat_pct / 100) * (discSubtotal + charges);
  const grandTotal = discSubtotal + charges + vat;

  const canApprove = ['quoted', 'awaiting_customer'].includes(quote.status);
  const canRequestRevision = ['quoted', 'awaiting_customer', 'under_review'].includes(quote.status);
  const canConvert = quote.status === 'accepted' && !quote.converted_order_id;
  const isConverted = quote.status === 'converted_to_order' || !!quote.converted_order_id;

  async function handleDownloadPdf() {
    if (!quote) return;
    setPdfLoading(true);
    try {
      const pdfData: PdfQuoteData = {
        quote_number: quote.quote_number ?? quote.reference,
        customer_name: quote.customer_name,
        customer_email: quote.customer_email,
        customer_phone: quote.customer_phone,
        company: quote.company,
        position: quote.position,
        address: quote.address,
        city: quote.city,
        country: quote.country,
        status: quote.status,
        sales_person: quote.sales_person,
        expiry_date: quote.expiry_date,
        submitted_at: quote.submitted_at,
        notes: quote.notes,
        discount_pct: quote.discount_pct,
        discount_amount: quote.discount_amount,
        vat_pct: quote.vat_pct,
        delivery_charge: quote.delivery_charge,
        installation_charge: quote.installation_charge,
        warranty_charge: quote.warranty_charge,
        customer_notes: quote.customer_notes,
        currency: quote.currency ?? 'KES',
        payment_terms: quote.payment_terms,
        delivery_terms: quote.delivery_terms,
        installation_required: quote.installation_required,
        warranty: quote.warranty,
        subtotal: quote.subtotal ?? undefined,
        grand_total: quote.grand_total ?? undefined,
        quote_items: items.map(i => ({
          product_name: i.product_name,
          product_sku: i.product_sku,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount_pct: i.discount_pct,
          discount_amount: i.discount_amount,
          is_optional: i.is_optional,
          item_type: i.item_type,
          notes: i.notes,
        } as PdfQuoteItem)),
      };
      await generateQuotePdf(pdfData);
    } catch {
      setActionError('Failed to generate PDF. Please try again.');
    }
    setPdfLoading(false);
  }

  async function handleApprove() {
    if (!quote) return;
    setAction('approve');
    setActionError(null);
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('quote_requests')
      .update({ status: 'accepted', quote_status: 'accepted', accepted_at: now })
      .eq('id', quote.id);
    if (error) { setActionError('Failed to approve quote: ' + error.message); setAction(null); return; }
    await supabase.from('quote_history').insert({
      quote_request_id: quote.id, event_type: 'status_change',
      from_status: quote.status, to_status: 'accepted', actor: 'customer',
    });
    setQuote({ ...quote, status: 'accepted', accepted_at: now });
    setSuccessMsg('Quote approved! You can now convert it to an order.');
    setAction(null);
    setTimeout(() => setSuccessMsg(null), 4000);
    loadData();
  }

  async function handleRequestRevision() {
    if (!quote || !revisionNote.trim()) return;
    setSubmitting(true);
    setActionError(null);
    const { error } = await supabase
      .from('quote_requests')
      .update({ status: 'revision_requested', quote_status: 'revision_requested', customer_notes: revisionNote.trim() })
      .eq('id', quote.id);
    if (error) { setActionError('Failed to submit revision request: ' + error.message); setSubmitting(false); return; }
    await supabase.from('quote_history').insert({
      quote_request_id: quote.id, event_type: 'revision_requested',
      from_status: quote.status, to_status: 'revision_requested', actor: 'customer',
      metadata: { note: revisionNote.trim() },
    });
    setQuote({ ...quote, status: 'revision_requested', customer_notes: revisionNote.trim() });
    setRevisionNote('');
    setSuccessMsg('Revision request sent. Our team will review and update your quote.');
    setAction(null);
    setSubmitting(false);
    setTimeout(() => setSuccessMsg(null), 4000);
    loadData();
  }

  async function handleConvertToOrder() {
    if (!quote) return;
    setAction('convert');
    setActionError(null);
    const existing = await supabase.from('orders').select('id').eq('quote_id', quote.id).maybeSingle();
    if (existing.data) {
      setActionError('This quote has already been converted to an order.');
      setAction(null);
      return;
    }
    const { data: order, error: oErr } = await supabase.from('orders').insert({
      customer_name: quote.customer_name,
      company_name: quote.company,
      email: quote.customer_email,
      phone: quote.customer_phone,
      notes: quote.notes,
      order_status: 'processing',
      quote_id: quote.id,
      total_value: grandTotal,
      source: 'quote_conversion',
    }).select('id, order_number').maybeSingle();
    if (oErr || !order) { setActionError('Order creation failed: ' + (oErr?.message ?? '')); setAction(null); return; }

    const nonOptional = items.filter(i => !i.is_optional);
    if (nonOptional.length > 0) {
      await supabase.from('order_items').insert(
        nonOptional.map(i => ({
          order_id: order.id,
          product_name: i.product_name,
          product_sku: i.product_sku,
          quantity: i.quantity,
          unit_price: i.unit_price,
          subtotal: lineNet(i),
        }))
      );
    }

    const now = new Date().toISOString();
    await supabase.from('quote_requests').update({
      status: 'converted_to_order', quote_status: 'converted_to_order', converted_at: now,
      linked_order_number: order.order_number, converted_order_id: order.id,
    }).eq('id', quote.id);
    await supabase.from('quote_history').insert({
      quote_request_id: quote.id, event_type: 'converted',
      from_status: quote.status, to_status: 'converted_to_order', actor: 'customer',
      metadata: { order_id: order.id, order_number: order.order_number },
    });
    setQuote({ ...quote, status: 'converted_to_order', linked_order_number: order.order_number, converted_order_id: order.id });
    setSuccessMsg(`Order ${order.order_number} created successfully!`);
    setAction(null);
    setTimeout(() => setSuccessMsg(null), 5000);
    loadData();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link to="/account" className="hover:text-slate-700">Account</Link>
        <span>/</span>
        <Link to="/account" onClick={() => navigate('/account')} className="hover:text-slate-700">My Quotes</Link>
        <span>/</span>
        <span className="text-slate-900 font-medium truncate">{quote.quote_number ?? quote.reference}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">{quote.quote_number ?? quote.reference}</h1>
                <p className="text-xs text-slate-500">Quote</p>
              </div>
            </div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusMeta.bg} ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
          <InfoCell icon={Calendar} label="Submitted" value={new Date(quote.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} />
          <InfoCell icon={Clock} label="Expires" value={quote.expiry_date ? new Date(quote.expiry_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—'} />
          <InfoCell icon={Package} label="Items" value={`${quote.total_items} item${quote.total_items !== 1 ? 's' : ''}`} />
          <InfoCell icon={FileText} label="Total" value={quote.grand_total != null ? `KSh ${Number(quote.grand_total).toLocaleString()}` : `KSh ${Math.round(grandTotal).toLocaleString()}`} />
        </div>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm">{successMsg}</p>
        </div>
      )}
      {actionError && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{actionError}</p>
        </div>
      )}

      {/* Actions bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-5 flex flex-wrap gap-3">
        <button
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-xl transition-colors disabled:opacity-50"
        >
          {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download PDF
        </button>

        {canApprove && (
          <button
            onClick={handleApprove}
            disabled={action === 'approve'}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {action === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve Quote
          </button>
        )}

        {canRequestRevision && (
          <button
            onClick={() => setAction('revision')}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Request Revision
          </button>
        )}

        {canConvert && (
          <button
            onClick={handleConvertToOrder}
            disabled={action === 'convert'}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
          >
            {action === 'convert' ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            Convert to Order
          </button>
        )}

        {isConverted && quote.linked_order_number && (
          <Link
            to="/account"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            Order #{quote.linked_order_number}
          </Link>
        )}
      </div>

      {/* Revision form */}
      {action === 'revision' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-900">Request a Revision</h3>
            <button onClick={() => { setAction(null); setRevisionNote(''); }} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">Describe what you'd like changed — pricing, quantities, items, terms, etc. Our sales team will revise and re-issue the quote.</p>
          <textarea
            value={revisionNote}
            onChange={e => setRevisionNote(e.target.value)}
            rows={4}
            placeholder="e.g. Please reduce the unit price on item 2 by 10% and add delivery to Mombasa…"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="flex justify-end gap-3 mt-3">
            <button onClick={() => { setAction(null); setRevisionNote(''); }} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
            <button
              onClick={handleRequestRevision}
              disabled={!revisionNote.trim() || submitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" /> Submit Request
            </button>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Items table */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Line Items</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {requiredItems.length === 0 && optionalItems.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No items in this quote.</p>
                </div>
              ) : (
                <>
                  {requiredItems.map((item, idx) => (
                    <ItemRow key={item.id} item={item} idx={idx + 1} />
                  ))}
                  {optionalItems.length > 0 && (
                    <>
                      <div className="px-5 py-2.5 bg-amber-50 border-y border-amber-100">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Optional Items</p>
                      </div>
                      {optionalItems.map((item, idx) => (
                        <ItemRow key={item.id} item={item} idx={requiredItems.length + idx + 1} optional />
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Customer notes */}
          {quote.customer_notes?.trim() && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Notes</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{quote.customer_notes}</p>
            </div>
          )}
        </div>

        {/* Summary sidebar */}
        <div className="space-y-5">
          {/* Totals */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Quote Summary</h3>
            <div className="space-y-2 text-sm">
              <SummaryRow label="Items subtotal" value={subtotal} />
              {totalDiscount > 0 && <SummaryRow label={`Discount${quote.discount_pct > 0 ? ` (${quote.discount_pct}%)` : ''}`} value={-totalDiscount} />}
              {quote.delivery_charge > 0 && <SummaryRow label="Delivery" value={quote.delivery_charge} />}
              {quote.installation_charge > 0 && <SummaryRow label="Installation" value={quote.installation_charge} />}
              {quote.warranty_charge > 0 && <SummaryRow label="Warranty" value={quote.warranty_charge} />}
              <SummaryRow label={`VAT (${quote.vat_pct}%)`} value={vat} />
              <div className="pt-3 mt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900">Grand Total</span>
                  <span className="text-lg font-bold text-blue-600">KSh {Math.round(grandTotal).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Customer</h3>
            <div className="space-y-2">
              <InfoLine icon={User} value={quote.customer_name} />
              {quote.company && <InfoLine icon={Building2} value={quote.company} />}
              <InfoLine icon={Mail} value={quote.customer_email} />
              <InfoLine icon={Phone} value={quote.customer_phone} />
              {quote.sales_person && <InfoLine icon={User} value={`Sales: ${quote.sales_person}`} />}
            </div>
          </div>

          {/* Terms */}
          {(quote.payment_terms || quote.delivery_terms || quote.warranty) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Terms</h3>
              <div className="space-y-3 text-xs text-slate-600">
                {quote.payment_terms && <div><p className="font-semibold text-slate-700 mb-0.5">Payment</p><p>{quote.payment_terms}</p></div>}
                {quote.delivery_terms && <div><p className="font-semibold text-slate-700 mb-0.5">Delivery</p><p>{quote.delivery_terms}</p></div>}
                {quote.warranty && <div><p className="font-semibold text-slate-700 mb-0.5">Warranty</p><p>{quote.warranty}</p></div>}
              </div>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Timeline</h3>
              <div className="space-y-3">
                {history.slice(0, 6).map(ev => (
                  <div key={ev.id} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 capitalize">{ev.event_type.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-slate-400">{new Date(ev.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ItemRow({ item, idx, optional }: { item: QuoteItem; idx: number; optional?: boolean }) {
  const net = lineNet(item);
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">#{idx}</span>
            <p className={`text-sm font-semibold ${optional ? 'text-amber-700' : 'text-slate-900'}`}>{item.product_name}</p>
          </div>
          {item.product_sku && <p className="text-xs text-slate-400 mt-0.5 ml-5">SKU: {item.product_sku}</p>}
          {item.notes && <p className="text-xs text-slate-500 mt-1 ml-5">{item.notes}</p>}
          {optional && <p className="text-xs text-amber-600 mt-1 ml-5">Optional — not included in total</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-slate-400">{item.quantity} × KSh {Number(item.unit_price).toLocaleString()}</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">KSh {Math.round(net).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function InfoCell({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <p className="text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function InfoLine({ icon: Icon, value }: { icon: typeof User; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600">
      <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: number }) {
  const isNeg = value < 0;
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium tabular-nums ${isNeg ? 'text-red-600' : 'text-slate-900'}`}>
        {isNeg ? '-' : ''}KSh {Math.abs(Math.round(value)).toLocaleString()}
      </span>
    </div>
  );
}

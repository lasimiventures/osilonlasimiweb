import { useState } from 'react';
import {
  X, Mail, MessageSquare, Download, Send, Loader2,
  AlertCircle, CheckCircle2, Phone, User, Building2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { generateQuotePdf } from '../../lib/quotePdf';
import type { PdfQuoteData } from '../../lib/quotePdf';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtKES(n: number): string {
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function lineNet(item: PdfQuoteData['quote_items'][0]): number {
  const gross = (item.quantity ?? 0) * (item.unit_price ?? 0);
  const d = Math.max(0, Math.min(100, item.discount_pct ?? 0));
  return Math.max(0, gross - (d / 100 * gross) - (item.discount_amount ?? 0));
}

function buildPricingSummary(quote: PdfQuoteData): {
  subtotal: number; vatAmt: number; grandTotal: number;
} {
  const required = quote.quote_items.filter(i => !i.is_optional);
  const subtotal = required.map(lineNet).reduce((a, b) => a + b, 0);
  const quotePctDisc = (quote.discount_pct / 100) * subtotal;
  const totalQDisc = quotePctDisc + (quote.discount_amount ?? 0);
  const discSubtotal = Math.max(0, subtotal - totalQDisc);
  const charges = (quote.delivery_charge ?? 0) + (quote.installation_charge ?? 0) + (quote.warranty_charge ?? 0);
  const preVat = discSubtotal + charges;
  const vatAmt = (quote.vat_pct / 100) * preVat;
  return { subtotal, vatAmt, grandTotal: preVat + vatAmt };
}

function buildWhatsAppText(quote: PdfQuoteData, message: string): string {
  const { subtotal, vatAmt, grandTotal } = buildPricingSummary(quote);
  const required = quote.quote_items.filter(i => !i.is_optional);

  const fmtDate = (iso: string | null | undefined) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const itemLines = required
    .map(i => `  • ${i.product_name}${i.product_sku ? ` (${i.product_sku})` : ''} × ${i.quantity} — ${fmtKES(lineNet(i))}`)
    .join('\n');

  const lines: string[] = [
    `*QUOTATION — OSIL Group Ltd*`,
    ``,
    `Dear ${quote.customer_name},`,
    ``,
    message,
    ``,
    `*Quote No:* ${quote.quote_number}`,
    `*Date:* ${fmtDate(quote.submitted_at)}`,
    quote.expiry_date ? `*Valid Until:* ${fmtDate(quote.expiry_date)}` : '',
    quote.sales_person ? `*Sales Rep:* ${quote.sales_person}` : '',
    ``,
    `*Items:*`,
    itemLines,
    ``,
    `*Subtotal:* ${fmtKES(subtotal)}`,
    quote.vat_pct > 0 ? `*VAT (${quote.vat_pct}%):* ${fmtKES(vatAmt)}` : '',
    `*GRAND TOTAL: ${fmtKES(grandTotal)}*`,
    ``,
    `For full specifications, terms, and conditions, please request the formal PDF quotation.`,
    ``,
    `Thank you for your business!`,
    ``,
    `—`,
    `OSIL Group Ltd`,
    `+254 700 000 000`,
    `info@osilltd.co.ke`,
    `www.osilltd.co.ke`,
  ];

  return lines.filter(l => l !== null && l !== undefined).join('\n').trim();
}

// ─── component ────────────────────────────────────────────────────────────────

interface Props {
  quote: PdfQuoteData;
  onClose: () => void;
}

type Channel = 'email' | 'whatsapp' | 'pdf';

export function SendQuoteModal({ quote, onClose }: Props) {
  const { grandTotal } = buildPricingSummary(quote);

  const [activeChannel, setActiveChannel] = useState<Channel>('email');
  const [recipientEmail, setRecipientEmail] = useState(quote.customer_email);
  const [recipientPhone, setRecipientPhone] = useState(
    quote.customer_phone.replace(/[^+\d]/g, '') // strip spaces/dashes for wa.me
  );
  const [coverMessage, setCoverMessage] = useState(
    `Please find attached your quotation for the items requested. This quote is valid for 30 days from the date of issue.\n\nPlease do not hesitate to contact us if you require any clarifications or amendments.`
  );
  const [sending, setSending] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSendEmail() {
    setSending(true);
    setError(null);
    setSuccess(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-quote`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            Apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ quote, recipientEmail, coverMessage }),
        }
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? 'Failed to send email.');
      setSuccess(`Email sent successfully to ${recipientEmail}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send email.');
    } finally {
      setSending(false);
    }
  }

  function handleSendWhatsApp() {
    const text = buildWhatsAppText(quote, coverMessage);
    const phone = recipientPhone.replace(/^\+/, ''); // wa.me needs no leading +
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setSuccess('WhatsApp opened in a new tab.');
  }

  async function handleDownloadPdf() {
    setGeneratingPdf(true);
    setError(null);
    try {
      await generateQuotePdf(quote);
      setSuccess('PDF downloaded successfully.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'PDF generation failed.');
    } finally {
      setGeneratingPdf(false);
    }
  }

  const channels: { key: Channel; label: string; icon: React.ElementType; color: string }[] = [
    { key: 'email',     label: 'Email',     icon: Mail,           color: 'blue' },
    { key: 'whatsapp',  label: 'WhatsApp',  icon: MessageSquare,  color: 'green' },
    { key: 'pdf',       label: 'Download PDF', icon: Download,    color: 'slate' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl z-10 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-800 flex-shrink-0">
          <div>
            <h2 className="text-sm font-bold text-white">Send Quotation</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">{quote.quote_number}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customer summary pill */}
        <div className="mx-6 mt-4 flex items-center gap-3 bg-slate-800/50 border border-slate-700/60 rounded-xl px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{quote.customer_name}</p>
            <div className="flex items-center gap-3 flex-wrap mt-0.5">
              {quote.company && <span className="text-xs text-slate-400 flex items-center gap-1"><Building2 className="w-3 h-3" />{quote.company}</span>}
              <span className="text-xs text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" />{quote.customer_email}</span>
              <span className="text-xs text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3" />{quote.customer_phone}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-sm font-bold text-white">{fmtKES(grandTotal)}</p>
          </div>
        </div>

        {/* Channel tabs */}
        <div className="px-6 mt-4 flex gap-2 flex-shrink-0">
          {channels.map(ch => {
            const Icon = ch.icon;
            const active = activeChannel === ch.key;
            return (
              <button
                key={ch.key}
                onClick={() => { setActiveChannel(ch.key); setSuccess(null); setError(null); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  active
                    ? ch.color === 'blue'  ? 'bg-blue-600/20 border-blue-500/60 text-blue-300'
                    : ch.color === 'green' ? 'bg-green-600/20 border-green-500/60 text-green-300'
                    : 'bg-slate-700 border-slate-600 text-white'
                    : 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {ch.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Feedback */}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-950/50 border border-emerald-800/40 rounded-xl px-4 py-3 text-emerald-300 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" /> {success}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-xs">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
            </div>
          )}

          {/* Email channel */}
          {activeChannel === 'email' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Recipient Email</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={e => setRecipientEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Cover Message</label>
                <textarea
                  value={coverMessage}
                  onChange={e => setCoverMessage(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none leading-relaxed"
                />
              </div>
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl px-4 py-3 text-xs text-slate-400 space-y-1">
                <p className="font-medium text-slate-300">The email will include:</p>
                <ul className="space-y-0.5 mt-1 ml-3">
                  <li>· Full itemised line-item table with pricing</li>
                  <li>· Discount, VAT and grand total breakdown</li>
                  <li>· Key terms (payment, warranty, returns, validity)</li>
                  <li>· OSIL company contact details</li>
                </ul>
              </div>
            </div>
          )}

          {/* WhatsApp channel */}
          {activeChannel === 'whatsapp' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Recipient Phone</label>
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={e => setRecipientPhone(e.target.value)}
                  placeholder="+254712345678"
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-slate-500 mt-1.5">Include country code, e.g. +254712345678</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Cover Message</label>
                <textarea
                  value={coverMessage}
                  onChange={e => setCoverMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none leading-relaxed"
                />
              </div>
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl px-4 py-3">
                <p className="text-xs font-medium text-slate-300 mb-2">Message preview:</p>
                <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
                  {buildWhatsAppText(quote, coverMessage)}
                </pre>
              </div>
              <p className="text-xs text-slate-500">
                Clicking "Send via WhatsApp" opens WhatsApp Web / app with the message pre-filled. You will need to press Send manually.
              </p>
            </div>
          )}

          {/* PDF channel */}
          {activeChannel === 'pdf' && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl px-4 py-4 space-y-3">
                <p className="text-xs font-medium text-slate-300">The PDF will include:</p>
                <ul className="text-xs text-slate-400 space-y-1 ml-3">
                  <li>· OSIL logo and company details</li>
                  <li>· Full customer billing information</li>
                  <li>· Itemised products with SKU, quantity, pricing, discounts</li>
                  <li>· Optional items section (excluded from totals)</li>
                  <li>· Complete discount, VAT, and charge breakdown</li>
                  <li>· Full terms & conditions (5 sections)</li>
                  <li>· Authorised signature block with QR code verification</li>
                </ul>
              </div>
              <p className="text-xs text-slate-500">
                The PDF will be saved as <span className="font-mono text-slate-400">Quote-{quote.quote_number}.pdf</span>
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-800 px-6 py-4 flex-shrink-0 flex gap-2">
          {activeChannel === 'email' && (
            <button
              onClick={handleSendEmail}
              disabled={sending || !recipientEmail.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {sending ? 'Sending…' : 'Send Email'}
            </button>
          )}
          {activeChannel === 'whatsapp' && (
            <button
              onClick={handleSendWhatsApp}
              disabled={!recipientPhone.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Send via WhatsApp
            </button>
          )}
          {activeChannel === 'pdf' && (
            <button
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
              className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              {generatingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {generatingPdf ? 'Generating…' : 'Download PDF'}
            </button>
          )}
          <button onClick={onClose} className="px-4 text-sm text-slate-400 hover:text-white transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { Navigate, Link } from 'react-router-dom';
import {
  Loader2, AlertCircle, CheckCircle2, MessageSquare, Shield, RotateCcw,
  BookOpen, Plus, X, Send, Clock, Package, ChevronRight, Search,
  LifeBuoy, Wrench, Truck, FileText, User, Mail, Phone, Calendar,
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { supabase } from '../lib/supabase';
import { faqs } from '../data/faqs';

type SupportTab = 'tickets' | 'warranty' | 'returns' | 'knowledge';

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  order_number: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketReply {
  id: string;
  author: string;
  author_name: string;
  message: string;
  created_at: string;
}

interface WarrantyClaim {
  id: string;
  claim_number: string;
  product_name: string;
  product_sku: string | null;
  serial_number: string | null;
  order_number: string | null;
  purchase_date: string | null;
  issue_description: string;
  warranty_type: string;
  status: string;
  resolution_notes: string | null;
  created_at: string;
}

interface ProductReturn {
  id: string;
  rma_number: string;
  product_name: string;
  product_sku: string | null;
  quantity: number;
  order_number: string | null;
  return_reason: string;
  reason_details: string;
  condition: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const TICKET_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: 'text-blue-700', bg: 'bg-blue-50' },
  awaiting_response: { label: 'Awaiting Response', color: 'text-orange-700', bg: 'bg-orange-50' },
  resolved: { label: 'Resolved', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  closed: { label: 'Closed', color: 'text-slate-500', bg: 'bg-slate-100' },
};

const CLAIM_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: 'text-amber-700', bg: 'bg-amber-50' },
  under_review: { label: 'Under Review', color: 'text-blue-700', bg: 'bg-blue-50' },
  approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50' },
  processing: { label: 'Processing', color: 'text-blue-700', bg: 'bg-blue-50' },
  completed: { label: 'Completed', color: 'text-emerald-700', bg: 'bg-emerald-50' },
};

const RETURN_STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  submitted: { label: 'Submitted', color: 'text-amber-700', bg: 'bg-amber-50' },
  under_review: { label: 'Under Review', color: 'text-blue-700', bg: 'bg-blue-50' },
  approved: { label: 'Approved', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50' },
  return_shipped: { label: 'Return Shipped', color: 'text-blue-700', bg: 'bg-blue-50' },
  received: { label: 'Received', color: 'text-teal-700', bg: 'bg-teal-50' },
  refunded: { label: 'Refunded', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  exchanged: { label: 'Exchanged', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  closed: { label: 'Closed', color: 'text-slate-500', bg: 'bg-slate-100' },
};

function statusLabel(meta: Record<string, { label: string }>, s: string): string {
  return meta[s]?.label ?? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function Support() {
  const { session, profile, loading: authLoading } = useCustomerAuth();
  const [tab, setTab] = useState<SupportTab>('tickets');

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  if (!session) return <Navigate to="/login?next=/account/support" replace />;

  const tabs: { id: SupportTab; label: string; icon: typeof MessageSquare }[] = [
    { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },
    { id: 'warranty', label: 'Warranty Claims', icon: Shield },
    { id: 'returns', label: 'Product Returns', icon: RotateCcw },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shadow-md">
          <LifeBuoy className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Support</h1>
          <p className="text-sm text-slate-500">Get help with orders, warranties, returns, and more</p>
        </div>
      </div>

      <Link to="/account" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-5">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back to account
      </Link>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'tickets' && <TicketsTab email={profile?.email ?? ''} name={profile?.full_name ?? ''} userId={session.user.id} />}
      {tab === 'warranty' && <WarrantyTab email={profile?.email ?? ''} name={profile?.full_name ?? ''} userId={session.user.id} />}
      {tab === 'returns' && <ReturnsTab email={profile?.email ?? ''} name={profile?.full_name ?? ''} userId={session.user.id} />}
      {tab === 'knowledge' && <KnowledgeBaseTab />}
    </div>
  );
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ meta, status }: { meta: Record<string, { label: string; color: string; bg: string }>; status: string }) {
  const m = meta[status] ?? { label: statusLabel(meta, status), color: 'text-slate-600', bg: 'bg-slate-100' };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${m.bg} ${m.color}`}>{m.label}</span>;
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, title, desc, actionLabel, onAction }: {
  icon: typeof MessageSquare; title: string; desc: string; actionLabel: string; onAction: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
      <Icon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-sm font-semibold text-slate-700 mb-1">{title}</p>
      <p className="text-xs text-slate-500 mb-4">{desc}</p>
      <button
        onClick={onAction}
        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 px-4 py-2 rounded-xl transition-colors"
      >
        <Plus className="w-4 h-4" /> {actionLabel}
      </button>
    </div>
  );
}

// ─── Form Modal ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function TextInput({ label, icon: Icon, value, onChange, placeholder, type = 'text' }: {
  label: string; icon: typeof User; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-3 py-2.5 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-white border border-slate-300 text-slate-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ─── Support Tickets Tab ─────────────────────────────────────────────────────

function TicketsTab({ email, name, userId }: { email: string; name: string; userId: string }) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replies, setReplies] = useState<TicketReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [orderNumber, setOrderNumber] = useState('');

  const loadTickets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('id,ticket_number,subject,category,priority,status,order_number,created_at,updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { setError('Failed to load tickets.'); } else { setTickets((data ?? []) as SupportTicket[]); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  async function loadReplies(ticketId: string) {
    const { data } = await supabase
      .from('ticket_replies')
      .select('id,author,author_name,message,created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setReplies((data ?? []) as TicketReply[]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: userId,
      customer_email: email,
      customer_name: name,
      subject: subject.trim(),
      description: description.trim(),
      category,
      priority,
      order_number: orderNumber.trim() || null,
    });
    setSubmitting(false);
    if (error) { setError('Failed to create ticket: ' + error.message); return; }
    setSuccess('Support ticket created successfully.');
    setSubject(''); setDescription(''); setCategory('general'); setPriority('normal'); setOrderNumber('');
    setShowForm(false);
    setTimeout(() => setSuccess(null), 4000);
    loadTickets();
  }

  async function handleReply() {
    if (!selectedTicket || !replyText.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from('ticket_replies').insert({
      ticket_id: selectedTicket.id,
      author: 'customer',
      author_name: name,
      message: replyText.trim(),
    });
    if (!error) {
      await supabase.from('support_tickets').update({ status: 'awaiting_response' }).eq('id', selectedTicket.id);
      setReplyText('');
      loadReplies(selectedTicket.id);
      loadTickets();
    }
    setSubmitting(false);
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm">{success}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">My Support Tickets ({tickets.length})</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon={MessageSquare} title="No support tickets" desc="Need help? Create a support ticket and our team will respond." actionLabel="Create Ticket" onAction={() => setShowForm(true)} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {tickets.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTicket(t); loadReplies(t.id); }}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{t.subject}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                    <span className="font-mono">{t.ticket_number}</span>
                    <span className="text-slate-300">·</span>
                    {new Date(t.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span className="text-slate-300">·</span>
                    <span className="capitalize">{t.category}</span>
                  </p>
                </div>
                <StatusBadge meta={TICKET_STATUS_META} status={t.status} />
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New ticket form */}
      {showForm && (
        <Modal title="New Support Ticket" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3"><AlertCircle className="w-4 h-4 text-red-500" /><p className="text-red-700 text-sm">{error}</p></div>}
            <TextInput label="Subject" icon={FileText} value={subject} onChange={setSubject} placeholder="Brief summary of your issue" />
            <TextArea label="Description" value={description} onChange={setDescription} placeholder="Describe your issue in detail…" rows={5} />
            <div className="grid grid-cols-2 gap-4">
              <SelectInput label="Category" value={category} onChange={setCategory} options={[
                { value: 'general', label: 'General' },
                { value: 'billing', label: 'Billing' },
                { value: 'technical', label: 'Technical' },
                { value: 'delivery', label: 'Delivery' },
                { value: 'product', label: 'Product' },
                { value: 'other', label: 'Other' },
              ]} />
              <SelectInput label="Priority" value={priority} onChange={setPriority} options={[
                { value: 'low', label: 'Low' },
                { value: 'normal', label: 'Normal' },
                { value: 'high', label: 'High' },
                { value: 'urgent', label: 'Urgent' },
              ]} />
            </div>
            <TextInput label="Order number (optional)" icon={Package} value={orderNumber} onChange={setOrderNumber} placeholder="e.g. ORD-000001" />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Ticket
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Ticket detail / conversation */}
      {selectedTicket && (
        <Modal title={selectedTicket.ticket_number} onClose={() => setSelectedTicket(null)}>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">{selectedTicket.subject}</h3>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge meta={TICKET_STATUS_META} status={selectedTicket.status} />
                <span className="text-xs text-slate-400 capitalize">{selectedTicket.category} · {selectedTicket.priority} priority</span>
              </div>
            </div>

            {/* Conversation */}
            <div className="space-y-3 max-h-64 overflow-y-auto bg-slate-50 rounded-xl p-4">
              {replies.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No replies yet. Our team will respond shortly.</p>
              ) : (
                replies.map(r => (
                  <div key={r.id} className={`flex flex-col ${r.author === 'customer' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 ${r.author === 'customer' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                      <p className="text-xs font-semibold mb-0.5 opacity-80">{r.author_name}</p>
                      <p className="text-sm whitespace-pre-wrap">{r.message}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(r.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                ))
              )}
            </div>

            {/* Reply box */}
            {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
              <div className="flex gap-2">
                <textarea
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Type your reply…"
                  rows={2}
                  className="flex-1 px-3 py-2.5 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={handleReply}
                  disabled={submitting || !replyText.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 flex-shrink-0"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Warranty Claims Tab ─────────────────────────────────────────────────────

function WarrantyTab({ email, name, userId }: { email: string; name: string; userId: string }) {
  const [claims, setClaims] = useState<WarrantyClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [warrantyType, setWarrantyType] = useState('manufacturer');

  const loadClaims = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('warranty_claims')
      .select('id,claim_number,product_name,product_sku,serial_number,order_number,purchase_date,issue_description,warranty_type,status,resolution_notes,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { setError('Failed to load claims.'); } else { setClaims((data ?? []) as WarrantyClaim[]); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadClaims(); }, [loadClaims]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!productName.trim() || !issueDescription.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from('warranty_claims').insert({
      user_id: userId,
      customer_email: email,
      customer_name: name,
      product_name: productName.trim(),
      product_sku: productSku.trim() || null,
      serial_number: serialNumber.trim() || null,
      order_number: orderNumber.trim() || null,
      purchase_date: purchaseDate || null,
      issue_description: issueDescription.trim(),
      warranty_type: warrantyType,
    });
    setSubmitting(false);
    if (error) { setError('Failed to submit claim: ' + error.message); return; }
    setSuccess('Warranty claim submitted successfully.');
    setProductName(''); setProductSku(''); setSerialNumber(''); setOrderNumber(''); setPurchaseDate(''); setIssueDescription(''); setWarrantyType('manufacturer');
    setShowForm(false);
    setTimeout(() => setSuccess(null), 4000);
    loadClaims();
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm">{success}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Warranty Claims ({claims.length})</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New Claim
        </button>
      </div>

      {claims.length === 0 ? (
        <EmptyState icon={Shield} title="No warranty claims" desc="Need to claim a product warranty? Submit a claim and our team will process it." actionLabel="New Claim" onAction={() => setShowForm(true)} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {claims.map(c => (
              <div key={c.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{c.product_name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono">{c.claim_number}</span>
                    <span className="text-slate-300">·</span>
                    {new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    {c.serial_number && <><span className="text-slate-300">·</span><span>SN: {c.serial_number}</span></>}
                  </p>
                  {c.resolution_notes && c.status !== 'submitted' && c.status !== 'under_review' && (
                    <p className="text-xs text-slate-500 mt-1 italic">"{c.resolution_notes}"</p>
                  )}
                </div>
                <StatusBadge meta={CLAIM_STATUS_META} status={c.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <Modal title="New Warranty Claim" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3"><AlertCircle className="w-4 h-4 text-red-500" /><p className="text-red-700 text-sm">{error}</p></div>}
            <TextInput label="Product name" icon={Package} value={productName} onChange={setProductName} placeholder="e.g. Dell Latitude 5440" />
            <div className="grid grid-cols-2 gap-4">
              <TextInput label="Product SKU" icon={Package} value={productSku} onChange={setProductSku} placeholder="SKU" />
              <TextInput label="Serial number" icon={FileText} value={serialNumber} onChange={setSerialNumber} placeholder="Serial #" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <TextInput label="Order number" icon={Package} value={orderNumber} onChange={setOrderNumber} placeholder="ORD-000001" />
              <TextInput label="Purchase date" icon={Calendar} type="date" value={purchaseDate} onChange={setPurchaseDate} />
            </div>
            <SelectInput label="Warranty type" value={warrantyType} onChange={setWarrantyType} options={[
              { value: 'manufacturer', label: 'Manufacturer Warranty' },
              { value: 'extended', label: 'Extended Warranty' },
              { value: 'in-house', label: 'In-house Warranty' },
            ]} />
            <TextArea label="Issue description" value={issueDescription} onChange={setIssueDescription} placeholder="Describe the defect or issue…" rows={4} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Claim
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Product Returns (RMA) Tab ───────────────────────────────────────────────

function ReturnsTab({ email, name, userId }: { email: string; name: string; userId: string }) {
  const [returns, setReturns] = useState<ProductReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [orderNumber, setOrderNumber] = useState('');
  const [returnReason, setReturnReason] = useState('defective');
  const [reasonDetails, setReasonDetails] = useState('');
  const [condition, setCondition] = useState('unopened');

  const loadReturns = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('product_returns')
      .select('id,rma_number,product_name,product_sku,quantity,order_number,return_reason,reason_details,condition,status,admin_notes,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) { setError('Failed to load returns.'); } else { setReturns((data ?? []) as ProductReturn[]); }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadReturns(); }, [loadReturns]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!productName.trim() || !reasonDetails.trim()) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from('product_returns').insert({
      user_id: userId,
      customer_email: email,
      customer_name: name,
      product_name: productName.trim(),
      product_sku: productSku.trim() || null,
      quantity: parseInt(quantity) || 1,
      order_number: orderNumber.trim() || null,
      return_reason: returnReason,
      reason_details: reasonDetails.trim(),
      condition,
    });
    setSubmitting(false);
    if (error) { setError('Failed to submit return: ' + error.message); return; }
    setSuccess('Return request submitted successfully.');
    setProductName(''); setProductSku(''); setQuantity('1'); setOrderNumber(''); setReturnReason('defective'); setReasonDetails(''); setCondition('unopened');
    setShowForm(false);
    setTimeout(() => setSuccess(null), 4000);
    loadReturns();
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm">{success}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Product Returns ({returns.length})</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> New Return
        </button>
      </div>

      {returns.length === 0 ? (
        <EmptyState icon={RotateCcw} title="No return requests" desc="Need to return a product? Submit an RMA request and our team will review it." actionLabel="New Return" onAction={() => setShowForm(true)} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {returns.map(r => (
              <div key={r.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{r.product_name} <span className="text-slate-400 font-normal">×{r.quantity}</span></p>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono">{r.rma_number}</span>
                    <span className="text-slate-300">·</span>
                    {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    <span className="text-slate-300">·</span>
                    <span className="capitalize">{r.return_reason.replace(/_/g, ' ')}</span>
                    <span className="text-slate-300">·</span>
                    <span className="capitalize">{r.condition}</span>
                  </p>
                  {r.admin_notes && r.status !== 'submitted' && r.status !== 'under_review' && (
                    <p className="text-xs text-slate-500 mt-1 italic">"{r.admin_notes}"</p>
                  )}
                </div>
                <StatusBadge meta={RETURN_STATUS_META} status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <Modal title="New Product Return (RMA)" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3"><AlertCircle className="w-4 h-4 text-red-500" /><p className="text-red-700 text-sm">{error}</p></div>}
            <TextInput label="Product name" icon={Package} value={productName} onChange={setProductName} placeholder="Product to return" />
            <div className="grid grid-cols-2 gap-4">
              <TextInput label="Product SKU" icon={Package} value={productSku} onChange={setProductSku} placeholder="SKU" />
              <TextInput label="Quantity" icon={Package} type="number" value={quantity} onChange={setQuantity} placeholder="1" />
            </div>
            <TextInput label="Order number" icon={Package} value={orderNumber} onChange={setOrderNumber} placeholder="ORD-000001" />
            <SelectInput label="Return reason" value={returnReason} onChange={setReturnReason} options={[
              { value: 'defective', label: 'Defective' },
              { value: 'wrong_item', label: 'Wrong item received' },
              { value: 'not_as_described', label: 'Not as described' },
              { value: 'damaged_in_transit', label: 'Damaged in transit' },
              { value: 'no_longer_needed', label: 'No longer needed' },
              { value: 'other', label: 'Other' },
            ]} />
            <SelectInput label="Product condition" value={condition} onChange={setCondition} options={[
              { value: 'unopened', label: 'Unopened / Sealed' },
              { value: 'opened', label: 'Opened (unused)' },
              { value: 'used', label: 'Used' },
              { value: 'damaged', label: 'Damaged' },
            ]} />
            <TextArea label="Reason details" value={reasonDetails} onChange={setReasonDetails} placeholder="Explain why you're returning this product…" rows={4} />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800">Cancel</button>
              <button type="submit" disabled={submitting} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit Return
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

// ─── Knowledge Base Tab ──────────────────────────────────────────────────────

function KnowledgeBaseTab() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { key: 'all', label: 'All' },
    { key: 'products', label: 'Products' },
    { key: 'warranty', label: 'Warranty' },
    { key: 'quotations', label: 'Quotations' },
    { key: 'services', label: 'Services' },
    { key: 'delivery', label: 'Delivery' },
  ];

  const filtered = faqs.filter(f => {
    const matchesCategory = activeCategory === 'all' || f.category === activeCategory;
    const matchesSearch = !search ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search the knowledge base…"
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
              activeCategory === c.key
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No articles found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(faq => (
            <FAQItem key={faq.id} faq={faq} />
          ))}
        </div>
      )}

      {/* Contact prompt */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
        <LifeBuoy className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-900">Can't find what you're looking for?</p>
          <p className="text-xs text-blue-700 mt-0.5">
            Create a support ticket from the Support Tickets tab, or call us on{' '}
            <span className="font-medium">+254 795 030 476</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ faq }: { faq: { id: string; question: string; answer: string; category: string } }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <p className="text-sm font-semibold text-slate-900">{faq.question}</p>
        <ChevronRight className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

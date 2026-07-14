import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Shield, Heart, GraduationCap, Briefcase, Factory, Building2,
  Mail, Phone, Hash, DollarSign, Calendar, FileText, Paperclip, Package,
  ChevronDown, Loader2, ExternalLink, Download, Trash2, CheckCircle2,
  AlertCircle, User, MapPin, Edit3, Save, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RFQItem {
  id: string;
  sort_order: number;
  product_name: string;
  product_sku: string | null;
  description: string | null;
  specifications: string | null;
  quantity: number;
  unit: string;
  estimated_unit_price: number | null;
}

interface RFQAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size_bytes: number | null;
}

interface RFQ {
  id: string;
  rfq_number: string;
  status: string;
  organization_name: string;
  organization_type: string;
  organization_address: string | null;
  organization_city: string | null;
  organization_country: string;
  procurement_officer: string;
  officer_email: string;
  officer_phone: string | null;
  officer_position: string | null;
  tender_reference: string | null;
  target_budget: number | null;
  required_delivery_date: string | null;
  project_description: string | null;
  special_conditions: string | null;
  internal_notes: string | null;
  assigned_to: string | null;
  submitted_at: string;
  created_at: string;
  rfq_items: RFQItem[];
  rfq_attachments: RFQAttachment[];
}

const STATUSES = ['submitted', 'under_review', 'quoted', 'awarded', 'rejected', 'cancelled'];

const STATUS_STYLE: Record<string, string> = {
  submitted:    'bg-blue-900/40 text-blue-300 border-blue-700/40',
  under_review: 'bg-amber-900/40 text-amber-300 border-amber-700/40',
  quoted:       'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
  awarded:      'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  rejected:     'bg-red-900/40 text-red-300 border-red-700/40',
  cancelled:    'bg-slate-700 text-slate-400 border-slate-600',
};

const ORG_ICON: Record<string, React.ElementType> = {
  government: Shield, ngo: Heart, university: GraduationCap,
  corporate: Briefcase, sme: Factory, other: Building2,
};

function sl(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }
function fmtDate(iso: string | null) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }); }
function fmtDateTime(iso: string) { return new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function fmtKES(v: number | null) { return v ? `KES ${v.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` : '—'; }
function fmtBytes(b: number | null) {
  if (!b) return '';
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm text-white leading-snug">{value}</p>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminRFQDetail() {
  const { id } = useParams<{ id: string }>();
  const [rfq, setRFQ] = useState<RFQ | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusOpen, setStatusOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('rfq_requests')
      .select('*, rfq_items(*), rfq_attachments(*)')
      .eq('id', id)
      .maybeSingle();
    if (data) {
      setRFQ(data as RFQ);
      setNotes(data.internal_notes ?? '');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(newStatus: string) {
    if (!rfq || newStatus === rfq.status) { setStatusOpen(false); return; }
    setUpdatingStatus(true);
    const { error } = await supabase.from('rfq_requests').update({ status: newStatus }).eq('id', rfq.id);
    if (!error) setRFQ(p => p ? { ...p, status: newStatus } : p);
    setStatusOpen(false);
    setUpdatingStatus(false);
  }

  async function saveNotes() {
    if (!rfq) return;
    setSavingNotes(true);
    await supabase.from('rfq_requests').update({ internal_notes: notes || null }).eq('id', rfq.id);
    setRFQ(p => p ? { ...p, internal_notes: notes || null } : p);
    setEditingNotes(false);
    setSavingNotes(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400">RFQ not found.</p>
        <Link to="/admin/rfqs" className="text-blue-400 text-sm mt-2 inline-block">← Back to RFQs</Link>
      </div>
    );
  }

  const OrgIcon = ORG_ICON[rfq.organization_type] ?? Building2;
  const sortedItems = [...rfq.rfq_items].sort((a, b) => a.sort_order - b.sort_order);
  const totalEstimate = sortedItems.reduce((s, i) => s + (i.estimated_unit_price ? i.estimated_unit_price * i.quantity : 0), 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link to="/admin/rfqs" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors flex-shrink-0 mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white font-mono">{rfq.rfq_number}</h1>
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLE[rfq.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
              {sl(rfq.status)}
            </span>
          </div>
          <p className="text-slate-400 text-sm">Submitted {fmtDateTime(rfq.submitted_at)}</p>
        </div>

        {/* Status dropdown */}
        <div className="relative flex-shrink-0">
          <button onClick={() => setStatusOpen(p => !p)} disabled={updatingStatus}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-sm text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors disabled:opacity-60">
            {updatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
            Update Status
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
          {statusOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-20">
              {STATUSES.map(s => (
                <button key={s} onClick={() => updateStatus(s)}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-slate-700 ${rfq.status === s ? 'text-white font-semibold' : 'text-slate-400'}`}>
                  {rfq.status === s && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                  <span className={rfq.status === s ? 'ml-0' : 'ml-6'}>{sl(s)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Product List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-400" />
                <h2 className="font-semibold text-white">Product List</h2>
                <span className="text-xs text-slate-500">({sortedItems.length} items)</span>
              </div>
              {totalEstimate > 0 && (
                <span className="text-xs text-slate-400">Est. total: <span className="text-white font-semibold">{fmtKES(totalEstimate)}</span></span>
              )}
            </div>
            {sortedItems.length === 0 ? (
              <p className="px-5 py-8 text-center text-slate-500 text-sm">No product items.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">#</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-24">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-32">Est. Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-32 hidden sm:table-cell">Est. Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40">
                    {sortedItems.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3.5 text-slate-500 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3.5">
                          <p className="text-white font-medium text-sm leading-tight">{item.product_name}</p>
                          {item.product_sku && <p className="text-slate-500 text-xs font-mono mt-0.5">{item.product_sku}</p>}
                          {item.description && <p className="text-slate-400 text-xs mt-1 leading-snug line-clamp-2">{item.description}</p>}
                          {item.specifications && <p className="text-slate-500 text-xs mt-0.5 italic leading-snug line-clamp-1">{item.specifications}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-white text-sm font-semibold">{item.quantity}</span>
                          <span className="text-slate-500 text-xs ml-1">{item.unit}</span>
                        </td>
                        <td className="px-4 py-3.5 text-right text-slate-300 text-sm">
                          {item.estimated_unit_price ? fmtKES(item.estimated_unit_price) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right text-white font-medium text-sm hidden sm:table-cell">
                          {item.estimated_unit_price ? fmtKES(item.estimated_unit_price * item.quantity) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {totalEstimate > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-slate-600">
                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-semibold text-slate-300">Estimated Total</td>
                        <td className="px-4 py-3 text-right text-base font-bold text-white hidden sm:table-cell">{fmtKES(totalEstimate)}</td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>

          {/* Attachments */}
          {rfq.rfq_attachments.length > 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
                <Paperclip className="w-4 h-4 text-blue-400" />
                <h2 className="font-semibold text-white">Attachments</h2>
                <span className="text-xs text-slate-500">({rfq.rfq_attachments.length})</span>
              </div>
              <div className="divide-y divide-slate-700/50">
                {rfq.rfq_attachments.map(a => (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{a.file_name}</p>
                      {a.file_size_bytes && <p className="text-xs text-slate-500">{fmtBytes(a.file_size_bytes)}</p>}
                    </div>
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Details */}
          {(rfq.project_description || rfq.special_conditions) && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-700">
                <FileText className="w-4 h-4 text-blue-400" />
                <h2 className="font-semibold text-white">Project Details</h2>
              </div>
              {rfq.project_description && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{rfq.project_description}</p>
                </div>
              )}
              {rfq.special_conditions && (
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Special Conditions</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{rfq.special_conditions}</p>
                </div>
              )}
            </div>
          )}

          {/* Internal Notes */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" /> Internal Notes
              </h2>
              {!editingNotes && (
                <button onClick={() => setEditingNotes(true)}
                  className="text-xs text-slate-400 hover:text-white transition-colors font-semibold">
                  Edit
                </button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-3">
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
                  placeholder="Add internal notes, follow-up actions, pricing strategy..."
                  className="w-full px-3 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
                <div className="flex gap-2">
                  <button onClick={saveNotes} disabled={savingNotes}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                    {savingNotes ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                  </button>
                  <button onClick={() => { setEditingNotes(false); setNotes(rfq.internal_notes ?? ''); }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-600 text-slate-400 text-xs font-semibold rounded-lg hover:text-white transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className={`text-sm leading-relaxed ${rfq.internal_notes ? 'text-slate-300' : 'text-slate-600 italic'}`}>
                {rfq.internal_notes || 'No internal notes yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Organisation */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-700 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-900/40 border border-blue-700/30 flex items-center justify-center">
                <OrgIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm">{rfq.organization_name}</h3>
                <p className="text-xs text-slate-400 capitalize">{rfq.organization_type}</p>
              </div>
            </div>
            <div className="space-y-3">
              <InfoRow icon={MapPin} label="Address" value={[rfq.organization_address, rfq.organization_city, rfq.organization_country].filter(Boolean).join(', ')} />
            </div>
          </div>

          {/* Procurement Officer */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2 pb-4 border-b border-slate-700 mb-4">
              <User className="w-4 h-4 text-blue-400" /> Procurement Officer
            </h3>
            <div className="space-y-3">
              <InfoRow icon={User} label="Name" value={rfq.procurement_officer} />
              <InfoRow icon={Briefcase} label="Position" value={rfq.officer_position} />
              <InfoRow icon={Mail} label="Email" value={rfq.officer_email} />
              <InfoRow icon={Phone} label="Phone" value={rfq.officer_phone} />
            </div>
            <div className="mt-4 pt-4 border-t border-slate-700 flex gap-2">
              <a href={`mailto:${rfq.officer_email}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors">
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
              {rfq.officer_phone && (
                <a href={`tel:${rfq.officer_phone}`}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 rounded-lg hover:bg-emerald-600/30 transition-colors">
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}
            </div>
          </div>

          {/* Procurement Info */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <h3 className="font-semibold text-white text-sm flex items-center gap-2 pb-4 border-b border-slate-700 mb-4">
              <Hash className="w-4 h-4 text-blue-400" /> Procurement Info
            </h3>
            <div className="space-y-3">
              <InfoRow icon={Hash} label="Tender Reference" value={rfq.tender_reference} />
              <InfoRow icon={DollarSign} label="Target Budget" value={fmtKES(rfq.target_budget)} />
              <InfoRow icon={Calendar} label="Delivery By" value={fmtDate(rfq.required_delivery_date)} />
              <div className="flex items-start gap-3">
                <Package className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Items</p>
                  <p className="text-sm text-white">{sortedItems.length} product{sortedItems.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Paperclip className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Attachments</p>
                  <p className="text-sm text-white">{rfq.rfq_attachments.length} file{rfq.rfq_attachments.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Link to customer history if email present */}
          <Link to={`/admin/customers/${encodeURIComponent(rfq.officer_email)}`}
            className="flex items-center justify-between w-full px-4 py-3.5 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700 transition-colors group">
            <span className="text-sm text-slate-300 font-medium">View Customer History</span>
            <ChevronDown className="w-4 h-4 text-slate-500 -rotate-90 group-hover:text-white transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  );
}

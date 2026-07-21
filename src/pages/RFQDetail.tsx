import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import {
  ArrowLeft, FileSpreadsheet, Loader2, AlertCircle, Package, Calendar,
  Building2, User, Mail, Phone, MapPin, Globe, Briefcase, Target,
  Clock, CheckCircle2, Paperclip, Download, ShieldCheck,
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { supabase } from '../lib/supabase';

interface RfqItem {
  id: string;
  product_name: string;
  product_sku: string | null;
  description: string | null;
  specifications: string | null;
  quantity: number;
  unit: string | null;
  estimated_unit_price: number | null;
}

interface RfqAttachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size_bytes: number | null;
}

interface RfqDetail {
  id: string;
  rfq_number: string;
  status: string;
  organization_name: string;
  organization_type: string | null;
  organization_address: string | null;
  organization_city: string | null;
  organization_country: string | null;
  procurement_officer: string;
  officer_email: string;
  officer_phone: string;
  officer_position: string | null;
  tender_reference: string | null;
  target_budget: number | null;
  required_delivery_date: string | null;
  project_description: string | null;
  special_conditions: string | null;
  submitted_at: string;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; step: number }> = {
  submitted:         { label: 'Submitted',          color: 'text-amber-700',  bg: 'bg-amber-50',  step: 1 },
  under_review:      { label: 'Under Review',       color: 'text-blue-700',   bg: 'bg-blue-50',   step: 2 },
  quoted:            { label: 'Quotation Issued',   color: 'text-blue-700',   bg: 'bg-blue-50',   step: 3 },
  awaiting_customer: { label: 'Awaiting Response',  color: 'text-orange-700', bg: 'bg-orange-50', step: 4 },
  accepted:          { label: 'Accepted',           color: 'text-emerald-700',bg: 'bg-emerald-50',step: 5 },
  rejected:          { label: 'Rejected',           color: 'text-red-700',    bg: 'bg-red-50',    step: 0 },
  converted_to_order:{ label: 'Converted to Order', color: 'text-teal-700',   bg: 'bg-teal-50',   step: 6 },
  expired:           { label: 'Expired',            color: 'text-slate-500',  bg: 'bg-slate-100', step: 0 },
};

const PIPELINE = ['submitted', 'under_review', 'quoted', 'awaiting_customer', 'accepted'];

export function RFQDetail() {
  const { id } = useParams<{ id: string }>();
  const { session, loading: authLoading } = useCustomerAuth();
  const [rfq, setRfq] = useState<RfqDetail | null>(null);
  const [items, setItems] = useState<RfqItem[]>([]);
  const [attachments, setAttachments] = useState<RfqAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: r, error: rErr }, { data: its }, { data: atts }] = await Promise.all([
      supabase.from('rfq_requests').select('*').eq('id', id).maybeSingle(),
      supabase.from('rfq_items').select('*').eq('rfq_id', id).order('sort_order'),
      supabase.from('rfq_attachments').select('id,file_name,file_url,file_type,file_size_bytes').eq('rfq_id', id).order('created_at'),
    ]);
    if (rErr) { setError('Failed to load RFQ.'); setLoading(false); return; }
    if (!r) { setError('RFQ not found.'); setLoading(false); return; }
    setRfq(r as RfqDetail);
    setItems((its ?? []) as RfqItem[]);
    setAttachments((atts ?? []) as RfqAttachment[]);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (authLoading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  if (!session) return <Navigate to={`/login?next=/account/rfqs/${id}`} replace />;
  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8"><div className="animate-pulse space-y-4"><div className="h-8 bg-slate-200 rounded w-1/3" /><div className="h-48 bg-slate-100 rounded-2xl" /><div className="h-64 bg-slate-100 rounded-2xl" /></div></div>;
  if (error || !rfq) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <p className="text-slate-600 mb-4">{error ?? 'RFQ not found'}</p>
      <Link to="/account" className="text-blue-600 font-medium text-sm">Back to account</Link>
    </div>
  );

  if (session.user.email && rfq.officer_email !== session.user.email) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 mb-4">You don't have access to this RFQ.</p>
        <Link to="/account" className="text-blue-600 font-medium text-sm">Back to account</Link>
      </div>
    );
  }

  const statusMeta = STATUS_META[rfq.status] ?? { label: rfq.status, color: 'text-slate-600', bg: 'bg-slate-100', step: 0 };
  const currentStep = PIPELINE.indexOf(rfq.status);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
        <Link to="/account" className="hover:text-slate-700">Account</Link>
        <span>/</span>
        <span className="hover:text-slate-700">My RFQs</span>
        <span>/</span>
        <span className="text-slate-900 font-medium">{rfq.rfq_number}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{rfq.rfq_number}</h1>
              <p className="text-xs text-slate-500">{rfq.organization_name}</p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${statusMeta.bg} ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
        </div>

        {/* Status pipeline */}
        {rfq.status !== 'rejected' && rfq.status !== 'expired' && (
          <div className="flex items-center gap-1 mt-4 pt-4 border-t border-slate-100 overflow-x-auto">
            {PIPELINE.map((step, idx) => {
              const meta = STATUS_META[step];
              const done = idx < currentStep;
              const active = idx === currentStep;
              return (
                <div key={step} className="flex items-center gap-1 flex-shrink-0">
                  {idx > 0 && <div className={`w-6 h-0.5 ${done || active ? 'bg-blue-500' : 'bg-slate-200'}`} />}
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {done ? <CheckCircle2 className="w-3 h-3" /> : idx + 1}
                    </div>
                    <span className={`text-xs font-medium whitespace-nowrap ${active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Items */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Requested Products ({items.length})</h2>
            </div>
            {items.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No items in this RFQ.</p>
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
                        {item.description && <p className="text-xs text-slate-500 mt-1 ml-5">{item.description}</p>}
                        {item.specifications && <p className="text-xs text-slate-400 mt-0.5 ml-5">Spec: {item.specifications}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-slate-900">{item.quantity} {item.unit ?? ''}</p>
                        {item.estimated_unit_price != null && (
                          <p className="text-xs text-slate-400 mt-0.5">~KSh {Number(item.estimated_unit_price).toLocaleString()}/unit</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Attachments ({attachments.length})</h3>
              <div className="space-y-2">
                {attachments.map(att => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <Paperclip className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{att.file_name}</p>
                      <p className="text-xs text-slate-400">{att.file_type ?? 'File'}{att.file_size_bytes ? ` · ${(att.file_size_bytes / 1024).toFixed(0)} KB` : ''}</p>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Project details */}
          {(rfq.project_description || rfq.special_conditions || rfq.tender_reference) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Project Details</h3>
              <div className="space-y-3 text-sm">
                {rfq.tender_reference && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Tender Reference</p>
                    <p className="text-slate-700 font-mono">{rfq.tender_reference}</p>
                  </div>
                )}
                {rfq.project_description && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Description</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{rfq.project_description}</p>
                  </div>
                )}
                {rfq.special_conditions && (
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Special Conditions</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{rfq.special_conditions}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Key info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Key Information</h3>
            <div className="space-y-3">
              <InfoLine icon={Calendar} label="Submitted" value={new Date(rfq.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} />
              {rfq.required_delivery_date && (
                <InfoLine icon={Clock} label="Required by" value={new Date(rfq.required_delivery_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} />
              )}
              {rfq.target_budget != null && (
                <InfoLine icon={Target} label="Target budget" value={`KSh ${Number(rfq.target_budget).toLocaleString()}`} />
              )}
            </div>
          </div>

          {/* Organisation */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Organisation</h3>
            <div className="space-y-2">
              <InfoLine icon={Building2} value={rfq.organization_name} />
              {rfq.organization_type && <InfoLine icon={Briefcase} value={rfq.organization_type.replace(/_/g, ' ')} />}
              {rfq.organization_address && <InfoLine icon={MapPin} value={rfq.organization_address} />}
              {rfq.organization_city && <InfoLine icon={MapPin} value={`${rfq.organization_city}${rfq.organization_country ? `, ${rfq.organization_country}` : ''}`} />}
              {rfq.organization_country && !rfq.organization_city && <InfoLine icon={Globe} value={rfq.organization_country} />}
            </div>
          </div>

          {/* Procurement officer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Procurement Officer</h3>
            <div className="space-y-2">
              <InfoLine icon={User} value={rfq.procurement_officer} />
              {rfq.officer_position && <InfoLine icon={Briefcase} value={rfq.officer_position} />}
              <InfoLine icon={Mail} value={rfq.officer_email} />
              <InfoLine icon={Phone} value={rfq.officer_phone} />
            </div>
          </div>
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

function InfoLine({ icon: Icon, value, label }: { icon: typeof User; value: string; label?: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
      {label ? (
        <div>
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-slate-700 font-medium">{value}</p>
        </div>
      ) : (
        <span className="text-slate-600">{value}</span>
      )}
    </div>
  );
}

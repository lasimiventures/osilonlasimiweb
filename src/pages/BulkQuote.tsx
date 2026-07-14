import { useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Building2, User, Package, FileSpreadsheet, Paperclip, CheckCircle2,
  ChevronRight, ChevronLeft, Upload, X, Plus, Trash2, Download,
  AlertCircle, Loader2, FileText, Calendar, DollarSign, Hash,
  Shield, GraduationCap, Heart, Briefcase, Factory, ArrowRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RFQItem {
  id: string;
  product_name: string;
  product_sku: string;
  description: string;
  quantity: number;
  unit: string;
  estimated_unit_price: string;
}

interface AttachmentFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

const ORG_TYPES = [
  { value: 'government', label: 'Government',  icon: Shield,        desc: 'Ministries, counties, parastatals' },
  { value: 'ngo',        label: 'NGO / INGO',  icon: Heart,         desc: 'Non-profit & humanitarian orgs' },
  { value: 'university', label: 'University',  icon: GraduationCap, desc: 'Universities & research institutes' },
  { value: 'corporate',  label: 'Corporate',   icon: Briefcase,     desc: 'Listed & private companies' },
  { value: 'sme',        label: 'SME',         icon: Factory,       desc: 'Small & medium enterprises' },
  { value: 'other',      label: 'Other',       icon: Building2,     desc: 'Any other organisation type' },
] as const;

const UNITS = ['piece','set','box','carton','kg','g','litre','m','m²','pair','roll','sheet','unit','other'];

const STEPS = [
  { id: 1, label: 'Organisation',    icon: Building2 },
  { id: 2, label: 'Contact',         icon: User },
  { id: 3, label: 'Products',        icon: Package },
  { id: 4, label: 'Project Details', icon: FileText },
  { id: 5, label: 'Documents',       icon: Paperclip },
  { id: 6, label: 'Review',          icon: CheckCircle2 },
];

const CSV_TEMPLATE =
  'Product Name,SKU/Model,Description,Quantity,Unit,Estimated Unit Price (KES)\n' +
  'Dell Latitude 5540 Laptop,DELL-LAT-5540,"14" FHD i5 13th Gen 8GB 256GB SSD",10,piece,120000\n' +
  'HP LaserJet Pro M404dn,HP-M404DN,"Monochrome duplex network printer",5,piece,45000\n';

function blank(): RFQItem {
  return { id: crypto.randomUUID(), product_name: '', product_sku: '', description: '', quantity: 1, unit: 'piece', estimated_unit_price: '' };
}

function fmtBytes(b: number) {
  if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1048576).toFixed(1)} MB`;
}

function inputCls(err?: string) {
  return `w-full px-3 py-2.5 bg-slate-800 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors ${err ? 'border-red-500/70' : 'border-slate-600'}`;
}
const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5';
const textareaCls = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors resize-none';
const miniInput = 'w-full px-2.5 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40 focus:border-blue-500 transition-colors';

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepHeader({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 pb-5 border-b border-slate-700/60 mb-6">
      <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="text-sm text-slate-400 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{msg}</p>;
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-2">
      <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-700/50">{title}</h4>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  return value ? (
    <div className="flex gap-3">
      <span className="text-xs text-slate-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-white flex-1 leading-relaxed">{value}</span>
    </div>
  ) : null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BulkQuote() {
  const [searchParams] = useSearchParams();
  const prefilledProduct = searchParams.get('product') ?? '';

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rfqNumber, setRfqNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1
  const [org, setOrg] = useState({ organization_name: '', organization_type: '', organization_address: '', organization_city: '', organization_country: 'Kenya' });
  // Step 2
  const [contact, setContact] = useState({ procurement_officer: '', officer_email: '', officer_phone: '', officer_position: '' });
  // Step 3
  const [items, setItems] = useState<RFQItem[]>([prefilledProduct ? { ...blank(), product_name: prefilledProduct } : blank()]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [parseError, setParseError] = useState('');
  // Step 4
  const [project, setProject] = useState({ tender_reference: '', target_budget: '', required_delivery_date: '', project_description: '', special_conditions: '' });
  // Step 5
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const attachRef = useRef<HTMLInputElement>(null);

  // ─── Validation ─────────────────────────────────────────────────────────────

  function validate(s: number) {
    const e: Record<string, string> = {};
    if (s === 1) {
      if (!org.organization_name.trim()) e.organization_name = 'Required';
      if (!org.organization_type) e.organization_type = 'Select an organisation type';
    }
    if (s === 2) {
      if (!contact.procurement_officer.trim()) e.procurement_officer = 'Required';
      if (!contact.officer_email.trim() || !/\S+@\S+\.\S+/.test(contact.officer_email)) e.officer_email = 'Valid email required';
      if (!contact.officer_phone.trim()) e.officer_phone = 'Required';
    }
    if (s === 3) {
      if (!items.some(i => i.product_name.trim())) e.items = 'Add at least one product';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() { if (validate(step)) setStep(s => Math.min(s + 1, 6)); }
  function back() { setStep(s => Math.max(s - 1, 1)); setErrors({}); }

  // ─── Item helpers ─────────────────────────────────────────────────────────────

  function updateItem(id: string, field: keyof RFQItem, val: string | number) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: val } : it));
  }

  function parseFile(file: File) {
    setParseError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        const parsed: RFQItem[] = rows
          .map(r => ({
            id: crypto.randomUUID(),
            product_name: String(r['Product Name'] ?? r['product_name'] ?? r['Name'] ?? '').trim(),
            product_sku: String(r['SKU/Model'] ?? r['SKU'] ?? r['Model'] ?? '').trim(),
            description: String(r['Description'] ?? r['description'] ?? '').trim(),
            quantity: parseInt(String(r['Quantity'] ?? r['quantity'] ?? '1'), 10) || 1,
            unit: String(r['Unit'] ?? r['unit'] ?? 'piece').trim().toLowerCase() || 'piece',
            estimated_unit_price: String(r['Estimated Unit Price (KES)'] ?? r['Unit Price'] ?? r['Price'] ?? '').replace(/[^0-9.]/g, ''),
          }))
          .filter(r => r.product_name);
        if (!parsed.length) { setParseError('No valid rows found. Ensure the file has a "Product Name" column.'); return; }
        setItems(prev => [...prev.filter(i => i.product_name.trim()), ...parsed]);
      } catch { setParseError('Could not parse file. Please use the provided CSV template.'); }
    };
    reader.readAsBinaryString(file);
  }

  function downloadTemplate() {
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(CSV_TEMPLATE);
    a.download = 'OSIL_RFQ_Template.csv';
    a.click();
  }

  // ─── Submit ────────────────────────────────────────────────────────────────────

  async function submit() {
    setSubmitting(true);
    setErrors({});
    try {
      const { data: rfq, error: rfqErr } = await supabase
        .from('rfq_requests')
        .insert({
          ...org,
          ...contact,
          tender_reference: project.tender_reference || null,
          target_budget: project.target_budget ? parseFloat(project.target_budget.replace(/,/g, '')) : null,
          required_delivery_date: project.required_delivery_date || null,
          project_description: project.project_description || null,
          special_conditions: project.special_conditions || null,
        })
        .select('id, rfq_number')
        .single();

      if (rfqErr || !rfq) throw rfqErr ?? new Error('Insert failed');

      const validItems = items.filter(i => i.product_name.trim());
      if (validItems.length) {
        await supabase.from('rfq_items').insert(
          validItems.map((it, idx) => ({
            rfq_id: rfq.id, sort_order: idx,
            product_name: it.product_name,
            product_sku: it.product_sku || null,
            description: it.description || null,
            quantity: it.quantity, unit: it.unit,
            estimated_unit_price: it.estimated_unit_price ? parseFloat(it.estimated_unit_price) : null,
          }))
        );
      }

      // Upload attachments to Supabase Storage
      for (const att of attachments) {
        const ext = att.name.split('.').pop();
        const path = `rfq/${rfq.id}/${att.id}.${ext}`;
        const { error: upErr } = await supabase.storage.from('media').upload(path, att.file, { upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
          await supabase.from('rfq_attachments').insert({
            rfq_id: rfq.id, file_name: att.name,
            file_url: urlData.publicUrl, file_type: att.file.type, file_size_bytes: att.size,
          });
        }
      }

      setRfqNumber(rfq.rfq_number);
      setSubmitted(true);
    } catch {
      setErrors({ submit: 'Submission failed. Please try again or contact us directly.' });
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Success screen ────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20">
          <div className="max-w-lg mx-auto px-4 py-24 text-center">
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">RFQ Submitted Successfully</h1>
            <p className="text-slate-400 mb-2 text-sm">Your RFQ reference number is</p>
            <div className="inline-block bg-slate-800 border border-slate-600 rounded-xl px-8 py-4 mb-6">
              <span className="text-2xl font-bold font-mono text-blue-400 tracking-widest">{rfqNumber}</span>
            </div>
            <p className="text-slate-400 text-sm mb-2 max-w-sm mx-auto">
              Our procurement team will review your RFQ and respond with a formal quotation within <strong className="text-white">2 business days</strong>.
            </p>
            <p className="text-slate-500 text-xs mb-8">Please quote this reference in all correspondence.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/" className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors text-sm">
                Back to Home
              </Link>
              <Link to="/contact" className="px-6 py-3 border border-slate-600 text-slate-300 font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm">
                Contact Us
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // ─── Main render ──────────────────────────────────────────────────────────────

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pt-20">
        {/* Hero banner */}
        <section className="bg-slate-900/50 border-b border-slate-800/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 lg:py-14">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-bold uppercase tracking-widest mb-4">
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Professional RFQ Engine
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Request for Quotation</h1>
                <p className="text-slate-400 max-w-xl text-sm lg:text-base leading-relaxed">
                  Submit a structured procurement request with product lists, budget, tender reference,
                  and supporting documents. Get a formal quotation within 2 business days.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:flex-shrink-0">
                {[{ icon: Shield, label: 'Government' }, { icon: Heart, label: 'NGOs' }, { icon: GraduationCap, label: 'Universities' }, { icon: Briefcase, label: 'Corporates' }].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-xs text-slate-300">
                    <Icon className="w-3.5 h-3.5 text-blue-400" /> {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Form area */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          <div className="flex flex-col lg:flex-row gap-8">

            {/* Sidebar stepper */}
            <aside className="lg:w-56 flex-shrink-0">
              <div className="lg:sticky lg:top-8 space-y-1">
                {STEPS.map(s => {
                  const Icon = s.icon;
                  const done = s.id < step;
                  const active = s.id === step;
                  return (
                    <div key={s.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${active ? 'bg-blue-600/15 border border-blue-500/25' : 'border border-transparent'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : done ? 'bg-emerald-600/80 text-white' : 'bg-slate-800 text-slate-500'}`}>
                        {done ? <CheckCircle2 className="w-4 h-4" /> : <span>{s.id}</span>}
                      </div>
                      <span className={`text-sm font-semibold transition-colors ${active ? 'text-white' : done ? 'text-emerald-400' : 'text-slate-600'}`}>{s.label}</span>
                    </div>
                  );
                })}

                {/* Benefits box */}
                <div className="mt-6 p-4 bg-slate-800/40 border border-slate-700/50 rounded-xl space-y-2.5">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supports</p>
                  {[
                    { icon: FileSpreadsheet, label: 'Excel & CSV upload' },
                    { icon: Hash, label: 'Tender references' },
                    { icon: DollarSign, label: 'Budget specification' },
                    { icon: Calendar, label: 'Delivery deadlines' },
                    { icon: Paperclip, label: 'Document attachments' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-xs text-slate-400">
                      <Icon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" /> {label}
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Form card */}
            <div className="flex-1 min-w-0">
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6 lg:p-8 shadow-xl">

                {/* STEP 1 — Organisation */}
                {step === 1 && (
                  <div>
                    <StepHeader icon={Building2} title="Organisation Details" desc="Tell us about your organisation." />
                    <div className="space-y-5">
                      <div>
                        <label className={labelCls}>Organisation Name *</label>
                        <input value={org.organization_name} onChange={e => setOrg(p => ({ ...p, organization_name: e.target.value }))}
                          placeholder="Ministry of Health / Aga Khan University / Safaricom PLC"
                          className={inputCls(errors.organization_name)} />
                        <FieldError msg={errors.organization_name} />
                      </div>

                      <div>
                        <label className={labelCls}>Organisation Type *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
                          {ORG_TYPES.map(ot => {
                            const Icon = ot.icon;
                            const sel = org.organization_type === ot.value;
                            return (
                              <button key={ot.value} type="button"
                                onClick={() => { setOrg(p => ({ ...p, organization_type: ot.value })); setErrors(p => ({ ...p, organization_type: '' })); }}
                                className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all ${sel ? 'bg-blue-600/20 border-blue-500/60 shadow-md shadow-blue-900/20' : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800'}`}>
                                <Icon className={`w-5 h-5 ${sel ? 'text-blue-400' : 'text-slate-500'}`} />
                                <span className={`text-xs font-bold ${sel ? 'text-white' : 'text-slate-300'}`}>{ot.label}</span>
                                <span className="text-[11px] text-slate-500 leading-snug">{ot.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                        <FieldError msg={errors.organization_type} />
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-2">
                          <label className={labelCls}>Address</label>
                          <input value={org.organization_address} onChange={e => setOrg(p => ({ ...p, organization_address: e.target.value }))}
                            placeholder="P.O. Box / Street address" className={inputCls()} />
                        </div>
                        <div>
                          <label className={labelCls}>City / Town</label>
                          <input value={org.organization_city} onChange={e => setOrg(p => ({ ...p, organization_city: e.target.value }))}
                            placeholder="Nairobi" className={inputCls()} />
                        </div>
                      </div>
                      <div className="sm:w-1/3">
                        <label className={labelCls}>Country</label>
                        <input value={org.organization_country} onChange={e => setOrg(p => ({ ...p, organization_country: e.target.value }))}
                          className={inputCls()} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2 — Procurement Officer */}
                {step === 2 && (
                  <div>
                    <StepHeader icon={User} title="Procurement Officer" desc="Who should we address the quotation to?" />
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Full Name *</label>
                        <input value={contact.procurement_officer} onChange={e => setContact(p => ({ ...p, procurement_officer: e.target.value }))}
                          placeholder="Jane Wanjiru Maina" className={inputCls(errors.procurement_officer)} />
                        <FieldError msg={errors.procurement_officer} />
                      </div>
                      <div>
                        <label className={labelCls}>Position / Title</label>
                        <input value={contact.officer_position} onChange={e => setContact(p => ({ ...p, officer_position: e.target.value }))}
                          placeholder="Procurement Manager" className={inputCls()} />
                      </div>
                      <div>
                        <label className={labelCls}>Phone Number *</label>
                        <input value={contact.officer_phone} onChange={e => setContact(p => ({ ...p, officer_phone: e.target.value }))}
                          placeholder="+254 700 000 000" className={inputCls(errors.officer_phone)} />
                        <FieldError msg={errors.officer_phone} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Official Email Address *</label>
                        <input type="email" value={contact.officer_email} onChange={e => setContact(p => ({ ...p, officer_email: e.target.value }))}
                          placeholder="procurement@organisation.go.ke" className={inputCls(errors.officer_email)} />
                        <FieldError msg={errors.officer_email} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 — Products */}
                {step === 3 && (
                  <div>
                    <StepHeader icon={Package} title="Product List" desc="Upload a spreadsheet or add products manually." />
                    <div className="space-y-5">

                      {/* Upload zone */}
                      <div
                        className="rounded-xl border-2 border-dashed border-slate-600/80 bg-slate-800/20 p-7 text-center hover:border-blue-500/40 hover:bg-slate-800/40 transition-all cursor-pointer"
                        onClick={() => fileRef.current?.click()}
                      >
                        <div className="w-12 h-12 bg-emerald-600/15 border border-emerald-500/30 rounded-xl flex items-center justify-center mx-auto mb-3">
                          <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                        </div>
                        <p className="text-white font-semibold mb-1">Upload Excel or CSV file</p>
                        <p className="text-slate-400 text-xs mb-4 max-w-sm mx-auto">Columns: Product Name · SKU/Model · Description · Quantity · Unit · Estimated Unit Price</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center" onClick={e => e.stopPropagation()}>
                          <button type="button" onClick={() => fileRef.current?.click()}
                            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors">
                            <Upload className="w-4 h-4" /> Choose File
                          </button>
                          <button type="button" onClick={downloadTemplate}
                            className="flex items-center gap-2 px-5 py-2 border border-slate-600 text-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors">
                            <Download className="w-4 h-4" /> Download Template
                          </button>
                        </div>
                        {parseError && <p className="mt-3 text-xs text-red-400 flex items-center justify-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{parseError}</p>}
                      </div>
                      <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden"
                        onChange={e => { if (e.target.files?.[0]) parseFile(e.target.files[0]); e.target.value = ''; }} />

                      {/* Item rows */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-slate-300">
                            Products <span className="text-slate-500">({items.filter(i => i.product_name.trim()).length} added)</span>
                          </p>
                          <button type="button" onClick={() => setItems(p => [...p, blank()])}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600/15 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-600/25 transition-colors">
                            <Plus className="w-3.5 h-3.5" /> Add Row
                          </button>
                        </div>
                        <FieldError msg={errors.items} />
                        <div className="space-y-3 mt-2">
                          {items.map((item, idx) => (
                            <div key={item.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Item {idx + 1}</span>
                                {items.length > 1 && (
                                  <button type="button" onClick={() => setItems(p => p.filter(i => i.id !== item.id))}
                                    className="text-slate-600 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="lg:col-span-2">
                                  <label className="block text-[11px] text-slate-500 mb-1">Product Name *</label>
                                  <input value={item.product_name} onChange={e => updateItem(item.id, 'product_name', e.target.value)}
                                    placeholder="e.g. HP LaserJet Pro M404dn" className={miniInput} />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-500 mb-1">SKU / Model</label>
                                  <input value={item.product_sku} onChange={e => updateItem(item.id, 'product_sku', e.target.value)}
                                    placeholder="HP-M404DN" className={miniInput} />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">Qty *</label>
                                    <input type="number" min={1} value={item.quantity}
                                      onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                      className={miniInput} />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] text-slate-500 mb-1">Unit</label>
                                    <select value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}
                                      className={miniInput + ' bg-slate-700'}>
                                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                  </div>
                                </div>
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <label className="block text-[11px] text-slate-500 mb-1">Description / Specifications</label>
                                  <input value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)}
                                    placeholder="Technical specs, colour, model variant..." className={miniInput} />
                                </div>
                                <div>
                                  <label className="block text-[11px] text-slate-500 mb-1">Est. Unit Price (KES)</label>
                                  <input value={item.estimated_unit_price} onChange={e => updateItem(item.id, 'estimated_unit_price', e.target.value)}
                                    placeholder="45,000" className={miniInput} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4 — Project Details */}
                {step === 4 && (
                  <div>
                    <StepHeader icon={FileText} title="Project Details" desc="Procurement timeline, budget, and tender information." />
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelCls}><Hash className="inline w-3.5 h-3.5 mr-1 opacity-70" />Tender / Bid Reference</label>
                        <input value={project.tender_reference} onChange={e => setProject(p => ({ ...p, tender_reference: e.target.value }))}
                          placeholder="MOH/PROC/2026/001" className={inputCls()} />
                        <p className="text-[11px] text-slate-600 mt-1">Official tender / bid number, if applicable.</p>
                      </div>
                      <div>
                        <label className={labelCls}><Calendar className="inline w-3.5 h-3.5 mr-1 opacity-70" />Required Delivery Date</label>
                        <input type="date" value={project.required_delivery_date}
                          onChange={e => setProject(p => ({ ...p, required_delivery_date: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                          className={inputCls()} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}><DollarSign className="inline w-3.5 h-3.5 mr-1 opacity-70" />Target Budget (KES)</label>
                        <input value={project.target_budget} onChange={e => setProject(p => ({ ...p, target_budget: e.target.value }))}
                          placeholder="e.g. 2,500,000" className={inputCls()} />
                        <p className="text-[11px] text-slate-600 mt-1">Indicative ceiling — helps us tailor the quotation.</p>
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Project Description</label>
                        <textarea value={project.project_description} onChange={e => setProject(p => ({ ...p, project_description: e.target.value }))}
                          rows={4} placeholder="Describe the project or procurement purpose, scope, and requirements..."
                          className={textareaCls} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Special Conditions / Notes</label>
                        <textarea value={project.special_conditions} onChange={e => setProject(p => ({ ...p, special_conditions: e.target.value }))}
                          rows={3} placeholder="Payment terms, delivery site, installation requirements, warranty needs..."
                          className={textareaCls} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5 — Documents */}
                {step === 5 && (
                  <div>
                    <StepHeader icon={Paperclip} title="Supporting Documents" desc="Attach BOQs, tender docs, spec sheets, site photos — any relevant files. Optional." />
                    <div className="space-y-4">
                      <div
                        className="rounded-xl border-2 border-dashed border-slate-600/80 bg-slate-800/20 p-8 text-center hover:border-blue-500/40 hover:bg-slate-800/40 transition-all cursor-pointer"
                        onClick={() => attachRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          e.preventDefault();
                          const newFiles: AttachmentFile[] = Array.from(e.dataTransfer.files).map(f => ({ id: crypto.randomUUID(), file: f, name: f.name, size: f.size }));
                          setAttachments(p => [...p, ...newFiles]);
                        }}
                      >
                        <Upload className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                        <p className="text-white font-semibold mb-1">Click or drag & drop</p>
                        <p className="text-slate-400 text-xs">PDF, Word, Excel, images — up to 10 MB each</p>
                        <input ref={attachRef} type="file" multiple className="hidden"
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                          onChange={e => {
                            const newFiles: AttachmentFile[] = Array.from(e.target.files ?? []).map(f => ({ id: crypto.randomUUID(), file: f, name: f.name, size: f.size }));
                            setAttachments(p => [...p, ...newFiles]);
                          }} />
                      </div>

                      {attachments.length > 0 && (
                        <div className="space-y-2">
                          {attachments.map(a => (
                            <div key={a.id} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3">
                              <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">{a.name}</p>
                                <p className="text-xs text-slate-500">{fmtBytes(a.size)}</p>
                              </div>
                              <button type="button" onClick={() => setAttachments(p => p.filter(x => x.id !== a.id))}
                                className="text-slate-600 hover:text-red-400 transition-colors">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {attachments.length === 0 && (
                        <p className="text-center text-slate-600 text-sm py-4">No files attached — you can proceed without attachments.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 6 — Review */}
                {step === 6 && (
                  <div>
                    <StepHeader icon={CheckCircle2} title="Review & Submit" desc="Confirm all details before submitting your RFQ." />
                    <div className="space-y-4">
                      <ReviewBlock title="Organisation">
                        <ReviewRow label="Name" value={org.organization_name} />
                        <ReviewRow label="Type" value={ORG_TYPES.find(t => t.value === org.organization_type)?.label} />
                        <ReviewRow label="City" value={org.organization_city} />
                        <ReviewRow label="Country" value={org.organization_country} />
                      </ReviewBlock>

                      <ReviewBlock title="Procurement Officer">
                        <ReviewRow label="Name" value={contact.procurement_officer} />
                        <ReviewRow label="Position" value={contact.officer_position} />
                        <ReviewRow label="Email" value={contact.officer_email} />
                        <ReviewRow label="Phone" value={contact.officer_phone} />
                      </ReviewBlock>

                      <ReviewBlock title={`Products (${items.filter(i => i.product_name.trim()).length} items)`}>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-slate-700">
                                <th className="py-2 pr-3 text-left text-slate-400 font-semibold">Product</th>
                                <th className="py-2 pr-3 text-center text-slate-400 font-semibold w-20">Qty</th>
                                <th className="py-2 text-right text-slate-400 font-semibold w-28">Est. Price</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/40">
                              {items.filter(i => i.product_name.trim()).map(it => (
                                <tr key={it.id}>
                                  <td className="py-2 pr-3 text-white">
                                    {it.product_name}
                                    {it.product_sku && <span className="text-slate-500 ml-1.5 font-mono text-[11px]">({it.product_sku})</span>}
                                    {it.description && <p className="text-slate-500 text-[11px] mt-0.5 leading-snug">{it.description}</p>}
                                  </td>
                                  <td className="py-2 pr-3 text-center text-slate-300">{it.quantity} {it.unit}</td>
                                  <td className="py-2 text-right text-slate-300">{it.estimated_unit_price ? `KES ${Number(it.estimated_unit_price).toLocaleString()}` : '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </ReviewBlock>

                      {(project.tender_reference || project.target_budget || project.required_delivery_date || project.project_description) && (
                        <ReviewBlock title="Project Details">
                          <ReviewRow label="Tender Ref" value={project.tender_reference} />
                          <ReviewRow label="Budget" value={project.target_budget ? `KES ${Number(project.target_budget.replace(/,/g, '')).toLocaleString()}` : undefined} />
                          <ReviewRow label="Delivery By" value={project.required_delivery_date ? new Date(project.required_delivery_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined} />
                          <ReviewRow label="Description" value={project.project_description} />
                          <ReviewRow label="Conditions" value={project.special_conditions} />
                        </ReviewBlock>
                      )}

                      {attachments.length > 0 && (
                        <ReviewBlock title={`Attachments (${attachments.length})`}>
                          {attachments.map(a => <ReviewRow key={a.id} label={fmtBytes(a.size)} value={a.name} />)}
                        </ReviewBlock>
                      )}

                      {errors.submit && (
                        <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-700/40 rounded-xl">
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                          <p className="text-sm text-red-300">{errors.submit}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700/50">
                  <button type="button" onClick={back} disabled={step === 1}
                    className="flex items-center gap-2 px-5 py-2.5 border border-slate-600 text-slate-300 text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-25 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>

                  {/* Progress dots */}
                  <div className="flex items-center gap-1.5">
                    {STEPS.map(s => (
                      <div key={s.id} className={`rounded-full transition-all ${s.id === step ? 'w-8 h-2 bg-blue-500' : s.id < step ? 'w-2 h-2 bg-emerald-500' : 'w-2 h-2 bg-slate-700'}`} />
                    ))}
                  </div>

                  {step < 6 ? (
                    <button type="button" onClick={next}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/30">
                      Continue <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button type="button" onClick={submit} disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-lg shadow-emerald-900/30">
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <><ArrowRight className="w-4 h-4" />Submit RFQ</>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

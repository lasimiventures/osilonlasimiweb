import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, AlertCircle, Loader2,
  Building2, Truck, DollarSign, Star, Info, User, Trash2, Plus,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import {
  adminGetSupplierById, adminCreateSupplier, adminUpdateSupplier,
  adminGetSupplierCategories, adminGetSupplierPaymentTerms,
} from '../../lib/database';

function slugify(str: string): string {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

interface Category { id: string; name: string; slug: string }
interface PaymentTerm { id: string; name: string; code: string; default_days: number }

interface ContactRow {
  id?: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  is_primary: boolean;
}

interface FormState {
  name: string;
  slug: string;
  category_id: string;
  supplier_type: string;
  status: string;
  tax_id: string;
  registration_number: string;
  website: string;
  description: string;
  address: string;
  city: string;
  country: string;
  postal_code: string;
  phone: string;
  email: string;
  currency: string;
  payment_terms_id: string;
  lead_time_days: string;
  min_order_value: string;
  is_preferred: boolean;
  distributor_code: string;
  distributor_region: string;
  distributor_exclusivity: boolean;
  parent_distributor_id: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  name: '', slug: '', category_id: '', supplier_type: 'distributor', status: 'active',
  tax_id: '', registration_number: '', website: '', description: '',
  address: '', city: '', country: '', postal_code: '', phone: '', email: '',
  currency: 'KES', payment_terms_id: '', lead_time_days: '0', min_order_value: '0',
  is_preferred: false, distributor_code: '', distributor_region: '',
  distributor_exclusivity: false, parent_distributor_id: '', notes: '',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToForm(raw: any): FormState {
  return {
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    category_id: raw.category_id ?? '',
    supplier_type: raw.supplier_type ?? 'distributor',
    status: raw.status ?? 'active',
    tax_id: raw.tax_id ?? '',
    registration_number: raw.registration_number ?? '',
    website: raw.website ?? '',
    description: raw.description ?? '',
    address: raw.address ?? '',
    city: raw.city ?? '',
    country: raw.country ?? '',
    postal_code: raw.postal_code ?? '',
    phone: raw.phone ?? '',
    email: raw.email ?? '',
    currency: raw.currency ?? 'KES',
    payment_terms_id: raw.payment_terms_id ?? '',
    lead_time_days: String(raw.lead_time_days ?? 0),
    min_order_value: String(raw.min_order_value ?? 0),
    is_preferred: raw.is_preferred ?? false,
    distributor_code: raw.distributor_code ?? '',
    distributor_region: raw.distributor_region ?? '',
    distributor_exclusivity: raw.distributor_exclusivity ?? false,
    parent_distributor_id: raw.parent_distributor_id ?? '',
    notes: raw.notes ?? '',
  };
}

function formToDb(form: FormState) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    category_id: form.category_id || null,
    supplier_type: form.supplier_type,
    status: form.status,
    tax_id: form.tax_id.trim() || null,
    registration_number: form.registration_number.trim() || null,
    website: form.website.trim() || null,
    description: form.description.trim() || null,
    address: form.address.trim() || null,
    city: form.city.trim() || null,
    country: form.country.trim() || null,
    postal_code: form.postal_code.trim() || null,
    phone: form.phone.trim() || null,
    email: form.email.trim() || null,
    currency: form.currency,
    payment_terms_id: form.payment_terms_id || null,
    lead_time_days: Number(form.lead_time_days) || 0,
    min_order_value: Number(form.min_order_value) || 0,
    is_preferred: form.is_preferred,
    preferred_since: form.is_preferred ? new Date().toISOString() : null,
    distributor_code: form.distributor_code.trim() || null,
    distributor_region: form.distributor_region.trim() || null,
    distributor_exclusivity: form.distributor_exclusivity,
    parent_distributor_id: form.parent_distributor_id || null,
    notes: form.notes.trim() || null,
  };
}

const inputCls = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5';

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
        <Icon className="w-4 h-4 text-blue-400" /> {title}
      </h2>
      {children}
    </div>
  );
}

export function AdminSupplierForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerm[]>([]);
  const [parentSuppliers, setParentSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    Promise.all([adminGetSupplierCategories(), adminGetSupplierPaymentTerms()]).then(([cats, terms]) => {
      setCategories(cats as Category[]);
      setPaymentTerms(terms as PaymentTerm[]);
    });
    supabase.from('suppliers').select('id,name').order('name').then(({ data }) => {
      if (data) setParentSuppliers(data as { id: string; name: string }[]);
    });
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      adminGetSupplierById(id).then(raw => {
        if (raw) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const r = raw as any;
          setForm(dbToForm(r));
          setSlugManual(true);
          if (r.supplier_contacts) setContacts(r.supplier_contacts.map((c: ContactRow) => ({ ...c })));
        }
        setLoading(false);
      });
    }
  }, [id, isEdit]);

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  function handleNameChange(value: string) {
    set('name', value);
    if (!slugManual) set('slug', slugify(value));
  }

  function addContact() {
    setContacts(prev => [...prev, { name: '', position: '', email: '', phone: '', is_primary: prev.length === 0 }]);
  }

  function updateContact(index: number, field: keyof ContactRow, value: string | boolean) {
    setContacts(prev => prev.map((c, i) => {
      if (i === index) {
        const updated = { ...c, [field]: value };
        if (field === 'is_primary' && value === true) {
          updated.is_primary = true;
          return updated;
        }
        return updated;
      }
      if (field === 'is_primary' && value === true) {
        return { ...c, is_primary: false };
      }
      return c;
    }));
  }

  function removeContact(index: number) {
    setContacts(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      setError('Name and Slug are required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = formToDb(form);
      let supplierId = id;
      if (isEdit && id) {
        await adminUpdateSupplier(id, payload);
      } else {
        const created = await adminCreateSupplier(payload);
        supplierId = created.id;
      }

      // Save contacts
      if (supplierId) {
        await supabase.from('supplier_contacts').delete().eq('supplier_id', supplierId);
        const validContacts = contacts.filter(c => c.name.trim());
        if (validContacts.length > 0) {
          await supabase.from('supplier_contacts').insert(validContacts.map(c => ({
            supplier_id: supplierId,
            name: c.name.trim(),
            position: c.position.trim() || null,
            email: c.email.trim() || null,
            phone: c.phone.trim() || null,
            is_primary: c.is_primary,
          })));
        }
      }

      navigate('/admin/suppliers');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save supplier.';
      setError(msg.includes('duplicate') || msg.includes('unique') ? 'A supplier with this slug already exists.' : msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-7">
        <Link to="/admin/suppliers" className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{isEdit ? 'Edit Supplier' : 'Add Supplier'}</h1>
          <p className="text-slate-400 text-sm">Manage supplier details, contacts, and distributor info</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <SectionCard title="Basic Information" icon={Building2}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Supplier Name <span className="text-red-400">*</span></label>
                <input value={form.name} onChange={e => handleNameChange(e.target.value)} className={inputCls} placeholder="e.g. Dell Technologies EA" required />
              </div>
              <div>
                <label className={labelCls}>Slug <span className="text-red-400">*</span></label>
                <input value={form.slug} onChange={e => { set('slug', e.target.value); setSlugManual(true); }} className={inputCls} placeholder="dell-technologies-ea" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Supplier Type</label>
                <select value={form.supplier_type} onChange={e => set('supplier_type', e.target.value)} className={inputCls}>
                  <option value="distributor">Distributor</option>
                  <option value="manufacturer">Manufacturer</option>
                  <option value="reseller">Reseller</option>
                  <option value="service_provider">Service Provider</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)} className={inputCls}>
                  <option value="">— Select category —</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blacklisted">Blacklisted</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Website</label>
                <input value={form.website} onChange={e => set('website', e.target.value)} className={inputCls} placeholder="https://www.dell.com" type="url" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} className={`${inputCls} resize-none`} rows={2} placeholder="Short description of this supplier…" />
            </div>
          </div>
        </SectionCard>

        {/* Contacts */}
        <SectionCard title="Supplier Contacts" icon={User}>
          <div className="space-y-3">
            {contacts.length === 0 && (
              <p className="text-sm text-slate-500 py-2">No contacts added yet. Add key account managers or sales reps.</p>
            )}
            {contacts.map((contact, index) => (
              <div key={index} className="p-4 bg-slate-800 border border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input type="checkbox" checked={contact.is_primary} onChange={e => updateContact(index, 'is_primary', e.target.checked)} className="w-3.5 h-3.5 rounded accent-blue-500" />
                    Primary contact
                  </label>
                  <button type="button" onClick={() => removeContact(index)} className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input value={contact.name} onChange={e => updateContact(index, 'name', e.target.value)} className={inputCls} placeholder="Full name" />
                  <input value={contact.position} onChange={e => updateContact(index, 'position', e.target.value)} className={inputCls} placeholder="Position / title" />
                  <input value={contact.email} onChange={e => updateContact(index, 'email', e.target.value)} className={inputCls} placeholder="Email" type="email" />
                  <input value={contact.phone} onChange={e => updateContact(index, 'phone', e.target.value)} className={inputCls} placeholder="Phone" />
                </div>
              </div>
            ))}
            <button type="button" onClick={addContact} className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 font-medium">
              <Plus className="w-3.5 h-3.5" /> Add contact
            </button>
          </div>
        </SectionCard>

        {/* Commercial Terms */}
        <SectionCard title="Commercial Terms" icon={DollarSign}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Currency</label>
                <select value={form.currency} onChange={e => set('currency', e.target.value)} className={inputCls}>
                  {['KES','USD','EUR','GBP','TZS','UGX'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Payment Terms</label>
                <select value={form.payment_terms_id} onChange={e => set('payment_terms_id', e.target.value)} className={inputCls}>
                  <option value="">— Select terms —</option>
                  {paymentTerms.map(t => <option key={t.id} value={t.id}>{t.name} ({t.code})</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Default Lead Time (days)</label>
                <input value={form.lead_time_days} onChange={e => set('lead_time_days', e.target.value)} type="number" min="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Minimum Order Value</label>
                <input value={form.min_order_value} onChange={e => set('min_order_value', e.target.value)} type="number" min="0" step="0.01" className={inputCls} />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Distributor Information */}
        <SectionCard title="Distributor Information" icon={Truck}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Distributor Code</label>
                <input value={form.distributor_code} onChange={e => set('distributor_code', e.target.value)} className={inputCls} placeholder="e.g. DELL-EA-001" />
              </div>
              <div>
                <label className={labelCls}>Distributor Region</label>
                <input value={form.distributor_region} onChange={e => set('distributor_region', e.target.value)} className={inputCls} placeholder="e.g. East Africa" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Parent Distributor</label>
              <select value={form.parent_distributor_id} onChange={e => set('parent_distributor_id', e.target.value)} className={inputCls}>
                <option value="">— None (top-level distributor) —</option>
                {parentSuppliers.filter(s => s.id !== id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">Set if this is a sub-distributor of a larger distributor.</p>
            </div>
            <label className="flex items-start gap-3 p-4 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-600 transition-colors">
              <input type="checkbox" checked={form.distributor_exclusivity} onChange={e => set('distributor_exclusivity', e.target.checked)} className="w-4 h-4 rounded accent-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Exclusive distributor</p>
                <p className="text-xs text-slate-500 mt-0.5">This supplier holds exclusive distribution rights for the region.</p>
              </div>
            </label>
          </div>
        </SectionCard>

        {/* Company Details */}
        <SectionCard title="Company Details" icon={Info}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tax ID / PIN</label>
                <input value={form.tax_id} onChange={e => set('tax_id', e.target.value)} className={inputCls} placeholder="e.g. P051234567X" />
              </div>
              <div>
                <label className={labelCls}>Registration Number</label>
                <input value={form.registration_number} onChange={e => set('registration_number', e.target.value)} className={inputCls} placeholder="Company reg. no." />
              </div>
            </div>
            <div>
              <label className={labelCls}>Address</label>
              <input value={form.address} onChange={e => set('address', e.target.value)} className={inputCls} placeholder="Street address" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>City</label>
                <input value={form.city} onChange={e => set('city', e.target.value)} className={inputCls} placeholder="Nairobi" />
              </div>
              <div>
                <label className={labelCls}>Country</label>
                <input value={form.country} onChange={e => set('country', e.target.value)} className={inputCls} placeholder="Kenya" />
              </div>
              <div>
                <label className={labelCls}>Postal Code</label>
                <input value={form.postal_code} onChange={e => set('postal_code', e.target.value)} className={inputCls} placeholder="00100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="+254 700 000 000" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input value={form.email} onChange={e => set('email', e.target.value)} className={inputCls} placeholder="sales@supplier.com" type="email" />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Preferred + Notes */}
        <SectionCard title="Preferred & Notes" icon={Star}>
          <div className="space-y-4">
            <label className="flex items-start gap-3 p-4 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-600 transition-colors">
              <input type="checkbox" checked={form.is_preferred} onChange={e => set('is_preferred', e.target.checked)} className="w-4 h-4 rounded accent-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Preferred supplier</p>
                <p className="text-xs text-slate-500 mt-0.5">Preferred suppliers are prioritized in procurement and shown with a star badge.</p>
              </div>
            </label>
            <div>
              <label className={labelCls}>Internal Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} className={`${inputCls} resize-none`} rows={3} placeholder="Private notes about this supplier…" />
            </div>
          </div>
        </SectionCard>

        {/* Save bar */}
        <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur border-t border-slate-800 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/admin/suppliers" className="text-sm text-slate-400 hover:text-white transition-colors">Cancel</Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Supplier'}
          </button>
        </div>

      </form>
    </div>
  );
}

import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, AlertCircle, Loader2,
  Layers, ImagePlus, Tag, Info,
} from 'lucide-react';
import { adminCreateCategory, adminUpdateCategory, adminGetCategoryById } from '../../lib/database';

// ─── helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── constants ────────────────────────────────────────────────────────────────

const ICON_SUGGESTIONS = [
  'Laptop', 'Monitor', 'Desktop', 'Server', 'Smartphone', 'Tablet',
  'Printer', 'Wifi', 'Shield', 'Camera', 'Code', 'Package',
  'Database', 'Cloud', 'Plug', 'Headphones', 'Mouse', 'Keyboard',
  'HardDrive', 'Cpu', 'Bluetooth', 'Usb', 'Network', 'Lock',
];

// ─── types ────────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  allow_buy_now: boolean;
  allow_quote: boolean;
  allow_bulk_quote: boolean;
}

const EMPTY_FORM: FormState = {
  name: '', slug: '', description: '', image: '', icon: '',
  allow_buy_now: true, allow_quote: true, allow_bulk_quote: true,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToForm(raw: any): FormState {
  return {
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    description: raw.description ?? '',
    image: raw.image ?? '',
    icon: raw.icon ?? '',
    allow_buy_now: raw.allow_buy_now ?? true,
    allow_quote: raw.allow_quote ?? true,
    allow_bulk_quote: raw.allow_bulk_quote ?? true,
  };
}

function formToDb(form: FormState) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || null,
    image: form.image.trim() || null,
    icon: form.icon.trim() || null,
    allow_buy_now: form.allow_buy_now,
    allow_quote: form.allow_quote,
    allow_bulk_quote: form.allow_bulk_quote,
  };
}

// ─── shared styles ────────────────────────────────────────────────────────────

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

// ─── main component ───────────────────────────────────────────────────────────

export function AdminCategoryForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [productCount, setProductCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);

  useEffect(() => {
    if (isEdit && id) {
      adminGetCategoryById(id).then(raw => {
        if (raw) {
          setForm(dbToForm(raw));
          setProductCount(raw.product_count ?? 0);
          setSlugManual(true);
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

  function handleSlugChange(value: string) {
    set('slug', value);
    setSlugManual(true);
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
      if (isEdit && id) {
        await adminUpdateCategory(id, payload);
      } else {
        await adminCreateCategory(payload);
      }
      navigate('/admin/categories');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save category.';
      setError(msg.includes('duplicate') || msg.includes('unique') ? 'A category with this name or slug already exists.' : msg);
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
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-7">
        <Link
          to="/admin/categories"
          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{isEdit ? 'Edit Category' : 'Add Category'}</h1>
          {isEdit && productCount !== null && (
            <p className="text-slate-400 text-sm">{productCount} product{productCount !== 1 ? 's' : ''} in this category</p>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <SectionCard title="Basic Information" icon={Layers}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Category Name <span className="text-red-400">*</span></label>
              <input
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                className={inputCls}
                placeholder="e.g. Laptops"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Slug <span className="text-red-400">*</span></label>
              <input
                value={form.slug}
                onChange={e => handleSlugChange(e.target.value)}
                className={inputCls}
                placeholder="laptops"
              />
              <p className="text-xs text-slate-500 mt-1">Used in URLs: /category/<span className="font-mono text-slate-400">{form.slug || 'slug'}</span></p>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="Short description of this product category…"
              />
            </div>
          </div>
        </SectionCard>

        {/* Image & Icon */}
        <SectionCard title="Appearance" icon={ImagePlus}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Category Image URL</label>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-slate-800 rounded-xl overflow-hidden ring-1 ring-slate-700 flex-shrink-0">
                  {form.image ? (
                    <img src={form.image} alt={form.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImagePlus className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                </div>
                <input
                  value={form.image}
                  onChange={e => set('image', e.target.value)}
                  className={`${inputCls} flex-1`}
                  placeholder="https://images.pexels.com/photos/…"
                />
              </div>
            </div>
            <div>
              <label className={labelCls}>Icon Name <span className="text-slate-500 font-normal">(Lucide icon)</span></label>
              <input
                value={form.icon}
                onChange={e => set('icon', e.target.value)}
                list="icon-options"
                className={inputCls}
                placeholder="Laptop"
              />
              <datalist id="icon-options">
                {ICON_SUGGESTIONS.map(name => <option key={name} value={name} />)}
              </datalist>
              <p className="text-xs text-slate-500 mt-1">Used to display an icon in navigation menus and category listings.</p>
            </div>
          </div>
        </SectionCard>

        {/* Commerce Settings */}
        <SectionCard title="Commerce Settings" icon={Tag}>
          <div className="space-y-3">
            {[
              { key: 'allow_buy_now', label: 'Allow Buy Now', desc: 'Products in this category can be purchased directly via the shopping cart.' },
              { key: 'allow_quote', label: 'Allow Quote Requests', desc: 'Products in this category can be added to the quote cart.' },
              { key: 'allow_bulk_quote', label: 'Allow Bulk Quotes', desc: 'Products in this category support bulk pricing requests.' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 p-4 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-600 transition-colors">
                <input
                  type="checkbox"
                  checked={form[key as keyof FormState] as boolean}
                  onChange={e => set(key as keyof FormState, e.target.checked as never)}
                  className="w-4 h-4 rounded accent-blue-500 mt-0.5 flex-shrink-0"
                />
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-4 p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0" />
              Commerce settings here act as category-level defaults. Individual product settings take precedence.
            </p>
          </div>
        </SectionCard>

        {/* Save bar */}
        <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur border-t border-slate-800 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/admin/categories" className="text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
          </button>
        </div>

      </form>
    </div>
  );
}

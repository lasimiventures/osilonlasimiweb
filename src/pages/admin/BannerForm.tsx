import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, Eye, Image } from 'lucide-react';
import { adminGetBannerById, adminCreateBanner, adminUpdateBanner } from '../../lib/database';

interface FormState {
  title: string;
  subtitle: string;
  badge_text: string;
  cta_primary_text: string;
  cta_primary_link: string;
  cta_secondary_text: string;
  cta_secondary_link: string;
  image_url: string;
  banner_type: 'hero' | 'promo';
  sort_order: string;
  is_active: boolean;
}

const EMPTY: FormState = {
  title: '',
  subtitle: '',
  badge_text: '',
  cta_primary_text: 'Shop Now',
  cta_primary_link: '/products',
  cta_secondary_text: '',
  cta_secondary_link: '',
  image_url: '',
  banner_type: 'hero',
  sort_order: '0',
  is_active: true,
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-600 mt-1">{hint}</p>}
    </div>
  );
}

const INPUT = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

export function AdminBannerForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!isEdit) return;
    adminGetBannerById(id).then(data => {
      if (!data) { setError('Banner not found.'); setLoading(false); return; }
      setForm({
        title: data.title,
        subtitle: data.subtitle ?? '',
        badge_text: data.badgeText ?? '',
        cta_primary_text: data.ctaPrimaryText ?? 'Shop Now',
        cta_primary_link: data.ctaPrimaryLink ?? '/products',
        cta_secondary_text: data.ctaSecondaryText ?? '',
        cta_secondary_link: data.ctaSecondaryLink ?? '',
        image_url: data.imageUrl ?? '',
        banner_type: data.bannerType,
        sort_order: String(data.sortOrder),
        is_active: data.isActive,
      });
      setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, [id, isEdit]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      badge_text: form.badge_text.trim() || null,
      cta_primary_text: form.cta_primary_text.trim() || null,
      cta_primary_link: form.cta_primary_link.trim() || null,
      cta_secondary_text: form.cta_secondary_text.trim() || null,
      cta_secondary_link: form.cta_secondary_link.trim() || null,
      image_url: form.image_url.trim() || null,
      banner_type: form.banner_type,
      sort_order: parseInt(form.sort_order, 10) || 0,
      is_active: form.is_active,
    };
    try {
      if (isEdit) {
        await adminUpdateBanner(id, payload);
      } else {
        await adminCreateBanner(payload);
      }
      navigate('/admin/banners');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed.');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link to="/admin/banners" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Banners
      </Link>

      <h1 className="text-xl font-bold text-white mb-6">{isEdit ? 'Edit Banner' : 'New Banner'}</h1>

      {error && (
        <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/40 rounded-xl px-4 py-3 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Banner type */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Banner Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {(['hero', 'promo'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => set('banner_type', type)}
                className={`flex flex-col items-start p-4 rounded-xl border transition-all ${
                  form.banner_type === type
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center mb-2 ${
                  form.banner_type === type ? 'bg-blue-500/20' : 'bg-slate-800'
                }`}>
                  {type === 'hero' ? (
                    <Eye className={`w-4 h-4 ${form.banner_type === type ? 'text-blue-400' : 'text-slate-500'}`} />
                  ) : (
                    <Image className={`w-4 h-4 ${form.banner_type === type ? 'text-blue-400' : 'text-slate-500'}`} />
                  )}
                </div>
                <p className={`text-sm font-semibold ${form.banner_type === type ? 'text-white' : 'text-slate-400'}`}>
                  {type === 'hero' ? 'Hero Carousel' : 'Promo Card'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {type === 'hero' ? 'Full-width homepage carousel' : '3-column promotional grid'}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Content</h2>
          <Field label="Title *">
            <input required value={form.title} onChange={e => set('title', e.target.value)}
              placeholder="e.g. Enterprise ICT Solutions for East Africa" className={INPUT} />
          </Field>
          <Field label="Subtitle" hint="Supporting copy shown below the title.">
            <textarea value={form.subtitle} onChange={e => set('subtitle', e.target.value)}
              rows={2} placeholder="Short supporting description…" className={INPUT + ' resize-none'} />
          </Field>
          <Field label="Badge Text" hint='Small label shown on the banner, e.g. "New", "Limited Offer"'>
            <input value={form.badge_text} onChange={e => set('badge_text', e.target.value)}
              placeholder="e.g. Authorized Dealer" className={INPUT} />
          </Field>
        </div>

        {/* Call-to-action */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Call-to-Action Buttons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Primary Button Text">
              <input value={form.cta_primary_text} onChange={e => set('cta_primary_text', e.target.value)}
                placeholder="Shop Now" className={INPUT} />
            </Field>
            <Field label="Primary Button Link">
              <input value={form.cta_primary_link} onChange={e => set('cta_primary_link', e.target.value)}
                placeholder="/products" className={INPUT} />
            </Field>
            <Field label="Secondary Button Text" hint="Leave blank to hide.">
              <input value={form.cta_secondary_text} onChange={e => set('cta_secondary_text', e.target.value)}
                placeholder="Request a Quote" className={INPUT} />
            </Field>
            <Field label="Secondary Button Link">
              <input value={form.cta_secondary_link} onChange={e => set('cta_secondary_link', e.target.value)}
                placeholder="/request-quote" className={INPUT} />
            </Field>
          </div>
        </div>

        {/* Image */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Image</h2>
          <Field label="Image URL" hint="Paste a Pexels, Unsplash, or any HTTPS image URL. Recommended: 1200×600px for hero, 800×500px for promo.">
            <input value={form.image_url} onChange={e => set('image_url', e.target.value)}
              placeholder="https://images.pexels.com/…" className={INPUT} />
          </Field>
          {form.image_url && (
            <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-700">
              <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Sort Order" hint="Lower numbers appear first.">
              <input type="number" min={0} value={form.sort_order} onChange={e => set('sort_order', e.target.value)}
                className={INPUT} />
            </Field>
            <div className="flex items-center gap-3 pt-5">
              <button
                type="button"
                onClick={() => set('is_active', !form.is_active)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                  form.is_active ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                  form.is_active ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
              <span className="text-sm text-slate-300">{form.is_active ? 'Active — visible on site' : 'Inactive — hidden from site'}</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : (isEdit ? 'Update Banner' : 'Create Banner')}
          </button>
          <Link to="/admin/banners" className="px-4 py-2.5 text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

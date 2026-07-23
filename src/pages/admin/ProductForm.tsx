import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, AlertCircle,
  Loader2, ImagePlus, Tag, Package, Info, Boxes, DollarSign, Search,
} from 'lucide-react';
import { adminCreateProduct, adminUpdateProduct, adminGetProductById, getCategories, getBrands } from '../../lib/database';
import { supabaseAdmin as supabase } from '../../lib/supabase';

// ─── helpers ──────────────────────────────────────────────────────────────────

function slugify(str: string): string {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── types ────────────────────────────────────────────────────────────────────

interface SpecRow { key: string; value: string }

interface FormState {
  name: string;
  slug: string;
  sku: string;
  brand: string;
  brand_slug: string;
  category: string;
  category_slug: string;
  description: string;
  short_description: string;
  images: string[];
  specifications: SpecRow[];
  price: string;
  cost_price: string;
  selling_price: string;
  distributor_price: string;
  dealer_price: string;
  promotional_price: string;
  promo_start_date: string;
  promo_end_date: string;
  pricing_currency: string;
  availability: string;
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  tags: string;
  datasheet_url: string;
  meta_title: string;
  meta_description: string;
  seo_keywords: string;
  buy_now_enabled: boolean;
  call_for_price: boolean;
  display_price: string;
  price_visible: boolean;
  minimum_order_quantity: string;
  maximum_order_quantity: string;
  // Inventory
  inv_stock_quantity: string;
  inv_reserved_quantity: string;
  inv_incoming_quantity: string;
  inv_reorder_level: string;
  inv_safety_stock: string;
  inv_discontinued: boolean;
  inv_restock_expected_date: string;
  inv_notes: string;
}

const EMPTY_FORM: FormState = {
  name: '', slug: '', sku: '', brand: '', brand_slug: '',
  category: '', category_slug: '',
  description: '', short_description: '',
  images: [''],
  specifications: [],
  price: '', cost_price: '', selling_price: '', distributor_price: '',
  dealer_price: '', promotional_price: '', promo_start_date: '', promo_end_date: '',
  pricing_currency: 'KES', availability: 'in-stock',
  is_featured: false, is_new: false, is_best_seller: false,
  tags: '', datasheet_url: '',
  meta_title: '', meta_description: '', seo_keywords: '',
  buy_now_enabled: true, call_for_price: false,
  display_price: '', price_visible: false,
  minimum_order_quantity: '1', maximum_order_quantity: '',
  inv_stock_quantity: '0', inv_reserved_quantity: '0', inv_incoming_quantity: '0',
  inv_reorder_level: '5', inv_safety_stock: '2', inv_discontinued: false,
  inv_restock_expected_date: '', inv_notes: '',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToForm(raw: any): FormState {
  const specs: SpecRow[] = Object.entries(raw.specifications ?? {}).map(([key, value]) => ({ key, value: String(value) }));
  return {
    name: raw.name ?? '',
    slug: raw.slug ?? '',
    sku: raw.sku ?? '',
    brand: raw.brand ?? '',
    brand_slug: raw.brand_slug ?? '',
    category: raw.category ?? '',
    category_slug: raw.category_slug ?? '',
    description: raw.description ?? '',
    short_description: raw.short_description ?? '',
    images: raw.images?.length ? raw.images : [''],
    specifications: specs.length ? specs : [],
    price: raw.price != null ? String(raw.price) : '',
    cost_price: raw.cost_price != null ? String(raw.cost_price) : '',
    selling_price: raw.selling_price != null ? String(raw.selling_price) : '',
    distributor_price: raw.distributor_price != null ? String(raw.distributor_price) : '',
    dealer_price: raw.dealer_price != null ? String(raw.dealer_price) : '',
    promotional_price: raw.promotional_price != null ? String(raw.promotional_price) : '',
    promo_start_date: raw.promo_start_date ?? '',
    promo_end_date: raw.promo_end_date ?? '',
    pricing_currency: raw.pricing_currency ?? 'KES',
    availability: raw.availability ?? 'in-stock',
    is_featured: raw.is_featured ?? false,
    is_new: raw.is_new ?? false,
    is_best_seller: raw.is_best_seller ?? false,
    tags: (raw.tags ?? []).join(', '),
    datasheet_url: raw.datasheet_url ?? '',
    meta_title: raw.meta_title ?? '',
    meta_description: raw.meta_description ?? '',
    seo_keywords: (raw.seo_keywords ?? []).join(', '),
    buy_now_enabled: raw.buy_now_enabled ?? true,
    call_for_price: raw.call_for_price ?? false,
    display_price: raw.display_price != null ? String(raw.display_price) : '',
    price_visible: raw.price_visible ?? false,
    minimum_order_quantity: String(raw.minimum_order_quantity ?? 1),
    maximum_order_quantity: raw.maximum_order_quantity != null ? String(raw.maximum_order_quantity) : '',
    inv_stock_quantity: String(raw.product_inventory?.stock_quantity ?? 0),
    inv_reserved_quantity: String(raw.product_inventory?.reserved_quantity ?? 0),
    inv_incoming_quantity: String(raw.product_inventory?.incoming_quantity ?? 0),
    inv_reorder_level: String(raw.product_inventory?.reorder_level ?? 5),
    inv_safety_stock: String(raw.product_inventory?.safety_stock ?? 2),
    inv_discontinued: raw.product_inventory?.discontinued ?? false,
    inv_restock_expected_date: raw.product_inventory?.restock_expected_date ?? '',
    inv_notes: raw.product_inventory?.notes ?? '',
  };
}

function formToDb(form: FormState) {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    sku: form.sku.trim(),
    brand: form.brand.trim(),
    brand_slug: form.brand_slug.trim() || slugify(form.brand),
    category: form.category.trim(),
    category_slug: form.category_slug.trim() || slugify(form.category),
    description: form.description.trim(),
    short_description: form.short_description.trim(),
    images: form.images.map(u => u.trim()).filter(Boolean),
    specifications: Object.fromEntries(
      form.specifications.filter(s => s.key.trim()).map(s => [s.key.trim(), s.value.trim()])
    ),
    price: form.price ? parseFloat(form.price) : null,
    cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
    selling_price: form.selling_price ? parseFloat(form.selling_price) : null,
    distributor_price: form.distributor_price ? parseFloat(form.distributor_price) : null,
    dealer_price: form.dealer_price ? parseFloat(form.dealer_price) : null,
    promotional_price: form.promotional_price ? parseFloat(form.promotional_price) : null,
    promo_start_date: form.promo_start_date || null,
    promo_end_date: form.promo_end_date || null,
    pricing_currency: form.pricing_currency || 'KES',
    availability: form.availability,
    is_featured: form.is_featured,
    is_new: form.is_new,
    is_best_seller: form.is_best_seller,
    tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    datasheet_url: form.datasheet_url.trim() || null,
    meta_title: form.meta_title.trim() || null,
    meta_description: form.meta_description.trim() || null,
    seo_keywords: form.seo_keywords.split(',').map(k => k.trim()).filter(Boolean),
    buy_now_enabled: form.buy_now_enabled,
    call_for_price: form.call_for_price,
    display_price: form.display_price ? parseFloat(form.display_price) : null,
    price_visible: form.price_visible,
    minimum_order_quantity: parseInt(form.minimum_order_quantity) || 1,
    maximum_order_quantity: form.maximum_order_quantity ? parseInt(form.maximum_order_quantity) : null,
  };
}

// ─── shared input styles ──────────────────────────────────────────────────────

const inputCls = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all';
const labelCls = 'block text-sm font-medium text-slate-300 mb-1.5';

// ─── sub-components ───────────────────────────────────────────────────────────

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

export function AdminProductForm() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugManual, setSlugManual] = useState(false);

  // Options for datalists
  const [categoryOptions, setCategoryOptions] = useState<{ name: string; slug: string }[]>([]);
  const [brandOptions, setBrandOptions] = useState<{ name: string; slug: string }[]>([]);

  useEffect(() => {
    getCategories().then(data => setCategoryOptions((data ?? []).map(c => ({ name: c.name, slug: c.slug }))));
    getBrands().then(data => setBrandOptions((data ?? []).map(b => ({ name: b.name, slug: b.slug }))));
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      adminGetProductById(id).then(raw => {
        if (raw) { setForm(dbToForm(raw)); setSlugManual(true); }
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

  function handleBrandSelect(name: string) {
    const match = brandOptions.find(b => b.name === name);
    setForm(prev => ({ ...prev, brand: name, brand_slug: match?.slug ?? slugify(name) }));
  }

  function handleCategorySelect(name: string) {
    const match = categoryOptions.find(c => c.name === name);
    setForm(prev => ({ ...prev, category: name, category_slug: match?.slug ?? slugify(name) }));
  }

  // Images
  function setImage(i: number, val: string) {
    const next = [...form.images];
    next[i] = val;
    set('images', next);
  }
  function addImage() { set('images', [...form.images, '']); }
  function removeImage(i: number) { set('images', form.images.filter((_, idx) => idx !== i)); }

  // Specs
  function setSpec(i: number, field: 'key' | 'value', val: string) {
    const next = form.specifications.map((s, idx) => idx === i ? { ...s, [field]: val } : s);
    set('specifications', next);
  }
  function addSpec() { set('specifications', [...form.specifications, { key: '', value: '' }]); }
  function removeSpec(i: number) { set('specifications', form.specifications.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim() || !form.brand.trim() || !form.category.trim()) {
      setError('Name, SKU, Brand, and Category are required.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!form.slug.trim()) {
      setError('Slug is required. It will be auto-generated from the name if left empty.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = formToDb(form);
      let productId = id;
      if (isEdit && id) {
        await adminUpdateProduct(id, payload);
      } else {
        const { data: created } = await adminCreateProduct(payload);
        if (created?.[0]?.id) productId = created[0].id;
      }

      if (productId) {
        const invPayload = {
          product_id: productId,
          stock_quantity: parseInt(form.inv_stock_quantity) || 0,
          reserved_quantity: parseInt(form.inv_reserved_quantity) || 0,
          incoming_quantity: parseInt(form.inv_incoming_quantity) || 0,
          reorder_level: parseInt(form.inv_reorder_level) || 5,
          safety_stock: parseInt(form.inv_safety_stock) || 2,
          discontinued: form.inv_discontinued,
          restock_expected_date: form.inv_restock_expected_date || null,
          notes: form.inv_notes || null,
        };
        await supabase.from('product_inventory').upsert(invPayload, { onConflict: 'product_id' });
      }

      navigate('/admin/products');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save product.';
      setError(msg.includes('duplicate') || msg.includes('unique') ? 'A product with this slug or SKU already exists.' : msg);
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
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-4 mb-7">
        <Link
          to="/admin/products"
          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <p className="text-slate-400 text-sm">{isEdit ? `ID: ${id}` : 'Fill in the details below'}</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-6">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic Info */}
        <SectionCard title="Basic Information" icon={Package}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>Product Name <span className="text-red-400">*</span></label>
              <input
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                className={inputCls}
                placeholder="e.g. Dell Latitude 5540 Business Laptop"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Slug <span className="text-red-400">*</span></label>
              <input
                value={form.slug}
                onChange={e => handleSlugChange(e.target.value)}
                className={inputCls}
                placeholder="dell-latitude-5540-business-laptop"
              />
              <p className="text-xs text-slate-500 mt-1">URL identifier. Auto-generated from name.</p>
            </div>
            <div>
              <label className={labelCls}>SKU <span className="text-red-400">*</span></label>
              <input
                value={form.sku}
                onChange={e => set('sku', e.target.value)}
                className={inputCls}
                placeholder="DELL-LAT-5540-I7-256"
                required
              />
            </div>
            <div>
              <label className={labelCls}>Brand <span className="text-red-400">*</span></label>
              <input
                value={form.brand}
                onChange={e => handleBrandSelect(e.target.value)}
                list="brand-options"
                className={inputCls}
                placeholder="Dell"
                required
              />
              <datalist id="brand-options">
                {brandOptions.map(b => <option key={b.slug} value={b.name} />)}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Category <span className="text-red-400">*</span></label>
              <input
                value={form.category}
                onChange={e => handleCategorySelect(e.target.value)}
                list="category-options"
                className={inputCls}
                placeholder="Laptops"
                required
              />
              <datalist id="category-options">
                {categoryOptions.map(c => <option key={c.slug} value={c.name} />)}
              </datalist>
            </div>
          </div>
        </SectionCard>

        {/* Descriptions */}
        <SectionCard title="Descriptions" icon={Info}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Short Description</label>
              <input
                value={form.short_description}
                onChange={e => set('short_description', e.target.value)}
                className={inputCls}
                placeholder="One-line summary shown in product cards"
                maxLength={200}
              />
              <p className="text-xs text-slate-500 mt-1">{form.short_description.length}/200 characters</p>
            </div>
            <div>
              <label className={labelCls}>Full Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                className={`${inputCls} resize-none`}
                rows={5}
                placeholder="Detailed product description for the product detail page…"
              />
            </div>
          </div>
        </SectionCard>

        {/* Availability & Flags */}
        <SectionCard title="Availability & Status" icon={Package}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelCls}>Availability <span className="text-red-400">*</span></label>
              <select
                value={form.availability}
                onChange={e => set('availability', e.target.value)}
                className={`${inputCls} appearance-none`}
              >
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
                <option value="pre-order">Pre-Order</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'is_featured', label: 'Featured' },
              { key: 'is_new', label: 'New Arrival' },
              { key: 'is_best_seller', label: 'Best Seller' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-500 transition-colors">
                <input
                  type="checkbox"
                  checked={form[key as keyof FormState] as boolean}
                  onChange={e => set(key as keyof FormState, e.target.checked as never)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-sm text-slate-300">{label}</span>
              </label>
            ))}
          </div>
        </SectionCard>

        {/* Images */}
        <SectionCard title="Product Images" icon={ImagePlus}>
          <div className="space-y-2.5 mb-3">
            {form.images.map((url, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-10 h-10 bg-slate-800 rounded-lg overflow-hidden ring-1 ring-slate-700 flex-shrink-0">
                  {url && <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />}
                </div>
                <input
                  value={url}
                  onChange={e => setImage(i, e.target.value)}
                  className={`${inputCls} flex-1`}
                  placeholder="https://images.pexels.com/photos/…"
                />
                {form.images.length > 1 && (
                  <button type="button" onClick={() => removeImage(i)} className="text-slate-500 hover:text-red-400 flex-shrink-0 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addImage}
            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Image URL
          </button>
          <p className="text-xs text-slate-500 mt-2">Use Pexels stock photo URLs or your own hosted images.</p>
        </SectionCard>

        {/* Specifications */}
        <SectionCard title="Technical Specifications" icon={Package}>
          {form.specifications.length > 0 && (
            <div className="space-y-2 mb-3">
              {form.specifications.map((spec, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={spec.key}
                    onChange={e => setSpec(i, 'key', e.target.value)}
                    className={`${inputCls} flex-1`}
                    placeholder="Spec name (e.g. Processor)"
                  />
                  <input
                    value={spec.value}
                    onChange={e => setSpec(i, 'value', e.target.value)}
                    className={`${inputCls} flex-1`}
                    placeholder="Value (e.g. Intel Core i7-1365U)"
                  />
                  <button type="button" onClick={() => removeSpec(i)} className="text-slate-500 hover:text-red-400 flex-shrink-0 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {form.specifications.length === 0 && (
            <p className="text-sm text-slate-500 mb-3">No specifications added yet.</p>
          )}
          <button
            type="button"
            onClick={addSpec}
            className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Specification
          </button>
        </SectionCard>

        {/* Tags */}
        <SectionCard title="Tags" icon={Tag}>
          <label className={labelCls}>Tags <span className="text-slate-500 font-normal">(comma-separated)</span></label>
          <input
            value={form.tags}
            onChange={e => set('tags', e.target.value)}
            className={inputCls}
            placeholder="laptop, business, dell, i7, 16gb"
          />
          <p className="text-xs text-slate-500 mt-2">Tags improve search visibility and product discovery.</p>
        </SectionCard>

        {/* Pricing & Commerce */}
        <SectionCard title="Pricing & Commerce" icon={Tag}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className={labelCls}>Base Price (KES) <span className="text-slate-500 font-normal">(optional)</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                className={inputCls}
                placeholder="85000"
              />
              <p className="text-xs text-slate-500 mt-1">Internal reference price. Not shown publicly unless price_visible is on.</p>
            </div>
            <div>
              <label className={labelCls}>Display Price (KES) <span className="text-slate-500 font-normal">(optional)</span></label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.display_price}
                onChange={e => set('display_price', e.target.value)}
                className={inputCls}
                placeholder="89000"
              />
              <p className="text-xs text-slate-500 mt-1">Price shown to customers if price_visible is enabled.</p>
            </div>
            <div>
              <label className={labelCls}>Minimum Order Quantity</label>
              <input
                type="number"
                min="1"
                value={form.minimum_order_quantity}
                onChange={e => set('minimum_order_quantity', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Maximum Order Quantity <span className="text-slate-500 font-normal">(leave blank for no limit)</span></label>
              <input
                type="number"
                min="1"
                value={form.maximum_order_quantity}
                onChange={e => set('maximum_order_quantity', e.target.value)}
                className={inputCls}
                placeholder="No limit"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { key: 'buy_now_enabled', label: 'Buy Now Enabled', desc: 'Show Buy Now button' },
              { key: 'call_for_price', label: 'Call for Price', desc: 'Show call button instead' },
              { key: 'price_visible', label: 'Show Price', desc: 'Display price publicly' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-start gap-3 p-3 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-500 transition-colors">
                <input
                  type="checkbox"
                  checked={form[key as keyof FormState] as boolean}
                  onChange={e => set(key as keyof FormState, e.target.checked as never)}
                  className="w-4 h-4 rounded accent-blue-500 mt-0.5"
                />
                <div>
                  <p className="text-sm text-slate-300 font-medium">{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </SectionCard>

        {/* Cost & Tiered Pricing */}
        <SectionCard title="Cost & Tiered Pricing" icon={DollarSign}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelCls}>Cost Price ({form.pricing_currency}) <span className="text-slate-500 font-normal">(supplier cost)</span></label>
              <input type="number" min="0" step="0.01" value={form.cost_price}
                onChange={e => set('cost_price', e.target.value)} className={inputCls} placeholder="0.00" />
              <p className="text-xs text-slate-500 mt-1">Used to calculate margin & mark-up. Changes are archived to cost history.</p>
            </div>
            <div>
              <label className={labelCls}>Selling Price ({form.pricing_currency}) <span className="text-slate-500 font-normal">(retail)</span></label>
              <input type="number" min="0" step="0.01" value={form.selling_price}
                onChange={e => set('selling_price', e.target.value)} className={inputCls} placeholder="0.00" />
              <p className="text-xs text-slate-500 mt-1">Standard retail price for B2C customers.</p>
            </div>
            <div>
              <label className={labelCls}>Distributor Price ({form.pricing_currency}) <span className="text-slate-500 font-normal">(tier 1)</span></label>
              <input type="number" min="0" step="0.01" value={form.distributor_price}
                onChange={e => set('distributor_price', e.target.value)} className={inputCls} placeholder="0.00" />
              <p className="text-xs text-slate-500 mt-1">Tiered pricing for distributor accounts.</p>
            </div>
            <div>
              <label className={labelCls}>Dealer Price ({form.pricing_currency}) <span className="text-slate-500 font-normal">(tier 2)</span></label>
              <input type="number" min="0" step="0.01" value={form.dealer_price}
                onChange={e => set('dealer_price', e.target.value)} className={inputCls} placeholder="0.00" />
              <p className="text-xs text-slate-500 mt-1">Tiered pricing for dealer / reseller accounts.</p>
            </div>
            <div>
              <label className={labelCls}>Pricing Currency</label>
              <select value={form.pricing_currency} onChange={e => set('pricing_currency', e.target.value)} className={inputCls}>
                {['KES','USD','EUR','GBP','TZS','UGX'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Promotional pricing */}
          <div className="border-t border-slate-700 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Promotional Price <span className="text-slate-600 normal-case font-normal">(temporary override)</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Promo Price ({form.pricing_currency})</label>
                <input type="number" min="0" step="0.01" value={form.promotional_price}
                  onChange={e => set('promotional_price', e.target.value)} className={inputCls} placeholder="No promo" />
              </div>
              <div>
                <label className={labelCls}>Promo Start Date</label>
                <input type="date" value={form.promo_start_date}
                  onChange={e => set('promo_start_date', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Promo End Date</label>
                <input type="date" value={form.promo_end_date}
                  onChange={e => set('promo_end_date', e.target.value)} className={inputCls} />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">When set and within the date range, promo price overrides selling price. Leave blank for no promotion.</p>
          </div>

          {/* Live margin/markup calculator */}
          {(() => {
            const cost = parseFloat(form.cost_price) || 0;
            const sell = parseFloat(form.selling_price) || 0;
            const today = new Date().toISOString().slice(0, 10);
            const promoActive = form.promotional_price &&
              (!form.promo_start_date || today >= form.promo_start_date) &&
              (!form.promo_end_date || today <= form.promo_end_date);
            const effPrice = promoActive ? (parseFloat(form.promotional_price) || 0) : sell;
            const marginAmt = cost > 0 && effPrice > 0 ? effPrice - cost : null;
            const marginPct = marginAmt !== null ? (marginAmt / effPrice) * 100 : null;
            const markupPct = marginAmt !== null ? (marginAmt / cost) * 100 : null;
            if (cost <= 0 || effPrice <= 0) return null;
            return (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Effective Price</p>
                  <p className="text-sm font-semibold text-white tabular-nums">{form.pricing_currency} {effPrice.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Margin (amount)</p>
                  <p className={`text-sm font-semibold tabular-nums ${marginAmt !== null && marginAmt >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{form.pricing_currency} {marginAmt?.toLocaleString() ?? '—'}</p>
                </div>
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Margin %</p>
                  <p className={`text-sm font-semibold tabular-nums ${marginPct !== null && marginPct >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{marginPct !== null ? `${marginPct.toFixed(1)}%` : '—'}</p>
                </div>
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl">
                  <p className="text-xs text-slate-400 mb-1">Mark-up %</p>
                  <p className={`text-sm font-semibold tabular-nums ${markupPct !== null && markupPct >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{markupPct !== null ? `${markupPct.toFixed(1)}%` : '—'}</p>
                </div>
              </div>
            );
          })()}
        </SectionCard>

        {/* Inventory */}
        <SectionCard title="Inventory Management" icon={Boxes}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Stock Quantity <span className="text-slate-500 font-normal">(on hand)</span></label>
              <input type="number" min={0} value={form.inv_stock_quantity}
                onChange={e => set('inv_stock_quantity', e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Reserved <span className="text-slate-500 font-normal">(pending orders)</span></label>
              <input type="number" min={0} value={form.inv_reserved_quantity}
                onChange={e => set('inv_reserved_quantity', e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Incoming <span className="text-slate-500 font-normal">(on PO)</span></label>
              <input type="number" min={0} value={form.inv_incoming_quantity}
                onChange={e => set('inv_incoming_quantity', e.target.value)}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Reorder Level</label>
              <input type="number" min={0} value={form.inv_reorder_level}
                onChange={e => set('inv_reorder_level', e.target.value)}
                className={inputCls} />
              <p className="text-xs text-slate-500 mt-1">Alert when stock drops to this level.</p>
            </div>
            <div>
              <label className={labelCls}>Safety Stock</label>
              <input type="number" min={0} value={form.inv_safety_stock}
                onChange={e => set('inv_safety_stock', e.target.value)}
                className={inputCls} />
              <p className="text-xs text-slate-500 mt-1">Minimum buffer to keep on hand.</p>
            </div>
            <div>
              <label className={labelCls}>Restock Expected</label>
              <input type="date" value={form.inv_restock_expected_date}
                onChange={e => set('inv_restock_expected_date', e.target.value)}
                className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
            <label className="flex items-start gap-3 p-3 bg-slate-800 border border-slate-700 rounded-xl cursor-pointer hover:border-slate-500 transition-colors sm:col-span-1">
              <input type="checkbox" checked={form.inv_discontinued}
                onChange={e => set('inv_discontinued', e.target.checked)}
                className="w-4 h-4 rounded accent-blue-500 mt-0.5" />
              <div>
                <p className="text-sm text-slate-300 font-medium">Discontinued</p>
                <p className="text-xs text-slate-500">Marks product as retired — overrides stock status.</p>
              </div>
            </label>
            <div className="sm:col-span-2">
              <label className={labelCls}>Inventory Notes <span className="text-slate-500 font-normal">(optional)</span></label>
              <textarea value={form.inv_notes}
                onChange={e => set('inv_notes', e.target.value)} rows={2}
                className={inputCls + ' resize-none'}
                placeholder="Supplier info, restock notes, special handling…" />
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-xl">
            <p className="text-xs text-blue-300/80">
              <Info className="w-3.5 h-3.5 inline mr-1" />
              Availability status is auto-derived: stock &#8804; 0 + incoming {'>'} 0 = Pre-Order; stock &#8804; 0 = Out of Stock;
              stock &#8804; reorder or safety = Low Stock; otherwise In Stock. Discontinued overrides all.
            </p>
          </div>
        </SectionCard>

        {/* Datasheet */}
        <SectionCard title="Documentation" icon={Info}>
          <label className={labelCls}>Datasheet URL <span className="text-slate-500 font-normal">(optional)</span></label>
          <input
            type="url"
            value={form.datasheet_url}
            onChange={e => set('datasheet_url', e.target.value)}
            className={inputCls}
            placeholder="https://…/datasheet.pdf"
          />
        </SectionCard>

        {/* SEO */}
        <SectionCard title="SEO Settings" icon={Search}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Meta Title <span className="text-slate-500 font-normal">(optional)</span></label>
              <input
                value={form.meta_title}
                onChange={e => set('meta_title', e.target.value)}
                className={inputCls}
                placeholder="e.g. HP OMEN 16-am0073dx Gaming Laptop in Kenya | RTX 5060 | OSIL Ltd"
                maxLength={70}
              />
              <p className="text-xs text-slate-500 mt-1">{form.meta_title.length}/70 characters — overrides auto-generated title</p>
            </div>
            <div>
              <label className={labelCls}>Meta Description <span className="text-slate-500 font-normal">(optional)</span></label>
              <textarea
                value={form.meta_description}
                onChange={e => set('meta_description', e.target.value)}
                className={`${inputCls} resize-none`}
                rows={3}
                placeholder="e.g. Buy HP OMEN 16-am0073dx gaming laptop in Kenya. Intel Core Ultra 7, RTX 5060, 16GB DDR5, 1TB SSD. Genuine warranty, fast delivery from OSIL Ltd Nairobi."
                maxLength={160}
              />
              <p className="text-xs text-slate-500 mt-1">{form.meta_description.length}/160 characters — overrides auto-generated description</p>
            </div>
            <div>
              <label className={labelCls}>SEO Keywords <span className="text-slate-500 font-normal">(comma-separated)</span></label>
              <input
                value={form.seo_keywords}
                onChange={e => set('seo_keywords', e.target.value)}
                className={inputCls}
                placeholder="HP OMEN 16-am0073dx Kenya, gaming laptop Nairobi, RTX 5060 laptop Kenya"
              />
              <p className="text-xs text-slate-500 mt-1">Targeted keywords for search engine ranking</p>
            </div>
          </div>
        </SectionCard>

        {/* Save bar */}
        <div className="sticky bottom-0 bg-slate-950/95 backdrop-blur border-t border-slate-800 -mx-6 lg:-mx-8 px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/admin/products" className="text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-600/20 disabled:shadow-none"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>

      </form>
    </div>
  );
}

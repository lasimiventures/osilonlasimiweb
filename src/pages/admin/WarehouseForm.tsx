import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Save, Plus, Trash2, Loader2, Warehouse,
  Users, Layers, Boxes, Package, MapPin, Phone, Mail,
  AlertCircle, Edit3, X, Check,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Tab = 'details' | 'contacts' | 'locations' | 'stock';

interface ContactRow {
  id: string;
  name: string;
  role: string | null;
  phone: string | null;
  email: string | null;
  is_primary: boolean;
  notes: string | null;
}

interface ZoneRow {
  id: string;
  name: string;
  code: string;
  description: string | null;
  sort_order: number;
  bins: BinRow[];
}

interface BinRow {
  id: string;
  zone_id: string;
  name: string;
  code: string;
  description: string | null;
  max_capacity: number | null;
  is_active: boolean;
}

interface StockRow {
  id: string;
  product_id: string;
  quantity_on_hand: number;
  quantity_reserved: number;
  zone_id: string | null;
  bin_id: string | null;
  product_name: string;
  product_sku: string;
  zone_name: string | null;
  bin_name: string | null;
}

const inputCls = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40';
const labelCls = 'block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider';

export function AdminWarehouseForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [tab, setTab] = useState<Tab>('details');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Details form
  const [form, setForm] = useState({
    name: '', code: '', address_line1: '', address_line2: '',
    city: '', county: '', country: 'Kenya', postal_code: '',
    phone: '', email: '', region: '', is_active: true,
  });

  // Contacts
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', role: '', phone: '', email: '', is_primary: false, notes: '' });

  // Zones + Bins
  const [zones, setZones] = useState<ZoneRow[]>([]);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [zoneForm, setZoneForm] = useState({ name: '', code: '', description: '', sort_order: 0 });
  const [editingBin, setEditingBin] = useState<string | null>(null);
  const [binForm, setBinForm] = useState({ zone_id: '', name: '', code: '', description: '', max_capacity: '', is_active: true });
  const [showBinForm, setShowBinForm] = useState(false);

  // Stock
  const [stock, setStock] = useState<StockRow[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; sku: string }[]>([]);
  const [stockForm, setStockForm] = useState({ product_id: '', quantity_on_hand: '', zone_id: '', bin_id: '' });
  const [showStockForm, setShowStockForm] = useState(false);
  const [editingStock, setEditingStock] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const [whRes, contactsRes, zonesRes, binsRes, stockRes, prodRes] = await Promise.all([
      supabase.from('warehouses').select('*').eq('id', id).maybeSingle(),
      supabase.from('warehouse_contacts').select('*').eq('warehouse_id', id).order('is_primary', { ascending: false }),
      supabase.from('warehouse_zones').select('*').eq('warehouse_id', id).order('sort_order'),
      supabase.from('warehouse_bins').select('*').eq('warehouse_id', id).order('code'),
      supabase.from('warehouse_stock_detail').select('*').eq('warehouse_id', id).order('product_name'),
      supabase.from('products').select('id, name, sku').order('name').limit(500),
    ]);

    if (whRes.data) {
      const w = whRes.data as Record<string, unknown>;
      setForm({
        name: w.name as string, code: w.code as string,
        address_line1: (w.address_line1 as string) ?? '', address_line2: (w.address_line2 as string) ?? '',
        city: (w.city as string) ?? '', county: (w.county as string) ?? '',
        country: (w.country as string) ?? 'Kenya', postal_code: (w.postal_code as string) ?? '',
        phone: (w.phone as string) ?? '', email: (w.email as string) ?? '',
        region: (w.region as string) ?? '', is_active: w.is_active as boolean,
      });
    }
    if (contactsRes.data) setContacts(contactsRes.data as ContactRow[]);

    const zoneList = (zonesRes.data ?? []) as Array<Record<string, unknown>>;
    const binList = (binsRes.data ?? []) as Array<Record<string, unknown>>;
    const zonesWithBins: ZoneRow[] = zoneList.map(z => ({
      id: z.id as string, name: z.name as string, code: z.code as string,
      description: (z.description as string) ?? null, sort_order: z.sort_order as number,
      bins: binList.filter(b => b.zone_id === z.id).map(b => ({
        id: b.id as string, zone_id: b.zone_id as string, name: b.name as string, code: b.code as string,
        description: (b.description as string) ?? null, max_capacity: (b.max_capacity as number) ?? null,
        is_active: b.is_active as boolean,
      })),
    }));
    setZones(zonesWithBins);

    if (stockRes.data) setStock(stockRes.data as StockRow[]);
    if (prodRes.data) setProducts(prodRes.data as { id: string; name: string; sku: string }[]);

    setLoading(false);
  }, [id]);

  useEffect(() => { if (isEdit) load(); }, [isEdit, load]);

  // ─── Save warehouse details ──────────────────────────────────────────────────

  async function saveDetails() {
    if (!form.name.trim() || !form.code.trim()) {
      setError('Warehouse name and code are required.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(), code: form.code.trim().toUpperCase(),
        address_line1: form.address_line1 || null, address_line2: form.address_line2 || null,
        city: form.city || null, county: form.county || null,
        country: form.country || 'Kenya', postal_code: form.postal_code || null,
        phone: form.phone || null, email: form.email || null,
        region: form.region || null, is_active: form.is_active,
      };
      if (isEdit && id) {
        await supabase.from('warehouses').update(payload).eq('id', id);
      } else {
        const { data } = await supabase.from('warehouses').insert(payload).select('id').single();
        if (data?.id) navigate(`/admin/warehouses/${data.id}/edit`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save warehouse.';
      setError(msg.includes('duplicate') || msg.includes('unique') ? 'A warehouse with this name or code already exists.' : msg);
    } finally {
      setSaving(false);
    }
  }

  // ─── Contacts ─────────────────────────────────────────────────────────────────

  async function saveContact() {
    if (!id || !contactForm.name.trim()) return;
    if (editingContact) {
      await supabase.from('warehouse_contacts').update({
        name: contactForm.name.trim(), role: contactForm.role || null,
        phone: contactForm.phone || null, email: contactForm.email || null,
        is_primary: contactForm.is_primary, notes: contactForm.notes || null,
      }).eq('id', editingContact);
    } else {
      await supabase.from('warehouse_contacts').insert({
        warehouse_id: id, name: contactForm.name.trim(), role: contactForm.role || null,
        phone: contactForm.phone || null, email: contactForm.email || null,
        is_primary: contactForm.is_primary, notes: contactForm.notes || null,
      });
    }
    setEditingContact(null);
    setContactForm({ name: '', role: '', phone: '', email: '', is_primary: false, notes: '' });
    await load();
  }

  async function deleteContact(cid: string) {
    if (!confirm('Delete this contact?')) return;
    await supabase.from('warehouse_contacts').delete().eq('id', cid);
    await load();
  }

  function editContact(c: ContactRow) {
    setEditingContact(c.id);
    setContactForm({ name: c.name, role: c.role ?? '', phone: c.phone ?? '', email: c.email ?? '', is_primary: c.is_primary, notes: c.notes ?? '' });
  }

  // ─── Zones ────────────────────────────────────────────────────────────────────

  async function saveZone() {
    if (!id || !zoneForm.name.trim() || !zoneForm.code.trim()) return;
    if (editingZone) {
      await supabase.from('warehouse_zones').update({
        name: zoneForm.name.trim(), code: zoneForm.code.trim().toUpperCase(),
        description: zoneForm.description || null, sort_order: zoneForm.sort_order,
      }).eq('id', editingZone);
    } else {
      await supabase.from('warehouse_zones').insert({
        warehouse_id: id, name: zoneForm.name.trim(), code: zoneForm.code.trim().toUpperCase(),
        description: zoneForm.description || null, sort_order: zoneForm.sort_order,
      });
    }
    setEditingZone(null);
    setZoneForm({ name: '', code: '', description: '', sort_order: 0 });
    await load();
  }

  async function deleteZone(zid: string) {
    if (!confirm('Delete this zone? All bins within it will also be deleted.')) return;
    await supabase.from('warehouse_zones').delete().eq('id', zid);
    await load();
  }

  function editZone(z: ZoneRow) {
    setEditingZone(z.id);
    setZoneForm({ name: z.name, code: z.code, description: z.description ?? '', sort_order: z.sort_order });
  }

  // ─── Bins ─────────────────────────────────────────────────────────────────────

  async function saveBin() {
    if (!id || !binForm.zone_id || !binForm.name.trim() || !binForm.code.trim()) return;
    const payload = {
      zone_id: binForm.zone_id, name: binForm.name.trim(), code: binForm.code.trim().toUpperCase(),
      description: binForm.description || null,
      max_capacity: binForm.max_capacity ? parseInt(binForm.max_capacity) : null,
      is_active: binForm.is_active,
    };
    if (editingBin) {
      await supabase.from('warehouse_bins').update(payload).eq('id', editingBin);
    } else {
      await supabase.from('warehouse_bins').insert(payload);
    }
    setEditingBin(null);
    setShowBinForm(false);
    setBinForm({ zone_id: '', name: '', code: '', description: '', max_capacity: '', is_active: true });
    await load();
  }

  async function deleteBin(bid: string) {
    if (!confirm('Delete this bin?')) return;
    await supabase.from('warehouse_bins').delete().eq('id', bid);
    await load();
  }

  function editBin(b: BinRow) {
    setEditingBin(b.id);
    setShowBinForm(true);
    setBinForm({ zone_id: b.zone_id, name: b.name, code: b.code, description: b.description ?? '', max_capacity: b.max_capacity?.toString() ?? '', is_active: b.is_active });
  }

  // ─── Stock ────────────────────────────────────────────────────────────────────

  async function saveStock() {
    if (!id || !stockForm.product_id || !stockForm.quantity_on_hand) return;
    const payload = {
      product_id: stockForm.product_id, warehouse_id: id,
      quantity_on_hand: parseInt(stockForm.quantity_on_hand) || 0,
      zone_id: stockForm.zone_id || null, bin_id: stockForm.bin_id || null,
    };
    if (editingStock) {
      await supabase.from('warehouse_stock').update({
        quantity_on_hand: payload.quantity_on_hand,
        zone_id: payload.zone_id, bin_id: payload.bin_id,
      }).eq('id', editingStock);
    } else {
      await supabase.from('warehouse_stock').upsert(payload, { onConflict: 'product_id,warehouse_id' });
    }
    setShowStockForm(false);
    setEditingStock(null);
    setStockForm({ product_id: '', quantity_on_hand: '', zone_id: '', bin_id: '' });
    await load();
  }

  async function deleteStock(sid: string) {
    if (!confirm('Remove this stock record?')) return;
    await supabase.from('warehouse_stock').delete().eq('id', sid);
    await load();
  }

  function editStock(s: StockRow) {
    setEditingStock(s.id);
    setShowStockForm(true);
    setStockForm({ product_id: s.product_id, quantity_on_hand: s.quantity_on_hand.toString(), zone_id: s.zone_id ?? '', bin_id: s.bin_id ?? '' });
  }

  const allBins = zones.flatMap(z => z.bins);
  const binsForZone = (zid: string) => allBins.filter(b => b.zone_id === zid);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link to="/admin/warehouses" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">{isEdit ? form.name : 'New Warehouse'}</h1>
        <p className="text-slate-400 text-sm mt-0.5">{isEdit ? form.code : 'Create a new storage facility'}</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700/30 rounded-xl text-sm text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Tabs */}
      {isEdit && (
        <div className="flex gap-1 border-b border-slate-700">
          {([
            { id: 'details' as Tab, label: 'Details', icon: Warehouse },
            { id: 'contacts' as Tab, label: 'Contacts', icon: Users },
            { id: 'locations' as Tab, label: 'Zones & Bins', icon: Layers },
            { id: 'stock' as Tab, label: 'Stock', icon: Package },
          ]).map(({ id: tid, label, icon: Icon }) => (
            <button key={tid} onClick={() => setTab(tid)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === tid ? 'text-blue-400 border-blue-500' : 'text-slate-400 border-transparent hover:text-white'
              }`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      )}

      {/* ─── Details Tab ─────────────────────────────────────────────────────── */}
      {tab === 'details' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Warehouse Name *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls} placeholder="e.g. Nairobi Main Warehouse" />
            </div>
            <div>
              <label className={labelCls}>Code *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                className={inputCls} placeholder="e.g. NBI-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Region</label>
              <input value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}
                className={inputCls} placeholder="e.g. Nairobi, Mombasa, Kisumu" />
            </div>
            <div>
              <label className={labelCls}>City</label>
              <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className={inputCls} placeholder="e.g. Industrial Area" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Address Line 1</label>
              <input value={form.address_line1} onChange={e => setForm(f => ({ ...f, address_line1: e.target.value }))}
                className={inputCls} placeholder="Street address" />
            </div>
            <div>
              <label className={labelCls}>Address Line 2</label>
              <input value={form.address_line2} onChange={e => setForm(f => ({ ...f, address_line2: e.target.value }))}
                className={inputCls} placeholder="Building, unit, etc." />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className={labelCls}>County</label>
              <input value={form.county} onChange={e => setForm(f => ({ ...f, county: e.target.value }))}
                className={inputCls} placeholder="e.g. Nairobi" />
            </div>
            <div>
              <label className={labelCls}>Country</label>
              <input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Postal Code</label>
              <input value={form.postal_code} onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))}
                className={inputCls} placeholder="00100" />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded accent-blue-500" />
                <span className="text-sm text-slate-300">Active</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className={inputCls} placeholder="+254 700 000 000" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className={inputCls} placeholder="warehouse@osil.com" />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={saveDetails} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-sm text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEdit ? 'Save Changes' : 'Create Warehouse'}
            </button>
          </div>
        </div>
      )}

      {/* ─── Contacts Tab ────────────────────────────────────────────────────── */}
      {tab === 'contacts' && (
        <div className="space-y-4">
          {/* Contact form */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">{editingContact ? 'Edit Contact' : 'Add Contact'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Name *</label>
                <input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls} placeholder="Full name" />
              </div>
              <div>
                <label className={labelCls}>Role / Title</label>
                <input value={contactForm.role} onChange={e => setContactForm(f => ({ ...f, role: e.target.value }))}
                  className={inputCls} placeholder="e.g. Warehouse Manager" />
              </div>
              <div>
                <label className={labelCls}>Phone</label>
                <input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
                  className={inputCls} placeholder="+254 700 000 000" />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))}
                  className={inputCls} placeholder="name@osil.com" />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Notes</label>
              <input value={contactForm.notes} onChange={e => setContactForm(f => ({ ...f, notes: e.target.value }))}
                className={inputCls} placeholder="Optional notes" />
            </div>
            <div className="flex items-center justify-between mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={contactForm.is_primary} onChange={e => setContactForm(f => ({ ...f, is_primary: e.target.checked }))}
                  className="w-4 h-4 rounded accent-blue-500" />
                <span className="text-sm text-slate-300">Primary contact</span>
              </label>
              <div className="flex gap-2">
                {editingContact && (
                  <button onClick={() => { setEditingContact(null); setContactForm({ name: '', role: '', phone: '', email: '', is_primary: false, notes: '' }); }}
                    className="px-3 py-2 bg-slate-700 text-sm text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
                )}
                <button onClick={saveContact} disabled={!contactForm.name.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  <Plus className="w-4 h-4" /> {editingContact ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>

          {/* Contacts list */}
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No contacts yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {contacts.map(c => (
                <div key={c.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{c.name}</p>
                        {c.role && <p className="text-xs text-slate-400">{c.role}</p>}
                      </div>
                    </div>
                    {c.is_primary && (
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-300 text-xs font-semibold rounded-full border border-blue-700/40">Primary</span>
                    )}
                  </div>
                  <div className="mt-3 space-y-1">
                    {c.phone && <p className="text-xs text-slate-400 flex items-center gap-1.5"><Phone className="w-3 h-3" /> {c.phone}</p>}
                    {c.email && <p className="text-xs text-slate-400 flex items-center gap-1.5"><Mail className="w-3 h-3" /> {c.email}</p>}
                    {c.notes && <p className="text-xs text-slate-500 mt-1">{c.notes}</p>}
                  </div>
                  <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => editContact(c)}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => deleteContact(c.id)}
                      className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Zones & Bins Tab ─────────────────────────────────────────────────── */}
      {tab === 'locations' && (
        <div className="space-y-4">
          {/* Zone form */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">{editingZone ? 'Edit Zone' : 'Add Zone'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className={labelCls}>Name *</label>
                <input value={zoneForm.name} onChange={e => setZoneForm(f => ({ ...f, name: e.target.value }))}
                  className={inputCls} placeholder="e.g. Bulk Storage" />
              </div>
              <div>
                <label className={labelCls}>Code *</label>
                <input value={zoneForm.code} onChange={e => setZoneForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className={inputCls} placeholder="e.g. BLK" />
              </div>
              <div>
                <label className={labelCls}>Sort Order</label>
                <input type="number" value={zoneForm.sort_order} onChange={e => setZoneForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                  className={inputCls} />
              </div>
            </div>
            <div className="mt-3">
              <label className={labelCls}>Description</label>
              <input value={zoneForm.description} onChange={e => setZoneForm(f => ({ ...f, description: e.target.value }))}
                className={inputCls} placeholder="Optional" />
            </div>
            <div className="flex justify-end gap-2 mt-3">
              {editingZone && (
                <button onClick={() => { setEditingZone(null); setZoneForm({ name: '', code: '', description: '', sort_order: 0 }); }}
                  className="px-3 py-2 bg-slate-700 text-sm text-slate-300 rounded-lg hover:bg-slate-600 transition-colors">Cancel</button>
              )}
              <button onClick={saveZone} disabled={!zoneForm.name.trim() || !zoneForm.code.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                <Plus className="w-4 h-4" /> {editingZone ? 'Update Zone' : 'Add Zone'}
              </button>
            </div>
          </div>

          {/* Zones + Bins */}
          {zones.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No zones yet — create one to start adding bin locations</p>
            </div>
          ) : (
            <div className="space-y-3">
              {zones.map(z => (
                <div key={z.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-700/50 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 text-amber-400" />
                      <div>
                        <p className="text-sm font-semibold text-white">{z.name}</p>
                        <p className="text-xs text-slate-500">{z.code} · {z.bins.length} bin{z.bins.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setShowBinForm(true); setEditingBin(null); setBinForm({ zone_id: z.id, name: '', code: '', description: '', max_capacity: '', is_active: true }); }}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors">
                        <Plus className="w-3 h-3" /> Add Bin
                      </button>
                      <button onClick={() => editZone(z)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => deleteZone(z.id)}
                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Inline bin form */}
                  {showBinForm && binForm.zone_id === z.id && (
                    <div className="px-4 py-3 bg-slate-750 border-b border-slate-700/50">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <input value={binForm.name} onChange={e => setBinForm(f => ({ ...f, name: e.target.value }))}
                          className={inputCls} placeholder="Bin name *" />
                        <input value={binForm.code} onChange={e => setBinForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                          className={inputCls} placeholder="Code *" />
                        <input type="number" value={binForm.max_capacity} onChange={e => setBinForm(f => ({ ...f, max_capacity: e.target.value }))}
                          className={inputCls} placeholder="Max cap." />
                        <input value={binForm.description} onChange={e => setBinForm(f => ({ ...f, description: e.target.value }))}
                          className={inputCls} placeholder="Description" />
                      </div>
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => { setShowBinForm(false); setEditingBin(null); setBinForm({ zone_id: '', name: '', code: '', description: '', max_capacity: '', is_active: true }); }}
                          className="px-3 py-1.5 bg-slate-700 text-xs text-slate-300 rounded-lg hover:bg-slate-600">Cancel</button>
                        <button onClick={saveBin} disabled={!binForm.name.trim() || !binForm.code.trim()}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-xs text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
                          {editingBin ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />} {editingBin ? 'Save' : 'Add Bin'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Bins list */}
                  {z.bins.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
                      {z.bins.map(b => (
                        <div key={b.id} className="flex items-center justify-between p-2.5 bg-slate-750 rounded-lg border border-slate-700/50 group/bin">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{b.name}</p>
                            <p className="text-[11px] text-slate-500">{b.code}{b.max_capacity ? ` · cap ${b.max_capacity}` : ''}</p>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover/bin:opacity-100 transition-opacity">
                            <button onClick={() => editBin(b)}
                              className="w-6 h-6 flex items-center justify-center bg-slate-700 text-slate-400 rounded hover:bg-blue-600 hover:text-white transition-colors">
                              <Edit3 className="w-3 h-3" />
                            </button>
                            <button onClick={() => deleteBin(b.id)}
                              className="w-6 h-6 flex items-center justify-center bg-slate-700 text-slate-400 rounded hover:bg-red-600 hover:text-white transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-xs text-slate-500">No bins in this zone yet.</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Stock Tab ───────────────────────────────────────────────────────── */}
      {tab === 'stock' && (
        <div className="space-y-4">
          {/* Stock form */}
          {showStockForm ? (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">{editingStock ? 'Edit Stock' : 'Add Stock'}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Product *</label>
                  <select value={stockForm.product_id} onChange={e => setStockForm(f => ({ ...f, product_id: e.target.value }))}
                    className={inputCls} disabled={!!editingStock}>
                    <option value="">Select product…</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Quantity on Hand *</label>
                  <input type="number" min={0} value={stockForm.quantity_on_hand} onChange={e => setStockForm(f => ({ ...f, quantity_on_hand: e.target.value }))}
                    className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className={labelCls}>Zone (optional)</label>
                  <select value={stockForm.zone_id} onChange={e => setStockForm(f => ({ ...f, zone_id: e.target.value, bin_id: '' }))}
                    className={inputCls}>
                    <option value="">— None —</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name} ({z.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Bin (optional)</label>
                  <select value={stockForm.bin_id} onChange={e => setStockForm(f => ({ ...f, bin_id: e.target.value }))}
                    className={inputCls} disabled={!stockForm.zone_id}>
                    <option value="">— None —</option>
                    {stockForm.zone_id && binsForZone(stockForm.zone_id).map(b => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <button onClick={() => { setShowStockForm(false); setEditingStock(null); setStockForm({ product_id: '', quantity_on_hand: '', zone_id: '', bin_id: '' }); }}
                  className="px-3 py-2 bg-slate-700 text-sm text-slate-300 rounded-lg hover:bg-slate-600">Cancel</button>
                <button onClick={saveStock} disabled={!stockForm.product_id || !stockForm.quantity_on_hand}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {editingStock ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {editingStock ? 'Save' : 'Add Stock'}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowStockForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-sm text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Add Stock
            </button>
          )}

          {/* Stock table */}
          {stock.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No stock in this warehouse yet</p>
            </div>
          ) : (
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">On Hand</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Reserved</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Available</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {stock.map(s => (
                      <tr key={s.id} className="hover:bg-slate-700/30 transition-colors group">
                        <td className="px-4 py-3">
                          <Link to={`/admin/products/${s.product_id}/edit`} className="text-white text-sm font-medium hover:text-blue-400">
                            {s.product_name}
                          </Link>
                          <p className="text-xs text-slate-500">{s.product_sku}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-bold text-white">{s.quantity_on_hand}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm ${s.quantity_reserved > 0 ? 'text-amber-400 font-medium' : 'text-slate-500'}`}>{s.quantity_reserved}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-bold ${s.quantity_on_hand - s.quantity_reserved <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {s.quantity_on_hand - s.quantity_reserved}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {s.zone_name || s.bin_name ? (
                            <span className="text-xs text-slate-300">
                              {s.zone_name && <span className="inline-flex items-center gap-1"><Layers className="w-3 h-3 text-slate-500" /> {s.zone_name}</span>}
                              {s.zone_name && s.bin_name && <span className="text-slate-600 mx-1">/</span>}
                              {s.bin_name && <span className="inline-flex items-center gap-1"><Boxes className="w-3 h-3 text-slate-500" /> {s.bin_name}</span>}
                            </span>
                          ) : <span className="text-xs text-slate-500">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => editStock(s)}
                              className="w-7 h-7 flex items-center justify-center bg-slate-700 text-slate-400 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteStock(s.id)}
                              className="w-7 h-7 flex items-center justify-center bg-slate-700 text-slate-400 rounded-lg hover:bg-red-600 hover:text-white transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

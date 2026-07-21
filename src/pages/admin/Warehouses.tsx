import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Warehouse, Plus, Search, RefreshCw, MapPin, Phone, Mail,
  Users, Layers, Boxes, Loader2, Edit3, Trash2, Package,
  TrendingUp, AlertTriangle, Download,
} from 'lucide-react';
import { supabaseAdmin as supabase } from '../../lib/supabase';

interface WarehouseRow {
  id: string;
  name: string;
  code: string;
  region: string | null;
  city: string | null;
  is_active: boolean;
  phone: string | null;
  email: string | null;
  contactCount: number;
  zoneCount: number;
  binCount: number;
  stockUnits: number;
}

interface RegionStock {
  region: string;
  warehouseCount: number;
  totalOnHand: number;
  totalAvailable: number;
}

const fmt = (n: number) => n.toLocaleString();

export function AdminWarehouses() {
  const [warehouses, setWarehouses] = useState<WarehouseRow[]>([]);
  const [regions, setRegions] = useState<RegionStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [showInactive, setShowInactive] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [whRes, contactsRes, zonesRes, binsRes, stockRes] = await Promise.all([
      supabase.from('warehouses').select('*').order('name'),
      supabase.from('warehouse_contacts').select('warehouse_id'),
      supabase.from('warehouse_zones').select('warehouse_id'),
      supabase.from('warehouse_bins').select('warehouse_id'),
      supabase.from('warehouse_stock').select('warehouse_id, quantity_on_hand, quantity_reserved'),
    ]);

    const contactMap = new Map<string, number>();
    (contactsRes.data ?? []).forEach((c: { warehouse_id: string }) =>
      contactMap.set(c.warehouse_id, (contactMap.get(c.warehouse_id) ?? 0) + 1));

    const zoneMap = new Map<string, number>();
    (zonesRes.data ?? []).forEach((z: { warehouse_id: string }) =>
      zoneMap.set(z.warehouse_id, (zoneMap.get(z.warehouse_id) ?? 0) + 1));

    const binMap = new Map<string, number>();
    (binsRes.data ?? []).forEach((b: { warehouse_id: string }) =>
      binMap.set(b.warehouse_id, (binMap.get(b.warehouse_id) ?? 0) + 1));

    const stockMap = new Map<string, number>();
    (stockRes.data ?? []).forEach((s: { warehouse_id: string; quantity_on_hand: number }) =>
      stockMap.set(s.warehouse_id, (stockMap.get(s.warehouse_id) ?? 0) + s.quantity_on_hand));

    const rows: WarehouseRow[] = (whRes.data ?? []).map((w: Record<string, unknown>) => ({
      id: w.id as string,
      name: w.name as string,
      code: w.code as string,
      region: (w.region as string) ?? null,
      city: (w.city as string) ?? null,
      is_active: w.is_active as boolean,
      phone: (w.phone as string) ?? null,
      email: (w.email as string) ?? null,
      contactCount: contactMap.get(w.id as string) ?? 0,
      zoneCount: zoneMap.get(w.id as string) ?? 0,
      binCount: binMap.get(w.id as string) ?? 0,
      stockUnits: stockMap.get(w.id as string) ?? 0,
    }));
    setWarehouses(rows);

    // Regional stock summary
    const regionMap = new Map<string, RegionStock>();
    rows.forEach(w => {
      const r = w.region ?? 'Unspecified';
      const existing = regionMap.get(r) ?? { region: r, warehouseCount: 0, totalOnHand: 0, totalAvailable: 0 };
      existing.warehouseCount++;
      existing.totalOnHand += w.stockUnits;
      regionMap.set(r, existing);
    });
    setRegions(Array.from(regionMap.values()).sort((a, b) => b.totalOnHand - a.totalOnHand));

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function deleteWarehouse(id: string, name: string) {
    if (!confirm(`Delete warehouse "${name}"? This will also delete all zones, bins, contacts, and stock records for this warehouse.`)) return;
    setDeleting(id);
    await supabase.from('warehouses').delete().eq('id', id);
    setDeleting(null);
    await load();
  }

  const regionOptions = ['all', ...new Set(warehouses.map(w => w.region ?? 'Unspecified'))];

  const filtered = warehouses.filter(w => {
    const q = search.toLowerCase();
    const matchSearch = !q || [w.name, w.code, w.city, w.region].some(v => v?.toLowerCase().includes(q));
    const matchRegion = filterRegion === 'all' || (w.region ?? 'Unspecified') === filterRegion;
    const matchActive = showInactive || w.is_active;
    return matchSearch && matchRegion && matchActive;
  });

  const totalStock = warehouses.reduce((s, w) => s + w.stockUnits, 0);
  const totalZones = warehouses.reduce((s, w) => s + w.zoneCount, 0);
  const totalBins = warehouses.reduce((s, w) => s + w.binCount, 0);

  function exportCSV() {
    const headers = ['Name', 'Code', 'Region', 'City', 'Active', 'Contacts', 'Zones', 'Bins', 'Stock Units', 'Phone', 'Email'];
    const lines = filtered.map(w => [w.name, w.code, w.region ?? '', w.city ?? '', w.is_active ? 'Yes' : 'No', w.contactCount, w.zoneCount, w.binCount, w.stockUnits, w.phone ?? '', w.email ?? '']
      .map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `OSIL_Warehouses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Warehouse Management</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage warehouses, zones, bins, contacts, and stock transfers</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/warehouses/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-sm text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" /> New Warehouse
          </Link>
          <Link to="/admin/transfers"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-sm text-slate-300 font-semibold rounded-xl hover:bg-slate-700 transition-colors">
            <TrendingUp className="w-4 h-4" /> Stock Transfers
          </Link>
          <button onClick={exportCSV} disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-sm text-slate-300 font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-sm text-slate-300 font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Warehouses', value: warehouses.filter(w => w.is_active).length, icon: Warehouse, color: 'text-blue-400', sub: `${warehouses.length} total` },
          { label: 'Total Stock Units', value: fmt(totalStock), icon: Package, color: 'text-emerald-400', sub: 'across all sites' },
          { label: 'Zones', value: totalZones, icon: Layers, color: 'text-amber-400', sub: 'storage areas' },
          { label: 'Bin Locations', value: totalBins, icon: Boxes, color: 'text-purple-400', sub: 'rack/shelf positions' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className="text-xl font-bold text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Regional Stock Availability */}
      {regions.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Regional Stock Availability</h2>
          </div>
          <div className="divide-y divide-slate-700/50">
            {regions.map(r => (
              <div key={r.region} className="px-4 py-3 flex items-center justify-between hover:bg-slate-700/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{r.region}</p>
                    <p className="text-xs text-slate-500">{r.warehouseCount} warehouse{r.warehouseCount !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">On Hand</p>
                    <p className="text-sm font-bold text-white">{fmt(r.totalOnHand)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Available</p>
                    <p className="text-sm font-bold text-emerald-400">{fmt(r.totalAvailable)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, code, city, region…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
        </div>
        <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
          className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
          {regionOptions.map(r => <option key={r} value={r}>{r === 'all' ? 'All Regions' : r}</option>)}
        </select>
        <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-300 cursor-pointer">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500" />
          Show inactive
        </label>
      </div>

      {/* Warehouses table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Warehouse className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">No warehouses found</p>
            <Link to="/admin/warehouses/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-sm text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Create your first warehouse
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Warehouse</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Contacts</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Zones</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Bins</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map(w => (
                  <tr key={w.id} className="hover:bg-slate-700/30 transition-colors group">
                    <td className="px-4 py-3.5">
                      <Link to={`/admin/warehouses/${w.id}/edit`} className="text-white text-sm font-medium hover:text-blue-400">
                        {w.name}
                      </Link>
                      <p className="text-slate-500 text-xs">{w.code}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-300 text-xs">{w.city ?? '—'}</p>
                      <p className="text-slate-500 text-xs">{w.region ?? 'Unspecified'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                        <Users className="w-3 h-3 text-slate-500" /> {w.contactCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                        <Layers className="w-3 h-3 text-slate-500" /> {w.zoneCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                        <Boxes className="w-3 h-3 text-slate-500" /> {w.binCount}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-bold ${w.stockUnits === 0 ? 'text-slate-500' : 'text-emerald-400'}`}>
                        {fmt(w.stockUnits)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        w.is_active
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-700/40'
                          : 'bg-slate-500/10 text-slate-400 border-slate-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${w.is_active ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        {w.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link to={`/admin/warehouses/${w.id}/edit`}
                          className="w-7 h-7 flex items-center justify-center bg-slate-700 text-slate-400 rounded-lg hover:bg-blue-600 hover:text-white transition-colors">
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => deleteWarehouse(w.id, w.name)} disabled={deleting === w.id}
                          className="w-7 h-7 flex items-center justify-center bg-slate-700 text-slate-400 rounded-lg hover:bg-red-600 hover:text-white disabled:opacity-50 transition-colors">
                          {deleting === w.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact info summary for warehouses that have it */}
      {filtered.some(w => w.phone || w.email) && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Quick Contact Directory</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.filter(w => w.phone || w.email).map(w => (
              <div key={w.id} className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg border border-slate-700/50">
                <Warehouse className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">{w.name}</p>
                  {w.phone && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3" /> {w.phone}</p>}
                  {w.email && <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate"><Mail className="w-3 h-3" /> {w.email}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-500 text-right">{filtered.length} of {warehouses.length} warehouses</p>
      )}
    </div>
  );
}

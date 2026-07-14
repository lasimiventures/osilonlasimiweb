import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet, Search, Shield, Heart, GraduationCap, Briefcase,
  Factory, Building2, ChevronRight, Hash, DollarSign, Calendar,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RFQRow {
  id: string;
  rfq_number: string;
  status: string;
  organization_name: string;
  organization_type: string;
  procurement_officer: string;
  officer_email: string;
  officer_phone: string | null;
  tender_reference: string | null;
  target_budget: number | null;
  required_delivery_date: string | null;
  submitted_at: string;
  rfq_items: { id: string }[];
}

const ALL_STATUSES = ['submitted', 'under_review', 'quoted', 'awarded', 'rejected', 'cancelled'];

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
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtKES(v: number | null) { return v ? `KES ${v.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` : '—'; }
function ago(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function AdminRFQs() {
  const [rfqs, setRFQs] = useState<RFQRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('rfq_requests')
      .select('*, rfq_items(id)')
      .order('submitted_at', { ascending: false });
    if (data) setRFQs(data as RFQRow[]);
    setLoading(false);
  }

  const counts = ALL_STATUSES.reduce<Record<string, number>>((a, s) => {
    a[s] = rfqs.filter(r => r.status === s).length; return a;
  }, {});

  const filtered = rfqs.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || [r.rfq_number, r.organization_name, r.procurement_officer, r.officer_email, r.tender_reference]
      .some(v => v?.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">RFQ Requests</h1>
          <p className="text-slate-400 text-sm mt-0.5">Professional bulk procurement requests from organisations</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl">
          <FileSpreadsheet className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-white font-bold">{rfqs.length}</span>
          <span className="text-slate-500 text-sm">total</span>
        </div>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {[{ v: 'all', label: 'All', count: rfqs.length }, ...ALL_STATUSES.map(s => ({ v: s, label: sl(s), count: counts[s] ?? 0 }))].map(({ v, label, count }) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${statusFilter === v ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}>
            {label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs leading-none ${statusFilter === v ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'}`}>{count}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by RFQ number, organisation, officer, or tender ref…"
          className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500" />
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No RFQs found</p>
            <p className="text-slate-500 text-sm mt-1">RFQs appear when organisations submit via the Bulk Quote page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">RFQ</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Organisation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:table-cell">Officer</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Budget</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Submitted</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {filtered.map(r => {
                  const OrgIcon = ORG_ICON[r.organization_type] ?? Building2;
                  return (
                    <tr key={r.id} className="hover:bg-slate-700/30 transition-colors group">
                      <td className="px-4 py-3.5">
                        <p className="font-mono font-bold text-xs text-white">{r.rfq_number}</p>
                        {r.tender_reference && (
                          <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                            <Hash className="w-3 h-3" />{r.tender_reference}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <OrgIcon className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <div>
                            <p className="text-white font-medium text-xs leading-tight">{r.organization_name}</p>
                            <p className="text-slate-500 text-[11px] capitalize">{r.organization_type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <p className="text-slate-300 text-xs">{r.procurement_officer}</p>
                        <p className="text-slate-500 text-[11px]">{r.officer_email}</p>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-900/40 text-blue-300 text-xs font-bold">
                          {r.rfq_items?.length ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                        {r.target_budget ? (
                          <span className="flex items-center justify-end gap-1 text-xs text-white font-medium">
                            <DollarSign className="w-3 h-3 text-slate-500" />{fmtKES(r.target_budget)}
                          </span>
                        ) : <span className="text-slate-600 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUS_STYLE[r.status] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                          {sl(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right hidden sm:table-cell">
                        <span className="text-slate-400 text-xs">{ago(r.submitted_at)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Link to={`/admin/rfqs/${r.id}`}
                          className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-700 text-slate-400 hover:bg-blue-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-500 text-right">{filtered.length} RFQ{filtered.length !== 1 ? 's' : ''}</p>
      )}
    </div>
  );
}

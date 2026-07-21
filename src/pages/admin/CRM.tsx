import { useState, useEffect, useCallback } from 'react';
import {
  Users, TrendingUp, Download, RefreshCw, Search, Filter,
  CheckCircle, Clock, Link2, ChevronDown, ArrowDownToLine,
  Zap, Database, BarChart3, Globe, Settings, Eye,
  Building2, Mail, Phone, Calendar, DollarSign,
  ShoppingBag, FileText, FileSpreadsheet, AlertCircle,
} from 'lucide-react';
import { supabaseAdmin as supabase } from '../../lib/supabase';
import {
  type CRMContact, type CRMDeal, type CRMTarget, type ExportDataType,
  CONTACT_FIELD_MAPS, DEAL_FIELD_MAPS, CRM_META,
  LIFECYCLE_LABELS, LIFECYCLE_COLORS, DEAL_TYPE_COLORS, STAGE_COLORS,
  generateContactsCSV, generateDealsCSV, downloadCSV,
} from '../../utils/crmExport';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'contacts' | 'deals' | 'export' | 'integrations';

interface ExportLog {
  id: string;
  export_type: string;
  target_crm: string;
  record_count: number;
  exported_by: string | null;
  exported_at: string;
}

const CRM_TARGETS: CRMTarget[] = ['hubspot', 'salesforce', 'zoho', 'dynamics', 'generic'];

const INTEGRATION_CARDS = [
  {
    id: 'hubspot' as CRMTarget,
    capabilities: ['Contact & Company sync', 'Deal pipeline mapping', 'Activity logging', 'Lead scoring'],
    importSteps: ['Go to Contacts → Import', 'Upload the HubSpot CSV', 'Map fields (pre-matched)', 'Import & sync'],
    docUrl: 'https://knowledge.hubspot.com/contacts/import-contacts',
  },
  {
    id: 'salesforce' as CRMTarget,
    capabilities: ['Lead & Contact import', 'Opportunity pipeline', 'Account management', 'Activity history'],
    importSteps: ['Go to Leads → Import', 'Select CSV file', 'Map Salesforce fields', 'Start import'],
    docUrl: 'https://help.salesforce.com/s/articleView?id=sf.importing_data_wizard.htm',
  },
  {
    id: 'zoho' as CRMTarget,
    capabilities: ['Contacts & Accounts', 'Deals & potentials', 'Lead nurturing', 'Email integration'],
    importSteps: ['Go to Contacts → Import', 'Choose CSV format', 'Map Zoho fields', 'Run import'],
    docUrl: 'https://www.zoho.com/crm/help/import-data.html',
  },
  {
    id: 'dynamics' as CRMTarget,
    capabilities: ['Contact records', 'Account linking', 'Opportunity tracking', 'Activity feeds'],
    importSteps: ['Go to Contacts → Import Data', 'Upload CSV file', 'Configure field mapping', 'Submit import'],
    docUrl: 'https://learn.microsoft.com/en-us/power-apps/user/import-data',
  },
];

function fmtKES(v: number) { return v > 0 ? `KES ${v.toLocaleString('en-KE', { maximumFractionDigits: 0 })}` : '—'; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }); }
function fmtDateTime(iso: string) { return new Date(iso).toLocaleString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function sl(s: string) { return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); }

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminCRM() {
  const [tab, setTab] = useState<Tab>('contacts');
  const [contacts, setContacts] = useState<CRMContact[]>([]);
  const [deals, setDeals] = useState<CRMDeal[]>([]);
  const [exportLogs, setExportLogs] = useState<ExportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Contact filters
  const [contactSearch, setContactSearch] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');

  // Deal filters
  const [dealSearch, setDealSearch] = useState('');
  const [dealTypeFilter, setDealTypeFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  // Export
  const [exportType, setExportType] = useState<ExportDataType>('contacts');
  const [exportCRM, setExportCRM] = useState<CRMTarget>('hubspot');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [cRes, dRes, logRes] = await Promise.all([
      supabase.from('crm_contacts_view').select('*'),
      supabase.from('crm_deals_view').select('*'),
      supabase.from('crm_export_logs').select('*').order('exported_at', { ascending: false }).limit(20),
    ]);
    if (cRes.data)   setContacts(cRes.data as CRMContact[]);
    if (dRes.data)   setDeals(dRes.data as CRMDeal[]);
    if (logRes.data) setExportLogs(logRes.data as ExportLog[]);
    setLastSync(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ─── Export ──────────────────────────────────────────────────────────────────

  async function handleExport() {
    setExporting(true);
    try {
      const now = new Date().toISOString().split('T')[0];
      let content = '';
      let filename = '';
      let count = 0;

      if (exportType === 'contacts') {
        const rows = filteredContacts;
        content  = generateContactsCSV(rows, exportCRM);
        filename = `OSIL_CRM_Contacts_${CRM_META[exportCRM].label.replace(/\s+/g, '_')}_${now}.csv`;
        count    = rows.length;
      } else {
        const rows = filteredDeals;
        content  = generateDealsCSV(rows, exportCRM);
        filename = `OSIL_CRM_Deals_${CRM_META[exportCRM].label.replace(/\s+/g, '_')}_${now}.csv`;
        count    = rows.length;
      }

      downloadCSV(content, filename);

      await supabase.from('crm_export_logs').insert({
        export_type: exportType,
        target_crm: exportCRM,
        record_count: count,
      });

      const { data: fresh } = await supabase.from('crm_export_logs').select('*').order('exported_at', { ascending: false }).limit(20);
      if (fresh) setExportLogs(fresh as ExportLog[]);
    } finally {
      setExporting(false);
    }
  }

  // ─── Filtered data ────────────────────────────────────────────────────────────

  const filteredContacts = contacts.filter(c => {
    const q = contactSearch.toLowerCase();
    const matchSearch = !q || [c.email, c.full_name, c.company, c.phone].some(v => v?.toLowerCase().includes(q));
    const matchLC = lifecycleFilter === 'all' || c.lifecycle_stage === lifecycleFilter;
    const matchSrc = sourceFilter === 'all' || c.lead_source === sourceFilter;
    return matchSearch && matchLC && matchSrc;
  });

  const filteredDeals = deals.filter(d => {
    const q = dealSearch.toLowerCase();
    const matchSearch = !q || [d.deal_number, d.contact_name, d.contact_email, d.company].some(v => v?.toLowerCase().includes(q));
    const matchType  = dealTypeFilter === 'all' || d.deal_type === dealTypeFilter;
    const matchStage = stageFilter === 'all' || d.crm_stage === stageFilter;
    return matchSearch && matchType && matchStage;
  });

  const uniqueSources   = [...new Set(contacts.map(c => c.lead_source))];
  const uniqueStages    = [...new Set(deals.map(d => d.crm_stage))];
  const totalPipeline   = deals.filter(d => !['Won','Lost'].includes(d.crm_stage)).reduce((s, d) => s + d.amount, 0);
  const totalRevenue    = contacts.reduce((s, c) => s + c.lifetime_value, 0);
  const customers       = contacts.filter(c => c.lifecycle_stage === 'customer').length;
  const mqls            = contacts.filter(c => c.lifecycle_stage === 'marketing_qualified_lead').length;

  // ─── Tabs ─────────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'contacts',     label: 'Contacts',     icon: Users,          count: contacts.length },
    { id: 'deals',        label: 'Deals',        icon: TrendingUp,     count: deals.length },
    { id: 'export',       label: 'Export',       icon: ArrowDownToLine },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">CRM Preparation</h1>
          <p className="text-slate-400 text-sm mt-0.5">All contacts, deals, and activities — ready for Zoho, Salesforce, HubSpot, and Dynamics.</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 border border-slate-700 text-sm text-slate-300 font-semibold rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Contacts', value: contacts.length, icon: Users,        color: 'text-blue-400',    sub: `${customers} customers` },
          { label: 'MQLs / Leads',   value: `${mqls} / ${contacts.length - customers - mqls}`, icon: BarChart3, color: 'text-amber-400', sub: 'warm + cold' },
          { label: 'Total Deals',    value: deals.length,    icon: TrendingUp,   color: 'text-purple-400',  sub: `${deals.filter(d => d.crm_stage === 'Won').length} won` },
          { label: 'Pipeline',       value: fmtKES(totalPipeline), icon: DollarSign, color: 'text-cyan-400', sub: 'open deals' },
          { label: 'Total Revenue',  value: fmtKES(totalRevenue),  icon: Database, color: 'text-emerald-400', sub: 'lifetime value' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-xs text-slate-400">{label}</span>
            </div>
            <p className="text-lg font-bold text-white leading-tight">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {lastSync && (
        <p className="text-xs text-slate-600 text-right">Last refreshed {fmtDateTime(lastSync.toISOString())}</p>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-slate-800/50 p-1 rounded-xl border border-slate-700">
        {TABS.map(({ id, label, icon: Icon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
            <Icon className="w-4 h-4" />
            {label}
            {count !== undefined && count > 0 && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs leading-none ${tab === id ? 'bg-blue-500' : 'bg-slate-700 text-slate-400'}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* ─── CONTACTS TAB ─── */}
          {tab === 'contacts' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                    placeholder="Search by name, email, company…"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>
                <select value={lifecycleFilter} onChange={e => setLifecycleFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                  <option value="all">All Stages</option>
                  <option value="customer">Customer</option>
                  <option value="marketing_qualified_lead">MQL</option>
                  <option value="lead">Lead</option>
                </select>
                <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                  <option value="all">All Sources</option>
                  {uniqueSources.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Table */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {filteredContacts.length === 0 ? (
                  <div className="py-16 text-center"><Users className="w-10 h-10 text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No contacts found.</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {['Contact', 'Company', 'Lead Source', 'Lifecycle', 'Orders', 'Lifetime Value', 'Last Active'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {filteredContacts.map(c => (
                          <tr key={c.email} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-900/50 border border-blue-700/40 flex items-center justify-center flex-shrink-0 text-xs font-bold text-blue-300 uppercase">
                                  {(c.full_name ?? c.email).slice(0, 2)}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-white font-medium text-xs truncate">{c.full_name ?? '—'}</p>
                                  <p className="text-slate-400 text-xs truncate">{c.email}</p>
                                  {c.phone && <p className="text-slate-500 text-xs">{c.phone}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-slate-300 text-xs">{c.company ?? '—'}</p>
                              {c.position && <p className="text-slate-500 text-xs">{c.position}</p>}
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-xs text-slate-300 bg-slate-700 px-2 py-1 rounded-lg">{c.lead_source}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${LIFECYCLE_COLORS[c.lifecycle_stage] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                {LIFECYCLE_LABELS[c.lifecycle_stage] ?? c.lifecycle_stage}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${c.total_orders > 0 ? 'bg-emerald-900/40 text-emerald-300' : 'bg-slate-700 text-slate-500'}`}>
                                {c.total_orders}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-white text-xs font-medium">{fmtKES(c.lifetime_value)}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-slate-400 text-xs">{fmtDate(c.last_activity_at)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 text-right">{filteredContacts.length} of {contacts.length} contacts</p>
            </div>
          )}

          {/* ─── DEALS TAB ─── */}
          {tab === 'deals' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input value={dealSearch} onChange={e => setDealSearch(e.target.value)}
                    placeholder="Search by deal number, contact, company…"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40" />
                </div>
                <select value={dealTypeFilter} onChange={e => setDealTypeFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                  <option value="all">All Types</option>
                  <option value="order">Orders</option>
                  <option value="quote">Quotes</option>
                  <option value="rfq">RFQs</option>
                </select>
                <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
                  className="px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40">
                  <option value="all">All Stages</option>
                  {uniqueStages.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {filteredDeals.length === 0 ? (
                  <div className="py-16 text-center"><TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No deals found.</p></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          {['Deal', 'Type', 'Contact', 'Company', 'CRM Stage', 'Amount', 'Source', 'Date'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/50">
                        {filteredDeals.map(d => (
                          <tr key={d.deal_id} className="hover:bg-slate-700/30 transition-colors">
                            <td className="px-4 py-3.5">
                              <p className="font-mono font-bold text-xs text-white">{d.deal_number}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${DEAL_TYPE_COLORS[d.deal_type] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                {sl(d.deal_type)}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-white text-xs">{d.contact_name}</p>
                              <p className="text-slate-500 text-xs">{d.contact_email}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-slate-300 text-xs">{d.company || '—'}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${STAGE_COLORS[d.crm_stage] ?? 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                {d.crm_stage}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-white text-xs font-medium">{fmtKES(d.amount)}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-slate-400 text-xs">{d.lead_source}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className="text-slate-400 text-xs">{fmtDate(d.created_at)}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 text-right">{filteredDeals.length} of {deals.length} deals</p>
            </div>
          )}

          {/* ─── EXPORT TAB ─── */}
          {tab === 'export' && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Config panel */}
              <div className="space-y-5">
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-5">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-400" /> Export Configuration
                  </h3>

                  {/* Data type */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">What to Export</label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['contacts', 'deals'] as ExportDataType[]).map(t => (
                        <button key={t} onClick={() => setExportType(t)}
                          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-semibold transition-all text-left ${exportType === t ? 'bg-blue-600/20 border-blue-500/50 text-white' : 'bg-slate-700/40 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                          {t === 'contacts' ? <Users className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                          <div>
                            <p className="font-bold capitalize">{t}</p>
                            <p className="text-xs opacity-70">{t === 'contacts' ? `${filteredContacts.length} records` : `${filteredDeals.length} records`}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CRM target */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Target CRM</label>
                    <div className="space-y-2">
                      {CRM_TARGETS.map(crm => {
                        const meta = CRM_META[crm];
                        return (
                          <button key={crm} onClick={() => setExportCRM(crm)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${exportCRM === crm ? `${meta.bg} ${meta.border}` : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'}`}>
                            <div className={`w-2 h-2 rounded-full ${exportCRM === crm ? 'bg-blue-400' : 'bg-slate-600'}`} />
                            <span className={`text-sm font-semibold ${exportCRM === crm ? meta.color : 'text-slate-400'}`}>{meta.label}</span>
                            {exportCRM === crm && <span className="ml-auto text-xs text-slate-400">{meta.importPath}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Download button */}
                  <button onClick={handleExport} disabled={exporting}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors">
                    {exporting
                      ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating…</>
                      : <><ArrowDownToLine className="w-4 h-4" />Download {sl(exportType)} CSV for {CRM_META[exportCRM].label}</>}
                  </button>
                </div>

                {/* Export history */}
                {exportLogs.length > 0 && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-700">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <h3 className="font-semibold text-white text-sm">Export History</h3>
                    </div>
                    <div className="divide-y divide-slate-700/50 max-h-64 overflow-y-auto">
                      {exportLogs.map(log => (
                        <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                          <Download className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white font-medium">
                              {sl(log.export_type)} → {CRM_META[log.target_crm as CRMTarget]?.label ?? log.target_crm}
                            </p>
                            <p className="text-xs text-slate-500">{log.record_count} records</p>
                          </div>
                          <span className="text-xs text-slate-500 flex-shrink-0">{fmtDate(log.exported_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Field mapping preview */}
              <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <h3 className="font-semibold text-white text-sm">Field Mapping Preview</h3>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg border ${CRM_META[exportCRM].bg} ${CRM_META[exportCRM].color} ${CRM_META[exportCRM].border}`}>
                    {CRM_META[exportCRM].label}
                  </span>
                </div>
                <div className="overflow-y-auto max-h-[560px]">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-slate-800 border-b border-slate-700">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">CRM Field</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Maps From</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Sample Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/40">
                      {(exportType === 'contacts' ? CONTACT_FIELD_MAPS[exportCRM] : DEAL_FIELD_MAPS[exportCRM]).map((field, idx) => {
                        const sample = exportType === 'contacts' && contacts.length > 0
                          ? (field as typeof CONTACT_FIELD_MAPS[CRMTarget][0]).getValue(contacts[0] as CRMContact)
                          : exportType === 'deals' && deals.length > 0
                          ? (field as typeof DEAL_FIELD_MAPS[CRMTarget][0]).getValue(deals[0] as CRMDeal)
                          : '';
                        return (
                          <tr key={idx} className="hover:bg-slate-700/20 transition-colors">
                            <td className="px-4 py-2.5">
                              <span className="text-white font-semibold">{field.crmField}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <code className="text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded text-[11px]">{field.sourceField}</code>
                            </td>
                            <td className="px-4 py-2.5 hidden sm:table-cell">
                              <span className="text-slate-400 truncate block max-w-[140px]">{sample || <span className="text-slate-600 italic">empty</span>}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-5 py-3 border-t border-slate-700 bg-slate-800/60">
                  <p className="text-xs text-slate-500">
                    {(exportType === 'contacts' ? CONTACT_FIELD_MAPS[exportCRM] : DEAL_FIELD_MAPS[exportCRM]).length} fields mapped for {CRM_META[exportCRM].label}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ─── INTEGRATIONS TAB ─── */}
          {tab === 'integrations' && (
            <div className="space-y-5">
              {/* Data readiness banner */}
              <div className="flex items-start gap-4 p-5 bg-emerald-900/20 border border-emerald-700/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">CRM Data Foundation is Ready</p>
                  <p className="text-xs text-emerald-400/70 mt-1">
                    All {contacts.length} contacts, {deals.length} deals, lead sources, lifecycle stages, and deal stages are normalised and
                    mapped to CRM-standard schemas. You can export now, or connect a live API when ready.
                  </p>
                </div>
              </div>

              {/* CRM cards */}
              <div className="grid sm:grid-cols-2 gap-5">
                {INTEGRATION_CARDS.map(crm => {
                  const meta = CRM_META[crm.id];
                  return (
                    <div key={crm.id} className={`bg-slate-800 rounded-xl border ${meta.border} overflow-hidden`}>
                      {/* Card header */}
                      <div className={`flex items-center justify-between px-5 py-4 ${meta.bg} border-b ${meta.border}`}>
                        <div>
                          <p className={`font-bold text-sm ${meta.color}`}>{meta.label}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                            <span className="text-xs text-amber-400 font-semibold">Not Connected</span>
                          </div>
                        </div>
                        <a href={crm.docUrl} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                          Docs <Globe className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Data ready checklist */}
                      <div className="px-5 py-4 border-b border-slate-700/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Data Ready to Sync</p>
                        <div className="space-y-2">
                          {[
                            { label: `${contacts.length} contacts normalised`, done: contacts.length > 0 },
                            { label: 'First/last name split', done: true },
                            { label: 'Lead sources tracked', done: true },
                            { label: 'Lifecycle stages mapped', done: true },
                            { label: `${deals.length} deals structured`, done: deals.length > 0 },
                            { label: 'CRM stage pipeline mapped', done: true },
                            { label: 'CSV export available', done: true },
                          ].map(({ label, done }) => (
                            <div key={label} className="flex items-center gap-2">
                              {done
                                ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                : <AlertCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}
                              <span className={`text-xs ${done ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Capabilities */}
                      <div className="px-5 py-4 border-b border-slate-700/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Integration Enables</p>
                        <div className="flex flex-wrap gap-1.5">
                          {crm.capabilities.map(c => (
                            <span key={c} className="text-xs text-slate-400 bg-slate-700/60 border border-slate-600/50 px-2 py-0.5 rounded-lg">{c}</span>
                          ))}
                        </div>
                      </div>

                      {/* Import steps */}
                      <div className="px-5 py-4 border-b border-slate-700/50">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Manual Import Steps</p>
                        <ol className="space-y-1.5">
                          {crm.importSteps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                              <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300 flex-shrink-0 mt-0.5">{i + 1}</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 px-5 py-4">
                        <button
                          onClick={() => { setExportCRM(crm.id); setTab('export'); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-blue-600/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors">
                          <ArrowDownToLine className="w-3.5 h-3.5" /> Export CSV
                        </button>
                        <button
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold bg-slate-700/50 border border-slate-600 text-slate-500 rounded-lg cursor-not-allowed"
                          title="Live API integration — coming soon">
                          <Zap className="w-3.5 h-3.5" /> Live Sync (Soon)
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Future webhook note */}
              <div className="p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-300">Live Webhook Sync — Coming Next</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      The CRM preparation layer is complete. When you're ready to go live, configure a webhook URL per CRM and
                      every new order, quote, and customer will be pushed automatically in real time. The outbox table and
                      event schema are already in place — no schema changes will be required.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

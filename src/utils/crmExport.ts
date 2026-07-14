// CRM export utilities — field mappings and CSV generation for
// Zoho CRM, Microsoft Dynamics 365, HubSpot, and Salesforce.

export type CRMTarget = 'hubspot' | 'salesforce' | 'zoho' | 'dynamics' | 'generic';
export type ExportDataType = 'contacts' | 'deals';

export interface CRMContact {
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  city: string | null;
  country: string | null;
  lead_source: string;
  lifecycle_stage: string;
  total_orders: number;
  total_quotes: number;
  total_rfqs: number;
  lifetime_value: number;
  last_activity_at: string;
}

export interface CRMDeal {
  deal_id: string;
  deal_number: string;
  contact_name: string;
  contact_email: string;
  company: string;
  crm_stage: string;
  native_stage: string;
  amount: number;
  lead_source: string;
  deal_type: string;
  created_at: string;
}

interface ContactFieldDef {
  crmField: string;
  sourceField: string;
  getValue: (c: CRMContact) => string;
}

interface DealFieldDef {
  crmField: string;
  sourceField: string;
  getValue: (d: CRMDeal) => string;
}

// ─── Contact field maps ───────────────────────────────────────────────────────

export const CONTACT_FIELD_MAPS: Record<CRMTarget, ContactFieldDef[]> = {
  hubspot: [
    { crmField: 'First Name',      sourceField: 'first_name',      getValue: c => c.first_name },
    { crmField: 'Last Name',       sourceField: 'last_name',       getValue: c => c.last_name },
    { crmField: 'Email',           sourceField: 'email',           getValue: c => c.email },
    { crmField: 'Phone Number',    sourceField: 'phone',           getValue: c => c.phone ?? '' },
    { crmField: 'Company',         sourceField: 'company',         getValue: c => c.company ?? '' },
    { crmField: 'Job Title',       sourceField: 'position',        getValue: c => c.position ?? '' },
    { crmField: 'City',            sourceField: 'city',            getValue: c => c.city ?? '' },
    { crmField: 'Country',         sourceField: 'country',         getValue: c => c.country ?? '' },
    { crmField: 'Lead Source',     sourceField: 'lead_source',     getValue: c => c.lead_source },
    { crmField: 'Lifecycle Stage', sourceField: 'lifecycle_stage', getValue: c => c.lifecycle_stage },
    { crmField: 'Number of Orders',sourceField: 'total_orders',    getValue: c => String(c.total_orders) },
    { crmField: 'Total Revenue',   sourceField: 'lifetime_value',  getValue: c => String(c.lifetime_value) },
  ],
  salesforce: [
    { crmField: 'First Name',  sourceField: 'first_name',  getValue: c => c.first_name },
    { crmField: 'Last Name',   sourceField: 'last_name',   getValue: c => c.last_name },
    { crmField: 'Email',       sourceField: 'email',       getValue: c => c.email },
    { crmField: 'Phone',       sourceField: 'phone',       getValue: c => c.phone ?? '' },
    { crmField: 'Company',     sourceField: 'company',     getValue: c => c.company ?? '' },
    { crmField: 'Title',       sourceField: 'position',    getValue: c => c.position ?? '' },
    { crmField: 'City',        sourceField: 'city',        getValue: c => c.city ?? '' },
    { crmField: 'Country',     sourceField: 'country',     getValue: c => c.country ?? '' },
    { crmField: 'Lead Source', sourceField: 'lead_source', getValue: c => c.lead_source },
    { crmField: 'Rating',      sourceField: 'lifecycle_stage', getValue: c =>
        c.lifecycle_stage === 'customer' ? 'Hot' : c.lifecycle_stage === 'marketing_qualified_lead' ? 'Warm' : 'Cold' },
    { crmField: 'Description', sourceField: '(computed)',  getValue: c =>
        `Orders: ${c.total_orders} | Quotes: ${c.total_quotes} | RFQs: ${c.total_rfqs} | LTV: KES ${c.lifetime_value.toLocaleString()}` },
  ],
  zoho: [
    { crmField: 'First Name',       sourceField: 'first_name',  getValue: c => c.first_name },
    { crmField: 'Last Name',        sourceField: 'last_name',   getValue: c => c.last_name },
    { crmField: 'Email',            sourceField: 'email',       getValue: c => c.email },
    { crmField: 'Phone',            sourceField: 'phone',       getValue: c => c.phone ?? '' },
    { crmField: 'Account Name',     sourceField: 'company',     getValue: c => c.company ?? '' },
    { crmField: 'Title',            sourceField: 'position',    getValue: c => c.position ?? '' },
    { crmField: 'Mailing City',     sourceField: 'city',        getValue: c => c.city ?? '' },
    { crmField: 'Mailing Country',  sourceField: 'country',     getValue: c => c.country ?? '' },
    { crmField: 'Lead Source',      sourceField: 'lead_source', getValue: c => c.lead_source },
    { crmField: 'Lead Status',      sourceField: 'lifecycle_stage', getValue: c =>
        c.lifecycle_stage === 'customer' ? 'Converted' : 'Open - Not Contacted' },
    { crmField: 'Rating',           sourceField: '(computed)',  getValue: c =>
        c.lifetime_value > 500000 ? 'Hot' : c.lifetime_value > 0 ? 'Warm' : 'Cold' },
  ],
  dynamics: [
    { crmField: 'First Name',                  sourceField: 'first_name',  getValue: c => c.first_name },
    { crmField: 'Last Name',                   sourceField: 'last_name',   getValue: c => c.last_name },
    { crmField: 'Email Address',               sourceField: 'email',       getValue: c => c.email },
    { crmField: 'Business Phone',              sourceField: 'phone',       getValue: c => c.phone ?? '' },
    { crmField: 'Company Name',                sourceField: 'company',     getValue: c => c.company ?? '' },
    { crmField: 'Job Title',                   sourceField: 'position',    getValue: c => c.position ?? '' },
    { crmField: 'Address 1: City',             sourceField: 'city',        getValue: c => c.city ?? '' },
    { crmField: 'Address 1: Country/Region',   sourceField: 'country',     getValue: c => c.country ?? '' },
    { crmField: 'Lead Source',                 sourceField: 'lead_source', getValue: c => c.lead_source },
    { crmField: 'Customer Size',               sourceField: 'lifecycle_stage', getValue: c => c.lifecycle_stage },
  ],
  generic: [
    { crmField: 'Email',              sourceField: 'email',           getValue: c => c.email },
    { crmField: 'Full Name',          sourceField: 'full_name',       getValue: c => c.full_name },
    { crmField: 'First Name',         sourceField: 'first_name',      getValue: c => c.first_name },
    { crmField: 'Last Name',          sourceField: 'last_name',       getValue: c => c.last_name },
    { crmField: 'Phone',              sourceField: 'phone',           getValue: c => c.phone ?? '' },
    { crmField: 'Company',            sourceField: 'company',         getValue: c => c.company ?? '' },
    { crmField: 'Position',           sourceField: 'position',        getValue: c => c.position ?? '' },
    { crmField: 'City',               sourceField: 'city',            getValue: c => c.city ?? '' },
    { crmField: 'Country',            sourceField: 'country',         getValue: c => c.country ?? '' },
    { crmField: 'Lead Source',        sourceField: 'lead_source',     getValue: c => c.lead_source },
    { crmField: 'Lifecycle Stage',    sourceField: 'lifecycle_stage', getValue: c => c.lifecycle_stage },
    { crmField: 'Total Orders',       sourceField: 'total_orders',    getValue: c => String(c.total_orders) },
    { crmField: 'Total Quotes',       sourceField: 'total_quotes',    getValue: c => String(c.total_quotes) },
    { crmField: 'Total RFQs',         sourceField: 'total_rfqs',      getValue: c => String(c.total_rfqs) },
    { crmField: 'Lifetime Value (KES)',sourceField: 'lifetime_value', getValue: c => String(c.lifetime_value) },
    { crmField: 'Last Activity',      sourceField: 'last_activity_at',getValue: c =>
        c.last_activity_at ? new Date(c.last_activity_at).toLocaleDateString('en-KE') : '' },
  ],
};

// ─── Deal field maps ──────────────────────────────────────────────────────────

export const DEAL_FIELD_MAPS: Record<CRMTarget, DealFieldDef[]> = {
  hubspot: [
    { crmField: 'Deal Name',          sourceField: 'deal_number',   getValue: d => d.deal_number },
    { crmField: 'Deal Stage',         sourceField: 'crm_stage',     getValue: d => d.crm_stage },
    { crmField: 'Amount',             sourceField: 'amount',        getValue: d => String(d.amount) },
    { crmField: 'Deal Type',          sourceField: 'deal_type',     getValue: d => d.deal_type.charAt(0).toUpperCase() + d.deal_type.slice(1) },
    { crmField: 'Lead Source',        sourceField: 'lead_source',   getValue: d => d.lead_source },
    { crmField: 'Associated Company', sourceField: 'company',       getValue: d => d.company },
    { crmField: 'Contact Email',      sourceField: 'contact_email', getValue: d => d.contact_email },
    { crmField: 'Create Date',        sourceField: 'created_at',    getValue: d => new Date(d.created_at).toLocaleDateString('en-KE') },
  ],
  salesforce: [
    { crmField: 'Opportunity Name', sourceField: 'deal_number',   getValue: d => d.deal_number },
    { crmField: 'Stage',            sourceField: 'crm_stage',     getValue: d => d.crm_stage },
    { crmField: 'Amount',           sourceField: 'amount',        getValue: d => String(d.amount) },
    { crmField: 'Close Date',       sourceField: 'created_at',    getValue: d => new Date(d.created_at).toLocaleDateString('en-KE') },
    { crmField: 'Type',             sourceField: 'deal_type',     getValue: d => d.deal_type },
    { crmField: 'Lead Source',      sourceField: 'lead_source',   getValue: d => d.lead_source },
    { crmField: 'Account Name',     sourceField: 'company',       getValue: d => d.company },
  ],
  zoho: [
    { crmField: 'Deal Name',     sourceField: 'deal_number',   getValue: d => d.deal_number },
    { crmField: 'Stage',         sourceField: 'crm_stage',     getValue: d => d.crm_stage },
    { crmField: 'Amount',        sourceField: 'amount',        getValue: d => String(d.amount) },
    { crmField: 'Account Name',  sourceField: 'company',       getValue: d => d.company },
    { crmField: 'Lead Source',   sourceField: 'lead_source',   getValue: d => d.lead_source },
    { crmField: 'Closing Date',  sourceField: 'created_at',    getValue: d => new Date(d.created_at).toLocaleDateString('en-KE') },
    { crmField: 'Type',          sourceField: 'deal_type',     getValue: d => d.deal_type },
  ],
  dynamics: [
    { crmField: 'Topic',           sourceField: 'deal_number',   getValue: d => d.deal_number },
    { crmField: 'Sales Stage',     sourceField: 'crm_stage',     getValue: d => d.crm_stage },
    { crmField: 'Est. Revenue',    sourceField: 'amount',        getValue: d => String(d.amount) },
    { crmField: 'Account Name',    sourceField: 'company',       getValue: d => d.company },
    { crmField: 'Source',          sourceField: 'lead_source',   getValue: d => d.lead_source },
    { crmField: 'Est. Close Date', sourceField: 'created_at',    getValue: d => new Date(d.created_at).toLocaleDateString('en-KE') },
  ],
  generic: [
    { crmField: 'Deal Number',   sourceField: 'deal_number',   getValue: d => d.deal_number },
    { crmField: 'Type',          sourceField: 'deal_type',     getValue: d => d.deal_type },
    { crmField: 'Contact Name',  sourceField: 'contact_name',  getValue: d => d.contact_name },
    { crmField: 'Contact Email', sourceField: 'contact_email', getValue: d => d.contact_email },
    { crmField: 'Company',       sourceField: 'company',       getValue: d => d.company },
    { crmField: 'CRM Stage',     sourceField: 'crm_stage',     getValue: d => d.crm_stage },
    { crmField: 'Native Stage',  sourceField: 'native_stage',  getValue: d => d.native_stage },
    { crmField: 'Amount (KES)',  sourceField: 'amount',        getValue: d => String(d.amount) },
    { crmField: 'Lead Source',   sourceField: 'lead_source',   getValue: d => d.lead_source },
    { crmField: 'Created Date',  sourceField: 'created_at',    getValue: d => new Date(d.created_at).toLocaleDateString('en-KE') },
  ],
};

// ─── CSV generation ───────────────────────────────────────────────────────────

function escapeCSV(v: string): string {
  if (v.includes(',') || v.includes('"') || v.includes('\n')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

export function generateContactsCSV(contacts: CRMContact[], crm: CRMTarget): string {
  const fields = CONTACT_FIELD_MAPS[crm];
  const header = fields.map(f => escapeCSV(f.crmField)).join(',');
  const rows   = contacts.map(c => fields.map(f => escapeCSV(f.getValue(c))).join(','));
  return [header, ...rows].join('\n');
}

export function generateDealsCSV(deals: CRMDeal[], crm: CRMTarget): string {
  const fields = DEAL_FIELD_MAPS[crm];
  const header = fields.map(f => escapeCSV(f.crmField)).join(',');
  const rows   = deals.map(d => fields.map(f => escapeCSV(f.getValue(d))).join(','));
  return [header, ...rows].join('\n');
}

export function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Meta ─────────────────────────────────────────────────────────────────────

export const CRM_META: Record<CRMTarget, { label: string; color: string; bg: string; border: string; importPath: string }> = {
  hubspot:    { label: 'HubSpot',                  color: 'text-orange-400',  bg: 'bg-orange-900/30',  border: 'border-orange-700/40',  importPath: 'Contacts → Import' },
  salesforce: { label: 'Salesforce',               color: 'text-blue-400',    bg: 'bg-blue-900/30',    border: 'border-blue-700/40',    importPath: 'Leads → Import' },
  zoho:       { label: 'Zoho CRM',                 color: 'text-red-400',     bg: 'bg-red-900/30',     border: 'border-red-700/40',     importPath: 'Contacts → Import' },
  dynamics:   { label: 'Microsoft Dynamics 365',   color: 'text-cyan-400',    bg: 'bg-cyan-900/30',    border: 'border-cyan-700/40',    importPath: 'Contacts → Import Data' },
  generic:    { label: 'Generic CSV',              color: 'text-slate-300',   bg: 'bg-slate-700/40',   border: 'border-slate-600',      importPath: 'Any CRM import wizard' },
};

export const LIFECYCLE_LABELS: Record<string, string> = {
  customer:                 'Customer',
  marketing_qualified_lead: 'MQL',
  lead:                     'Lead',
};

export const LIFECYCLE_COLORS: Record<string, string> = {
  customer:                 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  marketing_qualified_lead: 'bg-amber-900/40 text-amber-300 border-amber-700/40',
  lead:                     'bg-slate-700 text-slate-300 border-slate-600',
};

export const DEAL_TYPE_COLORS: Record<string, string> = {
  order: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  quote: 'bg-blue-900/40 text-blue-300 border-blue-700/40',
  rfq:   'bg-purple-900/40 text-purple-300 border-purple-700/40',
};

export const STAGE_COLORS: Record<string, string> = {
  'Won':           'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
  'Lost':          'bg-red-900/40 text-red-300 border-red-700/40',
  'In Progress':   'bg-blue-900/40 text-blue-300 border-blue-700/40',
  'Proposal Sent': 'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
  'Qualified':     'bg-amber-900/40 text-amber-300 border-amber-700/40',
  'Qualification': 'bg-amber-900/40 text-amber-300 border-amber-700/40',
  'New':           'bg-slate-700 text-slate-300 border-slate-600',
};

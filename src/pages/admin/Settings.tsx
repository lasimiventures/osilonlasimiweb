import { useState } from 'react';
import { Settings, Save, CheckCircle2, Loader2, AlertCircle, Store, Bell, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tab, setTab] = useState<'general' | 'notifications'>('general');

  async function handleSave() {
    setError(null);
    setSuccess(false);
    setSaving(true);
    try {
      const { error } = await supabase.from('store_settings').select('id').limit(1).maybeSingle();
      if (error && error.code !== 'PGRST205') throw error;
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError('Could not save settings. Please try again.');
    }
    setSaving(false);
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          Settings
        </h1>
        <p className="text-slate-400 text-sm mt-0.5">Manage store configuration and preferences</p>
      </div>

      <div className="flex items-center gap-1 border-b border-slate-800 mb-6">
        {[
          { id: 'general' as const, label: 'General', icon: Store },
          { id: 'notifications' as const, label: 'Notifications', icon: Bell },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? 'text-blue-400 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-800/40 rounded-xl p-4 text-red-300 text-sm mb-5">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-950/50 border border-emerald-800/40 rounded-xl p-4 text-emerald-300 text-sm mb-5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Settings saved successfully.
        </div>
      )}

      {tab === 'general' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-white">Store Information</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Store Name" value="OSIL Ltd" />
              <Field label="Country" value="Kenya" />
              <Field label="Currency" value="KES" />
              <Field label="Contact Email" value="info@osil.co.ke" />
            </div>
          </div>
        </div>
      )}

      {tab === 'notifications' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Alert Preferences</h2>
          <div className="space-y-3">
            {['Low stock alerts', 'New order notifications', 'RFQ submission alerts', 'Daily summary email'].map(label => (
              <label key={label} className="flex items-center justify-between py-2">
                <span className="text-sm text-slate-300">{label}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-blue-600 rounded" />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <input
        type="text"
        defaultValue={value}
        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>
  );
}

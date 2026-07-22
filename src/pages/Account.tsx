import { useState, type FormEvent, useEffect, useCallback } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  User, Mail, Phone, Building2, MapPin, Lock, Eye, EyeOff, AlertCircle,
  Loader2, CheckCircle2, Package, FileText, ShoppingBag, LogOut, Shield,
  ChevronRight, Calendar, MapPinned, Briefcase, Globe, Heart, ShoppingCart,
  Trash2, Minus, Plus, FileSpreadsheet, Inbox, FolderOpen, Truck,
  LifeBuoy,
} from 'lucide-react';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useShoppingCart } from '../context/ShoppingCartContext';
import { useSavedItems } from '../context/SavedItemsContext';
import { useCatalog } from '../context/CatalogContext';
import { supabase } from '../lib/supabase';
import type { Product } from '../types';

type Tab = 'profile' | 'security' | 'orders' | 'quotes' | 'rfqs' | 'bulk' | 'cart' | 'saved' | 'support';

export function Account() {
  const { session, profile, loading, updateProfile, updatePassword, signOut, refreshProfile } = useCustomerAuth();
  const [tab, setTab] = useState<Tab>('profile');

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login?next=/account" replace />;
  }

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'orders', label: 'My Orders', icon: Package },
    { id: 'quotes', label: 'My Quotes', icon: FileText },
    { id: 'rfqs', label: 'My RFQs', icon: FileSpreadsheet },
    { id: 'bulk', label: 'Bulk Requests', icon: Inbox },
    { id: 'cart', label: 'Shopping Cart', icon: ShoppingCart },
    { id: 'saved', label: 'Saved Items', icon: Heart },
    { id: 'support', label: 'Support', icon: LifeBuoy },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold shadow-md">
            {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {profile?.full_name || 'My Account'}
            </h1>
            <p className="text-sm text-slate-500">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 hover:bg-red-50 px-3.5 py-2 rounded-xl transition-all"
        >
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === t.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === 'profile' && <ProfileTab profile={profile} updateProfile={updateProfile} refreshProfile={refreshProfile} />}
      {tab === 'security' && <SecurityTab updatePassword={updatePassword} email={profile?.email ?? ''} />}
      {tab === 'orders' && <OrdersTab email={profile?.email ?? ''} />}
      {tab === 'quotes' && <QuotesTab email={profile?.email ?? ''} />}
      {tab === 'rfqs' && <RFQsTab email={profile?.email ?? ''} />}
      {tab === 'bulk' && <BulkRequestsTab email={profile?.email ?? ''} />}
      {tab === 'cart' && <CartTab />}
      {tab === 'saved' && <SavedItemsTab />}
      {tab === 'support' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <LifeBuoy className="w-10 h-10 text-blue-500 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 mb-1">Customer Support Centre</p>
          <p className="text-xs text-slate-500 mb-4">Manage support tickets, warranty claims, product returns, and browse our knowledge base.</p>
          <Link to="/account/support" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 px-4 py-2 rounded-xl transition-colors">
            Open Support Centre <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

// ─── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab({ profile, updateProfile, refreshProfile }: {
  profile: ReturnType<typeof useCustomerAuth>['profile'];
  updateProfile: ReturnType<typeof useCustomerAuth>['updateProfile'];
  refreshProfile: ReturnType<typeof useCustomerAuth>['refreshProfile'];
}) {
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [company, setCompany] = useState(profile?.company ?? '');
  const [position, setPosition] = useState(profile?.position ?? '');
  const [address, setAddress] = useState(profile?.address ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [country, setCountry] = useState(profile?.country ?? 'Kenya');
  const [customerType, setCustomerType] = useState(profile?.customer_type ?? 'individual');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setCompany(profile.company ?? '');
      setPosition(profile.position ?? '');
      setAddress(profile.address ?? '');
      setCity(profile.city ?? '');
      setCountry(profile.country ?? 'Kenya');
      setCustomerType(profile.customer_type ?? 'individual');
    }
  }, [profile]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);
    const { error } = await updateProfile({
      full_name: fullName,
      phone,
      company,
      position,
      address,
      city,
      country,
      customer_type: customerType,
    });
    setSaving(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      await refreshProfile();
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-emerald-700 text-sm">Profile updated successfully.</p>
        </div>
      )}

      {/* Customer type toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Account Type</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'individual', label: 'Individual', desc: 'Personal purchases' },
            { value: 'business', label: 'Business', desc: 'Company / B2B orders' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCustomerType(opt.value as 'individual' | 'business')}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                customerType === opt.value
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="text-sm font-semibold text-slate-900">{opt.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Personal Information</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <FormField label="Full name" icon={User} value={fullName} onChange={setFullName} placeholder="John Doe" />
          <FormField label="Phone" icon={Phone} value={phone} onChange={setPhone} placeholder="+254 7XX XXX XXX" />
          <FormField label="Email" icon={Mail} value={profile?.email ?? ''} onChange={() => {}} disabled placeholder="Email" />
          {customerType === 'business' && (
            <>
              <FormField label="Company" icon={Building2} value={company} onChange={setCompany} placeholder="Company name" />
              <FormField label="Position" icon={Briefcase} value={position} onChange={setPosition} placeholder="Job title" />
            </>
          )}
        </div>
      </div>

      {/* Address */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-4">Address</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField label="Street address" icon={MapPinned} value={address} onChange={setAddress} placeholder="123 Main Street" />
          </div>
          <FormField label="City" icon={MapPin} value={city} onChange={setCity} placeholder="Nairobi" />
          <FormField label="Country" icon={Globe} value={country} onChange={setCountry} placeholder="Kenya" />
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function FormField({ label, icon: Icon, value, onChange, placeholder, disabled }: {
  label: string;
  icon: typeof User;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-400"
        />
      </div>
    </div>
  );
}

// ─── Security tab ─────────────────────────────────────────────────────────────

function SecurityTab({ updatePassword, email }: {
  updatePassword: ReturnType<typeof useCustomerAuth>['updatePassword'];
  email: string;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const passwordChecks = {
    length: newPassword.length >= 8,
    hasUpper: /[A-Z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
  };
  const passwordValid = passwordChecks.length && passwordChecks.hasUpper && passwordChecks.hasNumber;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (!passwordValid) {
      setError('Password must be at least 8 characters with an uppercase letter and a number.');
      return;
    }

    setSaving(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (signInError) {
      setSaving(false);
      setError('Your current password is incorrect.');
      return;
    }
    const { error } = await updatePassword(newPassword);
    setSaving(false);
    if (error) {
      setError(error);
    } else {
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Change Password</h2>
        <p className="text-xs text-slate-500 mb-5">Keep your account secure with a strong password</p>

        {error && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-emerald-700 text-sm">Password changed successfully.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Current password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">New password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            {newPassword.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { ok: passwordChecks.length, label: '8+ chars' },
                  { ok: passwordChecks.hasUpper, label: 'Uppercase' },
                  { ok: passwordChecks.hasNumber, label: 'Number' },
                ].map(c => (
                  <span key={c.label} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${c.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {c.ok ? <CheckCircle2 className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-current" />}
                    {c.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm new password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full pl-9 pr-3 py-2.5 bg-white border text-slate-900 placeholder-slate-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${confirmPassword && confirmPassword !== newPassword ? 'border-red-300' : 'border-slate-300'}`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-1">Forgot your password?</h2>
        <p className="text-xs text-slate-500 mb-3">We'll email you a secure link to reset it.</p>
        <Link
          to="/forgot-password"
          className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Reset via email <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

// ─── Orders tab ───────────────────────────────────────────────────────────────

interface OrderRow {
  id: string;
  order_number: string;
  total_value: number | null;
  order_status: string;
  delivery_status: string | null;
  created_at: string;
}

function OrdersTab({ email }: { email: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase
      .from('orders')
      .select('id,order_number,total_value,order_status,delivery_status,created_at')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) setError(true);
        else setOrders((data ?? []) as OrderRow[]);
        setLoading(false);
      });
  }, [email]);

  if (loading) return <div className="py-12 text-center"><Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" /></div>;
  if (error) return <EmptyState icon={AlertCircle} title="Could not load orders" message="Please try again later." />;

  if (orders.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title="No orders yet"
        message="When you place an order, it'll appear here."
        action={{ label: 'Browse products', to: '/products' }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {orders.map(o => (
          <Link key={o.id} to={`/account/orders/${o.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">#{o.order_number}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(o.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                {o.delivery_status && o.delivery_status !== 'pending' && o.delivery_status !== o.order_status && (
                  <>
                    <span className="text-slate-300">·</span>
                    <Truck className="w-3 h-3" />
                    <span className="capitalize">{o.delivery_status.replace(/_/g, ' ')}</span>
                  </>
                )}
              </p>
            </div>
            {o.total_value != null && (
              <span className="text-sm font-semibold text-slate-900 tabular-nums hidden sm:inline">
                KSh {Number(o.total_value).toLocaleString()}
              </span>
            )}
            <StatusBadge status={o.order_status} />
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Quotes tab ───────────────────────────────────────────────────────────────

interface QuoteRow {
  id: string;
  reference: string;
  quote_number: string | null;
  status: string;
  total_items: number;
  submitted_at: string;
  grand_total: number | null;
}

function QuotesTab({ email }: { email: string }) {
  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase
      .from('quote_requests')
      .select('id,reference,quote_number,status,total_items,submitted_at,grand_total')
      .eq('customer_email', email)
      .eq('source', 'quote_form')
      .order('submitted_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) setError(true);
        else setQuotes((data ?? []) as QuoteRow[]);
        setLoading(false);
      });
  }, [email]);

  if (loading) return <div className="py-12 text-center"><Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" /></div>;
  if (error) return <EmptyState icon={AlertCircle} title="Could not load quotes" message="Please try again later." />;

  if (quotes.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No quote requests yet"
        message="Submit a quote request and track its status here."
        action={{ label: 'Request a quote', to: '/request-quote' }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {quotes.map(q => (
          <Link key={q.id} to={`/account/quotes/${q.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{q.quote_number ?? q.reference}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(q.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                <span className="text-slate-300">·</span>
                {q.total_items} item{q.total_items !== 1 ? 's' : ''}
              </p>
            </div>
            {q.grand_total != null && (
              <span className="text-sm font-semibold text-slate-900 tabular-nums hidden sm:inline">
                KSh {Number(q.grand_total).toLocaleString()}
              </span>
            )}
            <StatusBadge status={q.status} />
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── RFQs tab ─────────────────────────────────────────────────────────────────

interface RfqRow {
  id: string;
  rfq_number: string;
  status: string;
  organization_name: string;
  submitted_at: string;
}

function RFQsTab({ email }: { email: string }) {
  const [rfqs, setRfqs] = useState<RfqRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase
      .from('rfq_requests')
      .select('id,rfq_number,status,organization_name,submitted_at')
      .eq('officer_email', email)
      .order('submitted_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) setError(true);
        else setRfqs((data ?? []) as RfqRow[]);
        setLoading(false);
      });
  }, [email]);

  if (loading) return <div className="py-12 text-center"><Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" /></div>;
  if (error) return <EmptyState icon={AlertCircle} title="Could not load RFQs" message="Please try again later." />;

  if (rfqs.length === 0) {
    return (
      <EmptyState
        icon={FileSpreadsheet}
        title="No RFQs yet"
        message="Submit a Request for Quotation for bulk procurement."
        action={{ label: 'Submit an RFQ', to: '/bulk-quote' }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {rfqs.map(r => (
          <Link key={r.id} to={`/account/rfqs/${r.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{r.rfq_number}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(r.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                <span className="text-slate-300">·</span>
                <Building2 className="w-3 h-3" />
                {r.organization_name}
              </p>
            </div>
            <StatusBadge status={r.status} />
            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Bulk Requests tab ────────────────────────────────────────────────────────

function BulkRequestsTab({ email }: { email: string }) {
  const [requests, setRequests] = useState<QuoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    supabase
      .from('quote_requests')
      .select('id,reference,status,total_items,submitted_at')
      .eq('customer_email', email)
      .or('source.is.null,source.eq.bulk_pricing')
      .order('submitted_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) setError(true);
        else setRequests((data ?? []) as QuoteRow[]);
        setLoading(false);
      });
  }, [email]);

  if (loading) return <div className="py-12 text-center"><Loader2 className="w-5 h-5 text-slate-400 animate-spin mx-auto" /></div>;
  if (error) return <EmptyState icon={AlertCircle} title="Could not load bulk requests" message="Please try again later." />;

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No bulk pricing requests"
        message="Request bulk pricing for any product from its detail page."
        action={{ label: 'Browse products', to: '/products' }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="divide-y divide-slate-100">
        {requests.map(r => (
          <div key={r.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <Inbox className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{r.reference}</p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(r.submitted_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                <span className="text-slate-300">·</span>
                {r.total_items} item{r.total_items !== 1 ? 's' : ''}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shopping Cart tab ────────────────────────────────────────────────────────

function CartTab() {
  const { items, updateQuantity, removeItem, itemCount, estimatedTotal, clearCart } = useShoppingCart();

  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="Your cart is empty"
        message="Add products to your cart to check out quickly."
        action={{ label: 'Browse products', to: '/products' }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {items.map(item => (
            <div key={item.productId} className="flex items-center gap-4 px-5 py-4">
              <Link to={`/products/${item.productSlug}`} className="flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.productName} className="w-14 h-14 rounded-lg object-cover border border-slate-200" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-slate-400" />
                  </div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/products/${item.productSlug}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 truncate block">
                  {item.productName}
                </Link>
                <p className="text-xs text-slate-500">{item.brand} · SKU: {item.productSku}</p>
                {item.unitPrice != null && (
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    KSh {item.unitPrice.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-8 text-center text-sm font-semibold text-slate-900 tabular-nums">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <button
                onClick={() => removeItem(item.productId)}
                className="text-slate-400 hover:text-red-500 transition-colors p-1.5"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-500">Total items</span>
          <span className="text-sm font-semibold text-slate-900">{itemCount}</span>
        </div>
        {estimatedTotal != null && (
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-500">Estimated total</span>
            <span className="text-lg font-bold text-slate-900">KSh {estimatedTotal.toLocaleString()}</span>
          </div>
        )}
        <div className="flex gap-3">
          <button
            onClick={clearCart}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Clear
          </button>
          <Link
            to="/cart"
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Go to Checkout <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Saved Items tab ──────────────────────────────────────────────────────────

function SavedItemsTab() {
  const { savedIds, removeSaved } = useSavedItems();
  const { getProductById } = useCatalog();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    setProducts(savedIds.map(id => getProductById(id)).filter((p): p is Product => p !== undefined));
  }, [savedIds, getProductById]);

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No saved items"
        message="Tap the heart icon on any product to save it for later."
        action={{ label: 'Browse products', to: '/products' }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(p => (
        <div key={p.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden group">
          <Link to={`/products/${p.slug}`} className="block relative overflow-hidden">
            {p.images[0] ? (
              <img src={p.images[0]} alt={p.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-40 bg-slate-100 flex items-center justify-center">
                <Package className="w-8 h-8 text-slate-300" />
              </div>
            )}
          </Link>
          <div className="p-4">
            <p className="text-xs text-slate-400 mb-1">{p.brand}</p>
            <Link to={`/products/${p.slug}`} className="text-sm font-semibold text-slate-900 hover:text-blue-600 line-clamp-2 block mb-2">
              {p.name}
            </Link>
            {p.displayPrice != null && (
              <p className="text-sm font-bold text-slate-900 mb-3">KSh {p.displayPrice.toLocaleString()}</p>
            )}
            <div className="flex items-center gap-2">
              <Link
                to={`/products/${p.slug}`}
                className="flex-1 text-center text-xs font-semibold text-white bg-blue-600 rounded-lg py-2 hover:bg-blue-700 transition-colors"
              >
                View
              </Link>
              <button
                onClick={() => removeSaved(p.id)}
                className="flex items-center justify-center w-9 h-9 text-slate-400 border border-slate-200 rounded-lg hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── shared bits ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    submitted: 'bg-amber-50 text-amber-700',
    reviewed: 'bg-blue-50 text-blue-700',
    approved: 'bg-blue-50 text-blue-700',
    completed: 'bg-emerald-50 text-emerald-700',
    delivered: 'bg-emerald-50 text-emerald-700',
    shipped: 'bg-blue-50 text-blue-700',
    cancelled: 'bg-red-50 text-red-700',
    rejected: 'bg-red-50 text-red-700',
    draft: 'bg-slate-100 text-slate-600',
    confirmed: 'bg-blue-50 text-blue-700',
    processing: 'bg-blue-50 text-blue-700',
    converted: 'bg-emerald-50 text-emerald-700',
  };
  const color = colors[status?.toLowerCase()] ?? 'bg-slate-100 text-slate-600';
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${color}`}>
      {status?.replace(/_/g, ' ') ?? 'unknown'}
    </span>
  );
}

function EmptyState({ icon: Icon, title, message, action }: {
  icon: typeof Package;
  title: string;
  message: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 mb-5">{message}</p>
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-xl transition-colors"
        >
          {action.label} <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

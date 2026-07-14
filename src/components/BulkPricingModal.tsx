import { useState } from 'react';
import { X, Users, Send, CheckCircle, ArrowRight, FileSpreadsheet, Zap, Shield, GraduationCap, Heart, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createQuoteRequest } from '../lib/database';

interface BulkPricingModalProps {
  productName: string;
  onClose: () => void;
}

type Mode = 'choose' | 'quick';

export function BulkPricingModal({ productName, onClose }: BulkPricingModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('choose');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', quantity: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    try {
      await createQuoteRequest({
        customer_name: form.name,
        customer_email: form.email,
        customer_phone: form.phone,
        company: form.company || undefined,
        message: `Bulk pricing request for ${productName}. Quantity: ${form.quantity}. ${form.message}`.trim(),
        source: 'bulk_pricing',
        items: [{ product_name: productName, quantity: 1, notes: `Quantity: ${form.quantity}` }],
      });
      setSubmitted(true);
    } catch {
      setSubmitError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const goRFQ = () => {
    onClose();
    navigate(`/bulk-quote?product=${encodeURIComponent(productName)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Request Bulk Pricing</h2>
              <p className="text-xs text-slate-500 truncate max-w-[220px]">{productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODE: Choose */}
        {mode === 'choose' && (
          <div className="p-5 space-y-3">
            <p className="text-xs text-slate-500 text-center font-medium mb-4">How would you like to submit your bulk request?</p>

            {/* Professional RFQ option */}
            <button onClick={goRFQ}
              className="w-full text-left rounded-xl border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/30 p-4 hover:border-blue-300 hover:from-blue-50 hover:to-blue-100/40 transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-200">
                  <FileSpreadsheet className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-slate-900 text-sm">Professional RFQ</span>
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">Recommended</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">Multi-step form with Excel/CSV product upload, tender reference, target budget, delivery date, and document attachments.</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[{ icon: Shield, label: 'Government' }, { icon: Heart, label: 'NGOs' }, { icon: GraduationCap, label: 'Universities' }, { icon: Briefcase, label: 'Corporates' }].map(({ icon: Icon, label }) => (
                      <span key={label} className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        <Icon className="w-3 h-3" />{label}
                      </span>
                    ))}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:translate-x-1 transition-transform flex-shrink-0 mt-3" />
              </div>
            </button>

            {/* Quick request option */}
            <button onClick={() => setMode('quick')}
              className="w-full text-left rounded-xl border-2 border-slate-100 bg-slate-50/60 p-4 hover:border-slate-200 hover:bg-slate-50 transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm mb-1">Quick Bulk Request</p>
                  <p className="text-xs text-slate-500 leading-relaxed">Simple form — name, email, quantity. Fast for informal or internal requests.</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform flex-shrink-0 mt-3" />
              </div>
            </button>
          </div>
        )}

        {/* MODE: Quick form */}
        {mode === 'quick' && !submitted && (
          <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
            <button type="button" onClick={() => setMode('choose')} className="text-xs text-blue-600 font-semibold hover:underline">
              ← Back to options
            </button>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Jane Kamau"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company *</label>
                <input name="company" value={form.company} onChange={handleChange} required placeholder="Acme Ltd"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="jane@company.co.ke"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+254 7XX XXX XXX"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity Required *</label>
              <select name="quantity" value={form.quantity} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition bg-white">
                <option value="">Select quantity range</option>
                <option>5 – 9 units</option>
                <option>10 – 24 units</option>
                <option>25 – 49 units</option>
                <option>50 – 99 units</option>
                <option>100+ units</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Additional Notes</label>
              <textarea name="message" value={form.message} onChange={handleChange} rows={2}
                placeholder="Delivery timeline, configuration preferences..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition resize-none" />
            </div>
            {submitError && <p className="text-xs text-red-500">{submitError}</p>}
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                <Send className="w-4 h-4" />{submitting ? 'Sending…' : 'Send Request'}
              </button>
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Success */}
        {submitted && (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Request Received</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
              Our enterprise sales team will prepare a bulk pricing proposal within 4 business hours.
            </p>
            <button onClick={onClose}
              className="px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Users, Send, CheckCircle } from 'lucide-react';

interface BulkPricingModalProps {
  productName: string;
  onClose: () => void;
}

export function BulkPricingModal({ productName, onClose }: BulkPricingModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    quantity: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Request Bulk Pricing</h2>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">{productName}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Request Received</h3>
            <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
              Thank you! Our enterprise sales team will prepare a bulk pricing proposal and contact you within 4 business hours.
            </p>
            <button onClick={onClose} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="John Kamau"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company *</label>
                <input name="company" value={form.company} onChange={handleChange} required placeholder="Acme Ltd"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="john@company.co.ke"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone *</label>
                <input name="phone" value={form.phone} onChange={handleChange} required placeholder="+254 7XX XXX XXX"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Quantity Required *</label>
              <select name="quantity" value={form.quantity} onChange={handleChange} required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition bg-white">
                <option value="">Select quantity range</option>
                <option value="5-9">5 – 9 units</option>
                <option value="10-24">10 – 24 units</option>
                <option value="25-49">25 – 49 units</option>
                <option value="50-99">50 – 99 units</option>
                <option value="100+">100+ units</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Additional Notes</label>
              <textarea name="message" value={form.message} onChange={handleChange} rows={3}
                placeholder="Delivery timeline, configuration preferences, financing needs..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition resize-none" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                <Send className="w-4 h-4" /> Send Request
              </button>
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

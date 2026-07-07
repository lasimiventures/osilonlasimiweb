import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle, ShoppingCart, ArrowRight, Trash2 } from 'lucide-react';
import { SEO } from '../components/SEO';
import { useQuote } from '../context/QuoteContext';
import type { CustomerInfo } from '../types';

export function RequestQuote() {
  const { items, itemCount, removeItem, updateQuantity, setCustomerInfo, setSubmitted, submitted, clearQuote } = useQuote();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CustomerInfo>({
    fullName: '', email: '', phone: '', company: '', position: '', address: '', city: '', country: 'Kenya', message: '',
  });

  if (itemCount === 0 && !submitted) {
    return (
      <>
        <SEO meta={{ title: 'Request a Quote | Add Products First | OSIL Ltd Kenya', description: 'Request a quotation for your technology needs.' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">No Items in Your Quote</h1>
          <p className="text-slate-500 mb-6">Add products to your cart before requesting a quotation.</p>
          <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <SEO meta={{ title: 'Quote Submitted | Thank You | OSIL Ltd Kenya', description: 'Your quotation request has been submitted successfully.' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-6">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Quotation Request Submitted!</h1>
          <p className="text-slate-500 mb-2 max-w-lg mx-auto">Thank you for your interest. Our sales team will review your request and send a detailed quotation within 24 business hours.</p>
          <p className="text-sm text-slate-400 mb-8">Reference: QT-{Date.now().toString(36).toUpperCase()}</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button onClick={() => { clearQuote(); navigate('/products'); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ArrowRight className="w-4 h-4" /> Continue Shopping
            </button>
            <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
              Go to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerInfo(formData);
    setSubmitted(true);
  };

  return (
    <>
      <SEO meta={{
        title: 'Request a Quote | ICT Products & Services | OSIL Ltd Kenya',
        description: 'Request a customized quotation for laptops, desktops, phones, servers, networking equipment, and IT services.',
        keywords: ['quote', 'quotation', 'request', 'OSIL', 'Kenya', 'IT pricing'],
      }} />

      <section className="bg-slate-50 py-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Request a Quote</h1>
          <p className="text-sm text-slate-500">Provide your details and we will prepare a customized quotation</p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="bg-white border border-slate-100 rounded-xl p-6 lg:p-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Customer Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                    <input required type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone *</label>
                    <input required type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                    <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                    <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Country</label>
                    <input type="text" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Additional Notes</label>
                  <textarea rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Any specific requirements, delivery preferences, or questions..." />
                </div>
                <div className="flex items-center gap-3">
                  <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    <Send className="w-4 h-4" /> Submit Quote Request
                  </button>
                  <Link to="/quote-cart" className="px-4 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    Back to Cart
                  </Link>
                </div>
              </form>
            </div>

            {/* Items Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-100 rounded-xl p-6 sticky top-24">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Quote Items</h2>
                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-start gap-3 pb-3 border-b border-slate-50">
                      <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1 border border-slate-200 rounded">
                            <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-50 text-xs">-</button>
                            <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-50 text-xs">+</button>
                          </div>
                          <button onClick={() => removeItem(item.productId)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-slate-500">
                  <span className="font-medium text-slate-900">{itemCount}</span> items in quote
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

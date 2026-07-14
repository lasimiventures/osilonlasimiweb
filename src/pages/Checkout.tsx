import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, CreditCard, Phone, PhoneCall, Loader2,
  MapPin, User, Building2, Mail, MessageSquare, ShoppingBag,
} from 'lucide-react';
import { SEO } from '../components/SEO';
import { useShoppingCart } from '../context/ShoppingCartContext';
import { createOrder } from '../lib/database';

const KENYA_COUNTIES = [
  'Nairobi','Mombasa','Kisumu','Nakuru','Eldoret','Thika','Malindi','Kitale',
  'Garissa','Kisii','Nyeri','Machakos','Meru','Kakamega','Kericho','Embu',
  'Migori','Homabay','Siaya','Bungoma','Busia','Vihiga','Bomet','Nandi',
  'Trans Nzoia','Uasin Gishu','Elgeyo-Marakwet','West Pokot','Samburu',
  'Turkana','Marsabit','Isiolo','Laikipia','Nyandarua','Murang\'a','Kirinyaga',
  'Kiambu','Kajiado','Makueni','Kitui','Tharaka-Nithi','Tana River','Lamu',
  'Taita-Taveta','Kwale','Kilifi','Mombasa','Mandera','Wajir',
];

type CheckoutAction = 'place_order' | 'request_callback';

export function Checkout() {
  const { items, itemCount, estimatedTotal, clearCart } = useShoppingCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: '',
    companyName: '',
    email: '',
    phone: '',
    county: '',
    deliveryAddress: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState<CheckoutAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (itemCount === 0) {
    return (
      <>
        <SEO meta={{ title: 'Checkout | OSIL Ltd Kenya', description: 'Complete your order.' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Your cart is empty</h1>
          <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      </>
    );
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(action: CheckoutAction) {
    if (!form.customerName || !form.email || !form.phone) {
      setError('Please fill in your name, email, and phone number.');
      return;
    }
    setError(null);
    setSubmitting(action);
    try {
      const orderData = await createOrder({
        customer_name: form.customerName,
        company_name: form.companyName || undefined,
        email: form.email,
        phone: form.phone,
        county: form.county || undefined,
        delivery_address: form.deliveryAddress || undefined,
        notes: form.notes || undefined,
        order_status: action === 'request_callback' ? 'awaiting_customer_confirmation' : 'pending',
        source: 'cart',
        items: items.map(item => ({
          product_id: item.productId,
          product_name: item.productName,
          product_sku: item.productSku,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.unitPrice != null ? item.unitPrice * item.quantity : null,
        })),
      });
      clearCart();
      navigate(`/order-confirmation/${orderData.order_number}`, {
        state: { action, customerName: form.customerName, email: form.email },
      });
    } catch {
      setError('Something went wrong placing your order. Please try again or call us directly.');
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <>
      <SEO meta={{ title: 'Checkout | OSIL Ltd Kenya', description: 'Complete your order with OSIL Ltd.' }} />

      <section className="bg-slate-50 py-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/cart" className="text-slate-400 hover:text-blue-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
              <p className="text-sm text-slate-500">{itemCount} item{itemCount !== 1 ? 's' : ''} in your cart</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>
              )}

              {/* Contact */}
              <div className="bg-white border border-slate-100 rounded-xl p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> Contact Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                    <input name="customerName" value={form.customerName} onChange={handleChange} required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="John Kamau" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Company Name <span className="text-slate-400 text-xs">(optional)</span></label>
                    <input name="companyName" value={form.companyName} onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Acme Kenya Ltd" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="email" name="email" value={form.email} onChange={handleChange} required
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@company.co.ke" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="tel" name="phone" value={form.phone} onChange={handleChange} required
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="+254 7XX XXX XXX" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="bg-white border border-slate-100 rounded-xl p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" /> Delivery Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">County</label>
                    <select name="county" value={form.county} onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                      <option value="">Select county...</option>
                      {KENYA_COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Address</label>
                    <input name="deliveryAddress" value={form.deliveryAddress} onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Street, Building, Area" />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white border border-slate-100 rounded-xl p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" /> Additional Notes
                </h2>
                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Special delivery instructions, preferred contact time, or any other notes..." />
              </div>

              {/* Call for Price info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-amber-900 mb-1 flex items-center gap-2">
                  <PhoneCall className="w-4 h-4" /> Need to discuss pricing first?
                </h3>
                <p className="text-sm text-amber-800 mb-3">Our sales team will confirm pricing, availability, and delivery timelines before processing your order.</p>
                <div className="flex flex-wrap gap-3">
                  <a href="tel:+254795030476" className="flex items-center gap-1.5 text-sm font-medium text-amber-900 hover:text-amber-700">
                    <Phone className="w-3.5 h-3.5" /> +254 795 030 476
                  </a>
                  <a href="https://wa.me/254795030476" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-green-700 hover:text-green-600">
                    WhatsApp Sales
                  </a>
                </div>
              </div>

            </div>

            {/* Order summary */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-slate-100 rounded-xl p-6 sticky top-24 space-y-4">
                <h2 className="text-lg font-semibold text-slate-900">Order Summary</h2>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div key={item.productId} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                        <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 line-clamp-1">{item.productName}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      {item.unitPrice != null && (
                        <p className="text-xs font-semibold text-slate-900 shrink-0">
                          KES {(item.unitPrice * item.quantity).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {estimatedTotal != null && (
                  <div className="border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-700">Estimated Total</span>
                      <span className="text-slate-900">KES {estimatedTotal.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Excl. delivery charges</p>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => handleSubmit('place_order')}
                    disabled={submitting !== null}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                  >
                    {submitting === 'place_order' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                    Place Order
                  </button>
                  <button
                    onClick={() => handleSubmit('request_callback')}
                    disabled={submitting !== null}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-blue-200 text-blue-700 font-medium rounded-lg hover:bg-blue-50 disabled:opacity-60 transition-colors"
                  >
                    {submitting === 'request_callback' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneCall className="w-4 h-4" />}
                    Request Call Back
                  </button>
                  <Link to="/cart" className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 py-2">
                    <ShoppingBag className="w-4 h-4" /> Back to Cart
                  </Link>
                </div>

                <p className="text-xs text-slate-400 text-center">
                  No payment collected now. Our team confirms your order before processing.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}

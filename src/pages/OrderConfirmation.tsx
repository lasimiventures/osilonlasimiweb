import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Phone, MessageSquare, Package, ArrowRight, PhoneCall } from 'lucide-react';
import { SEO } from '../components/SEO';

interface LocationState {
  action?: 'place_order' | 'request_callback';
  customerName?: string;
  email?: string;
}

export function OrderConfirmation() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const state = (location.state ?? {}) as LocationState;

  const isCallback = state.action === 'request_callback';
  const firstName = state.customerName?.split(' ')[0] ?? 'Customer';

  return (
    <>
      <SEO meta={{ title: `Order Confirmed ${orderNumber} | OSIL Ltd Kenya`, description: 'Your order has been received.' }} />

      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">

          {/* Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isCallback ? 'Callback Requested!' : 'Order Received!'}
          </h1>
          <p className="text-slate-500 mb-6">
            {isCallback
              ? `Thank you, ${firstName}. Our sales team will call you shortly to discuss pricing and delivery.`
              : `Thank you, ${firstName}. We've received your order and our team is reviewing it.`}
          </p>

          {/* Reference box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8 text-left">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Order Reference</h2>
              <Package className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-mono font-bold text-slate-900 mb-1">{orderNumber}</p>
            {state.email && <p className="text-sm text-slate-500">Confirmation details sent to <span className="font-medium text-slate-700">{state.email}</span></p>}
          </div>

          {/* Next steps */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 text-left">
            <h2 className="text-sm font-semibold text-blue-900 mb-3">What happens next?</h2>
            <ol className="space-y-2">
              {(isCallback ? [
                'Our sales team will call you within 2 business hours.',
                'We\'ll confirm product availability and pricing.',
                'Once confirmed, we process and ship your order.',
                'You receive delivery tracking information.',
              ] : [
                'Our team reviews your order and confirms availability.',
                'We contact you to confirm pricing and delivery timeline.',
                'Once you approve, we process and prepare your order.',
                'Fast delivery across Kenya — Nairobi same/next day.',
              ]).map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-blue-800">
                  <span className="w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* Contact options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            <a
              href="tel:+254795030476"
              className="flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors"
            >
              <Phone className="w-4 h-4" /> Call Sales Team
            </a>
            <a
              href="https://wa.me/254795030476"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-3 border border-green-200 bg-green-50 rounded-xl text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp Us
            </a>
          </div>

          {/* Future payment note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <div className="flex items-center gap-2 text-amber-800 text-sm">
              <PhoneCall className="w-4 h-4 shrink-0" />
              <span>Online payment (M-Pesa, card, bank transfer) coming soon. Currently we confirm orders by phone.</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/products"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue Shopping <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/quote-cart" className="flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 font-medium rounded-lg hover:border-blue-300 hover:text-blue-600 transition-colors">
              Request a Quote
            </Link>
          </div>

        </div>
      </section>
    </>
  );
}

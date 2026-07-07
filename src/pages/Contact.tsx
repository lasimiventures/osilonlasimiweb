import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Headphones, MessageSquare, Building2, Globe } from 'lucide-react';
import { SEO, generateBreadcrumbSchema, getCanonicalUrl } from '../components/SEO';
import { Breadcrumb } from '../components/Breadcrumb';
import { trackContactForm } from '../utils/analytics';

export function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: '',
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://osil.co.ke' },
    { name: 'Contact Us', url: 'https://osil.co.ke/contact' },
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackContactForm(formData.subject || 'general inquiry');
    setSubmitted(true);
  };

  return (
    <>
      <SEO meta={{
        title: 'Contact Us | Nairobi Office | ICT Sales & Support | OSIL Ltd Kenya',
        description: 'Contact OSIL Ltd Kenya for product inquiries, quotes, and technical support. Visit our Nairobi office at Jethalal Chambers, Tubman Road, call +254 795 030 476, or email info@osilltd.co.ke. Fast response guaranteed.',
        keywords: ['OSIL contact', 'Nairobi ICT company', 'Kenya IT support', 'laptop sales Nairobi', 'OSIL phone', 'OSIL email', 'Tubman Road Nairobi', 'IT sales Kenya'],
        canonicalUrl: getCanonicalUrl('/contact'),
        ogType: 'website',
      }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Contact OSIL Ltd Nairobi Kenya" className="w-full h-full object-cover opacity-20" loading="eager" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="mb-3">
            <Breadcrumb crumbs={[
              { label: 'Contact Us' },
            ]} />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Contact OSIL Ltd Kenya</h1>
          <p className="text-lg text-slate-300 max-w-2xl">Get in touch with us for product inquiries, quotes, technical support, or partnership opportunities. Our team is ready to assist you.</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Fast Response</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Expert Team</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> All Kenya</span>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3">How Can We Help?</h2>
          <p className="text-slate-600 leading-relaxed mb-4">OSIL Ltd is here to support your technology needs. Whether you\'re looking for product information, pricing, technical assistance, or enterprise solutions, our team in Nairobi is ready to help. We serve customers across all 47 counties in Kenya and the wider East Africa region.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Headphones className="w-5 h-5" />, title: 'Product Inquiries', desc: 'Pricing & specs' },
              { icon: <MessageSquare className="w-5 h-5" />, title: 'Quotes', desc: 'Business pricing' },
              { icon: <Building2 className="w-5 h-5" />, title: 'Enterprise', desc: 'B2B solutions' },
              { icon: <Globe className="w-5 h-5" />, title: 'Support', desc: 'Technical help' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg">
                <div className="text-blue-600">{item.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                  <div className="text-xs text-slate-500">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-6">Get in Touch</h2>
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Office Address</h3>
                    <p className="text-sm text-slate-500">1st Floor, Jethalal Chambers</p>
                    <p className="text-sm text-slate-500">Tubman Rd, Suite 103</p>
                    <p className="text-sm text-slate-500">Nairobi, Kenya</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Phone</h3>
                    <p className="text-sm text-slate-500">+254 795 030 476 (Sales)</p>
                    <p className="text-sm text-slate-500">+254 20 123 4567 (Office)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Email</h3>
                    <p className="text-sm text-slate-500">info@osilltd.co.ke (General)</p>
                    <p className="text-sm text-slate-500">sales@osilltd.co.ke (Sales)</p>
                    <p className="text-sm text-slate-500">support@osilltd.co.ke (Support)</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Business Hours</h3>
                    <p className="text-sm text-slate-500">Monday - Friday: 8:00 AM - 6:00 PM</p>
                    <p className="text-sm text-slate-500">Saturday: 9:00 AM - 1:00 PM</p>
                    <p className="text-sm text-slate-500">Sunday: Closed</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" /> Prefer WhatsApp?
                </h3>
                <p className="text-sm text-slate-500 mb-3">Chat with us directly for quick inquiries and quotes. Get instant responses during business hours.</p>
                <a href="https://wa.me/254795030476" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] text-white text-sm font-medium rounded-lg hover:bg-[#128C7E] transition-colors">
                  Chat on WhatsApp
                </a>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-xl p-6 lg:p-8">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Message Sent!</h3>
                  <p className="text-sm text-slate-500 mb-6">Thank you for reaching out. Our team will respond within 24 business hours.</p>
                  <button onClick={() => setSubmitted(false)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-900 mb-4">Send us a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                        <input required type="text" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                        <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="your@email.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                        <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+254 7XX XXX XXX" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                        <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Company name" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                      <input type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="What is your inquiry about?" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
                      <textarea required rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Tell us how we can help you..." />
                    </div>
                    <button type="submit" className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                      <Send className="w-4 h-4" /> Send Message
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

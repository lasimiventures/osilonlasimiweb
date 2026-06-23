import { Link }  from 'react-router-dom';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { SEO } from '../components/SEO';
import { services } from '../data/services';

export function Services() {
  return (
    <>
      <SEO meta={{
        title: 'Services | OSIL Ltd - ICT Solutions & Services Kenya',
        description: 'Comprehensive ICT services including consultancy, infrastructure, managed services, networking, cloud, cybersecurity, audio visual, and maintenance support.',
        keywords: ['ICT services', 'IT consultancy', 'managed services', 'networking', 'cloud', 'cybersecurity', 'Kenya'],
      }} />

      {/* Hero */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Services" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Our Services</h1>
          <p className="text-lg text-slate-300 max-w-2xl">Comprehensive ICT services designed to help your organization leverage technology for growth, efficiency, and competitive advantage.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((svc) => (
              <div key={svc.id} className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-slate-100 overflow-hidden">
                  <img src={svc.image} alt={svc.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{svc.title}</h2>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed">{svc.description}</p>
                  <div className="space-y-2 mb-4">
                    {svc.features.slice(1, 4).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                        <ChevronRight className="w-3 h-3 text-blue-500 shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                  <Link to="/contact" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                    Request Service <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need a Custom Solution?</h2>
          <p className="text-lg text-blue-100 mb-8">Our team is ready to design a tailored ICT solution for your specific requirements.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
            Contact Our Team
          </Link>
        </div>
      </section>
    </>
  );
}

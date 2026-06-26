import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, Building2, Landmark, GraduationCap, Heart, Store, Globe, CheckCircle, Users, Zap, Shield, Headphones } from 'lucide-react';
import { SEO, generateBreadcrumbSchema, getCanonicalUrl } from '../components/SEO';
import { solutions } from '../data/solutions';

const solutionIcons: Record<string, React.ReactNode> = {
  'Building2': <Building2 className="w-6 h-6" />,
  'Landmark': <Landmark className="w-6 h-6" />,
  'GraduationCap': <GraduationCap className="w-6 h-6" />,
  'Heart': <Heart className="w-6 h-6" />,
  'Store': <Store className="w-6 h-6" />,
  'Globe': <Globe className="w-6 h-6" />,
};

const solutionSeoContent: Record<string, { overview: string; industries: string[]; keywords: string[] }> = {
  corporate: {
    overview: 'OSIL Ltd provides enterprise ICT solutions for corporate organizations across Kenya and East Africa, including secure infrastructure, collaboration tools, and managed services.',
    industries: ['Banking and Finance', 'Insurance', 'Manufacturing', 'Logistics', 'Telecommunications', 'Professional Services'],
    keywords: ['corporate IT solutions Kenya', 'enterprise technology Nairobi', 'business ICT solutions', 'corporate infrastructure'],
  },
  government: {
    overview: 'Government ICT solutions compliant with Kenyan regulations, supporting public sector digital transformation, e-governance, and citizen services.',
    industries: ['National Government', 'County Governments', 'Parastatals', 'Public Universities', 'Government Agencies', 'Regulatory Bodies'],
    keywords: ['government IT solutions Kenya', 'public sector technology', 'e-governance', 'county government ICT', 'digital government'],
  },
  education: {
    overview: 'Education technology solutions for schools, universities, and training institutions in Kenya, including digital classrooms, e-learning platforms, and campus infrastructure.',
    industries: ['Primary Schools', 'Secondary Schools', 'Universities', 'TVET Colleges', 'International Schools', 'E-learning Centers'],
    keywords: ['education technology Kenya', 'school ICT solutions', 'e-learning Nairobi', 'digital classroom', 'university technology'],
  },
  healthcare: {
    overview: 'Healthcare ICT solutions for hospitals, clinics, and medical facilities in Kenya, supporting patient management, telemedicine, and health information systems.',
    industries: ['Hospitals', 'Clinics', 'Medical Centers', 'Diagnostic Labs', 'Pharmacies', 'Health NGOs'],
    keywords: ['healthcare IT Kenya', 'hospital technology Nairobi', 'health information systems', 'telemedicine Kenya', 'medical ICT solutions'],
  },
  sme: {
    overview: 'Affordable and scalable ICT solutions designed for small and medium enterprises in Kenya, helping businesses grow with the right technology.',
    industries: ['Retail', 'Hospitality', 'Real Estate', 'Professional Services', 'Transport', 'Agriculture'],
    keywords: ['SME IT solutions Kenya', 'small business technology', 'SME ICT Nairobi', 'affordable IT solutions', 'business technology'],
  },
  ngo: {
    overview: 'Cost-effective ICT solutions for NGOs, non-profits, and humanitarian organizations operating in Kenya and East Africa.',
    industries: ['International NGOs', 'Local NGOs', 'Faith-based Organizations', 'Community Organizations', 'Development Agencies', 'Charitable Foundations'],
    keywords: ['NGO IT solutions Kenya', 'non-profit technology', 'humanitarian ICT', 'NGO technology Nairobi'],
  },
};

export function Solutions() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://osil.co.ke' },
    { name: 'Solutions', url: 'https://osil.co.ke/solutions' },
  ]);

  return (
    <>
      <SEO meta={{
        title: 'Industry ICT Solutions Kenya | Enterprise Technology Solutions | OSIL Ltd',
        description: 'Tailored ICT solutions for corporates, government, education, healthcare, SMEs, and NGOs across Kenya and East Africa. OSIL Ltd delivers industry-specific technology solutions for digital transformation.',
        keywords: ['IT solutions Kenya', 'industry solutions', 'corporate IT', 'government technology', 'education IT', 'healthcare ICT', 'SME solutions', 'NGO technology', 'Nairobi', 'OSIL'],
        canonicalUrl: getCanonicalUrl('/solutions'),
        ogType: 'website',
      }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="OSIL Ltd Industry Solutions in Kenya" className="w-full h-full object-cover opacity-20" loading="eager" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Industry Solutions Kenya</h1>
          <p className="text-lg text-slate-300 max-w-2xl">Tailored technology solutions designed to address the unique challenges of your sector. OSIL Ltd partners with organizations across Kenya for successful digital transformation.</p>
          <div className="flex items-center gap-4 mt-6 text-sm text-slate-400">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Sector Expertise</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Custom Solutions</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Local Support</span>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3">ICT Solutions for Every Sector</h2>
          <p className="text-slate-600 leading-relaxed mb-4">OSIL Ltd understands that different industries have unique technology requirements. Our sector-specific solutions combine hardware, software, and services to address your organization\'s challenges. We work with banks, hospitals, schools, government agencies, and businesses across Kenya to deliver transformative ICT solutions.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Building2 className="w-5 h-5" />, label: 'Corporate', count: '200+' },
              { icon: <Landmark className="w-5 h-5" />, label: 'Government', count: '50+' },
              { icon: <GraduationCap className="w-5 h-5" />, label: 'Education', count: '100+' },
              { icon: <Heart className="w-5 h-5" />, label: 'Healthcare', count: '80+' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg">
                <div className="text-blue-600">{item.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{item.label}</div>
                  <div className="text-xs text-slate-500">{item.count} clients</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {solutions.map((sol) => {
              const seoContent = solutionSeoContent[sol.slug] || solutionSeoContent.corporate;
              return (
                <article key={sol.id} className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-56 bg-slate-100 overflow-hidden">
                    <img src={sol.image} alt={`${sol.title} solutions at OSIL Ltd Kenya`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        {solutionIcons[sol.icon] || <Globe className="w-5 h-5" />}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{sol.title}</h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">{sol.description}</p>

                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Features</h3>
                      <ul className="space-y-1">
                        {sol.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <ChevronRight className="w-3 h-3 text-blue-500 shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Industries Served</h3>
                      <div className="flex flex-wrap gap-2">
                        {seoContent.industries.slice(0, 3).map((a, i) => (
                          <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{a}</span>
                        ))}
                      </div>
                    </div>

                    <Link to="/contact" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                      Get a Custom Solution <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Why OSIL for Industry Solutions?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Users className="w-6 h-6" />, title: 'Sector Expertise', desc: 'Specialists in your industry' },
              { icon: <Zap className="w-6 h-6" />, title: 'Custom Solutions', desc: 'Tailored to your needs' },
              { icon: <Shield className="w-6 h-6" />, title: 'Proven Track Record', desc: '15+ years experience' },
              { icon: <Headphones className="w-6 h-6" />, title: 'Ongoing Support', desc: 'From setup to maintenance' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 mx-auto bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-3">{item.icon}</div>
                <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Find Your Solution</h2>
          <p className="text-lg text-blue-100 mb-8">Our solutions architects are ready to design a technology strategy for your organization. Contact us for a free consultation.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
              Schedule a Consultation
            </Link>
            <Link to="/request-quote" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors border border-blue-500">
              Request a Quote
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

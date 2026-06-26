import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, CheckCircle, Shield, Server, Settings, Wifi, Database, Cloud, Monitor, Video, Wrench, Zap, Headphones, Users } from 'lucide-react';
import { SEO, generateBreadcrumbSchema, getCanonicalUrl } from '../components/SEO';
import { services } from '../data/services';

const serviceIcons: Record<string, React.ReactNode> = {
  'Lightbulb': <Zap className="w-5 h-5" />,
  'Server': <Server className="w-5 h-5" />,
  'Settings': <Settings className="w-5 h-5" />,
  'Wifi': <Wifi className="w-5 h-5" />,
  'Database': <Database className="w-5 h-5" />,
  'Cloud': <Cloud className="w-5 h-5" />,
  'Shield': <Shield className="w-5 h-5" />,
  'Monitor': <Monitor className="w-5 h-5" />,
  'Video': <Video className="w-5 h-5" />,
  'Wrench': <Wrench className="w-5 h-5" />,
};

const serviceSeoContent: Record<string, { overview: string; benefits: string[]; keywords: string[] }> = {
  consultancy: {
    overview: 'OSIL Ltd provides expert ICT consultancy services in Kenya, helping organizations design technology roadmaps, optimize IT infrastructure, and make informed technology investments for digital transformation.',
    benefits: ['Technology strategy development', 'Infrastructure assessment and planning', 'Vendor selection and procurement guidance', 'Digital transformation roadmaps', 'IT governance and policy design', 'ROI analysis and budget planning'],
    keywords: ['ICT consultancy Kenya', 'IT consulting Nairobi', 'technology advisory services', 'digital transformation Kenya', 'IT strategy consulting'],
  },
  infrastructure: {
    overview: 'Professional infrastructure solutions including structured cabling, data center setup, server room design, and network implementation across Kenya and East Africa.',
    benefits: ['Data center design and build', 'Structured cabling systems', 'Server room implementation', 'Network infrastructure deployment', 'Power and cooling solutions', 'Infrastructure documentation'],
    keywords: ['IT infrastructure Kenya', 'data center Nairobi', 'structured cabling', 'server room design', 'network infrastructure Kenya'],
  },
  managed: {
    overview: 'Comprehensive managed IT services with 24/7 monitoring, help desk support, and proactive maintenance for businesses across Kenya.',
    benefits: ['24/7 system monitoring', 'Help desk and technical support', 'Proactive maintenance and updates', 'Performance optimization', 'Backup and disaster recovery', 'Monthly reporting and analytics'],
    keywords: ['managed IT services Kenya', 'IT support Nairobi', 'help desk services', '24/7 IT support', 'outsourced IT Kenya'],
  },
  networking: {
    overview: 'Enterprise networking solutions including LAN/WAN design, wireless networks, VPN setup, and network security from OSIL Ltd Kenya.',
    benefits: ['LAN and WAN design', 'Enterprise WiFi deployment', 'VPN and remote access', 'Network security implementation', 'Load balancing and optimization', 'Network audits and upgrades'],
    keywords: ['networking services Kenya', 'network installation Nairobi', 'WiFi solutions', 'VPN setup Kenya', 'enterprise networking'],
  },
  cloud: {
    overview: 'Cloud migration, deployment, and management services for Microsoft Azure, AWS, and hybrid cloud environments in Kenya.',
    benefits: ['Cloud migration planning', 'Azure and AWS deployment', 'Hybrid cloud solutions', 'Cloud backup and disaster recovery', 'Cloud security and compliance', 'Cost optimization and management'],
    keywords: ['cloud services Kenya', 'Azure migration Nairobi', 'AWS Kenya', 'cloud computing', 'cloud migration services'],
  },
  cybersecurity: {
    overview: 'Comprehensive cybersecurity services including threat assessment, penetration testing, security audits, and managed security solutions for Kenyan organizations.',
    benefits: ['Security assessments and audits', 'Penetration testing', 'Firewall and endpoint protection', 'Security awareness training', 'Incident response planning', 'Compliance and governance'],
    keywords: ['cybersecurity Kenya', 'security services Nairobi', 'penetration testing', 'security audits Kenya', 'threat protection'],
  },
  audiovisual: {
    overview: 'Professional audio-visual solutions for meeting rooms, conference halls, digital signage, and hybrid work collaboration in Kenya.',
    benefits: ['Conference room solutions', 'Video conferencing setup', 'Digital signage systems', 'Sound and lighting design', 'Control room integration', 'AV maintenance and support'],
    keywords: ['audiovisual Kenya', 'AV solutions Nairobi', 'video conferencing systems', 'meeting room technology', 'digital signage Kenya'],
  },
  maintenance: {
    overview: 'IT equipment maintenance and repair services with certified technicians, genuine parts, and warranty support across Kenya.',
    benefits: ['Preventive maintenance contracts', 'Hardware repairs and upgrades', 'Software troubleshooting', 'On-site and remote support', 'Genuine spare parts', 'Warranty claim assistance'],
    keywords: ['IT maintenance Kenya', 'computer repair Nairobi', 'laptop repair Kenya', 'hardware maintenance', 'printer servicing'],
  },
};

export function Services() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://osil.co.ke' },
    { name: 'Services', url: 'https://osil.co.ke/services' },
  ]);

  return (
    <>
      <SEO meta={{
        title: 'ICT Services Kenya | IT Support & Professional Services | OSIL Ltd',
        description: 'Comprehensive ICT services in Kenya including IT consultancy, infrastructure setup, managed services, networking, cloud solutions, cybersecurity, and maintenance support. Expert team serving Nairobi and all counties.',
        keywords: ['ICT services', 'IT consultancy', 'managed services', 'networking', 'cloud solutions', 'cybersecurity', 'IT support', 'Kenya', 'Nairobi', 'OSIL'],
        canonicalUrl: getCanonicalUrl('/services'),
        ogType: 'website',
      }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/1181677/pexels-photo-1181677.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="OSIL Ltd ICT Services in Kenya" className="w-full h-full object-cover opacity-20" loading="eager" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">ICT Services Kenya</h1>
          <p className="text-lg text-slate-300 max-w-2xl">Professional IT services and solutions designed to help organizations across Kenya and East Africa leverage technology for growth, efficiency, and competitive advantage.</p>
          <div className="flex items-center gap-4 mt-6 text-sm text-slate-400">
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Certified Experts</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> 15+ Years Experience</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Nationwide Coverage</span>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Comprehensive IT Services for Kenya</h2>
          <p className="text-slate-600 leading-relaxed mb-4">OSIL Ltd provides end-to-end ICT services designed for Kenyan businesses, government institutions, NGOs, and educational organizations. Our certified team delivers technology solutions that drive efficiency, security, and growth. From initial consultation to implementation and ongoing support, we partner with you for digital success.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Users className="w-5 h-5" />, stat: '1,200+', label: 'Clients Served' },
              { icon: <Shield className="w-5 h-5" />, stat: '200+', label: 'Certifications' },
              { icon: <Server className="w-5 h-5" />, stat: '500+', label: 'Projects Completed' },
              { icon: <Headphones className="w-5 h-5" />, stat: '24/7', label: 'Support Available' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-lg">
                <div className="text-blue-600">{item.icon}</div>
                <div>
                  <div className="text-lg font-bold text-slate-900">{item.stat}</div>
                  <div className="text-xs text-slate-500">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((svc) => {
              const seoContent = serviceSeoContent[svc.slug] || serviceSeoContent.consultancy;
              return (
                <article key={svc.id} className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-slate-100 overflow-hidden">
                    <img src={svc.image} alt={`${svc.title} services at OSIL Ltd Kenya`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        {serviceIcons[svc.icon] || <Settings className="w-5 h-5" />}
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{svc.title}</h2>
                    </div>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed">{svc.description}</p>
                    <div className="mb-4">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Benefits</h3>
                      <ul className="space-y-1">
                        {seoContent.benefits.slice(1, 4).map((f, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                            <ChevronRight className="w-3 h-3 text-blue-500 shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link to="/contact" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                      Request Service <ArrowRight className="w-4 h-4" />
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
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center">Why Choose OSIL for IT Services?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Shield className="w-6 h-6" />, title: 'Certified Experts', desc: 'Microsoft, Cisco, AWS certified' },
              { icon: <Server className="w-6 h-6" />, title: 'Enterprise Experience', desc: 'Government and corporate projects' },
              { icon: <Headphones className="w-6 h-6" />, title: '24/7 Support', desc: 'Round-the-clock assistance' },
              { icon: <Zap className="w-6 h-6" />, title: 'Fast Response', desc: 'Same-day service in Nairobi' },
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
          <h2 className="text-3xl font-bold text-white mb-4">Need a Custom IT Solution?</h2>
          <p className="text-lg text-blue-100 mb-8">Our team is ready to design a tailored ICT service package for your specific requirements. Contact us for a free consultation.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
              Contact Our Team
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

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Award, Users, Globe, Target, Heart } from 'lucide-react';
import { SEO, generateBreadcrumbSchema, getCanonicalUrl, generateOrganizationSchema } from '../components/SEO';
import { companyStats, teamMembers } from '../data/company';

export function About() {
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://osil.co.ke' },
    { name: 'About Us', url: 'https://osil.co.ke/about' },
  ]);

  const organizationSchema = generateOrganizationSchema();

  return (
    <>
      <SEO meta={{
        title: 'About OSIL Ltd Kenya | Leading ICT Solutions Provider | 15+ Years Experience',
        description: 'OSIL Ltd is a leading ICT solutions provider in Kenya with 15+ years experience, 1200+ enterprise clients, and partnerships with Dell, HP, Lenovo, Cisco. Serving Nairobi and all Kenyan counties.',
        keywords: ['OSIL about us', 'ICT company Kenya', 'IT solutions provider Nairobi', 'technology company East Africa', 'OSIL history', 'OSIL team', 'ICT distributor Kenya'],
        canonicalUrl: getCanonicalUrl('/about'),
        ogType: 'website',
        structuredData: organizationSchema,
      }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Hero */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Office" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">About OSIL Ltd</h1>
            <p className="text-lg text-slate-300 max-w-2xl">Leading ICT solutions provider in East Africa, empowering businesses with technology since 2009.</p>
          </motion.div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Story</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>OSIL Ltd was founded in 2009 with a clear mission: to bring world-class technology products and services to businesses and consumers across East Africa. What began as a small computer hardware supplier has grown into a comprehensive ICT solutions provider.</p>
                <p>Over the past 15 years, we have partnered with global technology leaders including Dell, HP, Lenovo, Cisco, Samsung, and Microsoft to deliver enterprise-grade solutions to corporations, government institutions, schools, NGOs, and individual consumers.</p>
                <p>Our headquarters in Nairobi, Kenya, serves as a hub for operations across the region, with distribution networks extending to Uganda, Tanzania, Rwanda, and Ethiopia.</p>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden">
              <img src="https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=800" alt="OSIL Office" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {companyStats.map((stat) => (
              <div key={stat.id} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white">{stat.value}{stat.suffix}</div>
                <div className="text-sm text-blue-100 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Our Mission & Values</h2>
            <p className="text-slate-500">Guided by principles that drive our commitment to excellence</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Our Mission</h3>
              <p className="text-slate-600 leading-relaxed">To empower organizations and individuals across East Africa with world-class technology solutions, exceptional service, and unwavering integrity, enabling them to achieve their full potential in the digital age.</p>
            </div>
            <div className="bg-white border border-slate-100 rounded-xl p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Our Vision</h3>
              <p className="text-slate-600 leading-relaxed">To be the most trusted and innovative ICT solutions provider in East Africa, recognized for delivering transformative technology that drives business growth, enhances education, and improves quality of life.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Heart className="w-5 h-5" />, title: 'Customer First', desc: 'Every decision we make starts with the customer in mind.' },
              { icon: <Award className="w-5 h-5" />, title: 'Excellence', desc: 'We pursue the highest standards in everything we do.' },
              { icon: <Users className="w-5 h-5" />, title: 'Partnership', desc: 'We build lasting relationships with clients and partners.' },
              { icon: <CheckCircle className="w-5 h-5" />, title: 'Integrity', desc: 'We operate with honesty, transparency, and accountability.' },
            ].map((v, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-xl p-5 text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 mx-auto bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-3">{v.icon}</div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1">{v.title}</h3>
                <p className="text-xs text-slate-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Our Leadership Team</h2>
            <p className="text-slate-500">Experienced professionals driving our success</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((tm) => (
              <div key={tm.id} className="bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                <div className="h-48 bg-slate-100">
                  <img src={tm.image} alt={tm.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-slate-900">{tm.name}</h3>
                  <p className="text-sm text-blue-600 mb-2">{tm.role}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{tm.bio}</p>
                  <div className="flex items-center gap-3">
                    {tm.linkedin && (
                      <a href={tm.linkedin} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 text-xs">LinkedIn</a>
                    )}
                    {tm.email && (
                      <a href={`mailto:${tm.email}`} className="text-slate-400 hover:text-blue-600 text-xs">Email</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Partner With OSIL</h2>
          <p className="text-lg text-blue-100 mb-8">Let us help you achieve your technology goals with tailored solutions and expert support.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
              Contact Us
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

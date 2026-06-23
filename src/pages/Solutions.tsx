import { Link } from 'react-router-dom';
import { ChevronRight, ArrowRight, Building2, Landmark, GraduationCap, Heart, Store, Globe } from 'lucide-react';
import { SEO } from '../components/SEO';
import { solutions } from '../data/solutions';

const solutionIcons: Record<string, React.ReactNode> = {
  'Building2': <Building2 className="w-6 h-6" />,
  'Landmark': <Landmark className="w-6 h-6" />,
  'GraduationCap': <GraduationCap className="w-6 h-6" />,
  'Heart': <Heart className="w-6 h-6" />,
  'Store': <Store className="w-6 h-6" />,
  'Globe': <Globe className="w-6 h-6" />,
};

export function Solutions() {
  return (
    <>
      <SEO meta={{
        title: 'Solutions | OSIL Ltd - Industry ICT Solutions Kenya',
        description: 'Tailored technology solutions for corporates, government, education, NGOs, SMEs, and enterprises across Kenya and East Africa.',
        keywords: ['solutions', 'corporate', 'government', 'education', 'NGO', 'SME', 'enterprise', 'Kenya'],
      }} />

      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Solutions" className="w-full h-full object-cover opacity-20" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Solutions</h1>
          <p className="text-lg text-slate-300 max-w-2xl">Industry-specific technology solutions designed to address the unique challenges of your sector.</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {solutions.map((sol) => (
              <div key={sol.id} className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-56 bg-slate-100 overflow-hidden">
                  <img src={sol.image} alt={sol.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                    <div className="space-y-1">
                      {sol.features.slice(0, 4).map((f, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                          <ChevronRight className="w-3 h-3 text-blue-500 shrink-0" /> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Target Audience</h3>
                    <div className="flex flex-wrap gap-2">
                      {sol.targetAudience.slice(0, 3).map((a, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">{a}</span>
                      ))}
                    </div>
                  </div>
                  <Link to="/contact" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Find Your Solution</h2>
          <p className="text-lg text-blue-100 mb-8">Our solutions architects are ready to design a technology strategy for your organization.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
            Schedule a Consultation
          </Link>
        </div>
      </section>
    </>
  );
}

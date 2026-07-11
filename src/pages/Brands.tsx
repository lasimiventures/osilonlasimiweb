import { Link } from 'react-router-dom';
import { ChevronRight, Shield, CheckCircle, Award, Globe } from 'lucide-react';
import { SEO, generateBreadcrumbSchema, getCanonicalUrl } from '../components/SEO';
import { Breadcrumb } from '../components/Breadcrumb';
import { useCatalog } from '../context/CatalogContext';

export function Brands() {
  const { brands } = useCatalog();
  const grouped = brands.reduce((acc, brand) => {
    const key = brand.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(brand);
    return acc;
  }, {} as Record<string, typeof brands>);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://osil.co.ke' },
    { name: 'Brands', url: 'https://osil.co.ke/brands' },
  ]);

  return (
    <>
      <SEO meta={{
        title: 'Technology Brands | Authorized Dealer | Dell, HP, Lenovo & More | OSIL Ltd Kenya',
        description: 'OSIL Ltd is an authorized dealer for Dell, HP, Lenovo, Cisco, Samsung, Apple, Microsoft, and other leading technology brands in Kenya. Genuine products with manufacturer warranty.',
        keywords: ['Dell Kenya', 'HP Kenya', 'Lenovo Kenya', 'Cisco Kenya', 'Samsung Kenya', 'Apple Kenya', 'authorized dealer', 'technology brands Nairobi', 'OSIL brands'],
        canonicalUrl: getCanonicalUrl('/brands'),
        ogType: 'website',
      }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/374074/pexels-photo-374074.jpeg?auto=compress&cs=tinysrgb&w=1600" alt="Technology Brands at OSIL Ltd Kenya" className="w-full h-full object-cover opacity-20" loading="eager" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="mb-3">
            <Breadcrumb crumbs={[
              { label: 'Brands' },
            ]} />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Our Technology Brands</h1>
          <p className="text-lg text-slate-300 max-w-2xl">OSIL Ltd partners with the world\'s leading technology brands to bring genuine products to Kenya and East Africa.</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
            <span>{brands.length} brands</span>
            <span>|</span>
            <span className="flex items-center gap-1"><Shield className="w-4 h-4 text-green-400" /> Authorized Dealer</span>
            <span>|</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-4 h-4 text-green-400" /> Genuine Products</span>
          </div>
        </div>
      </section>

      <section className="py-8 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Authorized Technology Partner</h2>
          <p className="text-slate-600 leading-relaxed mb-4">OSIL Ltd is proud to be an authorized dealer for the world\'s leading technology brands. This means every product we sell is genuine, comes with manufacturer warranty, and is supported by our certified technical team. We partner directly with Dell, HP, Lenovo, Cisco, Samsung, Apple, Microsoft, Epson, Logitech, and many more to ensure you receive authentic products.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Shield className="w-5 h-5" />, title: 'Genuine Products', desc: 'No counterfeits' },
              { icon: <Award className="w-5 h-5" />, title: 'Manufacturer Warranty', desc: 'Full coverage' },
              { icon: <Globe className="w-5 h-5" />, title: 'Global Brands', desc: 'World-leaders' },
              { icon: <CheckCircle className="w-5 h-5" />, title: 'Local Support', desc: 'Kenya-based' },
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

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {Object.entries(grouped).map(([category, brands]) => (
            <div key={category} className="mb-10">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                {category} <span className="text-xs text-slate-400 font-normal">({brands.length} brands)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {brands.map((brand) => (
                  <Link key={brand.id} to={`/brand/${brand.slug}`} className="group bg-white border border-slate-100 rounded-xl p-5 hover:shadow-lg hover:border-blue-100 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600 overflow-hidden">
                        <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{brand.name}</h3>
                        <p className="text-xs text-slate-400">{brand.productCount} products</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">{brand.description}</p>
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      View Products <ChevronRight className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-8 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Looking for a Specific Brand?</h2>
          <p className="text-slate-600 text-sm mb-4">Can\'t find the brand you\'re looking for? Contact us - we may be able to source it for you.</p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Contact Us
          </Link>
        </div>
      </section>
    </>
  );
}

import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { allBrands } from '../data/brands';

export function Brands() {
  const grouped = allBrands.reduce((acc, brand) => {
    const key = brand.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(brand);
    return acc;
  }, {} as Record<string, typeof allBrands>);

  return (
    <>
      <SEO meta={{
        title: 'Brands | OSIL Ltd - Authorized Technology Partners',
        description: 'Browse our authorized technology brands including Dell, HP, Lenovo, Cisco, Samsung, Apple, and more. All products come with genuine manufacturer warranties.',
        keywords: ['brands', 'Dell', 'HP', 'Lenovo', 'Cisco', 'Samsung', 'Apple', 'authorized', 'Kenya'],
      }} />

      <section className="bg-slate-50 py-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Our Brands</h1>
          <p className="text-sm text-slate-500">Authorized partners with the world\'s leading technology brands</p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {Object.entries(grouped).map(([category, brands]) => (
            <div key={category} className="mb-10">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">{category}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {brands.map((brand) => (
                  <Link key={brand.id} to={`/brand/${brand.slug}`} className="group bg-white border border-slate-100 rounded-xl p-5 hover:shadow-lg hover:border-blue-100 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-sm font-bold text-slate-600">
                        {brand.name.slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{brand.name}</h3>
                        <p className="text-xs text-slate-400">{brand.productCount} products</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{brand.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

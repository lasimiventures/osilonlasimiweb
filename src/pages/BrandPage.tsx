import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { SEO } from '../components/SEO';
import { ProductGrid } from '../components/ProductGrid';
import { SearchBar } from '../components/SearchBar';
import { getBrandBySlug } from '../data/brands';
import { getProductsByBrand } from '../data/products';

export function BrandPage() {
  const { slug } = useParams<{ slug: string }>();
  const brand = getBrandBySlug(slug || '');
  const [query, setQuery] = useState('');

  if (!brand) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Brand Not Found</h1>
        <p className="text-slate-500 mb-6">The brand you are looking for does not exist in our catalog.</p>
        <Link to="/brands" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          View All Brands
        </Link>
      </div>
    );
  }

  const products = getProductsByBrand(slug || '').filter((p) =>
    query ? p.name.toLowerCase().includes(query.toLowerCase()) || p.category.toLowerCase().includes(query.toLowerCase()) : true
  );

  return (
    <>
      <SEO meta={{
        title: `${brand.name} Products | OSIL Ltd`,
        description: brand.description,
        keywords: [brand.name, 'products', brand.category, 'Kenya'],
      }} />

      {/* Banner */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src={brand.logo} alt={brand.name} className="w-full h-full object-cover opacity-30" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
            <Link to="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/brands" className="hover:text-white">Brands</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white font-medium">{brand.name}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">{brand.name}</h1>
          <p className="text-lg text-slate-300 max-w-2xl mb-4">{brand.description}</p>
          {brand.website && (
            <a href={brand.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-blue-300 hover:text-white transition-colors">
              Official Website <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <SearchBar initialValue={query} onSearch={setQuery} placeholder={`Search ${brand.name} products...`} />
          </div>
          <ProductGrid products={products} emptyMessage={`No products found for ${brand.name}.`} />
        </div>
      </section>
    </>
  );
}

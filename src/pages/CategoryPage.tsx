import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { SEO } from '../components/SEO';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductGrid } from '../components/ProductGrid';
import { SearchBar } from '../components/SearchBar';
import { getCategoryBySlug, getRelatedCategories } from '../data/categories';
import { getProductsByCategory } from '../data/products';
import { getBrandsByCategory } from '../data/brands';

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = getCategoryBySlug(slug || '');
  const [query, setQuery] = useState('');

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Category Not Found</h1>
        <p className="text-slate-500 mb-6">The category you are looking for does not exist.</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  const products = getProductsByCategory(slug || '').filter((p) =>
    query ? p.name.toLowerCase().includes(query.toLowerCase()) || p.brand.toLowerCase().includes(query.toLowerCase()) : true
  );
  const brands = getBrandsByCategory(slug || '');
  const relatedCats = getRelatedCategories(slug || '');

  return (
    <>
      <SEO meta={{
        title: `${category.name} | OSIL Ltd Products`,
        description: category.description,
        keywords: [category.name, 'products', 'Kenya', 'OSIL'],
      }} />

      {/* Banner */}
      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src={category.image} alt={category.name} className="w-full h-full object-cover opacity-30" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <Breadcrumb crumbs={[
            { label: 'Products', path: '/products' },
            { label: category.name },
          ]} />
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">{category.name}</h1>
          <p className="text-lg text-slate-300 max-w-2xl">{category.description}</p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Brands */}
          {brands.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">Brands in {category.name}</h2>
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <Link key={b.id} to={`/brand/${b.slug}`} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                    {b.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <SearchBar initialValue={query} onSearch={setQuery} placeholder={`Search in ${category.name}...`} />
          </div>

          {/* Products */}
          <ProductGrid products={products} emptyMessage={`No products found in ${category.name}.`} />

          {/* Related Categories */}
          {relatedCats.length > 0 && (
            <div className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Related Categories</h2>
              <div className="flex flex-wrap gap-3">
                {relatedCats.map((c) => (
                  <Link key={c.id} to={`/category/${c.slug}`} className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

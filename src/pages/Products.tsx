import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Zap, Shield, Truck } from 'lucide-react';
import { SEO, generateBreadcrumbSchema, getCanonicalUrl } from '../components/SEO';
import { Breadcrumb } from '../components/Breadcrumb';
import { ProductGrid } from '../components/ProductGrid';
import { SearchBar } from '../components/SearchBar';
import { FilterSidebar } from '../components/FilterSidebar';
import { products, searchProducts, getFeaturedProducts, getNewArrivals } from '../data/products';
import { categories } from '../data/categories';
import { allBrands } from '../data/brands';

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || null;
  const initialBrand = searchParams.get('brand') || null;

  const [query, setQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null);

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://osil.co.ke' },
    { name: 'Products', url: 'https://osil.co.ke/products' },
  ]);

  const filteredProducts = useMemo(() => {
    let result = products;
    if (query.trim()) {
      result = searchProducts(query);
    }
    if (selectedCategory) {
      result = result.filter((p) => p.categorySlug === selectedCategory);
    }
    if (selectedBrands.length > 0) {
      result = result.filter((p) => selectedBrands.includes(p.brandSlug));
    }
    if (selectedAvailability) {
      result = result.filter((p) => p.availability === selectedAvailability);
    }
    return result;
  }, [query, selectedCategory, selectedBrands, selectedAvailability]);

  const featuredProducts = getFeaturedProducts().slice(0, 4);
  const newArrivals = getNewArrivals().slice(0, 4);

  const handleSearch = (q: string) => {
    setQuery(q);
    const newParams = new URLSearchParams(searchParams);
    if (q) newParams.set('search', q);
    else newParams.delete('search');
    setSearchParams(newParams);
  };

  const handleCategoryChange = (slug: string | null) => {
    setSelectedCategory(slug);
    const newParams = new URLSearchParams(searchParams);
    if (slug) newParams.set('category', slug);
    else newParams.delete('category');
    setSearchParams(newParams);
  };

  const handleBrandChange = (slug: string) => {
    setSelectedBrands((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  return (
    <>
      <SEO meta={{
        title: 'ICT Products & Electronics | All Products | OSIL Ltd Kenya',
        description: 'Shop laptops, desktops, phones, tablets, servers, networking equipment, and IT accessories from Dell, HP, Lenovo, Cisco, Samsung, and more at OSIL Ltd Kenya. Genuine products with warranty and fast delivery.',
        keywords: ['laptops Kenya', 'desktop computers Nairobi', 'phones Kenya', 'tablets', 'servers Kenya', 'networking equipment', 'IT accessories', 'Dell laptops', 'HP computers', 'Lenovo Kenya', 'OSIL products'],
        canonicalUrl: getCanonicalUrl('/products'),
        ogType: 'website',
      }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <section className="relative bg-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=1600" alt="OSIL Ltd Products Kenya" className="w-full h-full object-cover opacity-20" loading="eager" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="mb-3">
            <Breadcrumb crumbs={[
              { label: 'Products' },
            ]} />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">Technology Products Kenya</h1>
          <p className="text-lg text-slate-300 max-w-2xl">Browse our extensive catalog of genuine laptops, desktops, phones, servers, networking equipment, and IT accessories from leading global brands.</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-slate-400">
            <span>{products.length}+ products</span>
            <span>|</span>
            <span>{allBrands.length} brands</span>
            <span>|</span>
            <span>{categories.length} categories</span>
          </div>
        </div>
      </section>

      <section className="py-6 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Shop by Category</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.name} <span className="text-slate-400 text-xs">({cat.productCount})</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {(featuredProducts.length > 0 || newArrivals.length > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {featuredProducts.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">Featured Products</h3>
                    <Link to="/products" className="text-xs text-blue-600 hover:underline">View all</Link>
                  </div>
                  <div className="space-y-2">
                    {featuredProducts.slice(0, 2).map((p) => (
                      <Link key={p.id} to={`/products/${p.slug}`} className="flex items-center gap-3 p-2 bg-white rounded-lg hover:shadow-sm transition-shadow">
                        <img src={p.images[0]} alt={p.name} className="w-12 h-12 rounded object-cover" loading="lazy" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-900 truncate">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.brand}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {newArrivals.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">New Arrivals</h3>
                    <Link to="/products" className="text-xs text-blue-600 hover:underline">View all</Link>
                  </div>
                  <div className="space-y-2">
                    {newArrivals.slice(0, 2).map((p) => (
                      <Link key={p.id} to={`/products/${p.slug}`} className="flex items-center gap-3 p-2 bg-white rounded-lg hover:shadow-sm transition-shadow">
                        <img src={p.images[0]} alt={p.name} className="w-12 h-12 rounded object-cover" loading="lazy" />
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-slate-900 truncate">{p.name}</div>
                          <div className="text-xs text-slate-500">{p.brand}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <SearchBar initialValue={query} onSearch={handleSearch} placeholder="Search products by name, brand, or category..." />
          </div>

          <div className="flex gap-8">
            <div className="w-64 shrink-0">
              <FilterSidebar
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
                selectedBrands={selectedBrands}
                onBrandChange={handleBrandChange}
                selectedAvailability={selectedAvailability}
                onAvailabilityChange={setSelectedAvailability}
                productCount={filteredProducts.length}
              />
            </div>
            <div className="flex-1 min-w-0">
              <ProductGrid
                products={filteredProducts}
                emptyMessage="No products match your filters. Try adjusting your search or filters."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-8 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Why Shop at OSIL Ltd Kenya?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: <Shield className="w-5 h-5" />, title: 'Genuine Products', desc: 'Authorized dealer' },
              { icon: <Truck className="w-5 h-5" />, title: 'Fast Delivery', desc: 'All Kenyan counties' },
              { icon: <Zap className="w-5 h-5" />, title: 'Local Warranty', desc: 'Kenya coverage' },
              { icon: <CheckCircle className="w-5 h-5" />, title: 'Expert Support', desc: 'Certified team' },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-lg p-4 text-center">
                <div className="w-10 h-10 mx-auto bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-2">{item.icon}</div>
                <div className="text-xs font-semibold text-slate-900">{item.title}</div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

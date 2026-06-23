import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { ProductGrid } from '../components/ProductGrid';
import { SearchBar } from '../components/SearchBar';
import { FilterSidebar } from '../components/FilterSidebar';
import { products, searchProducts } from '../data/products';

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || null;
  const initialBrand = searchParams.get('brand') || null;

  const [query, setQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null);

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
        title: 'Products | OSIL Ltd - ICT Solutions & Electronics',
        description: 'Browse our extensive catalog of laptops, desktops, phones, tablets, servers, networking equipment, and IT accessories from leading brands.',
        keywords: ['laptops', 'desktops', 'phones', 'tablets', 'servers', 'networking', 'IT accessories', 'Kenya'],
      }} />

      <section className="bg-slate-50 py-8 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Products</h1>
          <p className="text-sm text-slate-500">Explore our complete catalog of technology products</p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
    </>
  );
}

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

interface FilterSidebarProps {
  selectedCategory: string | null;
  onCategoryChange: (slug: string | null) => void;
  selectedBrands: string[];
  onBrandChange: (slug: string) => void;
  selectedAvailability: string | null;
  onAvailabilityChange: (status: string | null) => void;
  productCount?: number;
  hideCategoryFilter?: boolean;
  hideBrandFilter?: boolean;
  filterCategoriesByBrand?: string;
}

export function FilterSidebar({
  selectedCategory,
  onCategoryChange,
  selectedBrands,
  onBrandChange,
  selectedAvailability,
  onAvailabilityChange,
  productCount,
  hideCategoryFilter = false,
  hideBrandFilter = false,
  filterCategoriesByBrand,
}: FilterSidebarProps) {
  const { categories, brands: allBrands, products } = useCatalog();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sections, setSections] = useState({
    categories: true,
    brands: true,
    availability: true,
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredBrands = useMemo(() => {
    if (!selectedCategory) {
      return allBrands;
    }
    const brandSlugsInCategory = new Set(
      products
        .filter((p) => p.categorySlug === selectedCategory)
        .map((p) => p.brandSlug)
    );
    return allBrands.filter((brand) => brandSlugsInCategory.has(brand.slug));
  }, [selectedCategory]);

  const filteredCategories = useMemo(() => {
    if (!filterCategoriesByBrand) {
      return categories;
    }
    const categorySlugsInBrand = new Set(
      products
        .filter((p) => p.brandSlug === filterCategoriesByBrand)
        .map((p) => p.categorySlug)
    );
    return categories.filter((cat) => categorySlugsInBrand.has(cat.slug));
  }, [filterCategoriesByBrand]);

  const availabilityOptions = [
    { value: 'in-stock', label: 'In Stock' },
    { value: 'low-stock', label: 'Low Stock' },
    { value: 'pre-order', label: 'Pre-Order' },
    { value: 'out-of-stock', label: 'Out of Stock' },
  ];

  const hasFilters = selectedCategory || selectedBrands.length > 0 || selectedAvailability;

  const clearFilters = () => {
    onCategoryChange(null);
    selectedBrands.forEach((b) => onBrandChange(b));
    onAvailabilityChange(null);
  };

  const content = (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">Filters</h3>
        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            Clear all
          </button>
        )}
      </div>

      {/* Categories */}
      {!hideCategoryFilter && (
        <div>
          <button onClick={() => toggleSection('categories')} className="flex items-center justify-between w-full text-xs font-medium text-slate-700 mb-1.5">
            Categories
            {sections.categories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {sections.categories && (
            <div className="space-y-0.5">
              {filteredCategories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer group py-0.5">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat.slug}
                    onChange={() => onCategoryChange(selectedCategory === cat.slug ? null : cat.slug)}
                    className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{cat.name}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{cat.productCount}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Brands */}
      {!hideBrandFilter && (
        <div>
          <button onClick={() => toggleSection('brands')} className="flex items-center justify-between w-full text-xs font-medium text-slate-700 mb-1.5">
            Brands
            {sections.brands ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {sections.brands && (
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {filteredBrands.map((brand) => (
                <label key={brand.id} className="flex items-center gap-2 cursor-pointer group py-0.5">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.slug)}
                    onChange={() => onBrandChange(brand.slug)}
                    className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{brand.name}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">{brand.productCount}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Availability */}
      <div>
        <button onClick={() => toggleSection('availability')} className="flex items-center justify-between w-full text-xs font-medium text-slate-700 mb-1.5">
          Availability
          {sections.availability ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {sections.availability && (
          <div className="space-y-0.5">
            {availabilityOptions.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer group py-0.5">
                <input
                  type="radio"
                  name="availability"
                  checked={selectedAvailability === opt.value}
                  onChange={() => onAvailabilityChange(selectedAvailability === opt.value ? null : opt.value)}
                  className="w-3.5 h-3.5 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 group-hover:text-slate-900 transition-colors">{opt.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {productCount !== undefined && (
        <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-100">
          Showing {productCount} product{productCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <Filter className="w-3.5 h-3.5" /> Filters
          {hasFilters && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
        </button>
        {mobileOpen && (
          <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl shadow-lg">
            {content}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block sticky top-28 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
        {content}
      </div>
    </>
  );
}

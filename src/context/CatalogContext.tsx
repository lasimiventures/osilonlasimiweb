import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Product, Category, Brand } from '../types';
import { supabase } from '../lib/supabase';
import { mapProduct, mapCategory, mapBrand } from '../lib/mappers';

interface CatalogContextType {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  loading: boolean;
  error: string | null;
  getProductBySlug: (slug: string) => Product | undefined;
  getProductsByCategory: (categorySlug: string) => Product[];
  getProductsByBrand: (brandSlug: string) => Product[];
  getFeaturedProducts: () => Product[];
  getNewArrivals: () => Product[];
  getBestSellers: () => Product[];
  searchProducts: (query: string) => Product[];
  getRelatedProducts: (product: Product) => Product[];
  getCategoryBySlug: (slug: string) => Category | undefined;
  getRelatedCategories: (slug: string) => Category[];
  getBrandBySlug: (slug: string) => Brand | undefined;
  getBrandsByCategory: (categorySlug: string) => Brand[];
  getProductById: (id: string) => Product | undefined;
  refresh: () => void;
}

const CatalogContext = createContext<CatalogContextType>({
  products: [],
  categories: [],
  brands: [],
  loading: true,
  error: null,
  getProductBySlug: () => undefined,
  getProductsByCategory: () => [],
  getProductsByBrand: () => [],
  getFeaturedProducts: () => [],
  getNewArrivals: () => [],
  getBestSellers: () => [],
  searchProducts: () => [],
  getRelatedProducts: () => [],
  getCategoryBySlug: () => undefined,
  getRelatedCategories: () => [],
  getBrandBySlug: () => undefined,
  getBrandsByCategory: () => [],
  getProductById: () => undefined,
  refresh: () => {},
});

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [productsRes, categoriesRes, brandsRes] = await Promise.all([
          supabase.from('products').select('*').order('created_at', { ascending: false }),
          supabase.from('categories').select('*').order('name'),
          supabase.from('brands').select('*').order('name'),
        ]);

        if (cancelled) return;

        if (productsRes.error) throw productsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;
        if (brandsRes.error) throw brandsRes.error;

        setProducts((productsRes.data ?? []).map(mapProduct));
        setCategories((categoriesRes.data ?? []).map(mapCategory));
        setBrands((brandsRes.data ?? []).map(mapBrand));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load catalog');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [reloadKey]);

  const refresh = useCallback(() => setReloadKey(k => k + 1), []);

  const getProductBySlug = useCallback(
    (slug: string) => products.find(p => p.slug === slug),
    [products],
  );

  const getProductById = useCallback(
    (id: string) => products.find(p => p.id === id),
    [products],
  );

  const getProductsByCategory = useCallback(
    (categorySlug: string) => products.filter(p => p.categorySlug === categorySlug),
    [products],
  );

  const getProductsByBrand = useCallback(
    (brandSlug: string) => products.filter(p => p.brandSlug === brandSlug),
    [products],
  );

  const getFeaturedProducts = useCallback(
    () => products.filter(p => p.isFeatured),
    [products],
  );

  const getNewArrivals = useCallback(
    () => products.filter(p => p.isNew),
    [products],
  );

  const getBestSellers = useCallback(
    () => products.filter(p => p.isBestSeller),
    [products],
  );

  const searchProducts = useCallback(
    (query: string) => {
      const q = query.toLowerCase();
      return products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)),
      );
    },
    [products],
  );

  const getRelatedProducts = useCallback(
    (product: Product) => {
      const slugs = product.relatedProducts;
      const bySlug = slugs
        .map(s => products.find(p => p.slug === s))
        .filter((p): p is Product => p !== undefined);
      if (bySlug.length >= 4) return bySlug.slice(0, 4);
      const sameCategory = products
        .filter(p => p.categorySlug === product.categorySlug && p.id !== product.id)
        .slice(0, 4 - bySlug.length);
      return [...bySlug, ...sameCategory];
    },
    [products],
  );

  const getCategoryBySlug = useCallback(
    (slug: string) => categories.find(c => c.slug === slug),
    [categories],
  );

  const getRelatedCategories = useCallback(
    (slug: string) => {
      const cat = categories.find(c => c.slug === slug);
      if (!cat) return [];
      return categories.filter(c => cat.relatedCategories.includes(c.slug));
    },
    [categories],
  );

  const getBrandBySlug = useCallback(
    (slug: string) => brands.find(b => b.slug === slug),
    [brands],
  );

  const getBrandsByCategory = useCallback(
    (categorySlug: string) => {
      const brandSlugs = new Set(
        products
          .filter(p => p.categorySlug === categorySlug)
          .map(p => p.brandSlug),
      );
      return brands.filter(b => brandSlugs.has(b.slug));
    },
    [products, brands],
  );

  return (
    <CatalogContext.Provider
      value={{
        products,
        categories,
        brands,
        loading,
        error,
        getProductBySlug,
        getProductsByCategory,
        getProductsByBrand,
        getFeaturedProducts,
        getNewArrivals,
        getBestSellers,
        searchProducts,
        getRelatedProducts,
        getCategoryBySlug,
        getRelatedCategories,
        getBrandBySlug,
        getBrandsByCategory,
        getProductById,
        refresh,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  return useContext(CatalogContext);
}

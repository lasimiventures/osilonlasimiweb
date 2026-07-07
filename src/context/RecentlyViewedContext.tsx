import { createContext, useContext, useState, useCallback } from 'react';
import type { Product } from '../types';
import { products as allProducts } from '../data/products';

interface RecentlyViewedContextType {
  recentlyViewed: Product[];
  trackProduct: (productId: string) => void;
}

const MAX_RECENT = 6;
const STORAGE_KEY = 'osil_recently_viewed';

function loadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

const RecentlyViewedContext = createContext<RecentlyViewedContextType>({
  recentlyViewed: [],
  trackProduct: () => {},
});

export function RecentlyViewedProvider({ children }: { children: React.ReactNode }) {
  const [viewedIds, setViewedIds] = useState<string[]>(loadIds);

  const trackProduct = useCallback((productId: string) => {
    setViewedIds(prev => {
      const filtered = prev.filter(id => id !== productId);
      const updated = [productId, ...filtered].slice(0, MAX_RECENT);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const recentlyViewed = viewedIds
    .map(id => allProducts.find(p => p.id === id))
    .filter((p): p is Product => p !== undefined);

  return (
    <RecentlyViewedContext.Provider value={{ recentlyViewed, trackProduct }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export const useRecentlyViewed = () => useContext(RecentlyViewedContext);

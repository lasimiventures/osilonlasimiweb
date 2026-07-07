import { createContext, useContext, useState, useCallback } from 'react';
import type { Product } from '../types';

interface CompareContextType {
  compareList: Product[];
  addToCompare: (product: Product) => boolean;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  isDrawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const MAX_COMPARE = 4;

const CompareContext = createContext<CompareContextType>({
  compareList: [],
  addToCompare: () => false,
  removeFromCompare: () => {},
  clearCompare: () => {},
  isInCompare: () => false,
  isDrawerOpen: false,
  setDrawerOpen: () => {},
});

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  const addToCompare = useCallback((product: Product): boolean => {
    let added = false;
    setCompareList(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      if (prev.length >= MAX_COMPARE) return prev;
      added = true;
      return [...prev, product];
    });
    return added;
  }, []);

  const removeFromCompare = useCallback((productId: string) => {
    setCompareList(prev => {
      const next = prev.filter(p => p.id !== productId);
      if (next.length === 0) setDrawerOpen(false);
      return next;
    });
  }, []);

  const clearCompare = useCallback(() => {
    setCompareList([]);
    setDrawerOpen(false);
  }, []);

  const isInCompare = useCallback(
    (productId: string) => compareList.some(p => p.id === productId),
    [compareList],
  );

  return (
    <CompareContext.Provider value={{ compareList, addToCompare, removeFromCompare, clearCompare, isInCompare, isDrawerOpen, setDrawerOpen }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);

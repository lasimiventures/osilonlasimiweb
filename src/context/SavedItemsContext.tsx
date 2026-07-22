import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Product } from '../types';

interface SavedItemsContextType {
  savedIds: string[];
  savedItems: Product[];
  toggleSave: (product: Product) => void;
  isSaved: (productId: string) => boolean;
  removeSaved: (productId: string) => void;
  count: number;
}

const STORAGE_KEY = 'osil_saved_items';
const SavedItemsContext = createContext<SavedItemsContextType | undefined>(undefined);

function loadIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function SavedItemsProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<string[]>(loadIds);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIds)); } catch {}
  }, [savedIds]);

  const toggleSave = useCallback((product: Product) => {
    setSavedIds(prev => {
      if (prev.includes(product.id)) {
        return prev.filter(id => id !== product.id);
      }
      return [...prev, product.id];
    });
  }, []);

  const removeSaved = useCallback((productId: string) => {
    setSavedIds(prev => prev.filter(id => id !== productId));
  }, []);

  const isSaved = useCallback((productId: string) => savedIds.includes(productId), [savedIds]);

  return (
    <SavedItemsContext.Provider value={{
      savedIds,
      savedItems: [],
      toggleSave,
      isSaved,
      removeSaved,
      count: savedIds.length,
    }}>
      {children}
    </SavedItemsContext.Provider>
  );
}

export function useSavedItems() {
  const ctx = useContext(SavedItemsContext);
  if (!ctx) throw new Error('useSavedItems must be used within SavedItemsProvider');
  return ctx;
}

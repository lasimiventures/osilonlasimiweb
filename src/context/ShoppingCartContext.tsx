import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { CartItem, Product } from '../types';

interface ShoppingCartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  estimatedTotal: number | null;
}

const STORAGE_KEY = 'osil_shopping_cart';

const ShoppingCartContext = createContext<ShoppingCartContextType | undefined>(undefined);

export function ShoppingCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        productSlug: product.slug,
        brand: product.brand,
        image: product.images[0] ?? '',
        quantity,
        unitPrice: product.displayPrice ?? product.price ?? null,
      }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.productId !== productId));
      return;
    }
    setItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity } : i));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const estimatedTotal = items.some(i => i.unitPrice !== null)
    ? items.reduce((sum, i) => sum + (i.unitPrice ?? 0) * i.quantity, 0)
    : null;

  return (
    <ShoppingCartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart, itemCount, estimatedTotal,
    }}>
      {children}
    </ShoppingCartContext.Provider>
  );
}

export function useShoppingCart() {
  const ctx = useContext(ShoppingCartContext);
  if (!ctx) throw new Error('useShoppingCart must be used within ShoppingCartProvider');
  return ctx;
}

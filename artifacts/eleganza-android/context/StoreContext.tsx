import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { StorefrontProduct } from '@workspace/api-client-react';

type BagItem = { product: StorefrontProduct; quantity: number };
type StoreContextValue = {
  bag: BagItem[];
  favorites: number[];
  add: (product: StorefrontProduct) => void;
  remove: (id: number) => void;
  toggleFavorite: (id: number) => void;
};
const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: React.PropsWithChildren) {
  const [bag, setBag] = useState<BagItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  useEffect(() => {
    AsyncStorage.multiGet(['eleganza-mobile-bag', 'eleganza-mobile-favorites']).then(([b, f]) => {
      if (b[1]) setBag(JSON.parse(b[1]) as BagItem[]);
      if (f[1]) setFavorites(JSON.parse(f[1]) as number[]);
    }).catch(() => undefined);
  }, []);
  useEffect(() => { void AsyncStorage.setItem('eleganza-mobile-bag', JSON.stringify(bag)); }, [bag]);
  useEffect(() => { void AsyncStorage.setItem('eleganza-mobile-favorites', JSON.stringify(favorites)); }, [favorites]);
  const value = useMemo<StoreContextValue>(() => ({
    bag, favorites,
    add: (product) => setBag((current) => {
      const found = current.find((item) => item.product.id === product.id);
      return found ? current.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, 99) } : item) : [...current, { product, quantity: 1 }];
    }),
    remove: (id) => setBag((current) => current.flatMap((item) => item.product.id !== id ? [item] : item.quantity > 1 ? [{ ...item, quantity: item.quantity - 1 }] : [])),
    toggleFavorite: (id) => setFavorites((current) => current.includes(id) ? current.filter((x) => x !== id) : [...current, id]),
  }), [bag, favorites]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
}

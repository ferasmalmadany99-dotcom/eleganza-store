import React from 'react';
import { router } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { ProductList } from '@/components/Storefront';
import { useStore } from '@/context/StoreContext';
import { useColors } from '@/hooks/useColors';
import { Text, View } from 'react-native';
import type { StorefrontProduct } from '@workspace/api-client-react';

export default function SavedScreen() {
  const colors = useColors(); const { isSignedIn } = useAuth(); const { add, toggleFavorite } = useStore();
  const gated = () => router.push('/(auth)/sign-in');
  const run = (action: (p: StorefrontProduct) => void) => (p: StorefrontProduct) => isSignedIn ? action(p) : gated();
  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <Text style={{ fontFamily: 'serif', fontSize: 28, color: colors.foreground, textAlign: 'right', padding: 20 }}>المفضلة</Text>
    <ProductList onlyFavorites onAdd={run(add)} onFavorite={run((p) => toggleFavorite(p.id))} />
  </View>;
}

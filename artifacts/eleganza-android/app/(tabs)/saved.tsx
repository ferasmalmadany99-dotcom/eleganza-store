import React from 'react';
import { router } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { ProductList } from '@/components/Storefront';
import { useStore } from '@/context/StoreContext';
import { useColors } from '@/hooks/useColors';
import { Text, View } from 'react-native';
import type { StorefrontProduct } from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SavedScreen() {
  const colors = useColors(); const { isSignedIn } = useAuth(); const { add, toggleFavorite } = useStore();
  const insets = useSafeAreaInsets();
  const gated = () => router.push('/(auth)/sign-in');
  const run = (action: (p: StorefrontProduct) => void) => (p: StorefrontProduct) => isSignedIn ? action(p) : gated();
  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={{ paddingHorizontal: 20, paddingTop: Math.max(insets.top, 12) + 10, paddingBottom: 14, alignItems: 'flex-end' }}>
      <Text style={{ color: colors.accent, fontSize: 9, letterSpacing: 1.5 }}>اختياراتك</Text>
      <Text style={{ fontFamily: 'serif', fontSize: 31, lineHeight: 39, color: colors.foreground, textAlign: 'right', writingDirection: 'rtl' }}>المفضلة</Text>
      <Text style={{ color: colors.mutedForeground, fontSize: 13, textAlign: 'right', writingDirection: 'rtl' }}>اختياراتك التي تستحق أن تبقى قريبة</Text>
    </View>
    <ProductList onlyFavorites onAdd={run(add)} onFavorite={run((p) => toggleFavorite(p.id))} />
  </View>;
}

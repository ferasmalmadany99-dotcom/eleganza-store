import React from 'react';
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useColors } from '@/hooks/useColors';
import { ProductList } from '@/components/Storefront';
import { useStore } from '@/context/StoreContext';
import type { StorefrontProduct } from '@workspace/api-client-react';

export default function HomeScreen() {
  const colors = useColors();
  const { isSignedIn } = useAuth();
  const { add, toggleFavorite } = useStore();
  const gated = () => router.push('/(auth)/sign-in');
  const addProduct = (product: StorefrontProduct) => isSignedIn ? add(product) : gated();
  const favorite = (product: StorefrontProduct) => isSignedIn ? toggleFavorite(product.id) : gated();
  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView contentContainerStyle={{ paddingBottom: 110 }}>
      <View style={styles.header}><Text style={[styles.brand, { color: colors.foreground }]}>Eleganza</Text><Text style={{ color: colors.mutedForeground }}>الجمال يبدأ من هنا</Text></View>
      <ImageBackground source={require('@/assets/images/beauty-hero.jpg')} style={styles.hero} imageStyle={{ opacity: 0.86 }}>
        <View style={[styles.heroCaption, { backgroundColor: colors.foreground }]}><Text style={[styles.heroTitle, { color: colors.background }]}>اختاري ما يشبهك</Text><Text style={[styles.heroText, { color: colors.background }]}>عطور وجمال مختارة بعناية</Text></View>
      </ImageBackground>
      <View style={styles.section}><Text style={[styles.heading, { color: colors.foreground }]}>اكتشفي المتجر</Text><Text style={{ color: colors.mutedForeground }}>منتجاتنا المتوفرة الآن</Text></View>
      <ProductList onAdd={addProduct} onFavorite={favorite} />
    </ScrollView>
  </View>;
}
const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 14, alignItems: 'flex-end' },
  brand: { fontFamily: 'serif', fontSize: 34 }, hero: { height: 228, justifyContent: 'flex-end', marginHorizontal: 16 },
  heroCaption: { padding: 16, alignItems: 'flex-end' },
  heroTitle: { fontFamily: 'serif', fontSize: 26 }, heroText: { marginTop: 4 },
  section: { paddingHorizontal: 18, paddingTop: 22, alignItems: 'flex-end', gap: 4 }, heading: { fontFamily: 'serif', fontSize: 25 },
});

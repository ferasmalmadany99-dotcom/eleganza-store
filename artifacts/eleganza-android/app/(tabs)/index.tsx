import React from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useColors } from '@/hooks/useColors';
import { ProductList } from '@/components/Storefront';
import { useStore } from '@/context/StoreContext';
import type { StorefrontProduct } from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useAuth();
  const { add, toggleFavorite } = useStore();
  const gated = () => router.push('/(auth)/sign-in');
  const addProduct = (product: StorefrontProduct) => isSignedIn ? add(product) : gated();
  const favorite = (product: StorefrontProduct) => isSignedIn ? toggleFavorite(product.id) : gated();
  const header = (
    <View style={{ backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.brandBlock}>
          <Text style={[styles.brand, { color: colors.foreground }]}>Eleganza</Text>
          <Text style={[styles.brandNote, { color: colors.mutedForeground }]}>الجمال يبدأ من هنا</Text>
        </View>
        <Text style={[styles.edition, { color: colors.accent }]}>الجمال / 01</Text>
      </View>
      <ImageBackground source={require('@/assets/images/beauty-hero.jpg')} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={[styles.heroIndex, { backgroundColor: colors.background + 'D9' }]}>
          <Text style={[styles.heroIndexText, { color: colors.foreground }]}>مختارات إليغانزا</Text>
        </View>
        <View style={[styles.heroCaption, { backgroundColor: colors.foreground + 'E8' }]}>
          <Text style={[styles.heroKicker, { color: colors.secondary }]}>مختارات هذا الموسم</Text>
          <Text style={[styles.heroTitle, { color: colors.background }]}>اختاري ما يشبهك</Text>
          <Text style={[styles.heroText, { color: colors.background }]}>عطور وجمال مختارة بعناية</Text>
        </View>
      </ImageBackground>
      <View style={styles.section}>
        <View style={styles.sectionCopy}>
          <Text style={[styles.heading, { color: colors.foreground }]}>اكتشفي المتجر</Text>
          <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>منتجاتنا المتوفرة الآن</Text>
        </View>
        <Text style={[styles.sectionIndex, { color: colors.accent }]}>مختاراتنا</Text>
      </View>
    </View>
  );
  return <ProductList header={header} onAdd={addProduct} onFavorite={favorite} />;
}
const styles = StyleSheet.create({
  header: { minHeight: 82, paddingHorizontal: 22, paddingBottom: 14, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  brandBlock: { alignItems: 'flex-end' },
  brand: { fontFamily: 'serif', fontSize: 35, letterSpacing: -1.4, lineHeight: 38 },
  brandNote: { marginTop: 3, fontSize: 12, writingDirection: 'rtl' },
  edition: { fontSize: 10, letterSpacing: 1.7, fontWeight: '600' },
  hero: { height: 248, justifyContent: 'flex-end', marginHorizontal: 14, overflow: 'hidden' },
  heroImage: { opacity: 0.94 },
  heroIndex: { position: 'absolute', top: 14, left: 14, paddingHorizontal: 9, paddingVertical: 6 },
  heroIndexText: { fontSize: 9, letterSpacing: 1.3, fontWeight: '600' },
  heroCaption: { paddingHorizontal: 17, paddingTop: 13, paddingBottom: 15, alignItems: 'flex-end' },
  heroKicker: { fontSize: 11, marginBottom: 3, writingDirection: 'rtl' },
  heroTitle: { fontFamily: 'serif', fontSize: 30, lineHeight: 38, writingDirection: 'rtl' },
  heroText: { marginTop: 2, fontSize: 13, writingDirection: 'rtl' },
  section: { paddingHorizontal: 19, paddingTop: 25, paddingBottom: 9, flexDirection: 'row-reverse', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionCopy: { alignItems: 'flex-end' },
  heading: { fontFamily: 'serif', fontSize: 27, lineHeight: 34, writingDirection: 'rtl' },
  sectionNote: { marginTop: 3, fontSize: 13, writingDirection: 'rtl' },
  sectionIndex: { fontSize: 9, letterSpacing: 1.1, marginBottom: 5 },
});

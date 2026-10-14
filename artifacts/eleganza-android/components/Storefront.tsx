import React from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useListStorefrontProducts, type StorefrontProduct } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useStore } from '@/context/StoreContext';

export function ProductList({ onlyFavorites = false, onAdd, onFavorite, header }: { onlyFavorites?: boolean; onAdd: (product: StorefrontProduct) => void; onFavorite: (product: StorefrontProduct) => void; header?: React.ReactElement | null }) {
  const colors = useColors();
  const query = useListStorefrontProducts();
  const { add, favorites, toggleFavorite } = useStore();
  const products = (query.data ?? []).filter((p) => !onlyFavorites || favorites.includes(p.id));
  const emptyState = query.isLoading
    ? <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
    : query.isError
      ? <View style={styles.center}><Text style={{ color: colors.foreground }}>تعذر تحميل المنتجات</Text><Pressable onPress={() => void query.refetch()}><Text style={{ color: colors.primary }}>إعادة المحاولة</Text></Pressable></View>
      : <View style={styles.center}><Text style={{ color: colors.mutedForeground }}>{onlyFavorites ? 'لا توجد منتجات محفوظة بعد' : 'لا توجد منتجات متاحة الآن'}</Text></View>;
  return <FlatList
    style={{ flex: 1 }}
    data={products}
    keyExtractor={(item) => String(item.id)}
    numColumns={2}
    contentContainerStyle={styles.grid}
    columnWrapperStyle={styles.row}
    ListHeaderComponent={header ?? null}
    ListEmptyComponent={emptyState}
    renderItem={({ item }) => <ProductCard product={item} onAdd={() => onAdd(item)} onFavorite={() => onFavorite(item)} />}
  />;
}

function formatPrice(minorUnits: number): string {
  const value = Number(minorUnits) / 100;
  try {
    if (typeof Intl !== 'undefined' && typeof Intl.NumberFormat === 'function') {
      return new Intl.NumberFormat('ar-LY', { maximumFractionDigits: 2 }).format(value);
    }
  } catch {
    // Fall back to a locale-independent formatter on Android runtimes without ICU data.
  }
  const fallback = Number.isFinite(value) ? value.toFixed(2).replace(/\.?0+$/, '') : '0';
  return fallback.replace('.', '٫').replace(/[0-9]/g, (digit) => String.fromCharCode(0x0660 + Number(digit)));
}

function ProductCard({ product, onAdd, onFavorite }: { product: StorefrontProduct; onAdd: () => void; onFavorite: () => void }) {
  const colors = useColors();
  const { favorites } = useStore();
  const image = product.imageUrls?.[0];
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    {image ? <Image source={{ uri: image }} style={styles.image} resizeMode="cover" /> : <View style={[styles.image, styles.noImage, { backgroundColor: colors.secondary }]}><Text style={{ color: colors.mutedForeground }}>Eleganza</Text></View>}
    <Pressable accessibilityLabel="حفظ في المفضلة" style={[styles.favorite, { backgroundColor: colors.background }]} onPress={() => onFavorite()}><Text style={{ color: favorites.includes(product.id) ? colors.primary : colors.foreground, fontSize: 20 }}>{favorites.includes(product.id) ? '♥' : '♡'}</Text></Pressable>
    <Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>{product.nameAr || product.nameEn}</Text>
    <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(product.salePriceMinor)} د.ل</Text>
    <Pressable accessibilityLabel="أضف إلى السلة" onPress={() => onAdd()} style={[styles.addButton, { backgroundColor: colors.primary }]}><Text style={{ color: colors.primaryForeground }}>أضف للسلة</Text></Pressable>
  </View>;
}
const styles = StyleSheet.create({
  center: { flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 12 },
  grid: { paddingHorizontal: 16, paddingBottom: 110, paddingTop: 12 }, row: { gap: 12 },
  card: { flex: 1, marginBottom: 14, borderWidth: 1, overflow: 'hidden', paddingBottom: 12 },
  image: { width: '100%', height: 172 }, noImage: { alignItems: 'center', justifyContent: 'center' },
  favorite: { position: 'absolute', top: 9, right: 9, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: 'serif', fontSize: 18, textAlign: 'right', marginHorizontal: 10, marginTop: 10 },
  price: { fontSize: 14, textAlign: 'right', marginHorizontal: 10, marginTop: 4 },
  addButton: { minHeight: 40, marginHorizontal: 10, marginTop: 10, alignItems: 'center', justifyContent: 'center' },
});

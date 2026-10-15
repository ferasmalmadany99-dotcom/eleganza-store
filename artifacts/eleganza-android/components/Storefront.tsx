import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useListStorefrontProducts, type StorefrontProduct } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useStore } from '@/context/StoreContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function ProductList({ onlyFavorites = false, onAdd, onFavorite, header }: { onlyFavorites?: boolean; onAdd: (product: StorefrontProduct) => void; onFavorite: (product: StorefrontProduct) => void; header?: React.ReactElement | null }) {
  const colors = useColors();
  const query = useListStorefrontProducts();
  const { favorites } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const responseProducts = extractProductArray(query.data);
  const invalidResponse = query.isSuccess && responseProducts === null;
  const favoriteIds = Array.isArray(favorites) ? favorites : [];
  const products = (responseProducts ?? []).filter((p) => !onlyFavorites || favoriteIds.includes(p.id));
  const emptyState = query.isLoading
    ? <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
    : query.isError
      ? <View style={styles.center}><Text style={{ color: colors.foreground }}>تعذر تحميل المنتجات</Text><Pressable onPress={() => void query.refetch()}><Text style={{ color: colors.primary }}>إعادة المحاولة</Text></Pressable></View>
      : invalidResponse
        ? <View style={styles.center}><Text style={{ color: colors.foreground }}>استجابة المنتجات غير متوقعة</Text><Text selectable style={{ color: colors.mutedForeground, textAlign: 'center' }}>{describePayload(query.data)}</Text><Pressable onPress={() => void query.refetch()}><Text style={{ color: colors.primary }}>إعادة المحاولة</Text></Pressable></View>
      : <View style={styles.center}><Text style={{ color: colors.mutedForeground }}>{onlyFavorites ? 'لا توجد منتجات محفوظة بعد' : 'لا توجد منتجات متاحة الآن'}</Text></View>;
  return <>
    <FlatList
      style={{ flex: 1 }}
      data={products}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={header ?? null}
      ListEmptyComponent={emptyState}
       renderItem={({ item, index }) => <ProductCard product={item} index={index} onSelect={() => setSelectedProduct(item)} onAdd={() => onAdd(item)} onFavorite={() => onFavorite(item)} />}
    />
    {selectedProduct ? <ProductDetails
      product={selectedProduct}
      favorite={favoriteIds.includes(selectedProduct.id)}
      onClose={() => setSelectedProduct(null)}
      onAdd={() => onAdd(selectedProduct)}
      onFavorite={() => onFavorite(selectedProduct)}
    /> : null}
  </>;
}

function extractProductArray(value: unknown, depth = 0): StorefrontProduct[] | null {
  if (Array.isArray(value)) return value as StorefrontProduct[];
  if (!value || typeof value !== 'object' || depth >= 2) return null;

  const record = value as Record<string, unknown>;
  for (const key of ['products', 'items', 'data']) {
    const candidate = record[key];
    if (Array.isArray(candidate)) return candidate as StorefrontProduct[];
    if (candidate && typeof candidate === 'object') {
      const nested = extractProductArray(candidate, depth + 1);
      if (nested) return nested;
    }
  }
  return null;
}

function describePayload(value: unknown): string {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const detail = typeof record.error === 'string' ? record.error
      : typeof record.message === 'string' ? record.message
        : Object.keys(record).length ? `الحقول: ${Object.keys(record).slice(0, 6).join(', ')}` : 'كائن فارغ';
    return `نوع البيانات: object — ${detail}`;
  }
  return `نوع البيانات: ${value === null ? 'null' : typeof value}`;
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

function ProductCard({ product, index, onSelect, onAdd, onFavorite }: { product: StorefrontProduct; index: number; onSelect: () => void; onAdd: () => void; onFavorite: () => void }) {
  const colors = useColors();
  const { favorites } = useStore();
  const isFavorite = Array.isArray(favorites) && favorites.includes(product.id);
  const image = product.imageUrls?.[0];
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`تفاصيل ${product.nameAr || product.nameEn}`} onPress={onSelect} android_ripple={{ color: colors.muted }}>
      <View style={styles.imageWrap}>
        {image ? <Image source={{ uri: image }} style={styles.image} resizeMode="cover" /> : <View style={[styles.image, styles.noImage, { backgroundColor: colors.secondary }]}><Text style={{ color: colors.mutedForeground }}>Eleganza</Text></View>}
        <Text style={[styles.imageNumber, { color: colors.foreground, backgroundColor: colors.background + 'E8' }]}>{String(index + 1).padStart(2, '0')}</Text>
      </View>
      <View style={styles.cardCopy}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>{product.nameAr || product.nameEn}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(product.salePriceMinor)} د.ل</Text>
      </View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityState={{ selected: isFavorite }} accessibilityLabel={isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'} hitSlop={6} style={[styles.favorite, { backgroundColor: colors.background }]} onPress={onFavorite}>
      <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={19} color={isFavorite ? colors.primary : colors.foreground} />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="أضف إلى السلة" onPress={onAdd} style={[styles.addButton, { backgroundColor: colors.primary }]}>
      <Feather name="plus" size={16} color={colors.primaryForeground} />
      <Text style={[styles.addText, { color: colors.primaryForeground }]}>أضف للسلة</Text>
    </Pressable>
  </View>;
}

function ProductDetails({ product, favorite, onClose, onAdd, onFavorite }: {
  product: StorefrontProduct;
  favorite: boolean;
  onClose: () => void;
  onAdd: () => void;
  onFavorite: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const category = categoryName(product.category);
  const detailCopy = productDetailsBySku[product.sku];
  const description = product.descriptionAr?.trim()
    || detailCopy?.note
    || product.descriptionEn?.trim()
    || `منتج من فئة ${category} ضمن مجموعة Eleganza، اختير بعناية.`;
  const audience = product.audience === 'men' ? 'رجالي' : product.audience === 'women' ? 'نسائي' : '';

  return <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.modalBackdrop}>
      <Pressable accessibilityLabel="إغلاق تفاصيل المنتج" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.detailSheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.detailHeadCopy}>
            <Text style={[styles.detailOverline, { color: colors.accent }]}>ELEGANZA / PRODUCT</Text>
            <Text style={[styles.detailHeaderTitle, { color: colors.foreground }]}>تفاصيل المنتج</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="إغلاق" onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.closeText, { color: colors.foreground }]}>×</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator={false}>
          {product.imageUrls?.[0]
            ? <Image source={{ uri: product.imageUrls[0] }} style={styles.detailImage} resizeMode="cover" />
            : <View style={[styles.detailImage, styles.noImage, { backgroundColor: colors.secondary }]}><Text style={{ color: colors.mutedForeground }}>Eleganza</Text></View>}
          <Text style={[styles.detailCategory, { color: colors.primary }]}>{category}</Text>
          <Text style={[styles.detailName, { color: colors.foreground }]}>{product.nameAr || product.nameEn}</Text>
          <Text style={[styles.detailPrice, { color: colors.primary }]}>{formatPrice(product.salePriceMinor)} د.ل</Text>
          <Text style={[styles.detailDescription, { color: colors.foreground }]}>{description}</Text>
          <View style={[styles.detailFacts, { borderColor: colors.border }]}>
            {detailCopy ? <DetailFact label="التركيبة / الخامة" value={detailCopy.material} color={colors.foreground} muted={colors.mutedForeground} /> : null}
            {detailCopy ? <DetailFact label="الرائحة / اللون" value={detailCopy.color} color={colors.foreground} muted={colors.mutedForeground} /> : null}
            <DetailFact label="الفئة" value={category} color={colors.foreground} muted={colors.mutedForeground} />
            {audience ? <DetailFact label="التصنيف" value={audience} color={colors.foreground} muted={colors.mutedForeground} /> : null}
            <DetailFact label="المخزون" value={`${Math.max(0, Number(product.quantityOnHand) || 0)} قطعة`} color={colors.foreground} muted={colors.mutedForeground} />
            <DetailFact label="التوصيل" value="خلال 2–3 أيام" color={colors.foreground} muted={colors.mutedForeground} />
          </View>
          <View style={styles.detailActions}>
            <Pressable accessibilityRole="button" onPress={onAdd} style={[styles.detailAddButton, { backgroundColor: colors.primary }]}>
              <Feather name="plus" size={17} color={colors.primaryForeground} />
              <Text style={[styles.detailAddText, { color: colors.primaryForeground }]}>أضف للسلة</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: favorite }} accessibilityLabel={favorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'} onPress={onFavorite} style={[styles.detailFavoriteButton, { borderColor: colors.border }]}>
              <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={22} color={favorite ? colors.primary : colors.foreground} />
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function DetailFact({ label, value, color, muted }: { label: string; value: string; color: string; muted: string }) {
  return <View style={styles.factRow}>
    <Text style={{ color: muted, fontSize: 13 }}>{label}</Text>
    <Text style={{ color, fontSize: 14, textAlign: 'right', flexShrink: 1 }}>{value}</Text>
  </View>;
}

function categoryName(category: string): string {
  switch (category.toLowerCase()) {
    case 'fragrance':
    case 'perfume': return 'عطور';
    case 'makeup': return 'مكياج';
    case 'accessories': return 'إكسسوارات';
    case 'skincare': return 'العناية بالبشرة';
    default: return 'منتجات التجميل';
  }
}

const productDetailsBySku: Record<string, { material: string; color: string; note: string }> = {
  p01: { material: 'أو دو بارفان / 50 مل', color: 'خشب الصندل / العنبر', note: 'عطر دافئ بجاذبية هادئة، يترك أثرًا مميزًا يدوم طويلًا.' },
  m01: { material: 'أحمر خدود كريمي / 7 غ', color: 'وردي البتلات', note: 'لمسة وردية شفافة تبدو كلون بشرتك الطبيعي، ولكن بنعومة أجمل.' },
  a01: { material: 'فضة إسترلينية مطلية بالذهب', color: 'ذهبي دافئ', note: 'تفصيل ذهبي بسيط يضفي لمسة أنيقة على إطلالتك اليومية.' },
  m02: { material: 'أحمر شفاه ساتان / 3.5 غ', color: 'توتي داكن', note: 'لون شفاه ناعم بتأثير ضبابي ولمسة أكثر وضوحًا وتميّزًا.' },
  p02: { material: 'أو دو بارفان / 75 مل', color: 'عنبر / فانيليا', note: 'عبير عنبري غني تلطفه نفحات الفانيليا الناعمة.' },
  m03: { material: 'أحمر خدود بودرة / 8 غ', color: 'مرجاني ناعم', note: 'طبقة خفيفة من اللون المرجاني تضفي دفئًا طبيعيًا على الوجه.' },
  a02: { material: 'فضة مطلية بالذهب / 42 سم', color: 'ذهبي لامع', note: 'سلسلة ذهبية رفيعة تلتقط الضوء مع كل حركة.' },
  m04: { material: 'أحمر شفاه مطفي / 3.5 غ', color: 'أحمر معتّق', note: 'أحمر واثق بلمسة مطفية ناعمة ومريحة تدوم طويلًا.' },
  p03: { material: 'أو دو بارفان / 50 مل', color: 'خشب الأرز / المسك الأبيض', note: 'خشب أرز نقي ومسك ناعم يستقران برقة بالقرب من البشرة.' },
  m05: { material: 'أحمر خدود كريمي / 7 غ', color: 'خوخي دافئ', note: 'لون خوخي منعش يمنح البشرة إشراقة طبيعية بلا تكلّف.' },
  a03: { material: 'فضة مطلية بالذهب', color: 'ذهبي ساتان', note: 'أقراط متدلية تلتقط الضوء بتصميم راقٍ وحركة انسيابية.' },
  m06: { material: 'أحمر شفاه ساتان / 3.5 غ', color: 'برقوقي هادئ', note: 'درجة برقوقية هادئة تمنح الشفاه عمقًا وتبقى سهلة للاستخدام اليومي.' },
};

const styles = StyleSheet.create({
  center: { flex: 1, minHeight: 240, alignItems: 'center', justifyContent: 'center', gap: 12 },
  grid: { paddingHorizontal: 14, paddingBottom: 112, paddingTop: 12 }, row: { gap: 11 },
  card: { flex: 1, marginBottom: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingBottom: 11 },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 174 }, noImage: { alignItems: 'center', justifyContent: 'center' },
  imageNumber: { position: 'absolute', left: 9, bottom: 9, fontSize: 10, letterSpacing: 1, paddingHorizontal: 7, paddingVertical: 4 },
  cardCopy: { alignItems: 'flex-end', minHeight: 61, paddingTop: 10, paddingHorizontal: 10 },
  favorite: { position: 'absolute', top: 9, right: 9, width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  name: { fontFamily: 'serif', fontSize: 17, lineHeight: 23, textAlign: 'right', width: '100%' },
  price: { fontSize: 13, textAlign: 'right', marginTop: 3, width: '100%' },
  addButton: { minHeight: 42, marginHorizontal: 9, marginTop: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  addText: { fontSize: 13, writingDirection: 'rtl' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(28, 22, 18, 0.56)' },
  detailSheet: { maxHeight: '94%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  detailHeader: { minHeight: 68, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, borderBottomWidth: StyleSheet.hairlineWidth },
  detailHeadCopy: { alignItems: 'flex-end', gap: 2 },
  detailOverline: { fontSize: 9, letterSpacing: 1.2 },
  detailHeaderTitle: { fontSize: 19, fontFamily: 'serif', writingDirection: 'rtl' },
  closeButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21 },
  closeText: { fontSize: 26, lineHeight: 30 },
  detailContent: { paddingBottom: 28 },
  detailImage: { width: '100%', height: 280 },
  detailCategory: { marginTop: 20, marginHorizontal: 20, textAlign: 'right', fontSize: 13 },
  detailName: { marginTop: 8, marginHorizontal: 20, textAlign: 'right', fontFamily: 'serif', fontSize: 30, lineHeight: 40, writingDirection: 'rtl' },
  detailPrice: { marginTop: 8, marginHorizontal: 20, textAlign: 'right', fontSize: 17 },
  detailDescription: { marginTop: 20, marginHorizontal: 20, textAlign: 'right', writingDirection: 'rtl', fontSize: 16, lineHeight: 27 },
  detailFacts: { marginHorizontal: 20, marginTop: 22, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth },
  factRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingVertical: 8 },
  detailActions: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 20 },
  detailAddButton: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  detailAddText: { fontSize: 16, fontFamily: 'serif' },
  detailFavoriteButton: { width: 52, minHeight: 50, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
});

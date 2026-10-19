import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useListStorefrontProducts, type StorefrontProduct } from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { useStore } from '@/context/StoreContext';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { offlineStorefrontCatalog } from '@/constants/offlineCatalog';

const storefrontCatalogStorageKey = 'eleganza-mobile-storefront-catalog-v1';

export function ProductList({ onlyFavorites = false, onAdd, onFavorite, header }: { onlyFavorites?: boolean; onAdd: (product: StorefrontProduct) => boolean; onFavorite: (product: StorefrontProduct) => boolean; header?: React.ReactElement | null }) {
  const colors = useColors();
  const query = useListStorefrontProducts({
    query: { queryKey: ['/api/storefront/products'], staleTime: 60_000 },
    request: {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' },
    },
  });
  const [savedProducts, setSavedProducts] = useState<StorefrontProduct[]>(offlineStorefrontCatalog);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storefrontCatalogStorageKey).then((stored) => {
      if (!active || !stored) return;
      const products = extractProductArray(JSON.parse(stored));
      if (products?.length) setSavedProducts(products);
    }).catch((error) => console.warn('Unable to restore the saved storefront catalog', error));
    return () => { active = false; };
  }, []);
  const responseProducts = extractProductArray(query.data);
  useEffect(() => {
    if (!responseProducts?.length) return;
    setSavedProducts(responseProducts);
    AsyncStorage.setItem(storefrontCatalogStorageKey, JSON.stringify(responseProducts))
      .catch((error) => console.warn('Unable to save the storefront catalog', error));
  }, [responseProducts]);
  const { favorites } = useStore();
  const insets = useSafeAreaInsets();
  const [selectedProduct, setSelectedProduct] = useState<StorefrontProduct | null>(null);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [activeFilter, setActiveFilter] = useState<StoreFilter>('all');
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);
  const showFeedback = (message: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(message);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 2400);
  };
  const addProduct = (product: StorefrontProduct) => {
    if (!onAdd(product)) return;
    setSelectedProduct(null);
    showFeedback('تمت إضافة المنتج إلى السلة');
  };
  const toggleProductFavorite = (product: StorefrontProduct) => {
    const wasFavorite = favorites.includes(product.id);
    if (!onFavorite(product)) return;
    if (selectedProduct?.id === product.id) setSelectedProduct(null);
    showFeedback(wasFavorite ? 'تمت إزالة المنتج من المفضلة' : 'تمت إضافة المنتج إلى المفضلة');
  };
  const invalidResponse = query.isSuccess && responseProducts === null;
  const favoriteIds = Array.isArray(favorites) ? favorites : [];
  const products = (responseProducts?.length ? responseProducts : savedProducts).filter((p) => !onlyFavorites || favoriteIds.includes(p.id));
  const newestIds = new Set(products.slice(0, 6).map((product) => product.id));
  const filteredProducts = products.filter((product) => {
    if (activeFilter === 'new') return newestIds.has(product.id);
    if (activeFilter === 'perfume') return ['fragrance', 'perfume'].includes(product.category.toLowerCase());
    if (activeFilter === 'makeup') return product.category.toLowerCase() === 'makeup';
    if (activeFilter === 'accessories') return product.category.toLowerCase() === 'accessories';
    return true;
  });
  const featuredProducts = [...products].sort((a, b) => {
    const featuredSkus = ['p01', 'a02'];
    const aFeatured = featuredSkus.includes(a.sku.toLowerCase());
    const bFeatured = featuredSkus.includes(b.sku.toLowerCase());
    return Number(bFeatured) - Number(aFeatured) || b.id - a.id;
  }).slice(0, 8);
  const emptyState = query.isLoading && products.length === 0
    ? <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
    : query.isError
      ? <View style={styles.center}><Text style={{ color: colors.foreground }}>تعذر تحميل المنتجات</Text><Pressable onPress={() => void query.refetch()}><Text style={{ color: colors.primary }}>إعادة المحاولة</Text></Pressable></View>
      : invalidResponse
        ? <View style={styles.center}><Text style={{ color: colors.foreground }}>استجابة المنتجات غير متوقعة</Text><Text selectable style={{ color: colors.mutedForeground, textAlign: 'center' }}>{describePayload(query.data)}</Text><Pressable onPress={() => void query.refetch()}><Text style={{ color: colors.primary }}>إعادة المحاولة</Text></Pressable></View>
      : <View style={styles.center}><Text style={{ color: colors.mutedForeground }}>{onlyFavorites ? 'لا توجد منتجات محفوظة بعد' : activeFilter === 'all' ? 'لا توجد منتجات متاحة الآن' : 'ما فيش منتجات في هذا التصنيف حالياً'}</Text></View>;
  const listHeader = <>
    {header ?? null}
    {!onlyFavorites ? <HomeContentHeader
      colors={colors}
      products={featuredProducts}
      activeFilter={activeFilter}
      onFilter={setActiveFilter}
      onSelect={setSelectedProduct}
      onAdd={addProduct}
    /> : null}
  </>;
  return <View style={{ flex: 1 }}>
    <FlatList
      style={{ flex: 1 }}
      data={filteredProducts}
      keyExtractor={(item) => String(item.id)}
      numColumns={2}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={listHeader}
      ListFooterComponent={!onlyFavorites ? <StoriesSection colors={colors} onRead={setSelectedStory} /> : null}
      ListEmptyComponent={emptyState}
      renderItem={({ item, index }) => <ProductCard product={item} index={index} onSelect={() => setSelectedProduct(item)} onAdd={() => addProduct(item)} onFavorite={() => toggleProductFavorite(item)} />}
    />
    {feedback ? <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.toast, { bottom: Math.max(insets.bottom, 16) + 78, backgroundColor: colors.foreground }]}>
      <Feather name="check-circle" size={18} color={colors.background} />
      <Text style={[styles.toastText, { color: colors.background }]}>{feedback}</Text>
    </View> : null}
    {selectedProduct ? <ProductDetails
      product={selectedProduct}
      favorite={favoriteIds.includes(selectedProduct.id)}
      onClose={() => setSelectedProduct(null)}
      onAdd={() => addProduct(selectedProduct)}
      onFavorite={() => toggleProductFavorite(selectedProduct)}
    /> : null}
    {selectedStory ? <StoryDetails story={selectedStory} colors={colors} onClose={() => setSelectedStory(null)} /> : null}
  </View>;
}

type StoreFilter = 'all' | 'new' | 'perfume' | 'makeup' | 'accessories';
type Story = { category: string; title: string; introduction: string; sections: { heading: string; body: string }[]; closing: string };
type ThemeColors = ReturnType<typeof useColors>;

const storeFilters: { id: StoreFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'new', label: 'وصل حديثاً' },
  { id: 'perfume', label: 'عطور' },
  { id: 'makeup', label: 'مكياج' },
  { id: 'accessories', label: 'إكسسوارات' },
];

const stories: Story[] = [
  {
    category: 'عطور',
    title: 'كيف تختبرين العطر قبل اختياره',
    introduction: 'قد تختلف رائحة العطر على البشرة عن رائحته على ورقة الاختبار. جرّبيه بهذه الخطوات قبل اتخاذ قرارك.',
    sections: [
      { heading: 'ابدئي بكمية قليلة', body: 'ضعي رشة واحدة على الجلد، واتركيها تجف من دون فرك حتى لا تتغير الرائحة.' },
      { heading: 'انتظري قليلًا', body: 'عودي إلى العطر بعد نصف ساعة؛ عندها تكون الرائحة قد هدأت وظهرت تفاصيلها.' },
      { heading: 'جرّبي عطرًا واحدًا كل مرة', body: 'تجنبي وضع عدة عطور معًا. دوّني الاسم إذا أردت المقارنة أو العودة إليه لاحقًا.' },
    ],
    closing: 'اختبريه على بشرتك قبل الشراء، لا على ورقة الاختبار فقط.',
  },
  {
    category: 'عناية بالبشرة',
    title: 'ترتيب بسيط لروتين الصباح',
    introduction: 'ابدئي بالمنتجات الخفيفة، واتركي كل طبقة تستقر قبل وضع التالية.',
    sections: [
      { heading: 'نظّفي البشرة', body: 'استخدمي منظفًا يناسب بشرتك، ثم جففيها بالتربيت بدل الفرك.' },
      { heading: 'ضعي المرطب', body: 'اختاري مرطبك المعتاد واتركيه حتى تمتصه البشرة.' },
      { heading: 'لا تنسي واقي الشمس', body: 'استخدمي واقي شمس مناسبًا في النهار، واتبعي تعليمات العبوة عند إعادة وضعه.' },
    ],
    closing: 'إذا كانت لديك حالة جلدية أو تحسس، استشيري مختصًا قبل تغيير روتينك.',
  },
  {
    category: 'مكياج',
    title: 'مكياج يومي بثلاث خطوات',
    introduction: 'روتين قصير يبدأ بما تحتاجينه فعلًا، من دون إضافة خطوات لا تستخدمينها.',
    sections: [
      { heading: 'ابدئي بالبشرة', body: 'ضعي المرطب أو مستحضر التغطية الذي تستخدمينه عادةً، بكمية تناسبك.' },
      { heading: 'أضيفي اللون', body: 'اختاري أحمر خدود أو لون شفاه؛ ليس من الضروري استخدامهما معًا.' },
      { heading: 'أنهي بما تفضلينه', body: 'أضيفي الماسكارا أو رتبي الحواجب إذا كان ذلك جزءًا من روتينك.' },
    ],
    closing: 'عدّلي الخطوات حسب المنتجات التي ترتاحين لاستخدامها.',
  },
];

function productDescription(product: StorefrontProduct): string {
  return product.descriptionAr?.trim() || productDetailsBySku[product.sku.toLowerCase()]?.note || 'لا تتوفر تفاصيل إضافية لهذا المنتج حالياً.';
}

function HomeContentHeader({ colors, products, activeFilter, onFilter, onSelect, onAdd }: {
  colors: ThemeColors;
  products: StorefrontProduct[];
  activeFilter: StoreFilter;
  onFilter: (filter: StoreFilter) => void;
  onSelect: (product: StorefrontProduct) => void;
  onAdd: (product: StorefrontProduct) => void;
}) {
  return <View style={[styles.homeSections, { backgroundColor: colors.background }]}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
      {storeFilters.map((filter) => {
        const selected = activeFilter === filter.id;
        return <Pressable key={filter.id} testID={`store-filter-${filter.id}`} accessibilityRole="button" accessibilityState={{ selected }} onPress={() => onFilter(filter.id)}
          style={[styles.filterChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primary : colors.card, borderRadius: colors.radius }]}>
          <Text style={{ color: selected ? colors.primaryForeground : colors.foreground, fontSize: 13 }}>{filter.label}</Text>
        </Pressable>;
      })}
    </ScrollView>
    <View style={styles.featureHeading}>
      <View style={styles.sectionCopy}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>منتجات إليغانزا</Text>
        <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>العطور والمكياج والإكسسوارات</Text>
      </View>
      <Feather name="shopping-bag" size={18} color={colors.accent} />
    </View>
    {products.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featureRow}>
      {products.map((product) => <FeatureCard key={product.id} product={product} colors={colors} onSelect={() => onSelect(product)} onAdd={() => onAdd(product)} />)}
    </ScrollView> : <Text style={[styles.noFeatures, { color: colors.mutedForeground }]}>لا توجد منتجات متاحة للعرض الآن.</Text>}
    <View style={[styles.productHeading, { borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>جميع المنتجات</Text>
      <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>استخدمي التصنيفات لتضييق الاختيار</Text>
    </View>
  </View>;
}

function FeatureCard({ product, colors, onSelect, onAdd }: { product: StorefrontProduct; colors: ThemeColors; onSelect: () => void; onAdd: () => void }) {
  const image = product.imageUrls?.[0];
  return <View style={[styles.featureCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
    <Pressable accessibilityRole="button" onPress={onSelect}>
      <View style={styles.featureImageWrap}>
        {image ? <Image source={{ uri: image }} style={styles.featureImage} resizeMode="cover" /> : <View style={[styles.featureImage, styles.noImage, { backgroundColor: colors.secondary }]}><Text style={{ color: colors.mutedForeground }}>Eleganza</Text></View>}
        <View style={[styles.featureBadge, { backgroundColor: colors.background, borderRadius: colors.radius }]}>
          <Text style={{ color: colors.primary, fontSize: 10 }}>{categoryName(product.category)}</Text>
        </View>
      </View>
      <View style={styles.featureCopy}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>{product.nameAr || product.nameEn}</Text>
        <Text numberOfLines={2} style={[styles.featureDescription, { color: colors.mutedForeground }]}>{productDescription(product)}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(product.salePriceMinor)} د.ل</Text>
      </View>
    </Pressable>
    <Pressable accessibilityRole="button" onPress={onAdd} style={[styles.featureAddButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
      <Feather name="plus" size={15} color={colors.primaryForeground} />
      <Text style={{ color: colors.primaryForeground, fontSize: 12 }}>أضف للسلة</Text>
    </Pressable>
  </View>;
}

function StoriesSection({ colors, onRead }: { colors: ThemeColors; onRead: (story: Story) => void }) {
  return <View style={[styles.storiesSection, { backgroundColor: colors.secondary }]}>
    <View style={styles.storySectionHeader}>
      <View style={styles.sectionCopy}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>نصائح للعناية</Text>
        <Text style={[styles.sectionNote, { color: colors.mutedForeground }]}>خطوات واضحة قبل اختيار المنتج</Text>
      </View>
      <Feather name="book-open" size={20} color={colors.accent} />
    </View>
    {stories.map((story, index) => <Pressable key={story.title} accessibilityRole="button" onPress={() => onRead(story)}
      style={[styles.storyCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={styles.storyCardTop}>
        <Text style={[styles.storyCategory, { color: colors.primary }]}>{story.category} / 0{index + 1}</Text>
        <Feather name="arrow-up-left" size={16} color={colors.accent} />
      </View>
      <Text style={[styles.storyTitle, { color: colors.foreground }]}>{story.title}</Text>
      <Text numberOfLines={3} style={[styles.storyIntro, { color: colors.mutedForeground }]}>{story.introduction}</Text>
      <View style={styles.readStory}><Text style={{ color: colors.primary, fontSize: 12 }}>اقرئي القصة</Text><Feather name="arrow-left" size={14} color={colors.primary} /></View>
    </Pressable>)}
  </View>;
}

function StoryDetails({ story, colors, onClose }: { story: Story; colors: ThemeColors; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return <Modal visible transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
    <View style={styles.modalBackdrop}>
      <Pressable accessibilityLabel="إغلاق القصة" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.storySheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 12), borderTopLeftRadius: colors.radius + 6, borderTopRightRadius: colors.radius + 6 }]}>
        <View style={[styles.detailHeader, { borderBottomColor: colors.border }]}>
          <View style={styles.detailHeadCopy}>
            <Text style={[styles.detailOverline, { color: colors.accent }]}>{story.category}</Text>
            <Text style={[styles.detailHeaderTitle, { color: colors.foreground }]}>نصائح للعناية</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="إغلاق" onPress={onClose} style={[styles.closeButton, { backgroundColor: colors.secondary }]}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.storyContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.storyModalTitle, { color: colors.foreground }]}>{story.title}</Text>
          <Text style={[styles.storyModalIntro, { color: colors.mutedForeground }]}>{story.introduction}</Text>
          {story.sections.map((section) => <View key={section.heading} style={styles.storyParagraph}>
            <Text style={[styles.storyParagraphTitle, { color: colors.primary }]}>{section.heading}</Text>
            <Text style={[styles.storyBody, { color: colors.foreground }]}>{section.body}</Text>
          </View>)}
          <Text style={[styles.storyClosing, { color: colors.accent }]}>{story.closing}</Text>
        </ScrollView>
      </View>
    </View>
  </Modal>;
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
  return <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`تفاصيل ${product.nameAr || product.nameEn}`} onPress={onSelect} android_ripple={{ color: colors.muted }}>
      <View style={styles.imageWrap}>
        {image ? <Image source={{ uri: image }} style={styles.image} resizeMode="cover" /> : <View style={[styles.image, styles.noImage, { backgroundColor: colors.secondary }]}><Text style={{ color: colors.mutedForeground }}>Eleganza</Text></View>}
        <Text style={[styles.imageNumber, { color: colors.foreground, backgroundColor: colors.background + 'E8', borderRadius: colors.radius }]}>{String(index + 1).padStart(2, '0')}</Text>
      </View>
      <View style={styles.cardCopy}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>{product.nameAr || product.nameEn}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(product.salePriceMinor)} د.ل</Text>
      </View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityState={{ selected: isFavorite }} accessibilityLabel={isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'} hitSlop={6} style={[styles.favorite, { backgroundColor: colors.background }]} onPress={onFavorite}>
      <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={19} color={isFavorite ? colors.primary : colors.foreground} />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="أضف إلى السلة" onPress={onAdd} style={[styles.addButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
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
      <View style={[styles.detailSheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 12), borderTopLeftRadius: colors.radius + 6, borderTopRightRadius: colors.radius + 6 }]}>
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
            <DetailFact label="الدفع" value="عند الاستلام" color={colors.foreground} muted={colors.mutedForeground} />
          </View>
          <View style={styles.detailActions}>
            <Pressable accessibilityRole="button" onPress={onAdd} style={[styles.detailAddButton, { backgroundColor: colors.primary, borderRadius: colors.radius }]}>
              <Feather name="plus" size={17} color={colors.primaryForeground} />
              <Text style={[styles.detailAddText, { color: colors.primaryForeground }]}>أضف للسلة</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityState={{ selected: favorite }} accessibilityLabel={favorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'} onPress={onFavorite} style={[styles.detailFavoriteButton, { borderColor: colors.border, borderRadius: colors.radius }]}>
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
    default: return 'منتجات أخرى';
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
  homeSections: { paddingHorizontal: 14, paddingBottom: 4 },
  filterRow: { flexDirection: 'row-reverse', gap: 6, paddingTop: 15, paddingBottom: 6 },
  filterChip: { minHeight: 38, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' },
  featureHeading: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingTop: 19, paddingBottom: 2 },
  sectionCopy: { alignItems: 'flex-end' },
  sectionTitle: { fontFamily: 'serif', fontSize: 21, lineHeight: 28, textAlign: 'right', writingDirection: 'rtl' },
  sectionNote: { marginTop: 3, fontSize: 12, textAlign: 'right', writingDirection: 'rtl' },
  featureRow: { flexDirection: 'row-reverse', gap: 12, paddingTop: 10, paddingBottom: 8 },
  featureCard: { width: 220, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingBottom: 10 },
  featureImageWrap: { height: 152, position: 'relative' },
  featureImage: { width: '100%', height: '100%' },
  featureBadge: { position: 'absolute', top: 9, right: 9, paddingHorizontal: 10, paddingVertical: 6 },
  featureCopy: { alignItems: 'flex-end', paddingHorizontal: 11, paddingTop: 9, minHeight: 101 },
  featureDescription: { width: '100%', textAlign: 'right', fontSize: 12, lineHeight: 18, marginTop: 2 },
  featureAddButton: { minHeight: 39, marginHorizontal: 9, marginTop: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  noFeatures: { textAlign: 'right', fontSize: 13, paddingVertical: 16 },
  productHeading: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 19, paddingBottom: 8, marginTop: 8, alignItems: 'flex-end' },
  storiesSection: { marginTop: 16, paddingHorizontal: 14, paddingTop: 19, paddingBottom: 28, gap: 11 },
  storySectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  storyCard: { padding: 15, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
  storyCardTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  storyCategory: { fontSize: 10, letterSpacing: 0.6, writingDirection: 'rtl' },
  storyTitle: { fontFamily: 'serif', fontSize: 20, lineHeight: 27, textAlign: 'right', writingDirection: 'rtl' },
  storyIntro: { fontSize: 13, lineHeight: 21, textAlign: 'right', writingDirection: 'rtl' },
  readStory: { marginTop: 2, flexDirection: 'row-reverse', alignItems: 'center', gap: 6, fontSize: 12, writingDirection: 'rtl' },
  storySheet: { maxHeight: '92%', overflow: 'hidden' },
  storyContent: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 30 },
  storyModalTitle: { fontFamily: 'serif', fontSize: 28, lineHeight: 38, textAlign: 'right', writingDirection: 'rtl' },
  storyModalIntro: { marginTop: 12, fontSize: 15, lineHeight: 25, textAlign: 'right', writingDirection: 'rtl' },
  storyParagraph: { marginTop: 24, gap: 7 },
  storyParagraphTitle: { fontSize: 16, fontWeight: '600', textAlign: 'right', writingDirection: 'rtl' },
  storyBody: { fontSize: 14, lineHeight: 24, textAlign: 'right', writingDirection: 'rtl' },
  storyClosing: { marginTop: 26, fontFamily: 'serif', fontSize: 19, lineHeight: 28, textAlign: 'right', writingDirection: 'rtl' },
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
  detailSheet: { maxHeight: '94%', overflow: 'hidden' },
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
  toast: { position: 'absolute', left: 18, right: 18, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 16, borderRadius: 18, elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 8 },
  toastText: { fontSize: 14, fontWeight: '600', writingDirection: 'rtl' },
});

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Heart,
  Menu,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-react';
import heroImage from './assets/beauty-hero.jpg';
import perfumeImage from './assets/perfume-product.jpg';
import makeupImage from './assets/makeup-product.jpg';
import jewelryImage from './assets/jewelry-product.jpg';
import lipImage from './assets/lip-product.jpg';

type Category = 'All' | 'New in' | 'Perfume' | 'Makeup' | 'Accessories';
type Language = 'en' | 'ar';

type Product = {
  id: string;
  name: string;
  category: Exclude<Category, 'All'>;
  price: number;
  material: string;
  color: string;
  image: string;
  note: string;
  badge?: string;
};

type CartItem = Product & { quantity: number };

const products: Product[] = [
  {
    id: 'p01',
    name: 'Santal No. 03',
    category: 'Perfume',
    price: 145,
    material: 'Eau de parfum / 50 ml',
    color: 'Sandalwood / amber',
    image: perfumeImage,
    note: 'A warm, quietly magnetic trail with staying power.',
    badge: 'Bestseller',
  },
  {
    id: 'm01',
    name: 'Rose Veil',
    category: 'Makeup',
    price: 48,
    material: 'Cream blush / 7 g',
    color: 'Petal',
    image: makeupImage,
    note: 'A sheer flush that looks like your own, only softer.',
    badge: 'New',
  },
  {
    id: 'a01',
    name: 'Lune Hoops',
    category: 'Accessories',
    price: 92,
    material: 'Gold vermeil',
    color: 'Warm gold',
    image: jewelryImage,
    note: 'A small golden punctuation for every day.',
  },
  {
    id: 'm02',
    name: 'Velvet Muse',
    category: 'Makeup',
    price: 36,
    material: 'Satin lipstick / 3.5 g',
    color: 'Deep berry',
    image: lipImage,
    note: 'A soft-focus stain with a little more intention.',
    badge: 'Edition 01',
  },
];

const filters: Category[] = ['All', 'New in', 'Perfume', 'Makeup', 'Accessories'];

const copy = {
  en: {
    menu: 'Menu',
    shop: 'Shop',
    journal: 'Journal',
    about: 'About',
    search: 'Search',
    bag: 'Bag',
    openMenu: 'Open menu',
    openBag: 'Open bag',
    heroKicker: 'The beauty edit — 01 / 03',
    heroTitle: <>Made for<br /><em>the long view.</em></>,
    heroDescription: 'Fragrance, color and small rituals with a little more staying power.',
    shopEdit: 'Shop the edit',
    scrollDiscover: 'Scroll to discover',
    selectedForNow: 'Selected for now',
    essentials: <>The essentials<br /><em>in rotation.</em></>,
    essentialsDescription: 'A small, intentional edit of scent, color and adornment for the everyday.',
    all: 'All',
    newIn: 'New in',
    perfume: 'Perfume',
    makeup: 'Makeup',
    accessories: 'Accessories',
    ourPointOfView: 'Our point of view',
    aboutTitle: <>Beauty, but <em>better considered.</em></>,
    aboutDescription: 'Eleganza is a practice in editing. We look for the note that lingers, the color that feels like you, and the small detail that changes the whole ritual.',
    readNotes: 'Read our notes',
    beautyStudy: 'Beauty study / 001',
    theJournal: 'The journal',
    journalTitle: <>Notes on <em>living well.</em></>,
    viewAll: 'View all',
    fieldNotes: 'Field notes / 14.09.24',
    ritualArticle: 'The art of the ritual: on scent, skin and taking your time.',
    scentArticle: 'How to choose a signature scent without rushing the decision.',
    faceArticle: 'The five-minute face: a few good things, applied with intention.',
    readStory: 'Read story',
    slowerInbox: 'A slower inbox',
    inboxTitle: 'A note when there’s something to say.',
    email: 'Your email address',
    subscribe: 'Subscribe',
    explore: 'Explore',
    help: 'Help',
    follow: 'Follow',
    shipping: 'Shipping',
    contact: 'Contact',
    footerDescription: 'The quiet pleasure of finding the right thing.',
    madeInLondon: 'Made with patience in London',
    findPiece: 'Find a piece',
    searchPlaceholder: 'Search fragrance, makeup, accessories...',
    consideredThings: 'A few considered things',
    results: 'results',
    noResults: 'We couldn’t find that one. Try a material or category.',
    close: 'Close',
    yourEdit: 'Your edit',
    theBag: 'The bag',
    nothingHere: 'Nothing here yet.',
    emptyBagDescription: 'Take your time. The good things are still waiting.',
    continueBrowsing: 'Continue browsing',
    subtotal: 'Subtotal',
    freeShipping: 'Complimentary shipping on orders over $300.',
    checkout: 'Continue to checkout',
    format: 'Format',
    notes: 'Notes',
    dispatch: 'Dispatch',
    dispatchTime: 'Within 2–3 days',
    addToBag: 'Add to bag',
    bestseller: 'Bestseller',
    new: 'New',
    edition: 'Edition 01',
    languageLabel: 'العربية',
    ariaLanguage: 'Switch to Arabic',
  },
  ar: {
    menu: 'القائمة',
    shop: 'المتجر',
    journal: 'المجلة',
    about: 'عن إيليغانزا',
    search: 'بحث',
    bag: 'السلة',
    openMenu: 'فتح القائمة',
    openBag: 'فتح السلة',
    heroKicker: 'اختيارات الجمال — 01 / 03',
    heroTitle: <>صُمّمت<br /><em>لتبقى.</em></>,
    heroDescription: 'عطور وألوان وطقوس صغيرة تدوم معك أكثر.',
    shopEdit: 'تسوّق الاختيارات',
    scrollDiscover: 'مرّر للاستكشاف',
    selectedForNow: 'مختاراتنا الآن',
    essentials: <>الأساسيات<br /><em>في دورتها.</em></>,
    essentialsDescription: 'اختيارات صغيرة ومدروسة من العطور والألوان والإكسسوارات ليومك.',
    all: 'الكل',
    newIn: 'وصل حديثًا',
    perfume: 'عطور',
    makeup: 'مكياج',
    accessories: 'إكسسوارات',
    ourPointOfView: 'وجهة نظرنا',
    aboutTitle: <>الجمال، لكن <em>باختيار أفضل.</em></>,
    aboutDescription: 'إيليغانزا تمرين على الانتقاء. نبحث عن الأثر الذي يبقى، واللون الذي يشبهك، والتفصيل الصغير الذي يغيّر الطقس كله.',
    readNotes: 'اقرأ ملاحظاتنا',
    beautyStudy: 'دراسة جمال / 001',
    theJournal: 'المجلة',
    journalTitle: <>ملاحظات عن <em>حياة أجمل.</em></>,
    viewAll: 'عرض الكل',
    fieldNotes: 'ملاحظات ميدانية / 14.09.24',
    ritualArticle: 'فن الطقس اليومي: عن العطر والبشرة وأخذ الوقت.',
    scentArticle: 'كيف تختار عطرك المميز دون استعجال القرار.',
    faceArticle: 'إطلالة الخمس دقائق: أشياء قليلة جيدة، بلمسة مقصودة.',
    readStory: 'اقرأ القصة',
    slowerInbox: 'رسائل أبطأ',
    inboxTitle: 'رسالة عندما يكون هناك ما يستحق القول.',
    email: 'بريدك الإلكتروني',
    subscribe: 'اشترك',
    explore: 'استكشف',
    help: 'مساعدة',
    follow: 'تابعنا',
    shipping: 'الشحن',
    contact: 'تواصل معنا',
    footerDescription: 'متعة هادئة في العثور على الشيء المناسب.',
    madeInLondon: 'صُنع بصبر في لندن',
    findPiece: 'ابحث عن قطعة',
    searchPlaceholder: 'ابحث في العطور والمكياج والإكسسوارات...',
    consideredThings: 'بعض الاختيارات المدروسة',
    results: 'نتائج',
    noResults: 'لم نجد ما تبحث عنه. جرّب مادة أو تصنيفًا آخر.',
    close: 'إغلاق',
    yourEdit: 'اختياراتك',
    theBag: 'السلة',
    nothingHere: 'السلة فارغة حاليًا.',
    emptyBagDescription: 'خذ وقتك. الأشياء الجميلة ما زالت بانتظارك.',
    continueBrowsing: 'تابع التصفح',
    subtotal: 'المجموع الفرعي',
    freeShipping: 'الشحن مجاني للطلبات التي تتجاوز 300 دولار.',
    checkout: 'متابعة إلى الدفع',
    format: 'النوع',
    notes: 'الدرجات',
    dispatch: 'التوصيل',
    dispatchTime: 'خلال 2–3 أيام',
    addToBag: 'أضف إلى السلة',
    bestseller: 'الأكثر مبيعًا',
    new: 'جديد',
    edition: 'إصدار 01',
    languageLabel: 'English',
    ariaLanguage: 'التبديل إلى الإنجليزية',
  },
} as const;

type Copy = typeof copy.en;

const categoryLabels: Record<Language, Record<Category, string>> = {
  en: { All: copy.en.all, 'New in': copy.en.newIn, Perfume: copy.en.perfume, Makeup: copy.en.makeup, Accessories: copy.en.accessories },
  ar: { All: copy.ar.all, 'New in': copy.ar.newIn, Perfume: copy.ar.perfume, Makeup: copy.ar.makeup, Accessories: copy.ar.accessories },
};

const getBadgeLabel = (badge: string | undefined, c: Copy) =>
  badge === 'Bestseller' ? c.bestseller : badge === 'New' ? c.new : badge === 'Edition 01' ? c.edition : badge;

const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

function Header({
  bagCount,
  language,
  c,
  onBag,
  onSearch,
  onMenu,
  onLanguageToggle,
}: {
  bagCount: number;
  language: Language;
  c: Copy;
  onBag: () => void;
  onSearch: () => void;
  onMenu: () => void;
  onLanguageToggle: () => void;
}) {
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <header className="absolute left-0 right-0 top-0 z-30 text-[#f7f0e6]">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <button className="flex items-center gap-2 lg:hidden" onClick={onMenu} aria-label="Open menu" data-testid="button-open-menu">
          <Menu size={19} strokeWidth={1.5} />
          <span className="font-mono-ui text-[10px] uppercase tracking-[.22em]">{c.menu}</span>
        </button>
        <div className="hidden w-[260px] items-center gap-8 lg:flex">
          <button className="font-mono-ui text-[10px] uppercase tracking-[.22em] transition-opacity hover:opacity-60" onClick={() => jump('shop')} data-testid="link-shop">
            {c.shop}
          </button>
          <button className="font-mono-ui text-[10px] uppercase tracking-[.22em] transition-opacity hover:opacity-60" onClick={() => jump('journal')} data-testid="link-journal">
            {c.journal}
          </button>
          <button className="font-mono-ui text-[10px] uppercase tracking-[.22em] transition-opacity hover:opacity-60" onClick={() => jump('about')} data-testid="link-about">
            {c.about}
          </button>
        </div>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-display text-4xl leading-none tracking-[-.04em]" data-testid="link-home">
          Eleganza
        </button>
        <div className="flex w-[260px] items-center justify-end gap-4">
          <button aria-label={c.search} onClick={onSearch} className="transition-opacity hover:opacity-60" data-testid="button-open-search">
            <Search size={19} strokeWidth={1.4} />
          </button>
          <button aria-label={c.openBag} onClick={onBag} className="group flex items-center gap-2 transition-opacity hover:opacity-60" data-testid="button-open-bag">
            <ShoppingBag size={19} strokeWidth={1.4} />
            <span className="font-mono-ui text-[10px] uppercase tracking-[.18em]">
              {c.bag} <span className="opacity-60">({String(bagCount).padStart(2, '0')})</span>
            </span>
          </button>
          <button onClick={onLanguageToggle} aria-label={c.ariaLanguage} className="border-s border-white/30 ps-4 font-mono-ui text-[10px] uppercase tracking-[.12em] transition-opacity hover:opacity-60" data-testid="button-language-toggle">
            {c.languageLabel}
          </button>
        </div>
      </div>
      <div className="mx-5 h-px bg-white/20 sm:mx-8 lg:mx-12" />
    </header>
  );
}

function Hero({ onShop, c }: { onShop: () => void; c: Copy }) {
  return (
    <section className="relative min-h-[680px] overflow-hidden bg-[#6c4a3a] text-[#f7f0e6] sm:min-h-[760px]">
      <img src={heroImage} alt="Eleganza fragrance, makeup and jewelry arranged in warm light" className="absolute inset-0 h-full w-full object-cover object-center opacity-90" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1d201a]/70 via-[#3e2d24]/15 to-transparent" />
      <div className="relative mx-auto flex min-h-[680px] max-w-[1440px] flex-col justify-end px-5 pb-14 sm:min-h-[760px] sm:px-8 sm:pb-20 lg:px-12">
        <div className="max-w-[650px]">
          <p className="rise-in font-mono-ui text-[10px] uppercase tracking-[.3em] text-[#f1d2bd]">{c.heroKicker}</p>
          <h1 className="rise-in rise-in-delay-1 mt-4 max-w-[620px] font-display text-[clamp(4.6rem,10vw,9.6rem)] leading-[.82] tracking-[-.055em]">
            {c.heroTitle}
          </h1>
          <div className="rise-in rise-in-delay-2 mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <p className="max-w-[250px] text-sm leading-6 text-[#f6ebe0]/80">{c.heroDescription}</p>
            <button onClick={onShop} className="group flex items-center gap-3 border-b border-[#f7f0e6]/70 pb-2 font-mono-ui text-[10px] uppercase tracking-[.2em] transition-colors hover:border-[#f1d2bd] hover:text-[#f1d2bd]" data-testid="button-shop-edit">
              {c.shopEdit} <ArrowDownRight size={15} strokeWidth={1.3} className="transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
            </button>
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 right-5 hidden items-center gap-4 sm:flex lg:right-12">
        <span className="font-mono-ui text-[9px] uppercase tracking-[.2em] opacity-60">{c.scrollDiscover}</span>
        <span className="h-px w-14 bg-white/50" />
      </div>
    </section>
  );
}

function SectionKicker({ children, dark = false }: { children: string; dark?: boolean }) {
  return <p className={`font-mono-ui text-[10px] uppercase tracking-[.26em] ${dark ? 'text-[#d18c6d]' : 'text-[#a85a43]'}`}>{children}</p>;
}

function ProductCard({
  product,
  language,
  c,
  favorite,
  onFavorite,
  onSelect,
  onAdd,
}: {
  product: Product;
  language: Language;
  c: Copy;
  favorite: boolean;
  onFavorite: () => void;
  onSelect: () => void;
  onAdd: () => void;
}) {
  return (
    <article className="group" data-testid={`card-product-${product.id}`}>
      <div className="image-zoom relative aspect-[4/5] overflow-hidden bg-[#e3dbce]">
        <button onClick={onSelect} className="absolute inset-0 z-10 cursor-pointer" aria-label={`View ${product.name}`} data-testid={`button-view-${product.id}`} />
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        {product.badge && <span className="absolute left-4 top-4 z-20 bg-[#f1e4d4] px-2.5 py-1 font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#704637]">{getBadgeLabel(product.badge, c)}</span>}
        <button onClick={onFavorite} aria-label={favorite ? `Remove ${product.name} from favorites` : `Add ${product.name} to favorites`} className={`absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center bg-[#f8f0e6]/90 transition-all hover:bg-[#f8f0e6] ${favorite ? 'text-[#a64e3a]' : 'text-[#312b25]'}`} data-testid={`button-favorite-${product.id}`}>
          <Heart size={16} strokeWidth={1.4} fill={favorite ? 'currentColor' : 'none'} />
        </button>
        <button onClick={onAdd} className="absolute bottom-0 left-0 right-0 z-20 translate-y-full bg-[#f8f0e6]/95 px-4 py-4 text-left font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#322b25] transition-transform duration-300 group-hover:translate-y-0" data-testid={`button-add-${product.id}`}>
          {c.addToBag} <Plus size={13} className="float-right" strokeWidth={1.5} />
        </button>
      </div>
      <button onClick={onSelect} className="mt-4 block text-left" data-testid={`button-details-${product.id}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-[25px] leading-none text-[#312b25]">{product.name}</h3>
            <p className="mt-2 font-mono-ui text-[9px] uppercase tracking-[.14em] text-[#87796d]">{language === 'ar' ? `${product.color} / ${product.material}` : `${product.color} / ${product.material}`}</p>
          </div>
          <span className="font-mono-ui text-[11px] text-[#312b25]">{money(product.price)}</span>
        </div>
      </button>
    </article>
  );
}

function ProductDetail({
  product,
  language,
  c,
  favorite,
  onFavorite,
  onAdd,
  onClose,
}: {
  product: Product;
  language: Language;
  c: Copy;
  favorite: boolean;
  onFavorite: () => void;
  onAdd: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#211b18]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`${product.name} details`}>
      <div className="relative max-h-[94dvh] w-full max-w-[980px] overflow-auto bg-[#f8f0e6] sm:grid sm:grid-cols-2">
        <button onClick={onClose} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center bg-[#f8f0e6]/80 text-[#312b25] transition-colors hover:bg-[#f1e4d4]" aria-label={c.close} data-testid="button-close-detail"><X size={18} strokeWidth={1.4} /></button>
        <div className="aspect-[4/4.7] bg-[#ded4c7] sm:aspect-auto"><img src={product.image} alt={product.name} className="h-full w-full object-cover" /></div>
        <div className="flex flex-col justify-between p-7 sm:p-12">
          <div>
            <SectionKicker>{categoryLabels[language][product.category]}</SectionKicker>
            <h2 className="mt-5 font-display text-5xl leading-[.9] tracking-[-.04em] text-[#312b25]">{product.name}</h2>
            <p className="mt-4 font-mono-ui text-sm text-[#6f6358]">{money(product.price)}</p>
            <div className="my-8 h-px bg-[#312b25]/15" />
            <p className="font-display text-2xl leading-tight text-[#55473c]">{product.note}</p>
            <dl className="mt-8 space-y-4 border-t border-[#312b25]/15 pt-5 font-mono-ui text-[10px] uppercase tracking-[.13em] text-[#7d6d61]">
              <div className="flex justify-between"><dt>{c.format}</dt><dd className="text-right text-[#312b25]">{product.material}</dd></div>
              <div className="flex justify-between"><dt>{c.notes}</dt><dd className="text-right text-[#312b25]">{product.color}</dd></div>
              <div className="flex justify-between"><dt>{c.dispatch}</dt><dd className="text-right text-[#312b25]">{c.dispatchTime}</dd></div>
            </dl>
          </div>
          <div className="mt-10 flex gap-3">
            <button onClick={onAdd} className="flex-1 bg-[#9f523d] px-5 py-4 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#fff5e8] transition-colors hover:bg-[#7f3f31]" data-testid={`button-detail-add-${product.id}`}>{c.addToBag}</button>
            <button onClick={onFavorite} className={`grid w-14 place-items-center border border-[#312b25]/20 transition-colors hover:bg-[#efe2d3] ${favorite ? 'text-[#a64e3a]' : 'text-[#312b25]'}`} aria-label={c.languageLabel === 'العربية' ? 'إضافة إلى المفضلة' : 'Toggle favorite'} data-testid={`button-detail-favorite-${product.id}`}><Heart size={18} strokeWidth={1.3} fill={favorite ? 'currentColor' : 'none'} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BagDrawer({
  items,
  c,
  onClose,
  onUpdate,
  onRemove,
  onCheckout,
}: {
  items: CartItem[];
  c: Copy;
  onClose: () => void;
  onUpdate: (id: string, amount: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return (
    <div className="fixed inset-0 z-50 bg-[#211b18]/45 backdrop-blur-[2px]" onClick={onClose}>
       <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-[480px] flex-col bg-[#f8f0e6] text-[#312b25] shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-label={c.bag}>
        <div className="flex items-center justify-between border-b border-[#312b25]/15 px-6 py-5 sm:px-8">
           <div><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#9f523d]">{c.yourEdit}</p><h2 className="mt-1 font-display text-4xl">{c.theBag} <span className="font-sans text-sm text-[#89796c]">({items.length})</span></h2></div>
           <button onClick={onClose} aria-label={c.close} className="grid h-10 w-10 place-items-center border border-[#312b25]/15 hover:bg-[#efe2d3]" data-testid="button-close-bag"><X size={18} strokeWidth={1.3} /></button>
        </div>
        <div className="no-scrollbar flex-1 overflow-auto px-6 py-6 sm:px-8">
          {items.length === 0 ? (
            <div className="flex h-full min-h-[380px] flex-col items-center justify-center text-center">
              <ShoppingBag size={28} strokeWidth={1} className="text-[#9f523d]" />
               <p className="mt-5 font-display text-3xl">{c.nothingHere}</p>
               <p className="mt-2 max-w-[230px] text-sm leading-6 text-[#75685d]">{c.emptyBagDescription}</p>
               <button onClick={onClose} className="mt-7 border-b border-[#9f523d] pb-1 font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#9f523d]" data-testid="button-continue-shopping">{c.continueBrowsing}</button>
            </div>
          ) : (
            <div className="space-y-6">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b border-[#312b25]/12 pb-6" data-testid={`row-bag-${item.id}`}>
                  <img src={item.image} alt={item.name} className="h-28 w-24 object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2"><div><h3 className="font-display text-2xl leading-none">{item.name}</h3><p className="mt-2 font-mono-ui text-[9px] uppercase tracking-[.1em] text-[#87796d]">{item.color}</p></div><button onClick={() => onRemove(item.id)} className="text-[#98887b] hover:text-[#9f523d]" aria-label={`Remove ${item.name}`} data-testid={`button-remove-${item.id}`}><X size={14} /></button></div>
                    <div className="flex items-end justify-between"><div className="flex items-center border border-[#312b25]/20"><button className="grid h-7 w-7 place-items-center hover:bg-[#efe2d3]" onClick={() => onUpdate(item.id, -1)} aria-label={`Decrease ${item.name}`} data-testid={`button-decrease-${item.id}`}><Minus size={12} /></button><span className="w-7 text-center font-mono-ui text-[10px]" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span><button className="grid h-7 w-7 place-items-center hover:bg-[#efe2d3]" onClick={() => onUpdate(item.id, 1)} aria-label={`Increase ${item.name}`} data-testid={`button-increase-${item.id}`}><Plus size={12} /></button></div><span className="font-mono-ui text-xs">{money(item.price * item.quantity)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
         {items.length > 0 && <div className="border-t border-[#312b25]/15 px-6 py-6 sm:px-8"><div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#75685d]">{c.subtotal}</span><span className="font-display text-3xl">{money(subtotal)}</span></div><p className="mt-2 text-xs text-[#827469]">{c.freeShipping}</p><button onClick={onCheckout} className="mt-6 flex w-full items-center justify-center gap-3 bg-[#9f523d] py-4 font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#fff5e8] hover:bg-[#7f3f31]" data-testid="button-checkout">{c.checkout} <ArrowRight size={15} /></button></div>}
      </aside>
    </div>
  );
}

function SearchPanel({ onClose, products: catalog, onSelect, c, language }: { onClose: () => void; products: Product[]; onSelect: (product: Product) => void; c: Copy; language: Language }) {
  const [query, setQuery] = useState('');
  const results = catalog.filter((product) => `${product.name} ${product.category} ${product.material}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="fixed inset-0 z-50 bg-[#f8f0e6] text-[#312b25]">
      <div className="mx-auto max-w-[980px] px-5 py-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between border-b border-[#312b25]/15 pb-5"><span className="font-display text-4xl">{c.findPiece}</span><button onClick={onClose} aria-label={c.close} data-testid="button-close-search"><X size={21} strokeWidth={1.3} /></button></div>
        <div className="flex items-center gap-4 border-b border-[#312b25]/30 py-7"><Search size={20} strokeWidth={1.3} className="text-[#9f523d]" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={c.searchPlaceholder} className="w-full bg-transparent font-display text-3xl outline-none placeholder:text-[#b7a99d]" data-testid="input-search" /></div>
        <div className="mt-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#9f523d]">{query ? `${results.length} ${c.results}` : c.consideredThings}</p><div className="mt-5 divide-y divide-[#312b25]/12">{results.map((product) => <button onClick={() => onSelect(product)} key={product.id} className="flex w-full items-center justify-between py-5 text-left hover:text-[#9f523d]" data-testid={`search-result-${product.id}`}><span className="font-display text-3xl">{product.name}</span><span className="font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#8a796d]">{categoryLabels[language][product.category]} / {money(product.price)}</span></button>)}</div>{results.length === 0 && <p className="mt-8 font-display text-2xl text-[#817267]">{c.noResults}</p>}</div>
      </div>
    </div>
  );
}

function App() {
  const [activeFilter, setActiveFilter] = useState<Category>('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bag, setBag] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const shownProducts = useMemo(() => {
    if (activeFilter === 'All') return products;
    if (activeFilter === 'New in') return products.filter((product) => product.badge === 'New' || product.badge === 'Edition 01');
    return products.filter((product) => product.category === activeFilter);
  }, [activeFilter]);
  const bagCount = bag.reduce((sum, item) => sum + item.quantity, 0);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };
  const toggleFavorite = (id: string) => setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const addToBag = (product: Product) => {
    setBag((current) => {
      const existing = current.find((item) => item.id === product.id);
      return existing ? current.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { ...product, quantity: 1 }];
    });
    notify(`${product.name} added to your bag`);
  };
  const updateQuantity = (id: string, amount: number) => setBag((current) => current.flatMap((item) => item.id === id ? (item.quantity + amount > 0 ? [{ ...item, quantity: item.quantity + amount }] : []) : [item]));
  const jumpToShop = () => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="grain min-h-[100dvh] bg-[#f8f0e6] text-[#312b25]">
      <section className="relative">
        <Header bagCount={bagCount} onBag={() => setBagOpen(true)} onSearch={() => setSearchOpen(true)} onMenu={() => setMenuOpen(true)} />
        <Hero onShop={jumpToShop} />
      </section>

      {menuOpen && <div className="fixed inset-0 z-40 bg-[#f8f0e6] p-6 text-[#312b25] lg:hidden"><div className="flex items-center justify-between"><span className="font-display text-4xl">Eleganza</span><button onClick={() => setMenuOpen(false)} aria-label="Close menu" data-testid="button-close-menu"><X size={21} /></button></div><nav className="mt-20 flex flex-col gap-6 font-display text-6xl"><button className="text-left" onClick={() => { setMenuOpen(false); jumpToShop(); }} data-testid="mobile-link-shop">Shop</button><button className="text-left" onClick={() => { setMenuOpen(false); document.getElementById('journal')?.scrollIntoView({ behavior: 'smooth' }); }} data-testid="mobile-link-journal">Journal</button><button className="text-left" onClick={() => { setMenuOpen(false); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }} data-testid="mobile-link-about">About</button></nav></div>}

      <main>
        <section id="shop" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div><SectionKicker>Selected for now</SectionKicker><h2 className="mt-4 max-w-[500px] font-display text-5xl leading-[.9] tracking-[-.04em] sm:text-7xl">The essentials<br /><em>in rotation.</em></h2></div>
            <p className="max-w-[250px] text-sm leading-6 text-[#77695e]">A small, intentional edit of scent, color and adornment for the everyday.</p>
          </div>
          <div className="mt-14 flex items-center justify-between border-y border-[#312b25]/15 py-4">
            <div className="no-scrollbar flex gap-6 overflow-auto">{filters.map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`whitespace-nowrap font-mono-ui text-[10px] uppercase tracking-[.16em] transition-colors ${activeFilter === filter ? 'text-[#9f523d]' : 'text-[#88796c] hover:text-[#312b25]'}`} data-testid={`button-filter-${filter.toLowerCase().replace(' ', '-')}`}>{filter}</button>)}</div>
            <span className="hidden font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#9b8b7e] sm:block">{shownProducts.length} / 04</span>
          </div>
          <div className="mt-8 grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">{shownProducts.map((product) => <ProductCard key={product.id} product={product} favorite={favorites.includes(product.id)} onFavorite={() => toggleFavorite(product.id)} onSelect={() => setSelectedProduct(product)} onAdd={() => addToBag(product)} />)}</div>
        </section>

        <section id="about" className="bg-[#273b39] text-[#f5ede2]">
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.15fr_.85fr]">
            <div className="flex min-h-[530px] flex-col justify-between px-5 py-14 sm:px-8 sm:py-20 lg:px-12"><SectionKicker dark>Our point of view</SectionKicker><div><p className="max-w-[680px] font-display text-[clamp(3rem,6vw,6rem)] leading-[.88] tracking-[-.045em]">Beauty, but <em>better considered.</em></p><p className="mt-8 max-w-[360px] text-sm leading-6 text-[#d6d2c8]/70">Eleganza is a practice in editing. We look for the note that lingers, the color that feels like you, and the small detail that changes the whole ritual.</p></div><button onClick={() => notify('Our studio notes are coming soon')} className="flex w-fit items-center gap-3 border-b border-[#d6d2c8]/50 pb-2 font-mono-ui text-[10px] uppercase tracking-[.18em] hover:border-[#d18c6d] hover:text-[#d18c6d]" data-testid="button-read-about">Read our notes <ArrowRight size={15} strokeWidth={1.3} /></button></div>
            <div className="relative min-h-[390px] overflow-hidden bg-[#b87555] lg:min-h-0"><img src={makeupImage} alt="Rose cream blush in warm editorial light" className="h-full w-full object-cover mix-blend-multiply opacity-80" /><div className="absolute inset-0 bg-[#b87555]/30" /><div className="absolute bottom-8 left-8 font-mono-ui text-[9px] uppercase tracking-[.2em] text-[#f5ede2]/80">Beauty study / 001</div></div>
          </div>
        </section>

        <section id="journal" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="flex items-end justify-between"><div><SectionKicker>The journal</SectionKicker><h2 className="mt-4 font-display text-5xl leading-none tracking-[-.04em] sm:text-7xl">Notes on <em>living well.</em></h2></div><button onClick={() => notify('More journal entries are on their way')} className="hidden items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#9f523d] sm:flex" data-testid="button-view-journal">View all <ArrowRight size={15} /></button></div>
          <div className="mt-12 grid gap-8 md:grid-cols-[1.3fr_.7fr]">
            <button onClick={() => notify('Opening: The art of the everyday')} className="group text-left" data-testid="article-everyday"><div className="image-zoom relative aspect-[1.7/1] overflow-hidden bg-[#d3c4b4]"><img src={heroImage} alt="Eleganza beauty ritual in warm light" className="h-full w-full object-cover grayscale-[.1]" /><span className="absolute bottom-5 left-5 bg-[#f8f0e6] px-3 py-2 font-mono-ui text-[9px] uppercase tracking-[.15em]">Field notes / 14.09.24</span></div><h3 className="mt-5 max-w-[520px] font-display text-4xl leading-[.92] transition-colors group-hover:text-[#9f523d]">The art of the ritual: on scent, skin and taking your time.</h3></button>
            <div className="flex flex-col justify-between gap-8 border-t border-[#312b25]/15 pt-5 md:border-t-0 md:border-l md:pl-8">
               <button onClick={() => notify('Opening: How to choose a signature scent')} className="group text-left" data-testid="article-room"><p className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#9f523d]">Scent / 02</p><h3 className="mt-3 font-display text-3xl leading-[.95] group-hover:text-[#9f523d]">How to choose a signature scent without rushing the decision.</h3><span className="mt-4 flex items-center gap-2 font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#98887a]">Read story <ArrowRight size={13} /></span></button>
               <button onClick={() => notify('Opening: The five-minute face')} className="group border-t border-[#312b25]/15 pt-5 text-left" data-testid="article-form"><p className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#9f523d]">In practice / 03</p><h3 className="mt-3 font-display text-3xl leading-[.95] group-hover:text-[#9f523d]">The five-minute face: a few good things, applied with intention.</h3><span className="mt-4 flex items-center gap-2 font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#98887a]">Read story <ArrowRight size={13} /></span></button>
            </div>
          </div>
        </section>

        <section className="border-y border-[#312b25]/15 bg-[#ece1d2]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-14 sm:px-8 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-12">
            <div><SectionKicker>A slower inbox</SectionKicker><h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">A note when there’s something to say.</h2></div>
            <form className="flex w-full max-w-[420px] border-b border-[#312b25]/45 py-3" onSubmit={(event) => { event.preventDefault(); notify('You’re on the list. Thank you.'); }}><input type="email" required placeholder="Your email address" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8b7c70]" data-testid="input-newsletter" /><button className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#9f523d]" data-testid="button-subscribe">Subscribe</button></form>
          </div>
        </section>
      </main>

      <footer className="bg-[#312b25] text-[#f5ede2]">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-18 lg:px-12">
          <div className="flex flex-col justify-between gap-12 sm:flex-row"><div><p className="font-display text-6xl tracking-[-.05em]">Eleganza</p><p className="mt-4 max-w-[220px] text-sm leading-6 text-[#e2d6ca]/65">The quiet pleasure of finding the right thing.</p></div><div className="grid grid-cols-2 gap-x-16 gap-y-8 sm:grid-cols-3"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-[#d18c6d]">Explore</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#e2d6ca]/70"><button className="text-left hover:text-[#fff8ed]" onClick={jumpToShop} data-testid="footer-shop">Shop</button><button className="text-left hover:text-[#fff8ed]" onClick={() => document.getElementById('journal')?.scrollIntoView({ behavior: 'smooth' })} data-testid="footer-journal">Journal</button></div></div><div><p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-[#d18c6d]">Help</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#e2d6ca]/70"><button className="text-left hover:text-[#fff8ed]" onClick={() => notify('We’ll be in touch shortly')} data-testid="footer-contact">Contact</button><button className="text-left hover:text-[#fff8ed]" onClick={() => notify('Shipping is complimentary over $300')} data-testid="footer-shipping">Shipping</button></div></div><div className="col-span-2 sm:col-span-1"><p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-[#d18c6d]">Follow</p><div className="mt-4 flex gap-4 text-sm text-[#e2d6ca]/70"><button onClick={() => notify('Instagram is coming soon')} data-testid="footer-instagram">Instagram</button><button onClick={() => notify('Pinterest is coming soon')} data-testid="footer-pinterest">Pinterest</button></div></div></div></div>
          <div className="mt-16 flex flex-col justify-between gap-3 border-t border-[#f5ede2]/15 pt-5 font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#e2d6ca]/45 sm:flex-row"><span>© 2024 Eleganza Studio</span><span>Made with patience in London</span></div>
        </div>
      </footer>

      {notice && <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 bg-[#312b25] px-5 py-3 font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#f8f0e6] shadow-xl" role="status" data-testid="status-notice"><Sparkles size={13} className="mr-2 inline-block text-[#d18c6d]" />{notice}</div>}
      {bagOpen && <BagDrawer items={bag} onClose={() => setBagOpen(false)} onUpdate={updateQuantity} onRemove={(id) => setBag((current) => current.filter((item) => item.id !== id))} onCheckout={() => notify('Checkout is being prepared for you')} />}
      {searchOpen && <SearchPanel products={products} onClose={() => setSearchOpen(false)} onSelect={(product) => { setSearchOpen(false); setSelectedProduct(product); }} />}
      {selectedProduct && <ProductDetail product={selectedProduct} favorite={favorites.includes(selectedProduct.id)} onFavorite={() => toggleFavorite(selectedProduct.id)} onAdd={() => { addToBag(selectedProduct); setSelectedProduct(null); }} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}

export default App;
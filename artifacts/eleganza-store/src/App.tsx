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
import perfumeImage480 from './assets/perfume-product-480.jpg';
import perfumeImage960 from './assets/perfume-product-960.jpg';
import makeupImage from './assets/makeup-product.jpg';
import makeupImage480 from './assets/makeup-product-480.jpg';
import makeupImage960 from './assets/makeup-product-960.jpg';
import jewelryImage from './assets/jewelry-product.jpg';
import jewelryImage480 from './assets/jewelry-product-480.jpg';
import jewelryImage960 from './assets/jewelry-product-960.jpg';
import lipImage from './assets/lip-product.jpg';
import lipImage480 from './assets/lip-product-480.jpg';
import lipImage960 from './assets/lip-product-960.jpg';
import amberReverieImage from './assets/amber-reverie.jpg';
import amberReverieImage480 from './assets/amber-reverie-480.jpg';
import amberReverieImage960 from './assets/amber-reverie-960.jpg';
import silkPetalImage from './assets/silk-petal.jpg';
import silkPetalImage480 from './assets/silk-petal-480.jpg';
import silkPetalImage960 from './assets/silk-petal-960.jpg';
import solsticeChainImage from './assets/solstice-chain.jpg';
import solsticeChainImage480 from './assets/solstice-chain-480.jpg';
import solsticeChainImage960 from './assets/solstice-chain-960.jpg';
import nocturneRougeImage from './assets/nocturne-rouge.jpg';
import nocturneRougeImage480 from './assets/nocturne-rouge-480.jpg';
import nocturneRougeImage960 from './assets/nocturne-rouge-960.jpg';
import cedarAfterglowImage from './assets/cedar-afterglow.jpg';
import cedarAfterglowImage480 from './assets/cedar-afterglow-480.jpg';
import cedarAfterglowImage960 from './assets/cedar-afterglow-960.jpg';
import dawnFlushImage from './assets/dawn-flush.jpg';
import dawnFlushImage480 from './assets/dawn-flush-480.jpg';
import dawnFlushImage960 from './assets/dawn-flush-960.jpg';
import aureliaDropsImage from './assets/aurelia-drops.jpg';
import aureliaDropsImage480 from './assets/aurelia-drops-480.jpg';
import aureliaDropsImage960 from './assets/aurelia-drops-960.jpg';
import plumElanImage from './assets/plum-elan.jpg';
import plumElanImage480 from './assets/plum-elan-480.jpg';
import plumElanImage960 from './assets/plum-elan-960.jpg';

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
  image480: string;
  image960: string;
  note: string;
  badge?: string;
};

type CartItem = Product & { quantity: number };
type ArticleId = 'ritual' | 'scent' | 'five-minute-face';

type Article = {
  id: ArticleId;
  category: string;
  date: string;
  title: string;
  introduction: string;
  sections: { heading: string; body: string }[];
  closing: string;
  image: string;
};

const products: Product[] = [
  {
    id: 'p01',
    name: 'Santal No. 03',
    category: 'Perfume',
    price: 145,
    material: 'Eau de parfum / 50 ml',
    color: 'Sandalwood / amber',
    image: perfumeImage,
    image480: perfumeImage480,
    image960: perfumeImage960,
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
    image480: makeupImage480,
    image960: makeupImage960,
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
    image480: jewelryImage480,
    image960: jewelryImage960,
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
    image480: lipImage480,
    image960: lipImage960,
    note: 'A soft-focus stain with a little more intention.',
    badge: 'Edition 01',
  },
  {
    id: 'p02',
    name: 'Amber Reverie',
    category: 'Perfume',
    price: 168,
    material: 'Eau de parfum / 75 ml',
    color: 'Amber / vanilla',
    image: amberReverieImage,
    image480: amberReverieImage480,
    image960: amberReverieImage960,
    note: 'A rich amber glow softened by smooth vanilla.',
    badge: 'New',
  },
  {
    id: 'm03',
    name: 'Silk Petal',
    category: 'Makeup',
    price: 44,
    material: 'Powder blush / 8 g',
    color: 'Soft coral',
    image: silkPetalImage,
    image480: silkPetalImage480,
    image960: silkPetalImage960,
    note: 'A weightless wash of coral that brings warmth to the face.',
  },
  {
    id: 'a02',
    name: 'Solstice Chain',
    category: 'Accessories',
    price: 118,
    material: 'Gold vermeil / 42 cm',
    color: 'Polished gold',
    image: solsticeChainImage,
    image480: solsticeChainImage480,
    image960: solsticeChainImage960,
    note: 'A fine golden chain made to catch the light with every movement.',
    badge: 'Bestseller',
  },
  {
    id: 'm04',
    name: 'Nocturne Rouge',
    category: 'Makeup',
    price: 39,
    material: 'Matte lipstick / 3.5 g',
    color: 'Burnished red',
    image: nocturneRougeImage,
    image480: nocturneRougeImage480,
    image960: nocturneRougeImage960,
    note: 'A confident red with a soft matte finish that stays comfortable.',
  },
  {
    id: 'p03',
    name: 'Cedar Afterglow',
    category: 'Perfume',
    price: 152,
    material: 'Eau de parfum / 50 ml',
    color: 'Cedar / white musk',
    image: cedarAfterglowImage,
    image480: cedarAfterglowImage480,
    image960: cedarAfterglowImage960,
    note: 'Clean cedar and soft musk settle close to the skin.',
  },
  {
    id: 'm05',
    name: 'Dawn Flush',
    category: 'Makeup',
    price: 46,
    material: 'Cream blush / 7 g',
    color: 'Warm peach',
    image: dawnFlushImage,
    image480: dawnFlushImage480,
    image960: dawnFlushImage960,
    note: 'A fresh peach tint that gives the complexion an easy glow.',
    badge: 'New',
  },
  {
    id: 'a03',
    name: 'Aurelia Drops',
    category: 'Accessories',
    price: 105,
    material: 'Gold vermeil',
    color: 'Satin gold',
    image: aureliaDropsImage,
    image480: aureliaDropsImage480,
    image960: aureliaDropsImage960,
    note: 'Light-catching drops with a refined shape and effortless movement.',
  },
  {
    id: 'm06',
    name: 'Plum Élan',
    category: 'Makeup',
    price: 38,
    material: 'Satin lipstick / 3.5 g',
    color: 'Muted plum',
    image: plumElanImage,
    image480: plumElanImage480,
    image960: plumElanImage960,
    note: 'A muted plum that adds depth while remaining easy to wear.',
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

type Copy = typeof copy.en | typeof copy.ar;

const articles: Record<Language, Article[]> = {
  en: [
    {
      id: 'ritual',
      category: 'Field notes',
      date: '14.09.24',
      title: 'The art of the ritual: on scent, skin and taking your time.',
      introduction: 'A beauty ritual does not need to be complicated. It only needs enough attention to turn an ordinary moment into one that feels entirely your own.',
      sections: [
        { heading: 'Begin with the senses', body: 'Notice the temperature of the room, the light on the mirror and the texture of what you are applying. Moving slowly helps you understand what truly suits you instead of following every passing recommendation.' },
        { heading: 'Let fragrance settle', body: 'Perfume changes as it meets warm skin. Apply it lightly to pulse points, then give it time. The first impression is only the opening; the scent that remains after an hour is the one you will actually live with.' },
        { heading: 'Keep only what adds something', body: 'A considered ritual is often a short one. One beautiful scent, a color that brings life to the face and a small detail of gold can be more expressive than a crowded routine.' },
      ],
      closing: 'The pleasure is not in doing more. It is in noticing more.',
      image: heroImage,
    },
    {
      id: 'scent',
      category: 'Scent',
      date: '08.09.24',
      title: 'How to choose a signature scent without rushing the decision.',
      introduction: 'A signature scent should feel familiar without becoming predictable. Choosing one is less about finding the loudest perfume and more about discovering what feels natural on your skin.',
      sections: [
        { heading: 'Start with a feeling', body: 'Before reading a list of notes, decide what you want the fragrance to express: warmth, clarity, softness or mystery. This gives you a better direction than choosing by ingredient alone.' },
        { heading: 'Try it on skin', body: 'Paper strips are useful for a first impression, but skin tells the complete story. Wear one fragrance at a time and notice how it develops through the day.' },
        { heading: 'Return before deciding', body: 'A good choice still feels right on the second and third wear. Give yourself several days before buying. The fragrance you continue thinking about is usually the one worth keeping.' },
      ],
      closing: 'Choose the scent that feels like recognition, not performance.',
      image: perfumeImage,
    },
    {
      id: 'five-minute-face',
      category: 'In practice',
      date: '02.09.24',
      title: 'The five-minute face: a few good things, applied with intention.',
      introduction: 'Five minutes can be enough when each product has a clear purpose. The aim is not to hide the face, but to bring back light, warmth and definition.',
      sections: [
        { heading: 'Even only where needed', body: 'Use a small amount of complexion product around the center of the face and blend outward. Let natural skin remain visible wherever it already looks even.' },
        { heading: 'Bring in one living color', body: 'A cream blush pressed into the cheeks can make the whole face feel awake. Use what remains on the fingertips across the lips for an easy sense of harmony.' },
        { heading: 'Finish with definition', body: 'Brush the brows, curl the lashes and choose one deliberate finishing detail. A soft lip or a clean line around the eyes is enough.' },
      ],
      closing: 'A short routine works best when every gesture earns its place.',
      image: makeupImage,
    },
  ],
  ar: [
    {
      id: 'ritual',
      category: 'ملاحظات ميدانية',
      date: '14.09.24',
      title: 'فن الطقس اليومي: عن العطر والبشرة وأخذ الوقت.',
      introduction: 'لا يحتاج طقس الجمال إلى خطوات كثيرة. يكفي أن تمنحيه قليلًا من الانتباه حتى تتحول اللحظة العادية إلى وقت خاص بك.',
      sections: [
        { heading: 'ابدئي بالحواس', body: 'انتبهي إلى حرارة المكان، والضوء على المرآة، وملمس ما تضعينه على بشرتك. التمهّل يساعدك على معرفة ما يناسبك فعلًا بدل ملاحقة كل توصية عابرة.' },
        { heading: 'اتركي العطر يستقر', body: 'يتغير العطر عندما يلامس دفء البشرة. ضعي كمية خفيفة على نقاط النبض ثم امنحيه وقتًا. الانطباع الأول مجرد بداية، أما الرائحة التي تبقى بعد ساعة فهي التي سترافقك.' },
        { heading: 'احتفظي بما يضيف معنى', body: 'غالبًا ما يكون الطقس المدروس قصيرًا. عطر جميل، ولون يعيد الحيوية إلى الوجه، وتفصيل ذهبي صغير قد تكون أبلغ من روتين مزدحم.' },
      ],
      closing: 'المتعة ليست في فعل المزيد، بل في ملاحظة المزيد.',
      image: heroImage,
    },
    {
      id: 'scent',
      category: 'عطور',
      date: '08.09.24',
      title: 'كيف تختار عطرك المميز دون استعجال القرار.',
      introduction: 'يجب أن يبدو عطرك المميز مألوفًا دون أن يصبح متوقعًا. الاختيار لا يتعلق بأقوى رائحة، بل باكتشاف ما ينسجم طبيعيًا مع بشرتك.',
      sections: [
        { heading: 'ابدأ بالشعور', body: 'قبل قراءة قائمة المكونات، حدد ما تريد أن يقوله العطر: دفء، أو نقاء، أو نعومة، أو غموض. هذا يمنحك اتجاهًا أوضح من الاختيار حسب المكونات وحدها.' },
        { heading: 'جرّبه على البشرة', body: 'الأوراق العطرية مفيدة للانطباع الأول، لكن البشرة تكشف القصة الكاملة. جرّب عطرًا واحدًا في كل مرة وراقب كيف يتطور خلال اليوم.' },
        { heading: 'عُد إليه قبل القرار', body: 'الاختيار الجيد يبقى جميلًا في التجربة الثانية والثالثة. امنح نفسك عدة أيام قبل الشراء؛ فالعطر الذي يستمر في ذاكرتك غالبًا هو الذي يستحق البقاء.' },
      ],
      closing: 'اختر العطر الذي يشبه التعرف على نفسك، لا محاولة أداء دور.',
      image: perfumeImage,
    },
    {
      id: 'five-minute-face',
      category: 'في التطبيق',
      date: '02.09.24',
      title: 'إطلالة الخمس دقائق: أشياء قليلة جيدة، بلمسة مقصودة.',
      introduction: 'خمس دقائق قد تكون كافية عندما يكون لكل منتج دور واضح. الهدف ليس إخفاء الوجه، بل إعادة الضوء والدفء والتحديد إليه.',
      sections: [
        { heading: 'وحّدي ما يحتاج فقط', body: 'استخدمي كمية صغيرة من مستحضر البشرة في منتصف الوجه وادمجيها نحو الخارج. اتركي البشرة الطبيعية ظاهرة في المناطق التي لا تحتاج إلى تغطية.' },
        { heading: 'أضيفي لونًا حيًا واحدًا', body: 'قليل من أحمر الخدود الكريمي يعيد الحيوية إلى الوجه كله. مرري ما تبقى على أطراف الأصابع فوق الشفاه لتحصلي على تناغم بسيط.' },
        { heading: 'أنهي بقليل من التحديد', body: 'رتبي الحاجبين، وارفعي الرموش، ثم اختاري تفصيلًا أخيرًا واحدًا. لون شفاه هادئ أو خط نظيف حول العينين يكفي.' },
      ],
      closing: 'ينجح الروتين القصير عندما تكون لكل حركة فيه قيمة.',
      image: makeupImage,
    },
  ],
};

const categoryLabels: Record<Language, Record<Category, string>> = {
  en: { All: copy.en.all, 'New in': copy.en.newIn, Perfume: copy.en.perfume, Makeup: copy.en.makeup, Accessories: copy.en.accessories },
  ar: { All: copy.ar.all, 'New in': copy.ar.newIn, Perfume: copy.ar.perfume, Makeup: copy.ar.makeup, Accessories: copy.ar.accessories },
};

const getBadgeLabel = (badge: string | undefined, c: Copy) =>
  badge === 'Bestseller' ? c.bestseller : badge === 'New' ? c.new : badge === 'Edition 01' ? c.edition : badge;

const arabicProductCopy: Record<string, Pick<Product, 'material' | 'color' | 'note'>> = {
  p01: {
    material: 'أو دو بارفان / 50 مل',
    color: 'خشب الصندل / العنبر',
    note: 'عطر دافئ بجاذبية هادئة، يترك أثرًا مميزًا يدوم طويلًا.',
  },
  m01: {
    material: 'أحمر خدود كريمي / 7 غ',
    color: 'وردي البتلات',
    note: 'لمسة وردية شفافة تبدو كلون بشرتك الطبيعي، ولكن بنعومة أجمل.',
  },
  a01: {
    material: 'فضة إسترلينية مطلية بالذهب',
    color: 'ذهبي دافئ',
    note: 'تفصيل ذهبي بسيط يضفي لمسة أنيقة على إطلالتك اليومية.',
  },
  m02: {
    material: 'أحمر شفاه ساتان / 3.5 غ',
    color: 'توتي داكن',
    note: 'لون شفاه ناعم بتأثير ضبابي ولمسة أكثر وضوحًا وتميّزًا.',
  },
  p02: {
    material: 'أو دو بارفان / 75 مل',
    color: 'عنبر / فانيليا',
    note: 'عبير عنبري غني تلطفه نفحات الفانيليا الناعمة.',
  },
  m03: {
    material: 'أحمر خدود بودرة / 8 غ',
    color: 'مرجاني ناعم',
    note: 'طبقة خفيفة من اللون المرجاني تضفي دفئًا طبيعيًا على الوجه.',
  },
  a02: {
    material: 'فضة مطلية بالذهب / 42 سم',
    color: 'ذهبي لامع',
    note: 'سلسلة ذهبية رفيعة تلتقط الضوء مع كل حركة.',
  },
  m04: {
    material: 'أحمر شفاه مطفي / 3.5 غ',
    color: 'أحمر معتّق',
    note: 'أحمر واثق بلمسة مطفية ناعمة ومريحة تدوم طويلًا.',
  },
  p03: {
    material: 'أو دو بارفان / 50 مل',
    color: 'خشب الأرز / المسك الأبيض',
    note: 'خشب أرز نقي ومسك ناعم يستقران برقة بالقرب من البشرة.',
  },
  m05: {
    material: 'أحمر خدود كريمي / 7 غ',
    color: 'خوخي دافئ',
    note: 'لون خوخي منعش يمنح البشرة إشراقة طبيعية بلا تكلّف.',
  },
  a03: {
    material: 'فضة مطلية بالذهب',
    color: 'ذهبي ساتان',
    note: 'أقراط متدلية تلتقط الضوء بتصميم راقٍ وحركة انسيابية.',
  },
  m06: {
    material: 'أحمر شفاه ساتان / 3.5 غ',
    color: 'برقوقي هادئ',
    note: 'درجة برقوقية هادئة تمنح الشفاه عمقًا وتبقى سهلة للاستخدام اليومي.',
  },
};

const getProductCopy = (product: Product, language: Language) =>
  language === 'ar' ? arabicProductCopy[product.id] ?? product : product;

const money = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

function BrandName({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`brand-name inline-flex items-center whitespace-nowrap ${compact ? 'gap-1.5 text-[27px] sm:gap-2 sm:text-[34px]' : 'gap-2 text-3xl sm:text-4xl'}`}
      dir="ltr"
      aria-label="Eleganza إليغانزا"
    >
      <span className="brand-name-en">Eleganza</span>
      <span className="brand-name-ornament" aria-hidden="true">✦</span>
      <span className="brand-name-ar" dir="rtl">
        <span>إليغانزا</span>
        <span className="brand-name-ar-marks" aria-hidden="true">
          <i /><i /><i /><i /><i />
        </span>
      </span>
    </span>
  );
}

function Header({
  bagCount,
  language,
  c,
  onBag,
  onSearch,
  onMenu,
  onLanguageChange,
}: {
  bagCount: number;
  language: Language;
  c: Copy;
  onBag: () => void;
  onSearch: () => void;
  onMenu: () => void;
  onLanguageChange: (language: Language) => void;
}) {
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <header className="absolute left-0 right-0 top-0 z-30 text-[#f7f0e6]">
      <div className="mx-auto grid max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-5 py-5 sm:px-8 lg:grid-cols-[260px_1fr_260px] lg:px-12">
        <button className="flex items-center gap-2 justify-self-start lg:hidden" onClick={onMenu} aria-label={c.openMenu} data-testid="button-open-menu">
          <Menu size={19} strokeWidth={1.5} />
          <span className="hidden font-mono-ui text-[10px] uppercase tracking-[.22em] sm:inline">{c.menu}</span>
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
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="justify-self-center leading-none" data-testid="link-home">
          <BrandName compact />
        </button>
        <div className="flex items-center justify-end gap-2 justify-self-end sm:gap-4 lg:w-[260px]">
          <button aria-label={c.search} onClick={onSearch} className="transition-opacity hover:opacity-60" data-testid="button-open-search">
            <Search size={19} strokeWidth={1.4} />
          </button>
          <button aria-label={c.openBag} onClick={onBag} className="group flex items-center gap-2 transition-opacity hover:opacity-60" data-testid="button-open-bag">
            <ShoppingBag size={19} strokeWidth={1.4} />
            <span className="hidden font-mono-ui text-[10px] uppercase tracking-[.18em] sm:inline">
              {c.bag} <span className="opacity-60">({String(bagCount).padStart(2, '0')})</span>
            </span>
          </button>
          <details className="group relative border-s border-white/30 ps-2 sm:ps-4">
            <summary aria-label={c.ariaLanguage} className="flex cursor-pointer list-none items-center gap-1 font-mono-ui text-[9px] uppercase tracking-[.08em] transition-opacity hover:opacity-60 [&::-webkit-details-marker]:hidden sm:text-[10px] sm:tracking-[.12em]" data-testid="button-language-toggle">
              <span>{language === 'ar' ? 'AR' : 'EN'}</span>
              <ChevronDown size={12} strokeWidth={1.5} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="absolute end-0 top-full mt-3 min-w-[145px] border border-[#ded0c3] bg-[#f8f0e6] py-1 text-[#312b25] shadow-[0_12px_35px_rgba(31,24,20,.18)]">
              {([
                ['ar', 'AR'],
                ['en', 'EN'],
              ] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={(event) => {
                    onLanguageChange(value);
                    event.currentTarget.closest('details')?.removeAttribute('open');
                  }}
                  className={`flex w-full items-center justify-between px-4 py-3 text-start font-mono-ui text-[10px] tracking-[.1em] transition-colors hover:bg-[#eadbcd] ${language === value ? 'text-[#9f523d]' : ''}`}
                  aria-current={language === value ? 'true' : undefined}
                  data-testid={`language-option-${value}`}
                >
                  <span>{label}</span>
                  {language === value && <span aria-hidden="true">•</span>}
                </button>
              ))}
            </div>
          </details>
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
          <h1 className="arabic-hero-title rise-in rise-in-delay-1 mt-4 max-w-[620px] font-display text-[clamp(4.6rem,10vw,9.6rem)] leading-[.82] tracking-[-.055em]">
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
  const productText = getProductCopy(product, language);

  return (
    <article className="group" data-testid={`card-product-${product.id}`}>
      <div className="image-zoom relative aspect-[4/5] overflow-hidden bg-[#e3dbce]">
        <button onClick={onSelect} className="absolute inset-0 z-10 cursor-pointer" aria-label={`View ${product.name}`} data-testid={`button-view-${product.id}`} />
        <img
          src={product.image960}
          srcSet={`${product.image480} 480w, ${product.image960} 960w`}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
        />
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
            <p className="mt-2 font-mono-ui text-[9px] uppercase tracking-[.14em] text-[#87796d]">{productText.color} / {productText.material}</p>
            <p className="mt-3 max-w-[280px] text-xs leading-5 text-[#786b60]">{productText.note}</p>
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
  const productText = getProductCopy(product, language);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#211b18]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={`${product.name} details`}>
      <div className="relative max-h-[94dvh] w-full max-w-[980px] overflow-auto bg-[#f8f0e6] sm:grid sm:grid-cols-2">
        <button onClick={onClose} className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center bg-[#f8f0e6]/80 text-[#312b25] transition-colors hover:bg-[#f1e4d4]" aria-label={c.close} data-testid="button-close-detail"><X size={18} strokeWidth={1.4} /></button>
        <div className="aspect-[4/4.7] bg-[#ded4c7] sm:aspect-auto">
          <img
            src={product.image960}
            srcSet={`${product.image480} 480w, ${product.image960} 960w, ${product.image} 1024w`}
            sizes="(min-width: 640px) 490px, 100vw"
            alt={product.name}
            decoding="async"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-between p-7 sm:p-12">
          <div>
            <SectionKicker>{categoryLabels[language][product.category]}</SectionKicker>
            <h2 className="arabic-section-title mt-5 font-display text-5xl leading-[.9] tracking-[-.04em] text-[#312b25]">{product.name}</h2>
            <p className="mt-4 font-mono-ui text-sm text-[#6f6358]">{money(product.price)}</p>
            <div className="my-8 h-px bg-[#312b25]/15" />
            <p className="arabic-body-display font-display text-2xl leading-tight text-[#55473c]">{productText.note}</p>
            <dl className="mt-8 space-y-4 border-t border-[#312b25]/15 pt-5 font-mono-ui text-[10px] uppercase tracking-[.13em] text-[#7d6d61]">
              <div className="flex justify-between"><dt>{c.format}</dt><dd className="text-right text-[#312b25]">{productText.material}</dd></div>
              <div className="flex justify-between"><dt>{c.notes}</dt><dd className="text-right text-[#312b25]">{productText.color}</dd></div>
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
  language,
  c,
  onClose,
  onUpdate,
  onRemove,
  onCheckout,
}: {
  items: CartItem[];
  language: Language;
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
              {items.map((item) => {
                const itemText = getProductCopy(item, language);
                return (
                <div key={item.id} className="flex gap-4 border-b border-[#312b25]/12 pb-6" data-testid={`row-bag-${item.id}`}>
                  <img src={item.image480} alt={item.name} width="96" height="112" loading="lazy" decoding="async" className="h-28 w-24 object-cover" />
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2"><div><h3 className="font-display text-2xl leading-none">{item.name}</h3><p className="mt-2 font-mono-ui text-[9px] uppercase tracking-[.1em] text-[#87796d]">{itemText.color}</p></div><button onClick={() => onRemove(item.id)} className="text-[#98887b] hover:text-[#9f523d]" aria-label={`Remove ${item.name}`} data-testid={`button-remove-${item.id}`}><X size={14} /></button></div>
                    <div className="flex items-end justify-between"><div className="flex items-center border border-[#312b25]/20"><button className="grid h-7 w-7 place-items-center hover:bg-[#efe2d3]" onClick={() => onUpdate(item.id, -1)} aria-label={`Decrease ${item.name}`} data-testid={`button-decrease-${item.id}`}><Minus size={12} /></button><span className="w-7 text-center font-mono-ui text-[10px]" data-testid={`text-quantity-${item.id}`}>{item.quantity}</span><button className="grid h-7 w-7 place-items-center hover:bg-[#efe2d3]" onClick={() => onUpdate(item.id, 1)} aria-label={`Increase ${item.name}`} data-testid={`button-increase-${item.id}`}><Plus size={12} /></button></div><span className="font-mono-ui text-xs">{money(item.price * item.quantity)}</span></div>
                  </div>
                </div>
                );
              })}
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
  const results = catalog.filter((product) => {
    const productText = getProductCopy(product, language);
    return `${product.name} ${categoryLabels[language][product.category]} ${productText.material} ${productText.color} ${productText.note}`.toLowerCase().includes(query.toLowerCase());
  });
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

function ArticleReader({ article, onClose, c }: { article: Article; onClose: () => void; c: Copy }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f8f0e6] text-[#312b25]" role="dialog" aria-modal="true" aria-label={article.title}>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#312b25]/15 bg-[#f8f0e6]/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-12">
        <BrandName compact />
        <button onClick={onClose} className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.15em]" aria-label={c.close} data-testid="button-close-article">
          {c.close} <X size={18} strokeWidth={1.3} />
        </button>
      </div>
      <article className="mx-auto max-w-[1120px] px-5 pb-20 pt-10 sm:px-8 sm:pt-16 lg:px-12">
        <div className="mx-auto max-w-[780px] text-center">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-[#9f523d]">{article.category} / {article.date}</p>
          <h1 className="arabic-feature-title mt-5 font-display text-[clamp(2.8rem,6vw,5.7rem)] leading-[.95] tracking-[-.04em]">{article.title}</h1>
          <p className="mx-auto mt-7 max-w-[650px] text-base leading-8 text-[#706258] sm:text-lg">{article.introduction}</p>
        </div>
        <img src={article.image} alt="" className="mt-12 aspect-[16/8] w-full object-cover sm:mt-16" />
        <div className="mx-auto mt-12 max-w-[680px] sm:mt-16">
          {article.sections.map((section, index) => (
            <section key={section.heading} className={index === 0 ? '' : 'mt-12 border-t border-[#312b25]/12 pt-12'}>
              <p className="font-mono-ui text-[9px] tracking-[.16em] text-[#a85a43]">{String(index + 1).padStart(2, '0')}</p>
              <h2 className="arabic-article-title mt-3 font-display text-3xl leading-tight sm:text-4xl">{section.heading}</h2>
              <p className="mt-5 text-[15px] leading-8 text-[#66594f] sm:text-base">{section.body}</p>
            </section>
          ))}
          <blockquote className="arabic-body-display mt-14 border-y border-[#312b25]/15 py-10 text-center font-display text-3xl leading-snug text-[#9f523d] sm:text-4xl">
            {article.closing}
          </blockquote>
          <button onClick={onClose} className="mx-auto mt-10 flex items-center gap-3 border-b border-[#312b25]/50 pb-2 font-mono-ui text-[10px] uppercase tracking-[.16em]" data-testid="button-back-from-article">
            <ArrowLeft size={15} /> {c.journal}
          </button>
        </div>
      </article>
    </div>
  );
}

function JournalIndex({ entries, onClose, onSelect, c }: { entries: Article[]; onClose: () => void; onSelect: (id: ArticleId) => void; c: Copy }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#f8f0e6] text-[#312b25]" role="dialog" aria-modal="true" aria-label={c.journal}>
      <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#312b25]/15 bg-[#f8f0e6]/95 px-5 py-4 backdrop-blur sm:px-8 lg:px-12">
        <BrandName compact />
        <button onClick={onClose} className="flex items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.15em]" aria-label={c.close} data-testid="button-close-journal-index">
          {c.close} <X size={18} strokeWidth={1.3} />
        </button>
      </div>
      <section className="mx-auto max-w-[1440px] px-5 pb-20 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <SectionKicker>{c.theJournal}</SectionKicker>
        <h1 className="arabic-section-title mt-4 font-display text-5xl leading-none tracking-[-.04em] sm:text-7xl">{c.journalTitle}</h1>
        <div className="mt-12 grid gap-x-7 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <button key={entry.id} onClick={() => onSelect(entry.id)} className="group min-w-0 text-start" data-testid={`journal-index-${entry.id}`}>
              <div className="image-zoom aspect-[4/3] overflow-hidden bg-[#d3c4b4]">
                <img src={entry.image} alt="" className="h-full w-full object-cover" />
              </div>
              <p className="mt-5 font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#9f523d]">{entry.category} / {entry.date}</p>
              <h2 className="arabic-article-title mt-3 font-display text-3xl leading-[1.05] transition-colors group-hover:text-[#9f523d]">{entry.title}</h2>
              <p className="mt-4 line-clamp-3 text-sm leading-7 text-[#706258]">{entry.introduction}</p>
              <span className="mt-5 flex items-center gap-2 font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#98887a]">{c.readStory} <ArrowRight size={13} /></span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const requestedLanguage = new URLSearchParams(window.location.search).get('lang');
    if (requestedLanguage === 'ar' || requestedLanguage === 'en') return requestedLanguage;
    const savedLanguage = window.localStorage.getItem('eleganza-language');
    return savedLanguage === 'ar' ? 'ar' : 'en';
  });
  const [activeFilter, setActiveFilter] = useState<Category>('All');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bag, setBag] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [journalIndexOpen, setJournalIndexOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState<ArticleId | null>(null);
  const [notice, setNotice] = useState('');
  const c = copy[language];
  const selectedArticle = articles[language].find((article) => article.id === selectedArticleId) ?? null;

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    window.localStorage.setItem('eleganza-language', language);
  }, [language]);

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
    <div className={`grain min-h-[100dvh] bg-[#f8f0e6] text-[#312b25] ${language === 'ar' ? 'rtl-ui' : ''}`}>
      <section className="relative">
        <Header bagCount={bagCount} language={language} c={c} onBag={() => setBagOpen(true)} onSearch={() => setSearchOpen(true)} onMenu={() => setMenuOpen(true)} onLanguageChange={setLanguage} />
        <Hero onShop={jumpToShop} c={c} />
      </section>

      {menuOpen && <div className="fixed inset-0 z-40 bg-[#f8f0e6] p-6 text-[#312b25] lg:hidden"><div className="flex items-center justify-between"><BrandName /><button onClick={() => setMenuOpen(false)} aria-label={c.close} data-testid="button-close-menu"><X size={21} /></button></div><nav className="mt-20 flex flex-col gap-6 font-display text-6xl"><button className="text-left" onClick={() => { setMenuOpen(false); jumpToShop(); }} data-testid="mobile-link-shop">{c.shop}</button><button className="text-left" onClick={() => { setMenuOpen(false); document.getElementById('journal')?.scrollIntoView({ behavior: 'smooth' }); }} data-testid="mobile-link-journal">{c.journal}</button><button className="text-left" onClick={() => { setMenuOpen(false); document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }); }} data-testid="mobile-link-about">{c.about}</button></nav></div>}

      <main>
        <section id="shop" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="flex flex-col justify-between gap-8 sm:flex-row sm:items-end">
            <div><SectionKicker>{c.selectedForNow}</SectionKicker><h2 className="arabic-section-title mt-4 max-w-[500px] font-display text-5xl leading-[.9] tracking-[-.04em] sm:text-7xl">{c.essentials}</h2></div>
            <p className="max-w-[250px] text-sm leading-6 text-[#77695e]">{c.essentialsDescription}</p>
          </div>
          <div className="mt-14 flex items-center justify-between border-y border-[#312b25]/15 py-4">
            <div className="no-scrollbar flex gap-6 overflow-auto">{filters.map((filter) => <button key={filter} onClick={() => setActiveFilter(filter)} className={`whitespace-nowrap font-mono-ui text-[10px] uppercase tracking-[.16em] transition-colors ${activeFilter === filter ? 'text-[#9f523d]' : 'text-[#88796c] hover:text-[#312b25]'}`} data-testid={`button-filter-${filter.toLowerCase().replace(' ', '-')}`}>{categoryLabels[language][filter]}</button>)}</div>
            <span className="hidden font-mono-ui text-[10px] uppercase tracking-[.14em] text-[#9b8b7e] sm:block">{String(shownProducts.length).padStart(2, '0')} / {String(products.length).padStart(2, '0')}</span>
          </div>
          <div className="mt-8 grid gap-x-5 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">{shownProducts.map((product) => <ProductCard key={product.id} product={product} language={language} c={c} favorite={favorites.includes(product.id)} onFavorite={() => toggleFavorite(product.id)} onSelect={() => setSelectedProduct(product)} onAdd={() => addToBag(product)} />)}</div>
        </section>

        <section id="about" className="bg-[#273b39] text-[#f5ede2]">
          <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[1.15fr_.85fr]">
             <div className="flex min-h-[530px] flex-col justify-between px-5 py-14 sm:px-8 sm:py-20 lg:px-12"><SectionKicker dark>{c.ourPointOfView}</SectionKicker><div><p className="arabic-feature-title max-w-[680px] font-display text-[clamp(3rem,6vw,6rem)] leading-[.88] tracking-[-.045em]">{c.aboutTitle}</p><p className="mt-8 max-w-[360px] text-sm leading-6 text-[#d6d2c8]/70">{c.aboutDescription}</p></div><button onClick={() => notify(language === 'ar' ? 'ملاحظات الاستوديو ستتوفر قريبًا' : 'Our studio notes are coming soon')} className="flex w-fit items-center gap-3 border-b border-[#d6d2c8]/50 pb-2 font-mono-ui text-[10px] uppercase tracking-[.18em] hover:border-[#d18c6d] hover:text-[#d18c6d]" data-testid="button-read-about">{c.readNotes} <ArrowRight size={15} strokeWidth={1.3} /></button></div>
            <div className="relative min-h-[390px] overflow-hidden bg-[#b87555] lg:min-h-0"><img src={makeupImage} alt="Rose cream blush in warm editorial light" className="h-full w-full object-cover mix-blend-multiply opacity-80" /><div className="absolute inset-0 bg-[#b87555]/30" /><div className="absolute bottom-8 left-8 font-mono-ui text-[9px] uppercase tracking-[.2em] text-[#f5ede2]/80">{c.beautyStudy}</div></div>
          </div>
        </section>

        <section id="journal" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
           <div className="flex items-end justify-between"><div><SectionKicker>{c.theJournal}</SectionKicker><h2 className="arabic-section-title mt-4 font-display text-5xl leading-none tracking-[-.04em] sm:text-7xl">{c.journalTitle}</h2></div><button onClick={() => setJournalIndexOpen(true)} className="hidden items-center gap-2 font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#9f523d] sm:flex" data-testid="button-view-journal">{c.viewAll} <ArrowRight size={15} /></button></div>
          <div className="mt-12 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)] lg:gap-8">
              <button onClick={() => setSelectedArticleId('ritual')} className="group min-w-0 text-start" data-testid="article-everyday"><div className="image-zoom relative aspect-[1.7/1] overflow-hidden bg-[#d3c4b4]"><img src={heroImage} alt="Eleganza beauty ritual in warm light" className="h-full w-full object-cover grayscale-[.1]" /><span className="absolute bottom-5 start-5 bg-[#f8f0e6] px-3 py-2 font-mono-ui text-[9px] uppercase tracking-[.15em]">{c.fieldNotes}</span></div><h3 className="arabic-article-title mt-5 max-w-[620px] font-display text-4xl leading-[.98] transition-colors group-hover:text-[#9f523d] lg:text-[2.65rem]">{c.ritualArticle}</h3><span className="mt-4 flex items-center gap-2 font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#98887a]">{c.readStory} <ArrowRight size={13} /></span></button>
            <div className="flex min-w-0 flex-col border-t border-[#312b25]/15 pt-6 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
                <button onClick={() => setSelectedArticleId('scent')} className="group min-w-0 pb-7 text-start lg:flex-1" data-testid="article-room"><p className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#9f523d]">{language === 'ar' ? 'عطور / 02' : 'Scent / 02'}</p><h3 className="arabic-article-title mt-3 font-display text-2xl leading-[1.05] group-hover:text-[#9f523d] xl:text-3xl">{c.scentArticle}</h3><span className="mt-4 flex items-center gap-2 font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#98887a]">{c.readStory} <ArrowRight size={13} /></span></button>
                <button onClick={() => setSelectedArticleId('five-minute-face')} className="group min-w-0 border-t border-[#312b25]/15 pt-7 text-start lg:flex-1" data-testid="article-form"><p className="font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#9f523d]">{language === 'ar' ? 'في التطبيق / 03' : 'In practice / 03'}</p><h3 className="arabic-article-title mt-3 font-display text-2xl leading-[1.05] group-hover:text-[#9f523d] xl:text-3xl">{c.faceArticle}</h3><span className="mt-4 flex items-center gap-2 font-mono-ui text-[9px] uppercase tracking-[.15em] text-[#98887a]">{c.readStory} <ArrowRight size={13} /></span></button>
            </div>
          </div>
        </section>

        <section className="border-y border-[#312b25]/15 bg-[#ece1d2]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-14 sm:px-8 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-12">
             <div><SectionKicker>{c.slowerInbox}</SectionKicker><h2 className="arabic-section-title mt-3 font-display text-4xl leading-none sm:text-5xl">{c.inboxTitle}</h2></div>
            <form className="flex w-full max-w-[420px] border-b border-[#312b25]/45 py-3" onSubmit={(event) => { event.preventDefault(); notify(language === 'ar' ? 'تم اشتراكك. شكرًا لك.' : 'You’re on the list. Thank you.'); }}><input type="email" required placeholder={c.email} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#8b7c70]" data-testid="input-newsletter" /><button className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-[#9f523d]" data-testid="button-subscribe">{c.subscribe}</button></form>
          </div>
        </section>
      </main>

      <footer className="bg-[#312b25] text-[#f5ede2]">
        <div className="mx-auto max-w-[1440px] px-5 py-14 sm:px-8 sm:py-18 lg:px-12">
          <div className="flex flex-col justify-between gap-12 lg:flex-row"><div><p className="font-display text-6xl tracking-[-.05em]">Eleganza</p><p className="mt-4 max-w-[220px] text-sm leading-6 text-[#e2d6ca]/65">{c.footerDescription}</p></div><div className="grid grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-4 lg:gap-x-14"><div><p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-[#d18c6d]">{c.explore}</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#e2d6ca]/70"><button className="text-left hover:text-[#fff8ed]" onClick={jumpToShop} data-testid="footer-shop">{c.shop}</button><button className="text-left hover:text-[#fff8ed]" onClick={() => document.getElementById('journal')?.scrollIntoView({ behavior: 'smooth' })} data-testid="footer-journal">{c.journal}</button></div></div><div><p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-[#d18c6d]">{c.help}</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#e2d6ca]/70"><button className="text-left hover:text-[#fff8ed]" onClick={() => notify(language === 'ar' ? 'سنتواصل معك قريبًا' : 'We’ll be in touch shortly')} data-testid="footer-contact">{c.contact}</button><button className="text-left hover:text-[#fff8ed]" onClick={() => notify(c.freeShipping)} data-testid="footer-shipping">{c.shipping}</button></div></div><div><p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-[#d18c6d]">{language === 'ar' ? 'اتصل بنا' : 'Call us'}</p><a href="tel:+218939999901" dir="ltr" className="mt-4 block w-fit whitespace-nowrap text-sm text-[#e2d6ca]/70 transition-colors hover:text-[#fff8ed]">+218 93 999 9901</a></div><div><p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-[#d18c6d]">{c.follow}</p><div className="mt-4 flex flex-col gap-3 text-sm text-[#e2d6ca]/70"><button className="w-fit" onClick={() => notify(language === 'ar' ? 'إنستغرام قريبًا' : 'Instagram is coming soon')} data-testid="footer-instagram">Instagram</button><button className="w-fit" onClick={() => notify(language === 'ar' ? 'بنترست قريبًا' : 'Pinterest is coming soon')} data-testid="footer-pinterest">Pinterest</button></div></div></div></div>
          <div className="mt-16 flex flex-col justify-between gap-3 border-t border-[#f5ede2]/15 pt-5 font-mono-ui text-[9px] uppercase tracking-[.16em] text-[#e2d6ca]/45 sm:flex-row"><span>© 2024 Eleganza Studio</span><span>{c.madeInLondon}</span></div>
        </div>
      </footer>

      {notice && <div className="fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 bg-[#312b25] px-5 py-3 font-mono-ui text-[10px] uppercase tracking-[.12em] text-[#f8f0e6] shadow-xl" role="status" data-testid="status-notice"><Sparkles size={13} className="mr-2 inline-block text-[#d18c6d]" />{notice}</div>}
      {bagOpen && <BagDrawer items={bag} language={language} c={c} onClose={() => setBagOpen(false)} onUpdate={updateQuantity} onRemove={(id) => setBag((current) => current.filter((item) => item.id !== id))} onCheckout={() => notify(language === 'ar' ? 'يتم تجهيز صفحة الدفع لك' : 'Checkout is being prepared for you')} />}
      {searchOpen && <SearchPanel products={products} c={c} language={language} onClose={() => setSearchOpen(false)} onSelect={(product) => { setSearchOpen(false); setSelectedProduct(product); }} />}
      {selectedProduct && <ProductDetail product={selectedProduct} language={language} c={c} favorite={favorites.includes(selectedProduct.id)} onFavorite={() => toggleFavorite(selectedProduct.id)} onAdd={() => { addToBag(selectedProduct); setSelectedProduct(null); }} onClose={() => setSelectedProduct(null)} />}
      {journalIndexOpen && !selectedArticle && <JournalIndex entries={articles[language]} c={c} onClose={() => setJournalIndexOpen(false)} onSelect={setSelectedArticleId} />}
      {selectedArticle && <ArticleReader article={selectedArticle} c={c} onClose={() => setSelectedArticleId(null)} />}
    </div>
  );
}

export default App;
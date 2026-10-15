import { useState } from 'react';
import './_group.css';
import './_editorial.css';

type Product = {
  id: string;
  nameEn: string;
  nameAr?: string;
  salePriceMinor: number;
  image?: string;
  category: string;
  stock: number;
  description: string;
};

const products: Product[] = [
  {
    id: 'p02',
    nameEn: 'Amber Reverie',
    salePriceMinor: 16800,
    image: '/__mockup/images/eleganza/amber-reverie.jpg',
    category: 'عطور',
    stock: 18,
    description: 'عبير عنبري غني تلطفه نفحات الفانيليا الناعمة.',
  },
  {
    id: 'm05',
    nameEn: 'Dawn Flush',
    salePriceMinor: 4600,
    image: '/__mockup/images/eleganza/dawn-flush.jpg',
    category: 'مكياج',
    stock: 8,
    description: 'لون خوخي منعش يمنح البشرة إشراقة طبيعية بلا تكلّف.',
  },
  {
    id: 'p01',
    nameEn: 'Santal No. 03',
    salePriceMinor: 14500,
    category: 'عطور',
    stock: 12,
    description: 'عطر دافئ بجاذبية هادئة، يترك أثرًا مميزًا يدوم طويلًا.',
  },
  {
    id: 'm01',
    nameEn: 'Rose Veil',
    salePriceMinor: 4800,
    category: 'مكياج',
    stock: 7,
    description: 'لمسة وردية شفافة تبدو كلون بشرتك الطبيعي، ولكن بنعومة أجمل.',
  },
];

const formatPrice = (minorUnits: number) =>
  `${new Intl.NumberFormat('ar-LY', { maximumFractionDigits: 2 }).format(minorUnits / 100)} د.ل`;

function EditorialIcon({ name }: { name: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.55, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'home') return <svg aria-hidden="true" viewBox="0 0 24 24" {...common}><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></svg>;
  if (name === 'heart') return <svg aria-hidden="true" viewBox="0 0 24 24" {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>;
  if (name === 'bag') return <svg aria-hidden="true" viewBox="0 0 24 24" {...common}><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" {...common}><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></svg>;
}

export function Editorial() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bagCount, setBagCount] = useState(0);
  const [activeTab, setActiveTab] = useState('المتجر');
  const [selected, setSelected] = useState<Product | null>(null);
  const toggleFavorite = (id: string) =>
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const addToBag = () => setBagCount((count) => count + 1);

  return (
    <main className="eleganza-editorial">
      <div className="ed-page">
        <div className="ed-scroll">
          <header className="ed-header" dir="rtl">
            <div>
              <div className="ed-wordmark">Eleganza</div>
              <div className="ed-header-note">الجمال يبدأ من هنا</div>
            </div>
            <span className="ed-edition">BEAUTY / 01</span>
          </header>

          <section className="ed-hero" aria-label="اختاري ما يشبهك">
            <img className="ed-hero-image" src="/__mockup/images/eleganza/beauty-hero.jpg" alt="" />
            <span className="ed-hero-index">ELEGANZA — ATELIER</span>
            <div className="ed-hero-caption" dir="rtl">
              <div className="ed-kicker">مختارات هذا الموسم</div>
              <h1 className="ed-hero-title">اختاري ما يشبهك</h1>
              <p className="ed-hero-subtitle">عطور وجمال مختارة بعناية</p>
            </div>
          </section>

          <section className="ed-intro" dir="rtl">
            <div className="ed-intro-copy">
              <h2>اكتشفي المتجر</h2>
              <p>منتجاتنا المتوفرة الآن</p>
            </div>
            <span className="ed-count">0{products.length} / EDITION</span>
          </section>

          <section className="ed-product-grid" dir="rtl" aria-label="منتجات المتجر">
            {products.map((product, index) => {
              const isFavorite = favorites.includes(product.id);
              return (
                <article className="ed-card" key={product.id}>
                  <button className="ed-product-open" type="button" aria-label={`تفاصيل ${product.nameAr || product.nameEn}`} onClick={() => setSelected(product)}>
                    <span className="ed-image-wrap">
                      {product.image
                        ? <img className="ed-product-image" src={product.image} alt={product.nameAr || product.nameEn} />
                        : <span className="ed-product-image ed-no-image" aria-label="Eleganza">Eleganza</span>}
                      <span className="ed-image-number">0{index + 1}</span>
                    </span>
                    <span className="ed-product-name">{product.nameAr || product.nameEn}</span>
                    <span className="ed-price">{formatPrice(product.salePriceMinor)}</span>
                  </button>
                  <div className="ed-card-actions">
                    <button className="ed-add" type="button" onClick={addToBag}>أضف للسلة</button>
                    <button className={`ed-favorite${isFavorite ? ' is-favorite' : ''}`} type="button" aria-label={isFavorite ? 'إزالة من المفضلة' : 'حفظ في المفضلة'} aria-pressed={isFavorite} onClick={() => toggleFavorite(product.id)}>
                      {isFavorite ? '♥' : '♡'}
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </div>

        <nav className="ed-tabs" dir="rtl" aria-label="التنقل الرئيسي">
          {[
            { title: 'المتجر', icon: 'home' },
            { title: 'المفضلة', icon: 'heart' },
            { title: 'السلة', icon: 'bag' },
            { title: 'حسابي', icon: 'user' },
          ].map(({ title, icon }) => {
            const active = activeTab === title;
            return (
              <button className={`ed-tab${active ? ' is-active' : ''}`} type="button" key={title} onClick={() => setActiveTab(title)} aria-current={active ? 'page' : undefined}>
                <span className="ed-tab-icon"><EditorialIcon name={icon} />{title === 'السلة' && bagCount > 0 && <i className="ed-bag-count">{bagCount}</i>}</span>
                <span>{title}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {selected && (
        <div className="ed-backdrop" onClick={() => setSelected(null)}>
          <section className="ed-sheet" role="dialog" aria-modal="true" aria-label="تفاصيل المنتج" onClick={(event) => event.stopPropagation()}>
            <header className="ed-sheet-head" dir="rtl">
              <h2>تفاصيل المنتج</h2>
              <button className="ed-close" type="button" aria-label="إغلاق" onClick={() => setSelected(null)}>×</button>
            </header>
            <div className="ed-detail-content" dir="rtl">
              {selected.image ? <img className="ed-detail-image" src={selected.image} alt={selected.nameAr || selected.nameEn} /> : null}
              <p className="ed-detail-category">{selected.category}</p>
              <h3 className="ed-detail-name">{selected.nameAr || selected.nameEn}</h3>
              <p className="ed-detail-price">{formatPrice(selected.salePriceMinor)}</p>
              <p className="ed-detail-description">{selected.description}</p>
              <div className="ed-detail-facts">
                <div><span>الفئة</span><span>{selected.category}</span></div>
                <div><span>المخزون</span><span>{selected.stock} قطعة</span></div>
                <div><span>التوصيل</span><span>خلال 2–3 أيام</span></div>
              </div>
              <div className="ed-detail-actions">
                <button className="ed-add" type="button" onClick={addToBag}>أضف للسلة</button>
                <button className="ed-detail-favorite" type="button" aria-label={favorites.includes(selected.id) ? 'إزالة من المفضلة' : 'حفظ في المفضلة'} aria-pressed={favorites.includes(selected.id)} onClick={() => toggleFavorite(selected.id)}>
                  {favorites.includes(selected.id) ? '♥' : '♡'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

import { useState } from 'react';
import './_group.css';

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

function Icon({ name, active = false }: { name: string; active?: boolean }) {
  const paths: Record<string, React.ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-7h6v7" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />,
    bag: <><path d="M5 8h14l1 13H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill={active && name === 'heart' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function Current() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [bagCount, setBagCount] = useState(0);
  const [activeTab, setActiveTab] = useState('المتجر');
  const [selected, setSelected] = useState<Product | null>(null);

  const toggleFavorite = (id: string) =>
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const addToBag = () => setBagCount((count) => count + 1);

  return (
    <main className="eleganza-current">
      <div className="el-page">
        <div className="el-scroll">
          <header className="el-header">
            <div className="el-brand el-serif">Eleganza</div>
            <div className="el-tagline">الجمال يبدأ من هنا</div>
          </header>
          <section className="el-hero">
            <img src="/__mockup/images/eleganza/beauty-hero.jpg" alt="" />
            <div className="el-caption">
              <h1 className="el-serif">اختاري ما يشبهك</h1>
              <p>عطور وجمال مختارة بعناية</p>
            </div>
          </section>
          <section className="el-section-title">
            <h2 className="el-serif">اكتشفي المتجر</h2>
            <p>منتجاتنا المتوفرة الآن</p>
          </section>
          <div className="el-grid" dir="rtl">
            {products.map((product) => {
              const isFavorite = favorites.includes(product.id);
              return (
                <article className="el-card" key={product.id}>
                  <button className="el-product-open" type="button" aria-label={`تفاصيل ${product.nameAr || product.nameEn}`} onClick={() => setSelected(product)}>
                    {product.image
                      ? <img className="el-product-image" src={product.image} alt={product.nameAr || product.nameEn} />
                      : <div className="el-product-image el-no-image">Eleganza</div>}
                    <span className="el-product-name el-serif">{product.nameAr || product.nameEn}</span>
                    <span className="el-price">{formatPrice(product.salePriceMinor)}</span>
                  </button>
                  <button className="el-favorite" type="button" aria-label="حفظ في المفضلة" onClick={() => toggleFavorite(product.id)}>
                    <span style={{ color: isFavorite ? 'var(--el-primary)' : 'var(--el-foreground)' }}>{isFavorite ? '♥' : '♡'}</span>
                  </button>
                  <button className="el-add" type="button" onClick={addToBag}>أضف للسلة</button>
                </article>
              );
            })}
          </div>
        </div>
        <nav className="el-tabs" dir="rtl" aria-label="التنقل الرئيسي">
          {[
            { title: 'المتجر', icon: 'home' },
            { title: 'المفضلة', icon: 'heart' },
            { title: 'السلة', icon: 'bag' },
            { title: 'حسابي', icon: 'user' },
          ].map(({ title, icon }) => {
            const active = activeTab === title;
            return (
              <button className={`el-tab${active ? ' is-active' : ''}`} type="button" key={title} onClick={() => setActiveTab(title)}>
                <span className="el-tab-icon"><Icon name={icon} active={active} />{title === 'السلة' && bagCount > 0 && <i>{bagCount}</i>}</span>
                <span>{title}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {selected && (
        <div className="el-modal-backdrop" onClick={() => setSelected(null)}>
          <section className="el-detail-sheet" role="dialog" aria-modal="true" aria-label="تفاصيل المنتج" onClick={(event) => event.stopPropagation()}>
            <header className="el-detail-header">
              <h2 className="el-serif">تفاصيل المنتج</h2>
              <button className="el-close" type="button" aria-label="إغلاق" onClick={() => setSelected(null)}>×</button>
            </header>
            <div className="el-detail-content" dir="rtl">
              {selected.image ? <img className="el-detail-image" src={selected.image} alt={selected.nameAr || selected.nameEn} /> : null}
              <p className="el-detail-category">{selected.category}</p>
              <h3 className="el-detail-name el-serif">{selected.nameAr || selected.nameEn}</h3>
              <p className="el-detail-price">{formatPrice(selected.salePriceMinor)}</p>
              <p className="el-detail-description">{selected.description}</p>
              <div className="el-detail-facts">
                <div><span>الفئة</span><span>{selected.category}</span></div>
                <div><span>المخزون</span><span>{selected.stock} قطعة</span></div>
                <div><span>التوصيل</span><span>خلال 2–3 أيام</span></div>
              </div>
              <div className="el-detail-actions">
                <button className="el-add" type="button" onClick={addToBag}>أضف للسلة</button>
                <button className="el-detail-favorite" type="button" aria-label="حفظ في المفضلة" onClick={() => toggleFavorite(selected.id)}>
                  {favorites.includes(selected.id) ? '♥' : '♡'}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
      <style>{`
        .el-page{width:100%;max-width:480px;height:100dvh;min-height:620px;margin:0 auto;position:relative;display:flex;flex-direction:column;overflow:hidden;background:var(--el-background)}
        .el-scroll{overflow:auto;flex:1;scrollbar-width:none;padding-bottom:110px}.el-scroll::-webkit-scrollbar{display:none}
        .el-header{padding:18px 22px 14px;display:flex;flex-direction:column;align-items:flex-end}
        .el-brand{font-size:34px;line-height:1.15}.el-tagline{font-size:14px;color:var(--el-muted-foreground)}
        .el-hero{height:228px;margin:0 16px;position:relative;display:flex;align-items:flex-end;overflow:hidden}
        .el-hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.86}
        .el-caption{position:relative;width:100%;padding:16px;text-align:right;background:var(--el-foreground);color:var(--el-background)}
        .el-caption h1{font-size:26px;line-height:1.2;font-weight:400;margin:0}.el-caption p{font-size:14px;margin:4px 0 0}
        .el-section-title{padding:22px 18px 0;text-align:right;display:flex;flex-direction:column;gap:4px}
        .el-section-title h2{font-size:25px;line-height:1.25;font-weight:400;margin:0}.el-section-title p{font-size:14px;color:var(--el-muted-foreground);margin:0}
        .el-grid{padding:12px 16px 0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));column-gap:12px;align-items:stretch}
        .el-card{min-width:0;position:relative;margin-bottom:14px;padding-bottom:12px;border:1px solid var(--el-border);background:var(--el-card);overflow:hidden}
        .el-product-open{display:flex;width:100%;padding:0;border:0;background:transparent;color:inherit;text-align:initial;flex-direction:column;cursor:pointer}
        .el-product-image{display:block;width:100%;height:172px;object-fit:cover}
        .el-no-image{display:flex;align-items:center;justify-content:center;background:var(--el-secondary);color:var(--el-muted-foreground)}
        .el-product-name{font-size:18px;line-height:1.3;text-align:right;margin:10px 10px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;width:calc(100% - 20px)}
        .el-price{font-size:14px;color:var(--el-primary);text-align:right;margin:4px 10px 0}
        .el-favorite{position:absolute;top:9px;right:9px;width:36px;height:36px;display:grid;place-items:center;padding:0;border:0;background:var(--el-background);cursor:pointer;font-size:20px}
        .el-add{min-height:40px;margin:10px 10px 0;width:calc(100% - 20px);display:flex;align-items:center;justify-content:center;border:0;border-radius:0;background:var(--el-primary);color:var(--el-primary-foreground);font-size:14px;cursor:pointer}
        .el-tabs{position:absolute;bottom:0;left:0;right:0;display:flex;height:64px;background:var(--el-background);padding-bottom:env(safe-area-inset-bottom);color:var(--el-muted-foreground)}
        .el-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border:0;padding:3px;background:transparent;color:inherit;font-size:12px;cursor:pointer}
        .el-tab.is-active{color:var(--el-primary)}.el-tab-icon{position:relative;display:grid;place-items:center}.el-tab-icon i{position:absolute;right:-8px;top:-6px;min-width:15px;height:15px;padding:0 3px;border-radius:10px;background:var(--el-primary);color:white;font:10px Arial;display:grid;place-items:center}
        .el-modal-backdrop{position:fixed;z-index:20;inset:0;display:flex;align-items:flex-end;justify-content:center;background:rgba(28,22,18,.56)}
        .el-detail-sheet{width:min(100%,480px);max-height:92dvh;overflow:hidden;background:var(--el-background);border-radius:20px 20px 0 0}
        .el-detail-header{height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 18px;border-bottom:1px solid var(--el-border)}
        .el-detail-header h2{font-size:18px;font-weight:400;margin:0}.el-close{width:36px;height:36px;border:0;border-radius:50%;background:var(--el-secondary);font-size:26px;color:var(--el-foreground);cursor:pointer}
        .el-detail-content{overflow:auto;max-height:calc(92dvh - 58px);padding-bottom:28px}
        .el-detail-image{width:100%;height:280px;object-fit:cover}.el-detail-category{margin:20px 20px 0;font-size:13px;color:var(--el-primary)}
        .el-detail-name{margin:8px 20px 0;font-size:30px;font-weight:400}.el-detail-price{margin:8px 20px 0;font-size:17px;color:var(--el-primary)}
        .el-detail-description{margin:20px 20px 0;font-size:16px;line-height:27px}.el-detail-facts{margin:22px 20px 0;padding:12px 0;border-top:1px solid var(--el-border);border-bottom:1px solid var(--el-border)}
        .el-detail-facts div{display:flex;justify-content:space-between;gap:16px;padding:8px 0;font-size:14px}.el-detail-facts div span:first-child{color:var(--el-muted-foreground);font-size:13px}
        .el-detail-actions{display:flex;gap:10px;margin:20px 20px 0}.el-detail-actions .el-add{flex:1;width:auto;margin:0;min-height:50px;font:16px Georgia,serif}
        .el-detail-favorite{width:52px;min-height:50px;border:1px solid var(--el-border);background:transparent;color:var(--el-primary);font-size:24px;cursor:pointer}
        @media(max-width:350px){.el-product-image{height:150px}.el-product-name{font-size:16px}}
      `}</style>
    </main>
  );
}

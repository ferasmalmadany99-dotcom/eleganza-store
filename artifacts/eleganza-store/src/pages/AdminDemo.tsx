import {
  BarChart3,
  Boxes,
  ClipboardList,
  CreditCard,
  FileText,
  Globe2,
  Package,
  ReceiptText,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";

type DemoTab = "overview" | "products" | "inventory" | "orders" | "expenses" | "team" | "audit";

const demoProducts = [
  { name: "Nocturne Rouge", category: "Fragrance", sku: "ELZ-FR-001", price: "د.ل 185.00", stock: 24, status: "Active" },
  { name: "Dawn Flush", category: "Makeup", sku: "ELZ-MK-002", price: "د.ل 72.00", stock: 8, status: "Active" },
  { name: "Aurelia Drops", category: "Accessories", sku: "ELZ-AC-003", price: "د.ل 240.00", stock: 3, status: "Low stock" },
  { name: "Amber Reverie", category: "Fragrance", sku: "ELZ-FR-004", price: "د.ل 210.00", stock: 18, status: "Active" },
  { name: "Silk Petal", category: "Makeup", sku: "ELZ-MK-005", price: "د.ل 68.00", stock: 0, status: "Out of stock" },
];

const demoOrders = [
  { number: "ELZ-9K3F", customer: "Mariam Al-Saadi", date: "15 Sep 2026 · 10:42", total: "د.ل 257.00", payment: "Cash on delivery", status: "Processing" },
  { number: "ELZ-8B1A", customer: "Noura Khalil", date: "14 Sep 2026 · 18:20", total: "د.ل 185.00", payment: "Electronic", status: "Completed" },
  { number: "ELZ-7D6C", customer: "Samar Ben Ali", date: "14 Sep 2026 · 15:08", total: "د.ل 312.00", payment: "Cash on delivery", status: "Pending" },
  { number: "ELZ-5A2E", customer: "Lina Hamad", date: "13 Sep 2026 · 11:35", total: "د.ل 72.00", payment: "Shopify", status: "Confirmed" },
];

const demoExpenses = [
  { description: "Packaging materials", category: "Operations", date: "15 Sep 2026", amount: "د.ل 420.00" },
  { description: "Local delivery partner", category: "Delivery", date: "14 Sep 2026", amount: "د.ل 310.00" },
  { description: "Editorial shoot props", category: "Marketing", date: "12 Sep 2026", amount: "د.ل 860.00" },
];

const navItems: { tab: DemoTab; label: string; arabic: string; icon: typeof BarChart3 }[] = [
  { tab: "overview", label: "Overview", arabic: "نظرة عامة", icon: BarChart3 },
  { tab: "products", label: "Products", arabic: "المنتجات", icon: Package },
  { tab: "inventory", label: "Inventory", arabic: "المخزون", icon: Boxes },
  { tab: "orders", label: "Orders", arabic: "الطلبات", icon: ShoppingBag },
  { tab: "expenses", label: "Expenses", arabic: "المصروفات", icon: ReceiptText },
  { tab: "team", label: "Team", arabic: "الفريق", icon: Users },
  { tab: "audit", label: "Audit log", arabic: "سجل التدقيق", icon: ClipboardList },
];

export default function AdminDemo() {
  const [tab, setTab] = useState<DemoTab>("overview");
  const [arabic, setArabic] = useState(false);
  const [query, setQuery] = useState("");
  const language = arabic ? "ar" : "en";
  const filteredProducts = useMemo(() => demoProducts.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()) || product.sku.toLowerCase().includes(query.toLowerCase())), [query]);
  const title = navItems.find((item) => item.tab === tab)?.[language === "ar" ? "arabic" : "label"] ?? "Overview";

  return (
    <div dir={arabic ? "rtl" : "ltr"} className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 start-0 hidden w-72 border-e border-border bg-card lg:block">
        <div className="flex h-full flex-col p-6">
          <a href="/" className="block">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.24em] text-primary">Eleganza</p>
            <p className="mt-1 font-display text-3xl leading-none">Atelier desk</p>
          </a>
          <div className="mt-8 border-y border-border py-4"><p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">Preview account</p><p className="mt-2 text-sm font-medium">demo@eleganza.local</p><p className="mt-1 font-mono-ui text-[10px] uppercase tracking-[.12em] text-primary">owner · demo</p></div>
          <nav className="mt-6 grid gap-1">{navItems.map((item) => { const Icon = item.icon; return <button key={item.tab} onClick={() => setTab(item.tab)} className={`flex items-center gap-3 px-3 py-3 text-sm transition ${tab === item.tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4" />{language === "ar" ? item.arabic : item.label}</button>; })}</nav>
          <div className="mt-auto grid gap-2"><a href="/" className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Store className="h-4 w-4" />{arabic ? "المتجر العام" : "Public storefront"}</a><button onClick={() => setArabic(!arabic)} className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Globe2 className="h-4 w-4" />{arabic ? "English" : "العربية"}</button></div>
        </div>
      </aside>
      <main className="min-h-screen lg:ps-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-border bg-background/90 px-5 py-3 backdrop-blur lg:px-10"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">Eleganza demo</p><p className="text-xs text-muted-foreground">{arabic ? "نسخة استعراضية — لا يتم حفظ أي تغيير" : "Preview only — no changes are saved"}</p></div><div className="flex items-center gap-3"><span className="hidden border border-primary/30 px-3 py-2 text-[10px] uppercase tracking-[.13em] text-primary sm:inline">{arabic ? "بيانات تجريبية" : "Sample data"}</span><a href="/admin" className="inline-flex h-9 items-center gap-2 border border-border px-3 text-xs font-semibold hover:border-primary hover:text-primary"><CreditCard className="h-3.5 w-3.5" />{arabic ? "الدخول الفعلي" : "Real sign in"}</a></div></header>
        <div className="mx-auto max-w-[1500px] p-5 lg:p-10">
          <div className="mb-8 border border-primary/25 bg-primary/5 px-5 py-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">{arabic ? "نسخة استعراضية مفصلة" : "Detailed demo version"}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{arabic ? "هذه الأرقام والصلاحيات للتجربة البصرية فقط. لوحة الإدارة الفعلية تتطلب تسجيل الدخول لحماية بياناتك." : "These numbers and permissions are for visual exploration only. The live operations desk requires sign-in to protect your data."}</p></div>
          <div className="mb-8"><p className="font-mono-ui text-[10px] uppercase tracking-[.24em] text-primary">{arabic ? "مركز العمليات" : "Operations centre"}</p><h1 className="mt-2 font-display text-5xl leading-none">{title}</h1></div>
          {tab === "overview" && <Overview arabic={arabic} setTab={setTab} />}
          {tab === "products" && <Products arabic={arabic} query={query} setQuery={setQuery} products={filteredProducts} />}
          {tab === "inventory" && <Inventory arabic={arabic} />}
          {tab === "orders" && <Orders arabic={arabic} />}
          {tab === "expenses" && <Expenses arabic={arabic} />}
          {tab === "team" && <Team arabic={arabic} />}
          {tab === "audit" && <Audit arabic={arabic} />}
        </div>
      </main>
    </div>
  );
}

function Overview({ arabic, setTab }: { arabic: boolean; setTab: (tab: DemoTab) => void }) {
  const stats = [{ label: arabic ? "الإيرادات" : "Revenue", value: "د.ل 18,420", note: "+12.4% this month" }, { label: arabic ? "تكلفة البضاعة" : "Cost of goods", value: "د.ل 6,890", note: "37.4% of revenue" }, { label: arabic ? "المصروفات" : "Expenses", value: "د.ل 2,140", note: "3 categories" }, { label: arabic ? "الربح الصافي" : "Net profit", value: "د.ل 9,390", note: "Healthy margin" }];
  return <div className="grid gap-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((stat) => <section key={stat.label} className="border border-border bg-card p-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.17em] text-muted-foreground">{stat.label}</p><p className="mt-6 font-display text-3xl">{stat.value}</p><p className="mt-3 text-xs text-primary">{stat.note}</p></section>)}</div><div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="border border-border bg-card p-5"><div className="mb-6 flex items-center justify-between border-b border-border pb-4"><h2 className="font-display text-2xl">{arabic ? "أداء المبيعات" : "Sales performance"}</h2><span className="text-xs text-muted-foreground">01–15 Sep</span></div><div className="flex h-52 items-end gap-2 border-b border-border px-2">{[38, 52, 44, 68, 58, 76, 65, 88, 74, 94, 81, 100, 86, 91, 97].map((height, index) => <div key={index} className="flex-1 bg-primary/70 transition hover:bg-primary" style={{ height: `${height}%` }} />)}</div><div className="mt-4 flex justify-between text-[10px] text-muted-foreground"><span>01 Sep</span><span>08 Sep</span><span>15 Sep</span></div></section><section className="border border-border bg-card p-5"><h2 className="font-display text-2xl">{arabic ? "تنبيهات اليوم" : "Today’s attention"}</h2><div className="mt-5 grid gap-3"><button onClick={() => setTab("inventory")} className="border-s-2 border-destructive bg-destructive/5 p-4 text-start"><p className="font-medium">{arabic ? "3 منتجات منخفضة المخزون" : "3 products need restock"}</p><p className="mt-1 text-xs text-muted-foreground">{arabic ? "افتح المخزون للمراجعة" : "Open inventory to review"}</p></button><button onClick={() => setTab("orders")} className="border-s-2 border-primary bg-primary/5 p-4 text-start"><p className="font-medium">{arabic ? "4 طلبات تحتاج متابعة" : "4 orders need attention"}</p><p className="mt-1 text-xs text-muted-foreground">{arabic ? "آخر تحديث منذ 12 دقيقة" : "Last updated 12 minutes ago"}</p></button></div></section></div><section className="border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl">{arabic ? "آخر النشاط" : "Recent activity"}</h2><button onClick={() => setTab("audit")} className="text-xs font-semibold uppercase tracking-[.12em] text-primary">View audit</button></div>{["A product was marked low stock", "Order ELZ-9K3F moved to processing", "New expense recorded: Packaging materials"].map((item, index) => <div key={item} className="flex items-center justify-between border-t border-border py-4 text-sm"><span>{item}</span><span className="text-xs text-muted-foreground">{index + 1}h ago</span></div>)}</section></div>;
}

function Products({ arabic, query, setQuery, products }: { arabic: boolean; query: string; setQuery: (query: string) => void; products: typeof demoProducts }) {
  return <section className="border border-border bg-card p-5"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl">{arabic ? "كتالوج Eleganza" : "Eleganza catalogue"}</h2><p className="mt-1 text-sm text-muted-foreground">12 sample products · 5 shown</p></div><input className="h-10 border border-input bg-background px-3 text-sm outline-none focus:border-primary sm:w-72" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={arabic ? "ابحث بالاسم أو SKU" : "Search name or SKU"} /></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground"><tr><th className="pb-3 text-start">Product</th><th className="pb-3 text-start">SKU</th><th className="pb-3 text-start">Category</th><th className="pb-3 text-end">Price</th><th className="pb-3 text-end">Stock</th><th className="pb-3 text-end">Status</th></tr></thead><tbody>{products.map((product) => <tr key={product.sku} className="border-t border-border"><td className="py-4 font-medium">{product.name}</td><td className="py-4 font-mono-ui text-xs">{product.sku}</td><td className="py-4 text-muted-foreground">{product.category}</td><td className="py-4 text-end">{product.price}</td><td className={`py-4 text-end font-mono-ui ${product.stock < 5 ? "text-destructive" : ""}`}>{product.stock}</td><td className="py-4 text-end"><span className="border border-primary/30 px-2 py-1 text-[10px] uppercase tracking-[.1em]">{product.status}</span></td></tr>)}</tbody></table></div></section>;
}

function Inventory({ arabic }: { arabic: boolean }) {
  return <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><section className="border border-border bg-card p-5"><h2 className="font-display text-2xl">{arabic ? "صحة المخزون" : "Stock health"}</h2><p className="mt-8 font-display text-7xl">3</p><p className="mt-2 text-sm text-muted-foreground">{arabic ? "منتجات تحت حد إعادة الطلب" : "products below reorder level"}</p><div className="mt-8 grid gap-2">{[["Aurelia Drops", "3 left"], ["Silk Petal", "Out of stock"], ["Dawn Flush", "8 left"]].map(([name, stock]) => <div key={name} className="flex justify-between border-t border-border py-3 text-sm"><span>{name}</span><span className="text-destructive">{stock}</span></div>)}</div></section><section className="border border-border bg-card p-5"><h2 className="mb-5 font-display text-2xl">{arabic ? "سجل الحركات" : "Movement ledger"}</h2>{[["Aurelia Drops", "Purchase", "+12", "Today · 09:20"], ["Silk Petal", "Sale", "-2", "Yesterday · 16:10"], ["Dawn Flush", "Return", "+1", "Yesterday · 12:45"], ["Amber Reverie", "Damage", "-1", "12 Sep · 14:30"]].map(([product, type, change, when]) => <div key={`${product}${when}`} className="grid grid-cols-[1fr_auto_auto] gap-4 border-t border-border py-4 text-sm"><div><p>{product}</p><p className="mt-1 text-xs text-muted-foreground">{type}</p></div><span className={change.startsWith("+") ? "text-primary" : "text-destructive"}>{change}</span><span className="text-end text-xs text-muted-foreground">{when}</span></div>)}</section></div>;
}

function Orders({ arabic }: { arabic: boolean }) {
  return <section className="border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl">{arabic ? "سجل الطلبات" : "Order ledger"}</h2><span className="text-sm text-muted-foreground">4 sample orders</span></div><div className="grid gap-3">{demoOrders.map((order) => <div key={order.number} className="grid gap-4 border border-border p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><div className="flex flex-wrap gap-3"><span className="font-mono-ui text-xs text-primary">{order.number}</span><span className="text-xs text-muted-foreground">{order.date}</span></div><p className="mt-2 font-medium">{order.customer}</p><p className="mt-1 text-xs text-muted-foreground">{order.payment}</p></div><p className="font-display text-2xl">{order.total}</p><span className="border border-primary/30 px-3 py-2 text-center text-xs capitalize text-primary">{order.status}</span></div>)}</div></section>;
}

function Expenses({ arabic }: { arabic: boolean }) {
  return <section className="border border-border bg-card p-5"><h2 className="mb-5 font-display text-2xl">{arabic ? "سجل المصروفات" : "Expense ledger"}</h2><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground"><tr><th className="pb-3 text-start">Description</th><th className="pb-3 text-start">Category</th><th className="pb-3 text-end">Date</th><th className="pb-3 text-end">Amount</th></tr></thead><tbody>{demoExpenses.map((expense) => <tr key={expense.description} className="border-t border-border"><td className="py-4 font-medium">{expense.description}</td><td className="py-4 text-muted-foreground">{expense.category}</td><td className="py-4 text-end text-xs text-muted-foreground">{expense.date}</td><td className="py-4 text-end font-display text-xl">{expense.amount}</td></tr>)}</tbody></table></div></section>;
}

function Team({ arabic }: { arabic: boolean }) {
  return <section className="border border-border bg-card p-5"><h2 className="mb-5 font-display text-2xl">{arabic ? "أعضاء الفريق" : "Staff members"}</h2>{[["Feras Almadany", "Owner", "Active"], ["Sara Operations", "Manager", "Active"], ["Noura Sales", "Sales", "Pending activation"]].map(([name, role, status]) => <div key={name} className="grid gap-3 border-t border-border py-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-medium">{name}</p><p className="mt-1 text-xs text-muted-foreground">team member · added this month</p></div><span className="text-xs uppercase tracking-[.12em] text-primary">{role}</span><span className="text-xs text-muted-foreground">{status}</span></div>)}</section>;
}

function Audit({ arabic }: { arabic: boolean }) {
  return <section className="border border-border bg-card p-5"><h2 className="mb-5 font-display text-2xl">{arabic ? "النشاط الإداري" : "Administrative activity"}</h2>{["Updated stock for Aurelia Drops", "Created expense Packaging materials", "Moved order ELZ-9K3F to processing", "Synced catalogue from Shopify"].map((entry, index) => <div key={entry} className="grid gap-2 border-t border-border py-4 sm:grid-cols-[1fr_auto]"><div><p className="font-medium">{entry}</p><p className="mt-1 text-xs text-muted-foreground">owner · sample audit event</p></div><span className="text-xs text-muted-foreground">{index + 1}h ago</span></div>)}</section>;
}
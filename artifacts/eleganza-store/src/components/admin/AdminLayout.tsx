import {
  BarChart3,
  BookOpen,
  Boxes,
  ChevronDown,
  ExternalLink,
  Globe2,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  ScrollText,
  ShoppingBag,
  Store,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useClerk } from "@clerk/react";
import { useGetSession } from "@workspace/api-client-react";
import { AdminContext, can, ErrorState, LoadingState, usePersistentAdminLanguage } from "./AdminUI";

const navigation = [
  { href: "/admin", label: "Overview", arabic: "نظرة عامة", icon: BarChart3, capability: null },
  { href: "/admin/products", label: "Products", arabic: "المنتجات", icon: Package, capability: null },
  { href: "/admin/inventory", label: "Inventory", arabic: "المخزون", icon: Boxes, capability: null },
  { href: "/admin/orders", label: "Orders", arabic: "الطلبات", icon: ShoppingBag, capability: null },
  { href: "/admin/expenses", label: "Expenses", arabic: "المصروفات", icon: ReceiptText, capability: null },
  { href: "/admin/accounting", label: "Accounting", arabic: "المحاسبة", icon: BookOpen, capability: "manager" as const },
  { href: "/admin/team", label: "Team", arabic: "الفريق", icon: Users, capability: "owner" as const },
  { href: "/admin/audit", label: "Audit log", arabic: "سجل التدقيق", icon: ScrollText, capability: "manager" as const },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { language, setLanguage } = usePersistentAdminLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const session = useGetSession();

  if (session.isLoading) return <LoadingState />;
  if (session.isError) {
    const pending = session.error && "data" in session.error && (session.error as { data?: { error?: string } }).data?.error?.toLowerCase().includes("pending");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 text-center">
        <div className="max-w-md border border-border bg-card p-8">
          <p className="font-mono-ui text-xs font-semibold uppercase tracking-[.2em] text-primary">Eleganza operations</p>
          <h1 className="mt-3 font-display text-4xl">{pending ? "Access is pending" : "Workspace unavailable"}</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{pending ? "Your account was created, but an owner must activate it before you can access operations." : "We could not load your staff profile. Please try again or sign in with another account."}</p>
          <div className="mt-6 flex justify-center gap-2"><button className="h-10 border border-border px-4 text-xs font-semibold uppercase tracking-[.12em]" onClick={() => session.refetch()}>Retry</button><button className="h-10 bg-primary px-4 text-xs font-semibold uppercase tracking-[.12em] text-primary-foreground" onClick={() => signOut({ redirectUrl: "/" })}>Sign out</button></div>
        </div>
      </div>
    );
  }

  const role = session.data?.role ?? "viewer";
  const permissions = session.data?.permissions?.length ? session.data.permissions : [role];
  const dir = language === "ar" ? "rtl" : "ltr";
  const visibleNavigation = navigation.filter((item) => !item.capability || can(permissions, item.capability));

  const go = (href: string) => {
    setLocation(href);
    setMobileOpen(false);
    setNavigationOpen(false);
  };

  return (
    <AdminContext.Provider value={{ language, setLanguage, dir, role, permissions }}>
      <div dir={dir} className="admin-shell min-h-screen bg-background text-foreground">
        <aside className={`admin-sidebar-scroll fixed inset-y-0 start-0 ${navigationOpen ? "z-50" : "z-40"} w-72 overflow-y-auto overscroll-contain border-e border-border bg-card transition-transform lg:!translate-x-0 ${mobileOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"}`}>
          <div className="flex min-h-full flex-col bg-card p-6">
            <div className="flex items-start justify-between">
              <Link href="/" className="group" onClick={() => setMobileOpen(false)}>
                <div className="font-mono-ui text-xs font-semibold uppercase tracking-[.24em] text-primary">Eleganza</div>
                <div className="mt-1 font-display text-3xl leading-none">Atelier desk</div>
              </Link>
              <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-8 border-y border-border py-4">
              <p className="font-mono-ui text-xs font-medium uppercase tracking-[.2em] text-muted-foreground">{language === "ar" ? "الحساب الحالي" : "Workspace account"}</p>
              <p className="mt-2 truncate text-sm font-medium">{session.data?.displayName}</p>
              <p className="mt-1 font-mono-ui text-xs font-semibold uppercase tracking-[.12em] text-primary">{role}</p>
            </div>
            <div className="relative mt-6 flex min-w-0 flex-none flex-col overflow-visible rounded-2xl border border-primary/20 bg-background/60 p-2 shadow-[0_8px_24px_hsl(var(--foreground)/.03)]">
              <div className="flex shrink-0 items-center justify-between border-b border-primary/15 px-2 pb-3">
                <p className="font-mono-ui text-xs font-semibold uppercase tracking-[.16em] text-primary">{language === "ar" ? "القائمة الرئيسية" : "Main navigation"}</p>
                <span className="font-mono-ui text-xs font-medium text-muted-foreground">{visibleNavigation.length}</span>
              </div>
              <nav className="admin-nav-scroll mt-2 h-48 min-h-48 w-full min-w-0 max-w-full flex-none overflow-y-scroll overscroll-contain pe-1">
                <div className="grid gap-1">
                  {visibleNavigation.map((item) => {
                    const Icon = item.icon;
                    const active = item.href === "/admin" ? location === "/admin" : location.startsWith(item.href);
                    return <button key={item.href} onClick={() => go(item.href)} className={`flex min-w-0 w-full items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-sm transition ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 truncate">{language === "ar" ? item.arabic : item.label}</span></button>;
                  })}
                </div>
              </nav>
              {visibleNavigation.length > 4 && <button type="button" className="mt-2 flex shrink-0 items-center justify-center gap-1 border-t border-primary/15 pt-2 font-mono-ui text-[10px] font-semibold uppercase tracking-[.12em] text-primary transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => setNavigationOpen(true)} aria-expanded={navigationOpen} aria-controls="all-navigation-options" aria-label={language === "ar" ? "عرض جميع خيارات القائمة" : "Show all navigation options"}><ChevronDown className="h-3.5 w-3.5" />{language === "ar" ? "عرض كل الخيارات" : "Show all options"}</button>}
              {navigationOpen && <section id="all-navigation-options" dir={dir} className="absolute start-0 top-0 z-50 flex w-full flex-col overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-[0_18px_50px_hsl(var(--foreground)/.2)]" aria-label={language === "ar" ? "جميع خيارات القائمة" : "All navigation options"}><div className="flex shrink-0 items-center justify-between border-b border-border bg-background px-4 py-3"><div><p className="font-mono-ui text-[10px] font-semibold uppercase tracking-[.16em] text-primary">{language === "ar" ? "القائمة الرئيسية" : "Main navigation"}</p><p className="mt-1 text-sm font-semibold">{language === "ar" ? "جميع الخيارات" : "All options"}</p></div><button type="button" className="rounded-full p-1 text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" onClick={() => setNavigationOpen(false)} aria-label={language === "ar" ? "إغلاق" : "Close"}><X className="h-4 w-4" /></button></div><div className="admin-nav-scroll max-h-[calc(100vh-8rem)] overflow-y-auto p-2">{visibleNavigation.map((item) => { const Icon = item.icon; const active = item.href === "/admin" ? location === "/admin" : location.startsWith(item.href); return <button key={item.href} type="button" onClick={() => go(item.href)} className={`flex min-w-0 w-full items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4 shrink-0" /><span className="min-w-0 truncate">{language === "ar" ? item.arabic : item.label}</span></button>; })}</div></section>}
            </div>
            <div className="mt-4 shrink-0 border-t border-primary/20 pt-4">
              <p className="mb-2 px-2 font-mono-ui text-xs font-semibold uppercase tracking-[.16em] text-muted-foreground">{language === "ar" ? "إجراءات ثابتة" : "Fixed actions"}</p>
              <div className="grid gap-1 rounded-2xl border border-border bg-muted/20 p-2">
                <Link href="/" className="flex w-full items-center gap-3 px-2 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Store className="h-4 w-4" />{language === "ar" ? "المتجر العام" : "Public storefront"}<ExternalLink className="ms-auto h-3.5 w-3.5" /></Link>
                <button className="flex w-full items-center gap-3 px-2 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setLanguage(language === "en" ? "ar" : "en")}><Globe2 className="h-4 w-4" />{language === "en" ? "العربية" : "English"}</button>
                <button className="flex w-full items-center gap-3 px-2 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => signOut({ redirectUrl: "/" })}><LogOut className="h-4 w-4" />{language === "ar" ? "تسجيل الخروج" : "Sign out"}</button>
              </div>
            </div>
          </div>
        </aside>
        {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setMobileOpen(false)} />}
        {navigationOpen && <button type="button" aria-label={language === "ar" ? "إغلاق خيارات القائمة" : "Close navigation options"} className="fixed inset-0 z-40 bg-foreground/20" onClick={() => setNavigationOpen(false)} />}
        <main className="min-h-screen min-w-0 lg:ps-72">
          <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-border bg-background/90 px-5 py-3 backdrop-blur lg:px-10">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
            <div><p className="font-mono-ui text-xs font-semibold uppercase tracking-[.18em] text-primary">{language === "ar" ? "عمليات Eleganza" : "Eleganza operations"}</p><p className="text-xs text-muted-foreground">{language === "ar" ? "مساحة العمل الفعلية — التغييرات محفوظة" : "Live workspace — changes are saved"}</p></div>
            <div className="ms-auto flex items-center gap-3 text-xs text-muted-foreground">
              <span className="hidden rounded-xl border border-primary/30 px-3 py-2 text-xs font-semibold uppercase tracking-[.13em] text-primary sm:inline">{language === "ar" ? "بيانات فعلية" : "Live data"}</span>
              <button
                type="button"
                onClick={() => setLanguage(language === "en" ? "ar" : "en")}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-border px-3 font-semibold uppercase tracking-[.1em] transition hover:border-primary hover:text-primary"
                aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
              >
                <Globe2 className="h-3.5 w-3.5" />
                <span>{language === "ar" ? "English" : "العربية"}</span>
              </button>
              <span className="hidden h-1.5 w-1.5 rounded-full bg-primary sm:block" />
              <span className="hidden sm:inline">{language === "ar" ? "بيئة التطوير" : "Development environment"}</span>
            </div>
          </header>
          <div className="mx-auto min-w-0 max-w-[1500px] p-5 lg:p-10">
            <div className="mb-8 border border-primary/25 bg-primary/5 px-5 py-4">
              <p className="font-mono-ui text-xs font-semibold uppercase tracking-[.2em] text-primary">{language === "ar" ? "مساحة الإدارة الفعلية" : "Live operations desk"}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{language === "ar" ? "هذه المساحة محمية بتسجيل الدخول، وكل التغييرات تحفظ في قاعدة البيانات بحسب صلاحياتك." : "This workspace is protected by sign-in, and changes are saved to the database according to your permissions."}</p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </AdminContext.Provider>
  );
}
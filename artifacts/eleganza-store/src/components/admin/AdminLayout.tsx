import {
  BarChart3,
  BookOpen,
  Boxes,
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
import { AdminContext, type AdminLanguage, can, ErrorState, LoadingState } from "./AdminUI";

const navigation = [
  { href: "/admin", label: "Overview", arabic: "نظرة عامة", icon: BarChart3, capability: null },
  { href: "/admin/products", label: "Products", arabic: "المنتجات", icon: Package, capability: null },
  { href: "/admin/inventory", label: "Inventory", arabic: "المخزون", icon: Boxes, capability: null },
  { href: "/admin/orders", label: "Orders", arabic: "الطلبات", icon: ShoppingBag, capability: null },
  { href: "/admin/expenses", label: "Expenses", arabic: "المصروفات", icon: ReceiptText, capability: null },
  { href: "/admin/team", label: "Team", arabic: "الفريق", icon: Users, capability: "owner" as const },
  { href: "/admin/audit", label: "Audit log", arabic: "سجل التدقيق", icon: ScrollText, capability: "manager" as const },
  { href: "/admin/accounting", label: "Accounting", arabic: "المحاسبة", icon: BookOpen, capability: "manager" as const },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<AdminLanguage>("en");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { signOut } = useClerk();
  const session = useGetSession();

  if (session.isLoading) return <LoadingState />;
  if (session.isError) {
    const pending = session.error && "data" in session.error && (session.error as { data?: { error?: string } }).data?.error?.toLowerCase().includes("pending");
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-5 text-center">
        <div className="max-w-md border border-border bg-card p-8">
          <p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">Eleganza operations</p>
          <h1 className="mt-3 font-display text-4xl">{pending ? "Access is pending" : "Workspace unavailable"}</h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{pending ? "Your account was created, but an owner must activate it before you can access operations." : "We could not load your staff profile. Please try again or sign in with another account."}</p>
          <div className="mt-6 flex justify-center gap-2"><button className="h-10 border border-border px-4 text-xs font-semibold uppercase tracking-[.12em]" onClick={() => session.refetch()}>Retry</button><button className="h-10 bg-primary px-4 text-xs font-semibold uppercase tracking-[.12em] text-primary-foreground" onClick={() => signOut({ redirectUrl: "/" })}>Sign out</button></div>
        </div>
      </div>
    );
  }

  const role = session.data?.role ?? "viewer";
  const dir = language === "ar" ? "rtl" : "ltr";
  const visibleNavigation = navigation.filter((item) => !item.capability || can(role, item.capability));

  const go = (href: string) => {
    setLocation(href);
    setMobileOpen(false);
  };

  return (
    <AdminContext.Provider value={{ language, setLanguage, dir, role }}>
      <div dir={dir} className="min-h-screen bg-background text-foreground">
        <aside className={`fixed inset-y-0 start-0 z-40 w-72 border-e border-border bg-card transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"}`}>
          <div className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between">
              <Link href="/" className="group" onClick={() => setMobileOpen(false)}>
                <div className="font-mono-ui text-[9px] uppercase tracking-[.24em] text-primary">Eleganza</div>
                <div className="mt-1 font-display text-3xl leading-none">Atelier desk</div>
              </Link>
              <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-10 border-y border-border py-4">
              <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">Signed in as</p>
              <p className="mt-2 truncate text-sm font-medium">{session.data?.displayName}</p>
              <p className="mt-1 font-mono-ui text-[10px] uppercase tracking-[.12em] text-primary">{role}</p>
            </div>
            <nav className="mt-6 grid gap-1">
              {visibleNavigation.map((item) => {
                const Icon = item.icon;
                const active = item.href === "/admin" ? location === "/admin" : location.startsWith(item.href);
                return <button key={item.href} onClick={() => go(item.href)} className={`flex items-center gap-3 px-3 py-3 text-sm transition ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4" /><span>{language === "ar" ? item.arabic : item.label}</span></button>;
              })}
            </nav>
            <div className="mt-auto grid gap-2">
              <Link href="/" className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Store className="h-4 w-4" />{language === "ar" ? "المتجر العام" : "Public storefront"}<ExternalLink className="ms-auto h-3.5 w-3.5" /></Link>
              <button className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setLanguage(language === "en" ? "ar" : "en")}><Globe2 className="h-4 w-4" />{language === "en" ? "العربية" : "English"}</button>
              <button className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => signOut({ redirectUrl: "/" })}><LogOut className="h-4 w-4" />{language === "ar" ? "تسجيل الخروج" : "Sign out"}</button>
            </div>
          </div>
        </aside>
        {mobileOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setMobileOpen(false)} />}
        <main className="min-h-screen lg:ps-72">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur lg:px-10">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
            <div className="hidden font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground lg:block">Inventory · commerce · care</div>
            <div className="ms-auto flex items-center gap-3 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => setLanguage(language === "en" ? "ar" : "en")}
                className="inline-flex h-9 items-center gap-2 border border-border px-3 font-semibold uppercase tracking-[.1em] transition hover:border-primary hover:text-primary"
                aria-label={language === "ar" ? "Switch to English" : "التبديل إلى العربية"}
              >
                <Globe2 className="h-3.5 w-3.5" />
                <span>{language === "ar" ? "English" : "العربية"}</span>
              </button>
              <span className="hidden h-1.5 w-1.5 rounded-full bg-primary sm:block" />
              <span className="hidden sm:inline">{language === "ar" ? "بيئة التطوير" : "Development environment"}</span>
            </div>
          </header>
          <div className="mx-auto max-w-[1500px] p-5 lg:p-10">{children}</div>
        </main>
      </div>
    </AdminContext.Provider>
  );
}
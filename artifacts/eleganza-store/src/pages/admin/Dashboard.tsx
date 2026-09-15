import { ArrowUpRight, CircleDollarSign, RefreshCw, ShoppingBag, WalletCards } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useGetDashboardSummary, useSyncShopify } from "@workspace/api-client-react";
import { useAdmin, money, dateLabel, LoadingState, ErrorState, buttonClass, Toast, can, getErrorMessage } from "@/components/admin/AdminUI";
import { queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const { language, role } = useAdmin();
  const summary = useGetDashboardSummary();
  const sync = useSyncShopify();
  const [message, setMessage] = useState<string | null>(null);
  const isAr = language === "ar";

  async function syncShopify() {
    try {
      const result = await sync.mutateAsync();
      await queryClient.invalidateQueries();
      setMessage(isAr ? `تمت مزامنة ${result.syncedProducts} منتجًا و${result.syncedOrders} طلبات` : `Synced ${result.syncedProducts} products and ${result.syncedOrders} orders`);
    } catch (error) { setMessage(getErrorMessage(error)); }
  }

  const attentionOrders = (summary.data?.orderCounts.pending ?? 0) + (summary.data?.orderCounts.processing ?? 0);
  const performanceBars = Array.from({ length: 15 }, (_, index) => {
    const movement = summary.data?.recentMovements[index];
    const quantity = movement ? Math.abs(movement.quantity) : 0;
    return Math.min(100, Math.max(28, 42 + quantity * 8 + ((index * 13) % 34)));
  });

  return (
    <div>
      {summary.isLoading && <LoadingState />}
      {summary.isError && <ErrorState error={summary.error} onRetry={() => summary.refetch()} />}
      {summary.data && <div className="grid gap-5">
        <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="font-mono-ui text-xs font-semibold uppercase tracking-[.24em] text-primary">{isAr ? "مركز العمليات" : "Operations centre"}</p><h1 className="mt-2 font-display text-5xl leading-none">{isAr ? "نظرة عامة" : "Overview"}</h1></div>
          {can(role, "manager") && <button className={buttonClass} onClick={syncShopify} disabled={sync.isPending}><RefreshCw className={`h-3.5 w-3.5 ${sync.isPending ? "animate-spin" : ""}`} />{isAr ? "مزامنة Shopify" : "Sync Shopify"}</button>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: isAr ? "الإيرادات" : "Revenue", value: money(summary.data.revenueMinor, language), note: isAr ? "الإيرادات المسجلة" : "Recorded revenue", icon: CircleDollarSign },
            { label: isAr ? "تكلفة البضاعة" : "Cost of goods", value: money(summary.data.cogsMinor, language), note: isAr ? "تكلفة المنتجات المباعة" : "Cost of products sold", icon: ShoppingBag },
            { label: isAr ? "المصروفات" : "Expenses", value: money(summary.data.expensesMinor, language), note: isAr ? "المصروفات المسجلة" : "Recorded operating costs", icon: WalletCards },
            { label: isAr ? "الربح الصافي" : "Net profit", value: money(summary.data.profitMinor, language), note: summary.data.profitMinor >= 0 ? (isAr ? "هامش موجب" : "Positive margin") : (isAr ? "يحتاج مراجعة" : "Needs review"), icon: ArrowUpRight },
          ].map((stat) => { const Icon = stat.icon; return <section key={stat.label} className="border border-border bg-card p-5"><Icon className="h-4 w-4 text-primary" /><p className="mt-5 font-mono-ui text-[10px] uppercase tracking-[.17em] text-muted-foreground">{stat.label}</p><p className="mt-5 font-display text-3xl">{stat.value}</p><p className="mt-3 text-xs text-primary">{stat.note}</p></section>; })}
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
          <section className="border border-border bg-card p-5"><div className="mb-6 flex items-center justify-between border-b border-border pb-4"><h2 className="font-display text-2xl">{isAr ? "أداء النشاط" : "Sales performance"}</h2><span className="text-xs text-muted-foreground">{summary.data.recentMovements.length} {isAr ? "حركة حديثة" : "recent movements"}</span></div><div className="flex h-52 items-end gap-2 border-b border-border px-2">{performanceBars.map((height, index) => <div key={index} className="flex-1 bg-primary/70 transition hover:bg-primary" style={{ height: `${height}%` }} />)}</div><div className="mt-4 flex justify-between text-[10px] text-muted-foreground"><span>{isAr ? "الأقدم" : "Earlier"}</span><span>{isAr ? "النشاط الأخير" : "Latest activity"}</span></div></section>
          <section className="border border-border bg-card p-5"><h2 className="font-display text-2xl">{isAr ? "تنبيهات اليوم" : "Today’s attention"}</h2><div className="mt-5 grid gap-3"><Link href="/admin/inventory" className="border-s-2 border-destructive bg-destructive/5 p-4 text-start transition hover:bg-destructive/10"><p className="font-medium">{summary.data.lowStockCount} {isAr ? "منتجات تحتاج إعادة طلب" : "products need restock"}</p><p className="mt-1 text-xs text-muted-foreground">{isAr ? "افتح المخزون للمراجعة" : "Open inventory to review"}</p></Link><Link href="/admin/orders" className="border-s-2 border-primary bg-primary/5 p-4 text-start transition hover:bg-primary/10"><p className="font-medium">{attentionOrders} {isAr ? "طلبات تحتاج متابعة" : "orders need attention"}</p><p className="mt-1 text-xs text-muted-foreground">{isAr ? "راجع الطلبات والحالات الحالية" : "Review current orders and statuses"}</p></Link></div></section>
        </div>
        <section className="border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl">{isAr ? "آخر النشاط" : "Recent activity"}</h2><Link href="/admin/audit" className="text-xs font-semibold uppercase tracking-[.12em] text-primary">{isAr ? "عرض السجل" : "View audit"}</Link></div>{summary.data.recentMovements.length === 0 ? <p className="text-sm text-muted-foreground">{isAr ? "لا يوجد نشاط مسجل بعد." : "No recent activity yet."}</p> : <div>{summary.data.recentMovements.slice(0, 4).map((movement) => <div key={movement.id} className="flex items-center justify-between gap-4 border-t border-border py-4 text-sm"><span>{isAr ? `تم تحديث مخزون المنتج #${movement.productId}` : `Stock updated for product #${movement.productId}`}</span><span className="text-xs text-muted-foreground">{dateLabel(movement.createdAt, language)}</span></div>)}</div>}</section>
      </div>}
      <Toast message={message} onClose={() => setMessage(null)} />
    </div>
  );
}
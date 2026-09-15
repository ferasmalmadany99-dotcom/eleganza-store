import { ArrowUpRight, Boxes, CircleDollarSign, RefreshCw, ShoppingBag, WalletCards } from "lucide-react";
import { useState } from "react";
import { useGetDashboardSummary, useSyncShopify } from "@workspace/api-client-react";
import { useAdmin, PageHeader, Panel, PanelTitle, money, dateLabel, LoadingState, ErrorState, buttonClass, quietButtonClass, Toast, can, getErrorMessage } from "@/components/admin/AdminUI";
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

  return (
    <div>
      <PageHeader eyebrow={isAr ? "مركز العمليات" : "Operations centre"} title={isAr ? "صباح الخير، فريق Eleganza" : "Good morning, Eleganza"} description={isAr ? "نظرة سريعة على الأداء، المخزون، والحركة الأخيرة." : "A considered view of revenue, stock health, and the latest movements."} action={can(role, "manager") ? <button className={buttonClass} onClick={syncShopify} disabled={sync.isPending}><RefreshCw className={`h-3.5 w-3.5 ${sync.isPending ? "animate-spin" : ""}`} />{isAr ? "مزامنة Shopify" : "Sync Shopify"}</button> : undefined} />
      {summary.isLoading && <LoadingState />}
      {summary.isError && <ErrorState error={summary.error} onRetry={() => summary.refetch()} />}
      {summary.data && <div className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: isAr ? "الإيرادات" : "Revenue", value: money(summary.data.revenueMinor, language), icon: CircleDollarSign, accent: "text-primary" },
            { label: isAr ? "تكلفة البضاعة" : "Cost of goods", value: money(summary.data.cogsMinor, language), icon: ShoppingBag, accent: "text-accent" },
            { label: isAr ? "المصروفات" : "Expenses", value: money(summary.data.expensesMinor, language), icon: WalletCards, accent: "text-muted-foreground" },
            { label: isAr ? "الربح" : "Profit", value: money(summary.data.profitMinor, language), icon: ArrowUpRight, accent: summary.data.profitMinor >= 0 ? "text-primary" : "text-destructive" },
          ].map((stat) => { const Icon = stat.icon; return <Panel key={stat.label} className="relative overflow-hidden"><Icon className={`absolute end-5 top-5 h-5 w-5 ${stat.accent}`} /><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-muted-foreground">{stat.label}</p><p className="mt-6 font-display text-3xl">{stat.value}</p><div className="mt-3 h-px w-12 bg-primary/50" /></Panel>; })}
        </div>
        <div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]">
          <Panel><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{summary.data.recentMovements.length} {isAr ? "حركة" : "movements"}</span>}>{isAr ? "آخر حركات المخزون" : "Recent inventory movement"}</PanelTitle>{summary.data.recentMovements.length === 0 ? <p className="text-sm text-muted-foreground">{isAr ? "لا توجد حركات بعد." : "No inventory movements yet."}</p> : <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-start text-sm"><thead className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground"><tr><th className="pb-3 text-start">Product</th><th className="pb-3 text-start">Type</th><th className="pb-3 text-start">Change</th><th className="pb-3 text-end">Date</th></tr></thead><tbody>{summary.data.recentMovements.map((movement) => <tr key={movement.id} className="border-t border-border"><td className="py-3">#{movement.productId}</td><td className="py-3 capitalize">{movement.type}</td><td className={`py-3 font-mono-ui ${movement.quantity >= 0 ? "text-primary" : "text-destructive"}`}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</td><td className="py-3 text-end text-xs text-muted-foreground">{dateLabel(movement.createdAt, language)}</td></tr>)}</tbody></table></div>}</Panel>
          <Panel><PanelTitle>{isAr ? "صحة المخزون" : "Stock health"}</PanelTitle><div className="flex items-end justify-between"><div><p className="font-display text-6xl">{summary.data.lowStockCount}</p><p className="mt-2 text-sm text-muted-foreground">{isAr ? "منتجات تحت حد إعادة الطلب" : "products below reorder level"}</p></div><Boxes className="mb-2 h-10 w-10 text-primary/70" /></div><div className="mt-8 border-t border-border pt-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-muted-foreground">{isAr ? "الطلبات حسب الحالة" : "Orders by status"}</p><div className="mt-4 grid grid-cols-2 gap-3">{Object.entries(summary.data.orderCounts).map(([status, count]) => <div key={status} className="border border-border p-3"><p className="text-xs capitalize text-muted-foreground">{status}</p><p className="mt-1 font-display text-2xl">{count}</p></div>)}</div></div></Panel>
        </div>
      </div>}
      <Toast message={message} onClose={() => setMessage(null)} />
    </div>
  );
}
import { useState } from "react";
import { Link } from "wouter";
import { Database, ScrollText, ShieldAlert } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useResetSystemData } from "@workspace/api-client-react";
import { buttonClass, can, getErrorMessage, PageHeader, Panel, PanelTitle, quietButtonClass, useAdmin } from "@/components/admin/AdminUI";

const groups = ["products", "inventory", "orders", "expenses", "accounting"] as const;
type ResetGroup = typeof groups[number];

export default function SystemSettings() {
  const { language, permissions, setLanguage } = useAdmin();
  const isAr = language === "ar";
  const queryClient = useQueryClient();
  const reset = useResetSystemData();
  const [selected, setSelected] = useState<ResetGroup[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const isOwner = can(permissions, "owner");

  const updateGroup = (group: ResetGroup) => {
    setSelected((current) => {
      if (current.includes(group)) {
        const next = current.filter((item) => item !== group);
        return group === "orders" || group === "inventory" ? next.filter((item) => item !== "products") : next;
      }
      const next = [...current, group];
      return group === "products" ? [...new Set([...next, "inventory", "orders"])] as ResetGroup[] : next;
    });
    setMessage(null);
    setConfirming(false);
    setConfirmation("");
  };
  const allSelected = selected.length === groups.length;
  const toggleAll = () => {
    setSelected(allSelected ? [] : [...groups]);
    setMessage(null);
    setConfirming(false);
    setConfirmation("");
  };
  const executeReset = async () => {
    if (!selected.length || confirmation !== "DELETE") return;
    try {
      const result = await reset.mutateAsync({ data: { groups: selected, confirmation: "DELETE" } });
      const details = result.deleted;
      setMessage(isAr
        ? `اكتمل الحذف: ${details.products} منتج، ${details.orders} طلب، ${details.inventoryMovements} حركة مخزون، ${details.expenses} مصروف، ${details.journalEntries} قيد.`
        : `Deleted: ${details.products} products, ${details.orders} orders, ${details.inventoryMovements} stock movements, ${details.expenses} expenses, ${details.journalEntries} journal entries.`);
      setSelected([]);
      setConfirmation("");
      setConfirming(false);
      await queryClient.invalidateQueries();
    } catch (error) {
      setMessage(getErrorMessage(error, isAr ? "تعذر تنفيذ الحذف." : "Could not complete the deletion."));
    }
  };

  if (!isOwner) return <Panel><p className="font-medium">{isAr ? "هذه الصفحة متاحة للمالك فقط." : "This page is available to the owner only."}</p></Panel>;

  return <div className="grid gap-6">
    <PageHeader
      eyebrow={isAr ? "إدارة النظام" : "System administration"}
      title={isAr ? "النظام والإعدادات" : "System settings"}
      description={isAr ? "إدارة سجل نشاط الموظفين ومسح بيانات التشغيل المحددة." : "Review staff activity and selectively clear operational data."}
    />

    <Panel>
      <PanelTitle>{isAr ? "سجل نشاط الموظفين" : "Staff activity log"}</PanelTitle>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ScrollText className="mt-1 h-5 w-5 shrink-0 text-primary" />
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {isAr ? "راجع العمليات التي أجراها الموظفون مع تاريخها وتفاصيلها. يبقى سجل التدقيق محفوظًا حتى عند مسح بيانات التشغيل." : "Review actions performed by staff, with timestamps and details. The audit log remains preserved during operational data resets."}
          </p>
        </div>
        <Link href="/admin/audit" className={buttonClass}>{isAr ? "فتح سجل التدقيق" : "Open audit log"}</Link>
      </div>
    </Panel>

    <Panel>
      <PanelTitle>{isAr ? "إعدادات أخرى" : "Other settings"}</PanelTitle>
      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/admin/team" className="border border-border p-4 transition hover:border-primary">
          <span className="block font-medium">{isAr ? "الفريق والصلاحيات" : "Team and permissions"}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{isAr ? "إدارة الموظفين وأدوارهم." : "Manage staff and their roles."}</span>
        </Link>
        <Link href="/admin/accounting" className="border border-border p-4 transition hover:border-primary">
          <span className="block font-medium">{isAr ? "المحاسبة" : "Accounting"}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{isAr ? "إدارة الحسابات والقيود." : "Manage accounts and journal entries."}</span>
        </Link>
        <button type="button" className="border border-border p-4 text-start transition hover:border-primary" onClick={() => setLanguage(isAr ? "en" : "ar")}>
          <span className="block font-medium">{isAr ? "لغة لوحة الإدارة" : "Admin language"}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{isAr ? "التبديل إلى English." : "Switch to العربية."}</span>
        </button>
      </div>
    </Panel>

    <Panel className="border-destructive/30">
      <PanelTitle detail={<span className="text-xs font-semibold text-destructive">{isAr ? "للمالك فقط" : "Owner only"}</span>}>
        {isAr ? "مسح بيانات النظام" : "Clear system data"}
      </PanelTitle>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border border-destructive/20 bg-destructive/5 p-4">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {isAr ? "الحذف نهائي ولا يمكن التراجع عنه. حسابات الموظفين وسجل التدقيق وشجرة الحسابات تبقى محفوظة." : "Deletion is permanent and cannot be undone. Staff accounts, audit history, and the chart of accounts are preserved."}
          </p>
        </div>
        <button type="button" className={quietButtonClass} onClick={toggleAll}>
          {allSelected ? (isAr ? "إلغاء تحديد الكل" : "Deselect all") : (isAr ? "تحديد الكل" : "Select all")}
        </button>
      </div>

      <div className="grid gap-3">
        <label className="flex cursor-pointer items-start gap-3 border border-border p-4 hover:border-primary">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" checked={selected.includes("products")} onChange={() => updateGroup("products")} />
          <span><span className="block font-medium">{isAr ? "كتالوج المنتجات" : "Product catalog"}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{isAr ? "حذف المنتجات يتطلب أيضًا تحديد الطلبات والمخزون المرتبطين بها؛ يحددهما النظام تلقائيًا." : "Deleting products also requires related orders and inventory; these are selected automatically."}</span></span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-border p-4 hover:border-primary">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" checked={selected.includes("inventory")} onChange={() => updateGroup("inventory")} />
          <span><span className="block font-medium">{isAr ? "حركات المخزون" : "Inventory movements"}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{isAr ? "حذف سجل الحركات والقيود المرتبطة به؛ تبقى كميات المخزون الحالية على المنتجات كما هي." : "Deletes movement history and linked entries; current product quantities remain unchanged."}</span></span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-border p-4 hover:border-primary">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" checked={selected.includes("orders")} onChange={() => updateGroup("orders")} />
          <span><span className="block font-medium">{isAr ? "الطلبات" : "Orders"}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{isAr ? "حذف الطلبات وبنودها وحركات المخزون والقيود المحاسبية المرتبطة بها." : "Deletes orders and line items, related stock movements, and linked journal entries."}</span></span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-border p-4 hover:border-primary">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" checked={selected.includes("expenses")} onChange={() => updateGroup("expenses")} />
          <span><span className="block font-medium">{isAr ? "المصروفات" : "Expenses"}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{isAr ? "سجلات المصروفات والقيود المرتبطة بها." : "Expense records and their linked journal entries."}</span></span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 border border-border p-4 hover:border-primary">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" checked={selected.includes("accounting")} onChange={() => updateGroup("accounting")} />
          <span><span className="block font-medium">{isAr ? "كل القيود المحاسبية" : "All accounting entries"}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{isAr ? "كل القيود وبنودها، بما فيها اليدوية. تبقى شجرة الحسابات كما هي." : "All journal entries and lines, including manual entries. The chart of accounts remains."}</span></span>
        </label>
      </div>

      {selected.length > 0 && <div className="mt-5 border-t border-border pt-5">
        {!confirming ? <button type="button" className={`${buttonClass} !border-destructive !bg-destructive`} onClick={() => setConfirming(true)}>
          <Database className="h-4 w-4" />{isAr ? "متابعة إلى التأكيد" : "Continue to confirmation"}
        </button> : <div className="grid max-w-xl gap-3">
          <p className="text-sm font-medium">{isAr ? "اكتب DELETE للتأكيد النهائي:" : "Type DELETE to confirm:"}</p>
          <input className="h-10 rounded-xl border border-destructive/40 bg-background px-3 text-sm" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" />
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`${buttonClass} !border-destructive !bg-destructive`} disabled={confirmation !== "DELETE" || reset.isPending} onClick={executeReset}>
              {reset.isPending ? (isAr ? "جارٍ الحذف…" : "Deleting…") : (isAr ? "احذف البيانات المحددة" : "Delete selected data")}
            </button>
            <button type="button" className={quietButtonClass} disabled={reset.isPending} onClick={() => { setConfirming(false); setConfirmation(""); }}>
              {isAr ? "إلغاء" : "Cancel"}
            </button>
          </div>
        </div>}
      </div>}
      {message && <p role="status" className="mt-4 border border-border bg-muted/20 p-3 text-sm">{message}</p>}
    </Panel>
  </div>;
}

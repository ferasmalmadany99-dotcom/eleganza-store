import { ClipboardList } from "lucide-react";
import { useListAuditLogs, type AuditLog } from "@workspace/api-client-react";
import { EmptyState, ErrorState, LoadingState, money, PageHeader, Panel, PanelTitle, useAdmin, dateLabel } from "@/components/admin/AdminUI";

const entityLabels = {
  product: { en: "product", ar: "المنتج" },
  inventory_movement: { en: "inventory", ar: "المخزون" },
  order: { en: "order", ar: "الطلب" },
  storefront_order: { en: "store order", ar: "طلب المتجر" },
  expense: { en: "expense", ar: "المصروف" },
  account: { en: "account", ar: "الحساب" },
  journal_entry: { en: "accounting entry", ar: "القيد المحاسبي" },
  staff: { en: "staff member", ar: "الموظف" },
  system: { en: "system", ar: "النظام" },
} as const;

const statusLabels: Record<string, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "معلّق" },
  confirmed: { en: "Confirmed", ar: "مؤكد" },
  processing: { en: "Processing", ar: "قيد التجهيز" },
  completed: { en: "Completed", ar: "مكتمل" },
  cancelled: { en: "Cancelled", ar: "ملغى" },
  returned: { en: "Returned", ar: "مرتجع" },
};

function operationLabel(log: AuditLog, isAr: boolean) {
  const type = typeof log.metadata.type === "string" ? log.metadata.type : "";
  if (log.action === "system_reset") return isAr ? "إعادة ضبط النظام" : "System reset";
  if (log.entityType === "inventory_movement") {
    if (log.action === "delete") return isAr ? "حذف حركة مخزون" : "Inventory movement deleted";
    const labels: Record<string, { en: string; ar: string }> = {
      purchase: { en: "Purchase recorded · Stock received", ar: "تسجيل شراء · إدخال مخزون" },
      sale: { en: "Stock issued for a sale", ar: "صرف مخزون لعملية بيع" },
      return: { en: "Stock return recorded", ar: "تسجيل إرجاع للمخزون" },
      damage: { en: "Damaged stock recorded", ar: "تسجيل مخزون تالف" },
      adjustment: { en: "Stock adjustment", ar: "تسوية المخزون" },
    };
    if (labels[type]) return labels[type][isAr ? "ar" : "en"];
  }
  const labels: Record<string, { en: string; ar: string }> = {
    "create:product": { en: "Product added", ar: "إضافة منتج" },
    "update:product": { en: "Product details updated", ar: "تعديل بيانات منتج" },
    "create:order": { en: "Sale order recorded", ar: "تسجيل طلب بيع" },
    "create:storefront_order": { en: "New storefront order", ar: "طلب جديد من المتجر" },
    "update_status:order": { en: "Order status updated", ar: "تحديث حالة الطلب" },
    "create:expense": { en: "Expense recorded", ar: "تسجيل مصروف" },
    "create:account": { en: "Accounting account added", ar: "إضافة حساب محاسبي" },
    "update:account": { en: "Accounting account updated", ar: "تعديل حساب محاسبي" },
    "create:journal_entry": { en: "Accounting entry created", ar: "إنشاء قيد محاسبي" },
    "invite:staff": { en: "Staff invitation sent", ar: "إرسال دعوة لموظف" },
    "update:staff": { en: "Staff details updated", ar: "تعديل بيانات موظف" },
  };
  const known = labels[`${log.action}:${log.entityType}`];
  if (known) return known[isAr ? "ar" : "en"];
  const entity = entityLabels[log.entityType as keyof typeof entityLabels];
  if (!entity) return isAr ? "عملية إدارية" : "Administrative operation";
  if (log.action === "create") return isAr ? `إضافة ${entity.ar}` : `${entity.en} added`;
  if (log.action === "update") return isAr ? `تعديل ${entity.ar}` : `${entity.en} updated`;
  if (log.action === "delete") return isAr ? `حذف ${entity.ar}` : `${entity.en} deleted`;
  return isAr ? `عملية على ${entity.ar}` : `Operation on ${entity.en}`;
}

function operationDetails(log: AuditLog, isAr: boolean, language: "ar" | "en") {
  const parts: string[] = [];
  const { metadata } = log;
  if (typeof metadata.quantity === "number" && log.entityType === "inventory_movement") {
    parts.push(`${isAr ? "الكمية" : "Quantity"}: ${Math.abs(metadata.quantity)}`);
  }
  if (typeof metadata.amountMinor === "number") {
    parts.push(`${isAr ? "القيمة" : "Amount"}: ${money(metadata.amountMinor, language)}`);
  }
  if (typeof metadata.status === "string") {
    const status = statusLabels[metadata.status];
    parts.push(`${isAr ? "الحالة" : "Status"}: ${status?.[isAr ? "ar" : "en"] ?? (isAr ? "تم التحديث" : "Updated")}`);
  }
  if (typeof metadata.displayName === "string") {
    parts.push(`${isAr ? "الموظف" : "Staff"}: ${metadata.displayName}`);
  }
  return parts.join(" · ");
}

export default function Audit() {
  const { language } = useAdmin();
  const isAr = language === "ar";
  const logs = useListAuditLogs({ limit: 100 });
  return <div>
    <PageHeader eyebrow={isAr ? "الحوكمة" : "Governance"} title={isAr ? "سجل التدقيق" : "Audit log"} description={isAr ? "سجل واضح لعمليات الشراء والمخزون والطلبات وبقية التغييرات." : "A clear record of purchases, inventory, orders, and other changes."} />
    <Panel>
      <PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{logs.data?.length ?? 0} {isAr ? "عملية" : "events"}</span>}>{isAr ? "العمليات المسجلة" : "Recorded operations"}</PanelTitle>
      {logs.isLoading && <LoadingState />}
      {logs.isError && <ErrorState error={logs.error} onRetry={() => logs.refetch()} />}
      {logs.data?.length === 0 && <EmptyState icon={<ClipboardList className="h-5 w-5" />} title={isAr ? "لا توجد عمليات مسجلة" : "No operations recorded"} detail={isAr ? "ستظهر هنا عمليات الشراء والمخزون والطلبات بعد تنفيذها." : "Purchases, inventory, and order activity will appear here as it happens."} />}
      {logs.data && logs.data.length > 0 && <div className="grid gap-4">{logs.data.map((log) => {
        const details = operationDetails(log, isAr, language);
        return <article key={log.id} className="grid gap-2 border-b border-border pb-4 last:border-0 last:pb-0 sm:grid-cols-[1fr_auto]">
          <div><p className="font-semibold text-foreground">{operationLabel(log, isAr)}</p>{details && <p className="mt-1 text-sm text-muted-foreground">{details}</p>}</div>
          <time className="text-xs text-muted-foreground sm:text-end">{dateLabel(log.createdAt, language)}</time>
        </article>;
      })}</div>}
    </Panel>
  </div>;
}
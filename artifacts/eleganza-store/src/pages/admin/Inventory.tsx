import { Boxes, Download, Eye, FileText, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useCreateInventoryMovement, useDeleteInventoryMovement, useListInventoryMovements, useListOrders, useListProducts, type InventoryMovement, type InventoryMovementInput, type InventoryMovementType, type Order, type Product } from "@workspace/api-client-react";
import { downloadPaginatedPdf } from "@/lib/paginatedPdf";
import { queryClient } from "@/lib/queryClient";
import { buttonClass, can, EmptyState, ErrorState, Field, getErrorMessage, inputClass, LoadingState, money, PageHeader, Panel, PanelTitle, quietButtonClass, Toast, useAdmin, dateLabel } from "@/components/admin/AdminUI";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const movementTypeLabels: Record<InventoryMovementType, { en: string; ar: string }> = {
  purchase: { en: "Purchase", ar: "شراء" },
  sale: { en: "Sale", ar: "بيع" },
  return: { en: "Return", ar: "مرتجع" },
  damage: { en: "Damage", ar: "تالف" },
  adjustment: { en: "Adjustment", ar: "تسوية" },
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character);

function PurchaseInvoiceModal({ movement, movements, products, isAr, language, dir, onClose }: {
  movement: InventoryMovement;
  movements: InventoryMovement[];
  products: Product[];
  isAr: boolean;
  language: "en" | "ar";
  dir: "ltr" | "rtl";
  onClose: () => void;
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const productNames = new Map(products.map((product) => [product.id, isAr ? product.nameAr || product.nameEn : product.nameEn]));
  const invoiceNumber = movement.invoiceReference || `PURCHASE-${movement.id}`;
  const invoiceMovements = movements.filter((item) => item.type === "purchase" && (item.invoiceReference || `PURCHASE-${item.id}`) === invoiceNumber);
  const lines = invoiceMovements.length > 0 ? invoiceMovements : [movement];
  const totalMinor = lines.reduce((sum, item) => sum + (item.unitCostMinor != null ? item.quantity * item.unitCostMinor : 0), 0);
  const hasMissingCost = lines.some((item) => item.unitCostMinor == null);

  async function downloadPdf() {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const pageSize = 8;
      const linePages: InventoryMovement[][] = [];
      for (let index = 0; index < lines.length; index += pageSize) linePages.push(lines.slice(index, index + pageSize));
      const safeInvoiceNumber = invoiceNumber.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || `movement-${movement.id}`;
      const pages = linePages.map((pageLines, pageIndex) => {
        const rows = pageLines.map((item) => {
          const itemName = productNames.get(item.productId) ?? (isAr ? item.productNameAr || item.productNameEn || `منتج #${item.productId}` : item.productNameEn || `Product #${item.productId}`);
          const lineTotal = item.unitCostMinor != null ? money(item.quantity * item.unitCostMinor, language) : "—";
          return `<tr><td style="padding:12px 4px;border-bottom:1px solid #e5dacf;word-break:break-word">${escapeHtml(itemName)}</td><td dir="ltr" style="padding:12px 4px;border-bottom:1px solid #e5dacf;text-align:end;direction:ltr;unicode-bidi:isolate">${item.quantity}</td><td style="padding:12px 4px;border-bottom:1px solid #e5dacf;text-align:end">${item.unitCostMinor != null ? escapeHtml(money(item.unitCostMinor, language)) : "—"}</td><td style="padding:12px 4px;border-bottom:1px solid #e5dacf;text-align:end">${escapeHtml(lineTotal)}</td></tr>`;
        }).join("");
        const isLastPage = pageIndex === linePages.length - 1;
        const footerTotal = isLastPage
          ? `<div style="display:flex;justify-content:space-between;border-top:2px solid #312b25;margin-top:20px;padding-top:16px;font-size:20px"><span>${isAr ? "الإجمالي" : "Total"}</span><strong dir="ltr" style="direction:ltr;unicode-bidi:isolate">${hasMissingCost ? "—" : escapeHtml(money(totalMinor, language))}</strong></div>`
          : `<p style="margin:20px 0 0;color:#6f6258;font-size:12px">${isAr ? "يتبع في الصفحة التالية" : "Continued on the next page"}</p>`;
        return `<div dir="${dir}" lang="${language}" style="height:100%;box-sizing:border-box;border:1px solid #ded0c1;padding:40px;font-family:Arial,sans-serif;unicode-bidi:isolate"><div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:2px solid #9f523d;padding-bottom:24px"><div><p style="color:#9f523d;font-size:11px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 8px">Eleganza Operations</p><h1 style="font-size:30px;font-weight:400;margin:0 0 8px">${isAr ? "فاتورة شراء مخزون" : "Inventory purchase invoice"}</h1><p style="line-height:1.6;margin:5px 0;color:#6f6258">${isAr ? "مستند مشتق من عملية الشراء المسجلة في المخزون." : "Generated from the recorded inventory purchase."}</p></div><div style="text-align:end"><p style="color:#9f523d;font-size:11px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 8px">${isAr ? "رقم الفاتورة" : "Invoice number"}</p><p dir="ltr" style="font-size:16px;color:#9f523d;font-weight:bold;direction:ltr;unicode-bidi:isolate;margin:0">${escapeHtml(invoiceNumber)}</p><p style="margin:12px 0 0;color:#8b7b6e;font-size:11px">${isAr ? "التاريخ" : "Date"} · ${escapeHtml(dateLabel(movement.createdAt, language))}</p><p style="margin:8px 0 0;color:#8b7b6e;font-size:11px">${pageIndex + 1} / ${linePages.length}</p></div></div><section style="margin-top:28px"><table style="width:100%;table-layout:fixed;border-collapse:collapse;font-size:14px"><thead><tr><th style="width:40%;text-align:start;border-bottom:1px solid #ded0c1;padding:12px 4px;font-size:11px;color:#8b7b6e">${isAr ? "المنتج" : "Product"}</th><th style="width:15%;text-align:end;border-bottom:1px solid #ded0c1;padding:12px 4px;font-size:11px;color:#8b7b6e">${isAr ? "الكمية" : "Quantity"}</th><th style="width:22%;text-align:end;border-bottom:1px solid #ded0c1;padding:12px 4px;font-size:11px;color:#8b7b6e">${isAr ? "تكلفة الوحدة" : "Unit cost"}</th><th style="width:23%;text-align:end;border-bottom:1px solid #ded0c1;padding:12px 4px;font-size:11px;color:#8b7b6e">${isAr ? "الإجمالي" : "Total"}</th></tr></thead><tbody>${rows}</tbody></table>${footerTotal}</section>${isLastPage && movement.note ? `<p style="margin-top:28px;border-top:1px solid #ded0c1;padding-top:12px;color:#6f6258;font-size:12px"><strong>${isAr ? "ملاحظة" : "Note"}:</strong> ${escapeHtml(movement.note)}</p>` : ""}<div style="margin-top:28px;padding-top:12px;border-top:1px solid #ded0c1;color:#8b7b6e;font-size:11px;text-align:center">Eleganza Operations · ${escapeHtml(invoiceNumber)}</div></div>`;
      });
      await downloadPaginatedPdf({ pages, fileName: `eleganza-purchase-${safeInvoiceNumber}.pdf`, direction: dir });
    } catch {
      setDownloadError(isAr ? "تعذر إنشاء ملف الفاتورة. حاول مرة أخرى." : "Unable to create the invoice file. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="w-full max-w-3xl border border-border bg-card p-4 shadow-2xl sm:p-6" dir={dir} role="dialog" aria-modal="true" aria-labelledby="purchase-invoice-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="mb-4 flex items-start justify-between gap-4 border-b border-border pb-4">
        <div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-primary">{isAr ? "فاتورة مشتريات" : "Purchase invoice"}</p>
          <h2 id="purchase-invoice-title" className="mt-2 font-display text-3xl">{invoiceNumber}</h2>
        </div>
        <button type="button" className={quietButtonClass} aria-label={isAr ? "إغلاق" : "Close"} onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
      <div className="border border-border bg-[#fffaf3] p-5 text-[#312b25] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#9f523d] pb-6">
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-[#9f523d]">Eleganza Operations</p>
            <h3 className="mt-2 font-display text-3xl">{isAr ? "فاتورة شراء مخزون" : "Inventory purchase invoice"}</h3>
            <p className="mt-2 text-sm text-[#6f6258]">{isAr ? "مستند مشتق من عملية الشراء المسجلة في المخزون." : "Generated from the recorded inventory purchase."}</p>
          </div>
          <dl className="text-end text-sm">
            <div><dt className="text-xs text-[#8b7b6e]">{isAr ? "رقم الفاتورة" : "Invoice number"}</dt><dd className="mt-1 font-mono-ui font-semibold text-[#9f523d]" dir="ltr">{invoiceNumber}</dd></div>
            <div className="mt-3"><dt className="text-xs text-[#8b7b6e]">{isAr ? "التاريخ" : "Date"}</dt><dd className="mt-1">{dateLabel(movement.createdAt, language)}</dd></div>
          </dl>
        </div>
        <div className="mt-7 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-[#ded0c1] text-xs text-[#8b7b6e]"><tr><th className="pb-3 text-start">{isAr ? "المنتج" : "Product"}</th><th className="pb-3 text-end">{isAr ? "الكمية" : "Quantity"}</th><th className="pb-3 text-end">{isAr ? "تكلفة الوحدة" : "Unit cost"}</th><th className="pb-3 text-end">{isAr ? "الإجمالي" : "Total"}</th></tr></thead>
            <tbody>{lines.map((item) => <tr key={item.id} className="border-b border-[#e5dacf]"><td className="py-4 font-medium">{productNames.get(item.productId) ?? (isAr ? item.productNameAr || item.productNameEn || `منتج #${item.productId}` : item.productNameEn || `Product #${item.productId}`)}</td><td className="py-4 text-end font-mono-ui">{item.quantity}</td><td className="py-4 text-end">{item.unitCostMinor != null ? money(item.unitCostMinor, language) : "—"}</td><td className="py-4 text-end font-mono-ui">{item.unitCostMinor != null ? money(item.quantity * item.unitCostMinor, language) : "—"}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="mt-6 flex items-center justify-between border-t-2 border-[#312b25] pt-4 text-lg">
          <span>{isAr ? "الإجمالي" : "Total"}</span>
          <strong dir="ltr">{hasMissingCost ? "—" : money(totalMinor, language)}</strong>
        </div>
        {movement.note && <p className="mt-6 border-t border-[#ded0c1] pt-4 text-sm leading-6 text-[#6f6258]"><strong>{isAr ? "ملاحظة" : "Note"}:</strong> {movement.note}</p>}
      </div>
      {downloadError && <p className="mt-3 text-sm text-destructive">{downloadError}</p>}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" className={quietButtonClass} onClick={onClose}>{isAr ? "إغلاق" : "Close"}</button>
        <button type="button" className={buttonClass} onClick={downloadPdf} disabled={isDownloading}><Download className="h-4 w-4" />{isDownloading ? (isAr ? "جاري إنشاء الملف..." : "Creating file…") : (isAr ? "تنزيل الفاتورة PDF" : "Download invoice PDF")}</button>
      </div>
    </section>
  </div>;
}

function MovementDetailsModal({ movement, order, products, isLoading, isError, isAr, language, dir, onClose }: {
  movement: InventoryMovement;
  order?: Order;
  products: Product[];
  isLoading: boolean;
  isError: boolean;
  isAr: boolean;
  language: "en" | "ar";
  dir: "ltr" | "rtl";
  onClose: () => void;
}) {
  const productName = isAr ? movement.productNameAr || movement.productNameEn || `#${movement.productId}` : movement.productNameEn || `#${movement.productId}`;
  const productNames = new Map(products.map((product) => [product.id, isAr ? product.nameAr || product.nameEn : product.nameEn]));
  const orderItemsTotal = order?.items.reduce((sum, item) => sum + item.quantity * item.unitPriceMinor, 0) ?? 0;
  const detailRows = [
    { label: isAr ? "المنتج" : "Product", value: productName },
    { label: isAr ? "نوع الحركة" : "Movement type", value: movementTypeLabels[movement.type][isAr ? "ar" : "en"] },
    { label: isAr ? "التغيير" : "Change", value: `${movement.quantity > 0 ? "+" : ""}${movement.quantity}` },
    { label: isAr ? "قبل الحركة" : "Before", value: String(movement.quantityBefore) },
    { label: isAr ? "بعد الحركة" : "After", value: String(movement.quantityAfter) },
    { label: isAr ? "تكلفة الوحدة" : "Unit cost", value: movement.unitCostMinor != null ? money(movement.unitCostMinor, language) : "—" },
    { label: isAr ? "التاريخ" : "Date", value: dateLabel(movement.createdAt, language) },
  ];

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="w-full max-w-4xl border border-border bg-card p-5 shadow-2xl sm:p-7" dir={dir} role="dialog" aria-modal="true" aria-labelledby="movement-details-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-primary">{isAr ? "تفاصيل العملية" : "Transaction details"}</p>
          <h2 id="movement-details-title" className="mt-2 font-display text-3xl">{movement.invoiceReference || (isAr ? "حركة مخزون" : "Inventory movement")}</h2>
        </div>
        <button type="button" className={quietButtonClass} aria-label={isAr ? "إغلاق" : "Close"} onClick={onClose}><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.25fr]">
        <div>
          <h3 className="font-display text-2xl">{isAr ? "بيانات الحركة" : "Movement information"}</h3>
          <dl className="mt-4 grid gap-3 text-sm">
            {detailRows.map((row) => <div key={row.label} className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0"><dt className="text-muted-foreground">{row.label}</dt><dd className="text-end font-medium">{row.value}</dd></div>)}
          </dl>
          {movement.note && <p className="mt-5 border-t border-border pt-4 text-sm leading-6 text-muted-foreground"><strong className="font-medium text-foreground">{isAr ? "الملاحظة" : "Note"}:</strong> {movement.note}</p>}
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-2xl">{isAr ? "الفاتورة المرتبطة" : "Related invoice"}</h3>
          {isLoading && <LoadingState label={isAr ? "جاري تحميل الفاتورة..." : "Loading invoice..."} />}
          {isError && <ErrorState error={new Error(isAr ? "تعذر تحميل الفاتورة المرتبطة" : "Unable to load the related invoice")} />}
          {!isLoading && !isError && !order && <EmptyState title={isAr ? "لا توجد فاتورة مبيعات مرتبطة" : "No sales invoice linked"} detail={isAr ? "بيانات الحركة ورقم الفاتورة المسجل معروضان في الجهة الأخرى." : "The movement details and recorded invoice reference are shown beside this panel."} />}
          {order && <div className="mt-4 border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
              <div><p className="font-mono-ui text-xs text-primary">{order.orderNumber}</p><p className="mt-1 font-medium">{order.customerName}</p><p className="mt-1 text-xs text-muted-foreground">{order.customerPhone || (isAr ? "لا يوجد هاتف" : "No phone")}</p></div>
              <div className="text-end"><p className="text-xs capitalize text-muted-foreground">{order.status}</p><p className="mt-2 font-display text-2xl">{money(order.totalMinor, language)}</p></div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{order.customerAddress || (isAr ? "لا يوجد عنوان" : "No address")}</p>
            <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[420px] text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="py-2 text-start">{isAr ? "المنتج" : "Product"}</th><th className="py-2 text-end">{isAr ? "الكمية" : "Quantity"}</th><th className="py-2 text-end">{isAr ? "الإجمالي" : "Total"}</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id} className="border-b border-border last:border-0"><td className="py-3 font-medium">{productNames.get(item.productId) ?? `${isAr ? "منتج" : "Product"} #${item.productId}`}</td><td className="py-3 text-end">{item.quantity}</td><td className="py-3 text-end font-mono-ui">{money(item.quantity * item.unitPriceMinor, language)}</td></tr>)}</tbody><tfoot><tr className="font-semibold"><td colSpan={2} className="pt-4">{isAr ? "إجمالي المنتجات" : "Products total"}</td><td className="pt-4 text-end font-mono-ui">{money(orderItemsTotal, language)}</td></tr></tfoot></table></div>
          </div>}
        </div>
      </div>
    </section>
  </div>;
}

export default function Inventory() {
  const { language, role, permissions, dir } = useAdmin();
  const isAr = language === "ar";
  const canWrite = can(permissions, "inventory");
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<InventoryMovementType>("purchase");
  const [quantity, setQuantity] = useState("1");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [invoiceReference, setInvoiceReference] = useState("");
  const [note, setNote] = useState("");
  const [movementOpen, setMovementOpen] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<InventoryMovement | null>(null);
  const [purchaseInvoiceMovement, setPurchaseInvoiceMovement] = useState<InventoryMovement | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const products = useListProducts({ limit: 100 });
  const movements = useListInventoryMovements({ limit: 100 });
  const relatedOrders = useListOrders(
    { limit: 1, invoiceNumber: selectedMovement?.invoiceReference || undefined },
    { query: { enabled: selectedMovement?.invoiceReference != null, queryKey: ["/api/orders", "movement-invoice", selectedMovement?.id, selectedMovement?.invoiceReference] } },
  );
  const create = useCreateInventoryMovement();
  const remove = useDeleteInventoryMovement();

  function handleTypeChange(nextType: InventoryMovementType) {
    setType(nextType);
    if (nextType === "adjustment") {
      const product = products.data?.find((item) => item.id === Number(productId));
      setQuantity(String(product?.quantityOnHand ?? 0));
    } else {
      setQuantity("1");
    }
    if (nextType !== "purchase") setPurchasePrice("");
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const selectedProduct = products.data?.find((product) => product.id === Number(productId));
      const requestedQuantity = Number(quantity);
      const purchasePriceMinor = purchasePrice.trim() === "" ? undefined : Math.round(Number(purchasePrice) * 100);
      if (type === "purchase" && (purchasePriceMinor === undefined || !Number.isFinite(purchasePriceMinor) || purchasePriceMinor < 0)) {
        setMessage(isAr ? "أدخل سعر شراء صحيحًا للوحدة" : "Enter a valid purchase price per unit");
        return;
      }
      const movementQuantity = type === "adjustment" && selectedProduct
        ? requestedQuantity - selectedProduct.quantityOnHand
        : requestedQuantity;
      const payload: InventoryMovementInput = { productId: Number(productId), type, quantity: movementQuantity, unitCostMinor: purchasePriceMinor, invoiceReference: invoiceReference.trim() || undefined, note: note || undefined };
      await create.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ["/api/inventory/movements"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setProductId("");
      setType("purchase");
      setPurchasePrice("");
      setInvoiceReference("");
      setNote("");
      setQuantity("1");
      setMovementOpen(false);
      setMessage(isAr ? "تم تسجيل الحركة وتحديث الرصيد" : "Movement recorded and stock updated");
    } catch (error) { setMessage(getErrorMessage(error)); }
  }

  async function deleteMovement(id: number) {
    if (!window.confirm(isAr ? "حذف آخر حركة سيعيد الرصيد السابق. هل تريد المتابعة؟" : "Delete this latest movement and restore the previous stock balance?")) return;
    try {
      await remove.mutateAsync({ id });
      await queryClient.invalidateQueries({ queryKey: ["/api/inventory/movements"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setMessage(isAr ? "تم حذف الحركة وإرجاع الرصيد" : "Movement deleted and stock restored");
    } catch (error) { setMessage(getErrorMessage(error)); }
  }

  return <div>
    <PageHeader
      eyebrow={isAr ? "سلسلة التوريد" : "Supply chain"}
      title={isAr ? "المخزون" : "Inventory"}
      description={isAr ? "سجّل المشتريات، المرتجعات، التلف، والمبيعات مع أثر واضح." : "Record purchases, returns, damage, and adjustments with a clear stock trail."}
      action={canWrite && <button type="button" className={buttonClass} onClick={() => setMovementOpen(true)}><Plus className="h-3.5 w-3.5" />{isAr ? "حركة جديدة" : "New movement"}</button>}
    />
     <div className="grid gap-5">
       <Panel><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{movements.data?.length ?? 0} {isAr ? "حركة" : "entries"}</span>}>{isAr ? "سجل الحركات" : "Movement ledger"}</PanelTitle>{movements.isLoading && <LoadingState label={isAr ? "جاري تحميل سجل الحركات..." : "Loading movement ledger..."} />}{movements.isError && <ErrorState error={movements.error} onRetry={() => movements.refetch()} />}{movements.data?.length === 0 && <EmptyState title={isAr ? "لا توجد حركات" : "No movements yet"} detail={isAr ? "سيظهر سجل المخزون هنا بعد تسجيل أول حركة." : "Your stock trail will appear here."} />}{movements.data && movements.data.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[960px] text-sm"><thead className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground"><tr><th className="pb-3 text-start">{isAr ? "المنتج" : "Product"}</th><th className="pb-3 text-start">{isAr ? "نوع الحركة" : "Movement type"}</th><th className="ps-16 pe-6 pb-3 text-start">{isAr ? "رقم الفاتورة" : "Invoice number"}</th><th className="pb-3 text-end">{isAr ? "تكلفة الوحدة" : "Unit cost"}</th><th className="pb-3 text-end">{isAr ? "التغيير" : "Change"}</th><th className="pb-3 text-end">{isAr ? "قبل الحركة" : "Before"}</th><th className="pb-3 text-end">{isAr ? "بعد الحركة" : "After"}</th><th className="pb-3 text-end">{isAr ? "التاريخ" : "Date"}</th><th className="sticky end-0 z-10 bg-card pb-3 text-end shadow-[-8px_0_12px_hsl(var(--foreground)/.04)]">{isAr ? "الإجراء" : "Action"}</th></tr></thead><tbody>{movements.data.map((movement) => <tr key={movement.id} className="border-t border-border"><td className="py-3">{isAr ? movement.productNameAr || movement.productNameEn || `#${movement.productId}` : movement.productNameEn || `#${movement.productId}`}{movement.note && <span className="block text-xs text-muted-foreground">{movement.note}</span>}</td><td className="py-3">{movementTypeLabels[movement.type][isAr ? "ar" : "en"]}</td><td className="ps-16 pe-6 py-3 font-mono-ui text-xs">{movement.invoiceReference || "—"}</td><td className="py-3 text-end text-xs">{movement.unitCostMinor != null ? money(movement.unitCostMinor, language) : "—"}</td><td className={`py-3 text-end font-mono-ui ${movement.quantity < 0 ? "text-destructive" : "text-primary"}`}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</td><td className="py-3 text-end font-mono-ui">{movement.quantityBefore}</td><td className="py-3 text-end font-mono-ui">{movement.quantityAfter}</td><td className="py-3 text-end text-xs text-muted-foreground">{dateLabel(movement.createdAt, language)}</td><td className="sticky end-0 z-10 bg-card py-3 text-end shadow-[-8px_0_12px_hsl(var(--foreground)/.04)]"><div className="flex flex-wrap justify-end gap-2"><button type="button" className={quietButtonClass} onClick={() => setSelectedMovement(movement)} title={movement.orderId ? (isAr ? "عرض الفاتورة" : "View invoice") : (isAr ? "عرض الحركة" : "View movement")} aria-label={movement.orderId ? (isAr ? "عرض الفاتورة" : "View invoice") : (isAr ? "عرض الحركة" : "View movement")}><Eye className="h-3.5 w-3.5" /></button>{movement.type === "purchase" && <button type="button" className={quietButtonClass} onClick={() => setPurchaseInvoiceMovement(movement)} title={isAr ? "إنشاء فاتورة شراء" : "Create purchase invoice"} aria-label={isAr ? "إنشاء فاتورة شراء" : "Create purchase invoice"}><FileText className="h-3.5 w-3.5" /></button>}{(role === "owner" || role === "manager") && <button className={quietButtonClass} onClick={() => deleteMovement(movement.id)} disabled={remove.isPending} title={isAr ? "حذف آخر حركة" : "Delete latest movement"}><Trash2 className="h-3.5 w-3.5" /></button>}</div></td></tr>)}</tbody></table></div>}</Panel>
     </div>
     {movementOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setMovementOpen(false); }}>
       <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="new-movement-dialog-title">
         <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
           <div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-primary">{isAr ? "حركة مخزون جديدة" : "New inventory movement"}</p><h2 id="new-movement-dialog-title" className="mt-2 font-display text-2xl">{isAr ? "إضافة حركة" : "Add movement"}</h2></div>
           <button type="button" className={quietButtonClass} aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setMovementOpen(false)}><X className="h-4 w-4" /></button>
         </div>
         <form onSubmit={submit} className="mt-5 grid gap-4">
           <Field label={isAr ? "المنتج" : "Product"}><select className={inputClass} required value={productId} onChange={(event) => { const value = event.target.value; setProductId(value); if (type === "adjustment") { const product = products.data?.find((item) => item.id === Number(value)); setQuantity(String(product?.quantityOnHand ?? 0)); } }}><option value="">{isAr ? "اختر المنتج" : "Select a product"}</option>{products.data?.map((product) => <option key={product.id} value={product.id}>{isAr ? product.nameAr || product.nameEn : product.nameEn} · {product.quantityOnHand} {isAr ? "في المخزون" : "in stock"}</option>)}</select></Field>
            <Field label={isAr ? "النوع" : "Movement type"}>
              <Select dir={dir} value={type} onValueChange={(value) => handleTypeChange(value as InventoryMovementType)}>
                <SelectTrigger className={`${inputClass} justify-between`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-popover text-popover-foreground shadow-xl">
                  <SelectItem value="purchase">{isAr ? "شراء · إضافة" : "Purchase · add"}</SelectItem>
                  <SelectItem value="return">{isAr ? "مرتجع · إضافة" : "Return · add"}</SelectItem>
                  <SelectItem value="damage">{isAr ? "تالف · خصم" : "Damage · remove"}</SelectItem>
                  <SelectItem value="sale">{isAr ? "بيع · خصم" : "Sale · remove"}</SelectItem>
                  {role === "owner" && <SelectItem value="adjustment">{isAr ? "تسوية · رصيد مستهدف" : "Reconcile · target stock"}</SelectItem>}
                </SelectContent>
              </Select>
            </Field>
           {type === "purchase" && <Field label={isAr ? "سعر الشراء للوحدة" : "Purchase price per unit"} hint={isAr ? "بالدينار الليبي، وسيُستخدم لاحتساب تكلفة المخزون." : "In LYD; used to calculate inventory cost."}><input className={inputClass} type="number" min="0" step="0.01" required value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} placeholder={isAr ? "مثال: 35.50" : "e.g. 35.50"} /></Field>}
            {type === "purchase" && <Field label={isAr ? "رقم الفاتورة" : "Invoice number"} hint={isAr ? "أدرج رقم الفاتورة" : "Enter the invoice number"}><input className={inputClass} required value={invoiceReference} onChange={(event) => setInvoiceReference(event.target.value)} placeholder={isAr ? "أدرج رقم الفاتورة" : "Enter the invoice number"} /></Field>}
           <Field label={type === "adjustment" ? (isAr ? "الرصيد المستهدف" : "Target stock") : (isAr ? "الكمية" : "Quantity")} hint={type === "adjustment" ? (isAr ? "سيحسب النظام الفرق تلقائيًا مقارنة بالرصيد الحالي." : "The system calculates the delta from the current balance.") : undefined}><input className={inputClass} type="number" min="0" required value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
           <Field label={isAr ? "ملاحظة" : "Note"}><textarea className="min-h-20 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" value={note} onChange={(event) => setNote(event.target.value)} /></Field>
           <div className="flex flex-wrap gap-2"><button className={buttonClass} disabled={create.isPending}><Boxes className="h-4 w-4" />{create.isPending ? "Saving…" : (isAr ? "تسجيل الحركة" : "Record movement")}</button><button type="button" className={quietButtonClass} onClick={() => setMovementOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</button></div>
         </form>
       </div>
     </div>}
      {selectedMovement && <MovementDetailsModal movement={selectedMovement} order={relatedOrders.data?.find((order) => order.id === selectedMovement.orderId) ?? relatedOrders.data?.[0]} products={products.data ?? []} isLoading={relatedOrders.isLoading} isError={relatedOrders.isError} isAr={isAr} language={language} dir={dir} onClose={() => setSelectedMovement(null)} />}
      {purchaseInvoiceMovement && <PurchaseInvoiceModal movement={purchaseInvoiceMovement} movements={movements.data ?? []} products={products.data ?? []} isAr={isAr} language={language} dir={dir} onClose={() => setPurchaseInvoiceMovement(null)} />}
     <Toast message={message} onClose={() => setMessage(null)} />
  </div>;
}
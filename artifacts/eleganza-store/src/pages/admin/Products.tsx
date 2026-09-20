import { Edit3, FileText, Plus, RefreshCw, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCreateProduct, useGetProductReport, useListProducts, useSyncShopify, useUpdateProduct, type Product, type ProductInput, type ProductReport } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { buttonClass, can, dateLabel, EmptyState, ErrorState, Field, getErrorMessage, inputClass, LoadingState, money, PageHeader, Panel, PanelTitle, quietButtonClass, textareaClass, Toast, useAdmin } from "@/components/admin/AdminUI";

const emptyForm: ProductInput = { sku: "", nameEn: "", nameAr: "", category: "fragrance", salePriceMinor: 0, costMinor: 0, reorderThreshold: 3, quantityOnHand: 0, imageUrls: [], active: true };

export default function Products() {
  const { language, permissions } = useAdmin();
  const isAr = language === "ar";
  const canEdit = can(permissions, "manager");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [reportProductId, setReportProductId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const products = useListProducts({ limit: 100, search: search || undefined });
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const sync = useSyncShopify();
  const report = useGetProductReport(reportProductId ?? 0, { query: { queryKey: ["/api/products", "report", reportProductId], enabled: reportProductId !== null } });

  useEffect(() => {
    if (editing) {
      setForm({ sku: editing.sku, nameEn: editing.nameEn, nameAr: editing.nameAr, descriptionEn: editing.descriptionEn ?? "", descriptionAr: editing.descriptionAr ?? "", category: editing.category, salePriceMinor: editing.salePriceMinor, costMinor: editing.costMinor, reorderThreshold: editing.reorderThreshold, imageUrls: editing.imageUrls, active: editing.active });
    } else if (creating) {
      setForm(emptyForm);
    }
  }, [editing, creating]);

  const categories = useMemo(() => Array.from(new Set((products.data ?? []).map((product) => product.category))), [products.data]);
  const updateField = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const setNumber = (key: "salePriceMinor" | "costMinor" | "reorderThreshold" | "quantityOnHand", value: string) => updateField(key, Math.max(0, Number(value) || 0));
  const setSalePrice = (value: string) => updateField("salePriceMinor", Math.max(0, Math.round((Number(value) || 0) * 100)));
  const setCostPrice = (value: string) => updateField("costMinor", Math.max(0, Math.round((Number(value) || 0) * 100)));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      const payload = { ...form, imageUrls: (form.imageUrls ?? []).filter(Boolean) };
      if (editing) await update.mutateAsync({ id: editing.id, data: payload });
      else await create.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setEditing(null);
      setCreating(false);
      setMessage(isAr ? "تم حفظ المنتج" : "Product saved");
    } catch (error) { setMessage(getErrorMessage(error)); }
  }

  async function syncShopify() {
    try {
      const result = await sync.mutateAsync();
      await queryClient.invalidateQueries();
      setMessage(isAr ? `تم تحديث ${result.syncedProducts} منتجًا` : `${result.syncedProducts} products synced`);
    } catch (error) { setMessage(getErrorMessage(error)); }
  }

  return <div>
     <PageHeader eyebrow={isAr ? "الكتالوج" : "Catalogue"} title={isAr ? "المنتجات" : "Products"} description={isAr ? "إدارة بيانات المنتجات والأسعار وحدود إعادة الطلب. أدخل المخزون يدويًا؛ ربط Shopify لا يغيّر الرصيد المحلي." : "Keep product data, pricing, and reorder levels in one place. Enter stock manually; Shopify mapping does not change local quantities."} action={<>{canEdit && <button className={buttonClass} onClick={() => { setEditing(null); setCreating(true); }}><Plus className="h-3.5 w-3.5" />{isAr ? "منتج جديد" : "New product"}</button>}{canEdit && <button className={quietButtonClass} onClick={syncShopify} disabled={sync.isPending}><RefreshCw className={`h-3.5 w-3.5 ${sync.isPending ? "animate-spin" : ""}`} />{isAr ? "ربط Shopify" : "Sync Shopify mapping"}</button>}</>} />
     {creating && canEdit && <Panel className="mb-5"><PanelTitle>{isAr ? "إضافة منتج" : "Add a product"}</PanelTitle><ProductForm form={form} updateField={updateField} setNumber={setNumber} setSalePrice={setSalePrice} setCostPrice={setCostPrice} onSubmit={save} onCancel={() => setCreating(false)} busy={create.isPending} language={language} /></Panel>}
    <Panel>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl">{isAr ? "كتالوج Eleganza" : "Eleganza catalogue"}</h2><p className="mt-1 text-sm text-muted-foreground">{products.data?.length ?? 0} {isAr ? "منتج" : "products"}</p></div><label className="relative block sm:w-72"><Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" /><input className={`${inputClass} ps-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isAr ? "ابحث بالاسم الإنجليزي" : "Search by English name"} /></label></div>
      {products.isLoading && <LoadingState />}{products.isError && <ErrorState error={products.error} onRetry={() => products.refetch()} />}{products.data?.length === 0 && <EmptyState title={isAr ? "لا توجد منتجات" : "No products found"} detail={isAr ? "أضف أول منتج أو غيّر عبارة البحث." : "Add the first product or change the search."} />}
       {products.data && products.data.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground"><tr><th className="pb-3 text-start">{isAr ? "المنتج" : "Product"}</th><th className="pb-3 text-start">SKU</th><th className="pb-3 text-start">{isAr ? "الفئة" : "Category"}</th><th className="pb-3 text-end">{isAr ? "السعر" : "Price"}</th><th className="pb-3 text-end">{isAr ? "المخزون" : "Stock"}</th><th className="pb-3 text-end">{isAr ? "الحالة" : "Status"}</th><th className="pb-3 text-end">{isAr ? "التفاصيل" : "Details"}</th></tr></thead><tbody>{products.data.map((product) => <tr key={product.id} className="border-t border-border"><td className="py-4"><p className="font-medium">{isAr ? product.nameAr : product.nameEn}</p><p className="mt-1 text-xs text-muted-foreground">{isAr ? product.nameEn : product.nameAr}</p></td><td className="py-4 font-mono-ui text-xs">{product.sku}</td><td className="py-4 capitalize text-muted-foreground">{product.category}</td><td className="py-4 text-end">{money(product.salePriceMinor, language)}</td><td className={`py-4 text-end font-mono-ui ${product.quantityOnHand <= product.reorderThreshold ? "text-destructive" : ""}`}>{product.quantityOnHand}</td><td className="py-4 text-end"><span className={`border px-2 py-1 text-[10px] uppercase tracking-[.12em] ${product.active ? "border-primary/30 text-primary" : "border-border text-muted-foreground"}`}>{product.active ? (isAr ? "نشط" : "Active") : (isAr ? "مخفي" : "Hidden")}</span></td><td className="py-4 text-end"><div className="flex flex-wrap justify-end gap-3">{<button className="inline-flex items-center gap-1 text-xs text-primary hover:underline" onClick={() => setReportProductId(product.id)}><FileText className="h-3.5 w-3.5" />{isAr ? "التقرير" : "Report"}</button>}{canEdit && <button className="inline-flex items-center gap-1 text-xs text-primary hover:underline" onClick={() => { setCreating(false); setEditing(product); }}><Edit3 className="h-3.5 w-3.5" />{isAr ? "تعديل" : "Edit"}</button>}</div></td></tr>)}</tbody></table></div>}
    </Panel>
     {editing && <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-foreground/20 p-5 pt-16"><div className="w-full max-w-3xl bg-card p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-3xl">{isAr ? "تعديل المنتج" : "Edit product"}</h2><button className="text-sm text-muted-foreground" onClick={() => setEditing(null)}>×</button></div><ProductForm form={form} updateField={updateField} setNumber={setNumber} setSalePrice={setSalePrice} setCostPrice={setCostPrice} onSubmit={save} onCancel={() => setEditing(null)} busy={update.isPending} language={language} /></div></div>}
      {reportProductId !== null && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-foreground/40 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setReportProductId(null); }}><div className="flex max-h-[calc(100vh-1.5rem)] w-full max-w-6xl flex-col border border-border bg-card shadow-2xl sm:max-h-[calc(100vh-3rem)]" role="dialog" aria-modal="true" aria-labelledby="product-report-title"><div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-5 sm:p-7"><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">{isAr ? "تقرير الصنف" : "Product report"}</p><h2 id="product-report-title" className="mt-2 font-display text-3xl">{isAr ? "تفاصيل المنتج وحركته" : "Product details and activity"}</h2></div><button className={quietButtonClass} onClick={() => setReportProductId(null)} aria-label={isAr ? "إغلاق التقرير" : "Close report"}><X className="h-4 w-4" /></button></div><div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-7 sm:pt-6">{report.isLoading && <LoadingState label={isAr ? "جاري تحميل تقرير الصنف..." : "Loading product report..."} />}{report.isError && <ErrorState error={report.error} onRetry={() => report.refetch()} />}{report.data && <ProductReportView report={report.data} language={language} />}</div></div></div>}
    <Toast message={message} onClose={() => setMessage(null)} />
  </div>;
}

function ProductReportView({ report, language }: { report: ProductReport; language: "en" | "ar" }) {
  const isAr = language === "ar";
  const productName = isAr ? report.product.nameAr || report.product.nameEn : report.product.nameEn;
  const movementTypeLabels = {
    purchase: isAr ? "شراء" : "Purchase",
    sale: isAr ? "بيع" : "Sale",
    return: isAr ? "مرتجع" : "Return",
    damage: isAr ? "تالف" : "Damage",
    adjustment: isAr ? "تسوية" : "Adjustment",
  };
  const statCards = [
    { label: isAr ? "الرصيد الحالي" : "Current stock", value: String(report.product.quantityOnHand) },
    { label: isAr ? "متوسط تكلفة التوريد" : "Weighted average cost", value: money(report.summary.weightedAverageCostMinor, language) },
    { label: isAr ? "قيمة المخزون الحالية" : "Current inventory value", value: money(report.summary.currentInventoryValueMinor, language) },
    { label: isAr ? "عدد الحركات" : "Movement count", value: String(report.summary.movementCount) },
  ];

  return <div className="grid min-w-0 gap-6">
    <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-4">{statCards.map((card) => <div key={card.label} className="flex min-h-28 min-w-0 flex-col justify-between border border-border bg-background p-4"><p className="text-xs leading-5 text-muted-foreground">{card.label}</p><p className="mt-3 break-words font-display text-2xl">{card.value}</p></div>)}</div>
    <div className="grid items-stretch gap-5 lg:grid-cols-2">
      <Panel className="h-full"><PanelTitle>{isAr ? "بيانات الصنف" : "Product information"}</PanelTitle><dl className="grid gap-3 text-sm"><ReportRow label="SKU" value={report.product.sku} /><ReportRow label={isAr ? "الفئة" : "Category"} value={report.product.category} /><ReportRow label={isAr ? "سعر البيع" : "Sale price"} value={money(report.product.salePriceMinor, language)} /><ReportRow label={isAr ? "التكلفة الحالية" : "Current cost"} value={money(report.product.costMinor, language)} /><ReportRow label={isAr ? "حد إعادة الطلب" : "Reorder threshold"} value={String(report.product.reorderThreshold)} /><ReportRow label={isAr ? "الحالة" : "Status"} value={report.product.active ? (isAr ? "نشط" : "Active") : (isAr ? "مخفي" : "Hidden")} /></dl>{(isAr ? report.product.descriptionAr : report.product.descriptionEn) && <p className="mt-5 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">{isAr ? report.product.descriptionAr : report.product.descriptionEn}</p>}</Panel>
      <Panel className="h-full"><PanelTitle>{isAr ? "ملخص الحركات" : "Movement summary"}</PanelTitle><div className="grid gap-x-6 gap-y-4 sm:grid-cols-2"><ReportRow label={isAr ? "المشتريات" : "Purchases"} value={`${report.summary.purchaseQuantity} · ${money(report.summary.purchaseCostMinor, language)}`} /><ReportRow label={isAr ? "المرتجعات" : "Returns"} value={String(report.summary.returnQuantity)} /><ReportRow label={isAr ? "المبيعات" : "Sales"} value={String(report.summary.saleQuantity)} /><ReportRow label={isAr ? "التالف" : "Damaged"} value={String(report.summary.damageQuantity)} /><ReportRow label={isAr ? "صافي التسويات" : "Net adjustments"} value={String(report.summary.adjustmentQuantity)} /><ReportRow label={isAr ? "إجمالي الداخل" : "Total inbound"} value={String(report.summary.inboundQuantity)} /><ReportRow label={isAr ? "إجمالي الخارج" : "Total outbound"} value={String(report.summary.outboundQuantity)} /></div></Panel>
    </div>
    <Panel className="min-w-0"><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{report.movements.length} {isAr ? "حركة" : "movements"}</span>}>{isAr ? "سجل حركات الصنف" : "Product movement history"}</PanelTitle>{report.movements.length === 0 ? <EmptyState title={isAr ? "لا توجد حركات" : "No movements yet"} detail={isAr ? "لم يتم تسجيل حركة لهذا الصنف بعد." : "No movement has been recorded for this product yet."} /> : <div className="overflow-x-auto"><table className="w-full min-w-[1160px] text-sm"><thead className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground"><tr><th className="pb-3 text-start">{isAr ? "التاريخ" : "Date"}</th><th className="pb-3 text-start">{isAr ? "الحركة" : "Movement"}</th><th className="pb-3 text-end">{isAr ? "الكمية" : "Quantity"}</th><th className="pb-3 text-end">{isAr ? "تكلفة الوحدة" : "Unit cost"}</th><th className="pb-3 text-end">{isAr ? "إجمالي القيمة" : "Total value"}</th><th className="pb-3 text-end">{isAr ? "قبل" : "Before"}</th><th className="pb-3 text-end">{isAr ? "بعد" : "After"}</th><th className="pb-3 text-start">{isAr ? "المرجع" : "Reference"}</th><th className="pb-3 text-start">{isAr ? "الملاحظة" : "Note"}</th></tr></thead><tbody>{report.movements.map((movement) => <tr key={movement.id} className="border-t border-border"><td className="py-3 text-xs text-muted-foreground">{dateLabel(movement.createdAt, language)}</td><td className="py-3">{movementTypeLabels[movement.type]}</td><td className={`py-3 text-end font-mono-ui ${movement.quantity < 0 ? "text-destructive" : "text-primary"}`}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</td><td className="py-3 text-end text-xs">{movement.unitCostMinor != null ? money(movement.unitCostMinor, language) : "—"}</td><td className="py-3 text-end text-xs font-medium">{money(movement.totalValueMinor, language)}</td><td className="py-3 text-end font-mono-ui">{movement.quantityBefore}</td><td className="py-3 text-end font-mono-ui">{movement.quantityAfter}</td><td className="py-3 text-start font-mono-ui text-xs">{movement.orderId ? `#${movement.orderId}` : "—"}</td><td className="max-w-52 py-3 text-start text-xs text-muted-foreground">{movement.note || "—"}</td></tr>)}</tbody></table></div>}</Panel>
  </div>;
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4 border-b border-border/70 pb-2 last:border-0"><dt className="text-muted-foreground">{label}</dt><dd className="text-end font-medium">{value}</dd></div>;
}

function ProductForm({ form, updateField, setNumber, setSalePrice, setCostPrice, onSubmit, onCancel, busy, language }: { form: ProductInput; updateField: <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => void; setNumber: (key: "salePriceMinor" | "costMinor" | "reorderThreshold" | "quantityOnHand", value: string) => void; setSalePrice: (value: string) => void; setCostPrice: (value: string) => void; onSubmit: (event: React.FormEvent) => void; onCancel: () => void; busy: boolean; language: "en" | "ar" }) {
  const isAr = language === "ar";
  return <form onSubmit={onSubmit} className="grid gap-5"><div className="grid gap-4 md:grid-cols-2"><Field label="SKU"><input className={inputClass} required value={form.sku} onChange={(event) => updateField("sku", event.target.value)} /></Field><Field label={isAr ? "الفئة" : "Category"}><select className={inputClass} value={form.category} onChange={(event) => updateField("category", event.target.value)}><option value="fragrance">Fragrance</option><option value="makeup">Makeup</option><option value="accessories">Accessories</option><option value="skincare">Skincare</option></select></Field><Field label="Name in English"><input className={inputClass} required value={form.nameEn} onChange={(event) => updateField("nameEn", event.target.value)} /></Field><Field label="الاسم بالعربية"><input className={inputClass} required dir="rtl" value={form.nameAr} onChange={(event) => updateField("nameAr", event.target.value)} /></Field><Field label={isAr ? "سعر البيع (دينار ليبي)" : "Sale price (LYD)"} hint={isAr ? "اكتب المبلغ بالدينار، مثل 185.50" : "Enter the amount in LYD, e.g. 185.50"}><input className={inputClass} type="number" min="0" step="0.01" required value={(form.salePriceMinor / 100).toFixed(2)} onChange={(event) => setSalePrice(event.target.value)} /></Field><Field label={isAr ? "التكلفة (دينار ليبي)" : "Cost (LYD)"} hint={isAr ? "اكتب المبلغ بالدينار، مثل 35.50" : "Enter the amount in LYD, e.g. 35.50"}><input className={inputClass} type="number" min="0" step="0.01" required value={(form.costMinor / 100).toFixed(2)} onChange={(event) => setCostPrice(event.target.value)} /></Field><Field label={isAr ? "حد إعادة الطلب" : "Reorder threshold"}><input className={inputClass} type="number" min="0" required value={form.reorderThreshold} onChange={(event) => setNumber("reorderThreshold", event.target.value)} /></Field><Field label={isAr ? "الكمية الافتتاحية" : "Opening quantity"}><input className={inputClass} type="number" min="0" value={form.quantityOnHand ?? 0} onChange={(event) => setNumber("quantityOnHand", event.target.value)} /></Field></div><div className="grid gap-4 md:grid-cols-2"><Field label="Description in English"><textarea className={textareaClass} value={form.descriptionEn ?? ""} onChange={(event) => updateField("descriptionEn", event.target.value)} /></Field><Field label="الوصف بالعربية"><textarea className={textareaClass} dir="rtl" value={form.descriptionAr ?? ""} onChange={(event) => updateField("descriptionAr", event.target.value)} /></Field></div><Field label="Image URLs" hint="Separate multiple URLs with commas"><input className={inputClass} value={(form.imageUrls ?? []).join(", ")} onChange={(event) => updateField("imageUrls", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} /></Field><div className="flex justify-end gap-2"><button type="button" className={quietButtonClass} onClick={onCancel}>{isAr ? "إلغاء" : "Cancel"}</button><button className={buttonClass} disabled={busy}>{busy ? (isAr ? "جاري الحفظ..." : "Saving…") : (isAr ? "حفظ المنتج" : "Save product")}</button></div></form>;
}
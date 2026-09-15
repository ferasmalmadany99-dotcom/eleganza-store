import { Edit3, Plus, RefreshCw, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCreateProduct, useListProducts, useSyncShopify, useUpdateProduct, type Product, type ProductInput } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { buttonClass, can, EmptyState, ErrorState, Field, getErrorMessage, inputClass, LoadingState, money, PageHeader, Panel, PanelTitle, quietButtonClass, textareaClass, Toast, useAdmin } from "@/components/admin/AdminUI";

const emptyForm: ProductInput = { sku: "", nameEn: "", nameAr: "", category: "fragrance", salePriceMinor: 0, costMinor: 0, reorderThreshold: 3, quantityOnHand: 0, imageUrls: [], active: true };

export default function Products() {
  const { language, role } = useAdmin();
  const isAr = language === "ar";
  const canEdit = can(role, "manager");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);
  const products = useListProducts({ limit: 100, search: search || undefined });
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const sync = useSyncShopify();

  useEffect(() => {
    if (editing) setForm({ sku: editing.sku, nameEn: editing.nameEn, nameAr: editing.nameAr, descriptionEn: editing.descriptionEn ?? "", descriptionAr: editing.descriptionAr ?? "", category: editing.category, salePriceMinor: editing.salePriceMinor, costMinor: editing.costMinor, reorderThreshold: editing.reorderThreshold, imageUrls: editing.imageUrls, active: editing.active });
    else setForm(emptyForm);
  }, [editing]);

  const categories = useMemo(() => Array.from(new Set((products.data ?? []).map((product) => product.category))), [products.data]);
  const updateField = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => setForm((current) => ({ ...current, [key]: value }));
  const setNumber = (key: "salePriceMinor" | "costMinor" | "reorderThreshold" | "quantityOnHand", value: string) => updateField(key, Math.max(0, Number(value) || 0));

  async function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      const payload = { ...form, imageUrls: (form.imageUrls ?? []).filter(Boolean) };
      if (editing) await update.mutateAsync({ id: editing.id, data: payload });
      else await create.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setEditing(null);
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
    <PageHeader eyebrow={isAr ? "الكتالوج" : "Catalogue"} title={isAr ? "المنتجات" : "Products"} description={isAr ? "إدارة بيانات المنتجات والأسعار وحدود إعادة الطلب." : "Keep product data, pricing, imagery, and reorder levels in one place."} action={<>{canEdit && <button className={buttonClass} onClick={() => setEditing(null)}><Plus className="h-3.5 w-3.5" />{isAr ? "منتج جديد" : "New product"}</button>}{canEdit && <button className={quietButtonClass} onClick={syncShopify} disabled={sync.isPending}><RefreshCw className={`h-3.5 w-3.5 ${sync.isPending ? "animate-spin" : ""}`} />{isAr ? "مزامنة" : "Sync"}</button>}</>} />
    {editing === null && canEdit && <Panel className="mb-5"><PanelTitle>{isAr ? "إضافة منتج" : "Add a product"}</PanelTitle><ProductForm form={form} updateField={updateField} setNumber={setNumber} onSubmit={save} onCancel={() => setEditing(null)} busy={create.isPending} language={language} /></Panel>}
    <Panel>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl">{isAr ? "كتالوج Eleganza" : "Eleganza catalogue"}</h2><p className="mt-1 text-sm text-muted-foreground">{products.data?.length ?? 0} {isAr ? "منتج" : "products"}</p></div><label className="relative block sm:w-72"><Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" /><input className={`${inputClass} ps-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isAr ? "ابحث بالاسم الإنجليزي" : "Search by English name"} /></label></div>
      {products.isLoading && <LoadingState />}{products.isError && <ErrorState error={products.error} onRetry={() => products.refetch()} />}{products.data?.length === 0 && <EmptyState title={isAr ? "لا توجد منتجات" : "No products found"} detail={isAr ? "أضف أول منتج أو غيّر عبارة البحث." : "Add the first product or change the search."} />}
      {products.data && products.data.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-sm"><thead className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-muted-foreground"><tr><th className="pb-3 text-start">Product</th><th className="pb-3 text-start">SKU</th><th className="pb-3 text-start">Category</th><th className="pb-3 text-end">Price</th><th className="pb-3 text-end">Stock</th><th className="pb-3 text-end">Status</th><th /></tr></thead><tbody>{products.data.map((product) => <tr key={product.id} className="border-t border-border"><td className="py-4"><p className="font-medium">{isAr ? product.nameAr : product.nameEn}</p><p className="mt-1 text-xs text-muted-foreground">{isAr ? product.nameEn : product.nameAr}</p></td><td className="py-4 font-mono-ui text-xs">{product.sku}</td><td className="py-4 capitalize text-muted-foreground">{product.category}</td><td className="py-4 text-end">{money(product.salePriceMinor, language)}</td><td className={`py-4 text-end font-mono-ui ${product.quantityOnHand <= product.reorderThreshold ? "text-destructive" : ""}`}>{product.quantityOnHand}</td><td className="py-4 text-end"><span className={`border px-2 py-1 text-[10px] uppercase tracking-[.12em] ${product.active ? "border-primary/30 text-primary" : "border-border text-muted-foreground"}`}>{product.active ? "Active" : "Hidden"}</span></td><td className="py-4 text-end">{canEdit && <button className="inline-flex items-center gap-1 text-xs text-primary hover:underline" onClick={() => setEditing(product)}><Edit3 className="h-3.5 w-3.5" />Edit</button>}</td></tr>)}</tbody></table></div>}
    </Panel>
    {editing && <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-foreground/20 p-5 pt-16"><div className="w-full max-w-3xl bg-card p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-3xl">{isAr ? "تعديل المنتج" : "Edit product"}</h2><button className="text-sm text-muted-foreground" onClick={() => setEditing(null)}>×</button></div><ProductForm form={form} updateField={updateField} setNumber={setNumber} onSubmit={save} onCancel={() => setEditing(null)} busy={update.isPending} language={language} /></div></div>}
    <Toast message={message} onClose={() => setMessage(null)} />
  </div>;
}

function ProductForm({ form, updateField, setNumber, onSubmit, onCancel, busy, language }: { form: ProductInput; updateField: <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => void; setNumber: (key: "salePriceMinor" | "costMinor" | "reorderThreshold" | "quantityOnHand", value: string) => void; onSubmit: (event: React.FormEvent) => void; onCancel: () => void; busy: boolean; language: "en" | "ar" }) {
  const isAr = language === "ar";
  return <form onSubmit={onSubmit} className="grid gap-5"><div className="grid gap-4 md:grid-cols-2"><Field label="SKU"><input className={inputClass} required value={form.sku} onChange={(event) => updateField("sku", event.target.value)} /></Field><Field label={isAr ? "الفئة" : "Category"}><select className={inputClass} value={form.category} onChange={(event) => updateField("category", event.target.value)}><option value="fragrance">Fragrance</option><option value="makeup">Makeup</option><option value="accessories">Accessories</option><option value="skincare">Skincare</option></select></Field><Field label="Name in English"><input className={inputClass} required value={form.nameEn} onChange={(event) => updateField("nameEn", event.target.value)} /></Field><Field label="الاسم بالعربية"><input className={inputClass} required dir="rtl" value={form.nameAr} onChange={(event) => updateField("nameAr", event.target.value)} /></Field><Field label="Sale price (minor units)" hint="1000 = 10.00 LYD"><input className={inputClass} type="number" min="0" required value={form.salePriceMinor} onChange={(event) => setNumber("salePriceMinor", event.target.value)} /></Field><Field label="Cost (minor units)"><input className={inputClass} type="number" min="0" required value={form.costMinor} onChange={(event) => setNumber("costMinor", event.target.value)} /></Field><Field label="Reorder threshold"><input className={inputClass} type="number" min="0" required value={form.reorderThreshold} onChange={(event) => setNumber("reorderThreshold", event.target.value)} /></Field><Field label="Opening quantity"><input className={inputClass} type="number" min="0" value={form.quantityOnHand ?? 0} onChange={(event) => setNumber("quantityOnHand", event.target.value)} /></Field></div><div className="grid gap-4 md:grid-cols-2"><Field label="Description in English"><textarea className={textareaClass} value={form.descriptionEn ?? ""} onChange={(event) => updateField("descriptionEn", event.target.value)} /></Field><Field label="الوصف بالعربية"><textarea className={textareaClass} dir="rtl" value={form.descriptionAr ?? ""} onChange={(event) => updateField("descriptionAr", event.target.value)} /></Field></div><Field label="Image URLs" hint="Separate multiple URLs with commas"><input className={inputClass} value={(form.imageUrls ?? []).join(", ")} onChange={(event) => updateField("imageUrls", event.target.value.split(",").map((value) => value.trim()).filter(Boolean))} /></Field><div className="flex justify-end gap-2"><button type="button" className={quietButtonClass} onClick={onCancel}>Cancel</button><button className={buttonClass} disabled={busy}>{busy ? "Saving…" : "Save product"}</button></div></form>;
}
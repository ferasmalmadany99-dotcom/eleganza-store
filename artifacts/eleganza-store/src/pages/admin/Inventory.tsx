import { Boxes, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useCreateInventoryMovement, useDeleteInventoryMovement, useListInventoryMovements, useListProducts, type InventoryMovementInput, type InventoryMovementType } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { buttonClass, can, EmptyState, ErrorState, Field, getErrorMessage, inputClass, LoadingState, PageHeader, Panel, PanelTitle, quietButtonClass, Toast, useAdmin, dateLabel } from "@/components/admin/AdminUI";

export default function Inventory() {
  const { language, role } = useAdmin();
  const isAr = language === "ar";
  const canWrite = can(role, "inventory");
  const [productId, setProductId] = useState("");
  const [type, setType] = useState<InventoryMovementType>("purchase");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const products = useListProducts({ limit: 100 });
  const movements = useListInventoryMovements({ limit: 100 });
  const create = useCreateInventoryMovement();
  const remove = useDeleteInventoryMovement();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      const selectedProduct = products.data?.find((product) => product.id === Number(productId));
      const requestedQuantity = Number(quantity);
      const movementQuantity = type === "adjustment" && selectedProduct
        ? requestedQuantity - selectedProduct.quantityOnHand
        : requestedQuantity;
      const payload: InventoryMovementInput = { productId: Number(productId), type, quantity: movementQuantity, note: note || undefined };
      await create.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ["/api/inventory/movements"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setNote(""); setQuantity("1"); setMessage(isAr ? "تم تسجيل الحركة وتحديث الرصيد" : "Movement recorded and stock updated");
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

  return <div><PageHeader eyebrow={isAr ? "سلسلة التوريد" : "Supply chain"} title={isAr ? "المخزون" : "Inventory"} description={isAr ? "سجّل المشتريات، المرتجعات، التلف، والمبيعات مع أثر واضح." : "Record purchases, returns, damage, and adjustments with a clear stock trail."} />
    <div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
       {canWrite && <Panel><PanelTitle><span className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" />{isAr ? "حركة جديدة" : "New movement"}</span></PanelTitle><form onSubmit={submit} className="grid gap-4"><Field label={isAr ? "المنتج" : "Product"}><select className={inputClass} required value={productId} onChange={(event) => { const value = event.target.value; setProductId(value); if (type === "adjustment") { const product = products.data?.find((item) => item.id === Number(value)); setQuantity(String(product?.quantityOnHand ?? 0)); } }}><option value="">Select a product</option>{products.data?.map((product) => <option key={product.id} value={product.id}>{isAr ? product.nameAr || product.nameEn : product.nameEn} · {product.quantityOnHand} in stock</option>)}</select></Field><Field label={isAr ? "النوع" : "Movement type"}><select className={inputClass} value={type} onChange={(event) => { const nextType = event.target.value as InventoryMovementType; setType(nextType); if (nextType === "adjustment") { const product = products.data?.find((item) => item.id === Number(productId)); setQuantity(String(product?.quantityOnHand ?? 0)); } else { setQuantity("1"); } }}><option value="purchase">{isAr ? "شراء · إضافة" : "Purchase · add"}</option><option value="return">{isAr ? "مرتجع · إضافة" : "Return · add"}</option><option value="damage">{isAr ? "تالف · خصم" : "Damage · remove"}</option><option value="sale">{isAr ? "بيع · خصم" : "Sale · remove"}</option>{role === "owner" && <option value="adjustment">{isAr ? "تسوية · رصيد مستهدف" : "Reconcile · target stock"}</option>}</select></Field><Field label={type === "adjustment" ? (isAr ? "الرصيد المستهدف" : "Target stock") : (isAr ? "الكمية" : "Quantity")} hint={type === "adjustment" ? (isAr ? "سيحسب النظام الفرق تلقائيًا مقارنة بالرصيد الحالي." : "The system calculates the delta from the current balance.") : undefined}><input className={inputClass} type="number" min="0" required value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field><Field label={isAr ? "ملاحظة" : "Note"}><textarea className="min-h-20 w-full border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" value={note} onChange={(event) => setNote(event.target.value)} /></Field><button className={buttonClass} disabled={create.isPending}><Boxes className="h-4 w-4" />{create.isPending ? "Saving…" : (isAr ? "تسجيل الحركة" : "Record movement")}</button></form></Panel>}
       <Panel><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{movements.data?.length ?? 0} entries</span>}>{isAr ? "سجل الحركات" : "Movement ledger"}</PanelTitle>{movements.isLoading && <LoadingState />}{movements.isError && <ErrorState error={movements.error} onRetry={() => movements.refetch()} />}{movements.data?.length === 0 && <EmptyState title="No movements yet" detail="Your stock trail will appear here." />}{movements.data && movements.data.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground"><tr><th className="pb-3 text-start">Product</th><th className="pb-3 text-start">Type</th><th className="pb-3 text-end">Change</th><th className="pb-3 text-end">Before</th><th className="pb-3 text-end">After</th><th className="pb-3 text-end">When</th><th className="pb-3 text-end">Action</th></tr></thead><tbody>{movements.data.map((movement) => <tr key={movement.id} className="border-t border-border"><td className="py-3">{isAr ? movement.productNameAr || movement.productNameEn || `#${movement.productId}` : movement.productNameEn || `#${movement.productId}`}{movement.note && <span className="block text-xs text-muted-foreground">{movement.note}</span>}</td><td className="py-3 capitalize">{movement.type}</td><td className={`py-3 text-end font-mono-ui ${movement.quantity < 0 ? "text-destructive" : "text-primary"}`}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</td><td className="py-3 text-end font-mono-ui">{movement.quantityBefore}</td><td className="py-3 text-end font-mono-ui">{movement.quantityAfter}</td><td className="py-3 text-end text-xs text-muted-foreground">{dateLabel(movement.createdAt, language)}</td><td className="py-3 text-end">{(role === "owner" || role === "manager") && <button className={quietButtonClass} onClick={() => deleteMovement(movement.id)} disabled={remove.isPending} title={isAr ? "حذف آخر حركة" : "Delete latest movement"}><Trash2 className="h-3.5 w-3.5" /></button>}</td></tr>)}</tbody></table></div>}</Panel>
    </div><Toast message={message} onClose={() => setMessage(null)} />
  </div>;
}
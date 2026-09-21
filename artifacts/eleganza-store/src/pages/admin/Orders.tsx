import { ExternalLink, Package, Plus, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useCreateOrder, useListOrders, useListProducts, useUpdateOrderStatus, type Order, type OrderStatus, type PaymentMethod, type Product } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { buttonClass, can, EmptyState, ErrorState, Field, getErrorMessage, inputClass, LoadingState, money, PageHeader, Panel, PanelTitle, quietButtonClass, Toast, useAdmin, dateLabel } from "@/components/admin/AdminUI";

const statuses: OrderStatus[] = ["pending", "confirmed", "processing", "completed", "cancelled", "returned"];
const statusLabels: Record<OrderStatus, { en: string; ar: string }> = {
  pending: { en: "Pending", ar: "معلّق" },
  confirmed: { en: "Confirmed", ar: "مؤكد" },
  processing: { en: "Processing", ar: "قيد التجهيز" },
  completed: { en: "Completed", ar: "مكتمل" },
  cancelled: { en: "Cancelled", ar: "ملغى" },
  returned: { en: "Returned", ar: "مرتجع" },
};

function CustomerOrderDetails({ order, language, onView, onViewProducts }: { order: Pick<Order, "customerName" | "customerPhone" | "customerAddress" | "items">; language: "en" | "ar"; onView: () => void; onViewProducts: () => void }) {
  const [address, mapUrl] = (order.customerAddress ?? "").split("\nGoogle Maps: ");
  return <div><p className="mt-2 font-medium">{order.customerName}</p><p className="mt-1 text-xs text-muted-foreground">{order.items.length} {language === "ar" ? "عنصر" : "item(s)"}{order.customerPhone ? ` · ${order.customerPhone}` : ""}</p>{address && <p className="mt-1 max-w-[520px] text-xs text-muted-foreground">{address}</p>}{mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="h-3 w-3" />{language === "ar" ? "فتح الموقع على Google Maps" : "Open location in Google Maps"}</a>}<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2"><button type="button" onClick={onView} className="text-xs font-semibold text-primary hover:underline">{language === "ar" ? "عرض معلومات العميل" : "View customer details"}</button><button type="button" onClick={onViewProducts} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"><Package className="h-3 w-3" />{language === "ar" ? "عرض منتجات الفاتورة" : "View invoice products"}</button></div></div>;
}

function CustomerDetailsModal({ order, isAr, onClose }: { order: Order; isAr: boolean; onClose: () => void }) {
  const [address, mapUrl] = (order.customerAddress ?? "").split("\nGoogle Maps: ");
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose} role="presentation"><section className="w-full max-w-lg border border-border bg-card p-6 shadow-xl" dir={isAr ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-labelledby="customer-details-title" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.14em] text-primary">{order.orderNumber}</p><h2 id="customer-details-title" className="mt-2 font-display text-3xl">{isAr ? "معلومات العميل" : "Customer details"}</h2></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center border border-border hover:bg-muted" aria-label={isAr ? "إغلاق" : "Close"}><X className="h-4 w-4" /></button></div><dl className="mt-7 grid gap-4 text-sm"><div className="border-b border-border pb-3"><dt className="text-xs text-muted-foreground">{isAr ? "الاسم" : "Name"}</dt><dd className="mt-1 font-medium">{order.customerName}</dd></div><div className="border-b border-border pb-3"><dt className="text-xs text-muted-foreground">{isAr ? "رقم الهاتف" : "Phone"}</dt><dd className="mt-1" dir="ltr">{order.customerPhone || (isAr ? "غير متوفر" : "Not provided")}</dd></div><div className="border-b border-border pb-3"><dt className="text-xs text-muted-foreground">{isAr ? "العنوان التفصيلي" : "Detailed address"}</dt><dd className="mt-1 leading-6">{address || (isAr ? "غير متوفر" : "Not provided")}</dd></div></dl>{mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 bg-primary px-4 py-3 text-xs font-semibold text-primary-foreground hover:opacity-90"><ExternalLink className="h-3.5 w-3.5" />{isAr ? "فتح الموقع على Google Maps" : "Open location in Google Maps"}</a>}</section></div>;
}

function InvoiceProductsModal({ order, products, isAr, onClose }: { order: Order; products: Product[]; isAr: boolean; onClose: () => void }) {
  const productNames = new Map(products.map((product) => [product.id, isAr ? product.nameAr || product.nameEn : product.nameEn]));
  const itemsTotal = order.items.reduce((total, item) => total + item.quantity * item.unitPriceMinor, 0);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose} role="presentation"><section className="w-full max-w-2xl border border-border bg-card p-6 shadow-xl" dir={isAr ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-labelledby="invoice-products-title" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.14em] text-primary">{order.orderNumber}</p><h2 id="invoice-products-title" className="mt-2 font-display text-3xl">{isAr ? "منتجات الفاتورة" : "Invoice products"}</h2></div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center border border-border hover:bg-muted" aria-label={isAr ? "إغلاق" : "Close"}><X className="h-4 w-4" /></button></div><div className="mt-7 overflow-x-auto"><table className="w-full min-w-[520px] text-sm"><thead className="border-b border-border text-xs text-muted-foreground"><tr><th className="px-3 py-3 text-start">{isAr ? "المنتج" : "Product"}</th><th className="px-3 py-3 text-end">{isAr ? "الكمية" : "Quantity"}</th><th className="px-3 py-3 text-end">{isAr ? "سعر الوحدة" : "Unit price"}</th><th className="px-3 py-3 text-end">{isAr ? "الإجمالي" : "Total"}</th></tr></thead><tbody>{order.items.map((item) => <tr key={item.id} className="border-b border-border last:border-0"><td className="px-3 py-4 font-medium">{productNames.get(item.productId) ?? `${isAr ? "منتج" : "Product"} #${item.productId}`}</td><td className="px-3 py-4 text-end">{item.quantity}</td><td className="px-3 py-4 text-end font-mono-ui">{money(item.unitPriceMinor, isAr ? "ar" : "en")}</td><td className="px-3 py-4 text-end font-mono-ui">{money(item.quantity * item.unitPriceMinor, isAr ? "ar" : "en")}</td></tr>)}</tbody><tfoot><tr className="border-t-2 border-border font-semibold"><td colSpan={3} className="px-3 py-4">{isAr ? "إجمالي المنتجات" : "Products total"}</td><td className="px-3 py-4 text-end font-mono-ui">{money(itemsTotal, isAr ? "ar" : "en")}</td></tr></tfoot></table></div></section></div>;
}

export default function Orders() {
  const { language, permissions } = useAdmin();
  const isAr = language === "ar";
  const canCreate = can(permissions, "sales");
  const canUpdate = can(permissions, "manager");
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [shipping, setShipping] = useState("0");
  const [message, setMessage] = useState<string | null>(null);
  const [customerOrder, setCustomerOrder] = useState<Order | null>(null);
  const [productsOrder, setProductsOrder] = useState<Order | null>(null);
  const orders = useListOrders({ limit: 100, status: filter || undefined, invoiceNumber: invoiceNumber.trim() || undefined });
  const products = useListProducts({ limit: 100 });
  const create = useCreateOrder();
  const update = useUpdateOrderStatus();

  async function createOrder(event: React.FormEvent) {
    event.preventDefault();
    try {
      await create.mutateAsync({ data: { customerName, customerPhone: customerPhone || undefined, paymentMethod, shippingMinor: Number(shipping) || 0, items: [{ productId: Number(productId), quantity: Number(quantity) }] } });
      await queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setShowCreate(false); setCustomerName(""); setCustomerPhone(""); setProductId(""); setMessage(isAr ? "تم إنشاء الطلب" : "Order created");
    } catch (error) { setMessage(getErrorMessage(error)); }
  }

  async function changeStatus(id: number, status: OrderStatus) {
    try { await update.mutateAsync({ id, data: { status } }); await queryClient.invalidateQueries({ queryKey: ["/api/orders"] }); await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] }); setMessage(isAr ? "تم تحديث الحالة" : "Order status updated"); } catch (error) { setMessage(getErrorMessage(error)); }
  }

  return <div><PageHeader eyebrow={isAr ? "البيع وخدمة العملاء" : "Sales & care"} title={isAr ? "الطلبات" : "Orders"} description={isAr ? "تابع الطلبات المحلية وحالات الدفع والتنفيذ." : "Follow local orders, payment methods, and fulfilment status."} action={canCreate ? <button className={buttonClass} onClick={() => setShowCreate(!showCreate)}><Plus className="h-3.5 w-3.5" />{isAr ? "طلب جديد" : "New order"}</button> : undefined} />
    {showCreate && <Panel className="mb-5"><PanelTitle>{isAr ? "إنشاء طلب محلي" : "Create local order"}</PanelTitle><form onSubmit={createOrder} className="grid gap-4 md:grid-cols-2"><Field label="Customer name"><input className={inputClass} required value={customerName} onChange={(event) => setCustomerName(event.target.value)} /></Field><Field label="Phone"><input className={inputClass} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} /></Field><Field label="Product"><select className={inputClass} required value={productId} onChange={(event) => setProductId(event.target.value)}><option value="">Select a product</option>{products.data?.map((product) => <option key={product.id} value={product.id}>{product.nameEn} · {money(product.salePriceMinor, language)}</option>)}</select></Field><Field label="Quantity"><input className={inputClass} type="number" min="1" required value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field><Field label="Payment method"><select className={inputClass} value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}><option value="cod">Cash on delivery</option><option value="electronic">Electronic</option><option value="shopify">Shopify</option></select></Field><Field label="Shipping (minor units)"><input className={inputClass} type="number" min="0" value={shipping} onChange={(event) => setShipping(event.target.value)} /></Field><div className="flex justify-end gap-2 md:col-span-2"><button type="button" className={quietButtonClass} onClick={() => setShowCreate(false)}>Cancel</button><button className={buttonClass} disabled={create.isPending}>Create order</button></div></form></Panel>}
     <Panel><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><PanelTitle>{isAr ? "سجل الطلبات" : "Order ledger"}</PanelTitle><div className="flex flex-wrap items-center gap-2"><input className={`${inputClass} w-56`} value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder={isAr ? "ابحث برقم الفاتورة" : "Search invoice number"} aria-label={isAr ? "البحث برقم الفاتورة" : "Search by invoice number"} /><select className={`${inputClass} w-auto min-w-40`} value={filter} onChange={(event) => setFilter(event.target.value as OrderStatus | "")}><option value="">{isAr ? "كل الحالات" : "All statuses"}</option>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status][isAr ? "ar" : "en"]}</option>)}</select></div></div>{orders.isLoading && <LoadingState />}{orders.isError && <ErrorState error={orders.error} onRetry={() => orders.refetch()} />}{orders.data?.length === 0 && <EmptyState icon={<ShoppingBag className="h-5 w-5" />} title={isAr ? "لا توجد طلبات" : "No orders found"} detail={isAr ? "ستظهر هنا الطلبات التي ينشئها المتجر أو تتم مزامنتها من Shopify." : "Orders created here or synced from Shopify will appear here."} />}{orders.data && orders.data.length > 0 && <div className="grid gap-3">{orders.data.map((order) => <div key={order.id} className="grid gap-4 border border-border p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-3"><span className="font-mono-ui text-xs text-primary">{order.orderNumber}</span><span className="text-xs capitalize text-muted-foreground">{order.paymentMethod}</span><span className="text-xs text-muted-foreground">{dateLabel(order.createdAt, language)}</span></div><CustomerOrderDetails order={order} language={language} onView={() => setCustomerOrder(order)} onViewProducts={() => setProductsOrder(order)} /></div><p className="font-display text-2xl">{money(order.totalMinor, language)}</p>{canUpdate ? <select className={`${inputClass} w-auto`} value={order.status} onChange={(event) => changeStatus(order.id, event.target.value as OrderStatus)} disabled={update.isPending}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status][isAr ? "ar" : "en"]}</option>)}</select> : <span className="border border-border px-3 py-2 text-xs capitalize text-muted-foreground">{statusLabels[order.status][isAr ? "ar" : "en"]}</span>}</div>)}</div>}</Panel>
     {customerOrder && <CustomerDetailsModal order={customerOrder} isAr={isAr} onClose={() => setCustomerOrder(null)} />}
      {productsOrder && <InvoiceProductsModal order={productsOrder} products={products.data ?? []} isAr={isAr} onClose={() => setProductsOrder(null)} />}
     <Toast message={message} onClose={() => setMessage(null)} />
  </div>;
}
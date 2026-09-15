import { Plus, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCreateOrder, useListOrders, useListProducts, useUpdateOrderStatus, type OrderStatus, type PaymentMethod } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { buttonClass, can, EmptyState, ErrorState, Field, getErrorMessage, inputClass, LoadingState, money, PageHeader, Panel, PanelTitle, quietButtonClass, Toast, useAdmin, dateLabel } from "@/components/admin/AdminUI";

const statuses: OrderStatus[] = ["pending", "confirmed", "processing", "completed", "cancelled", "returned"];

export default function Orders() {
  const { language, role } = useAdmin();
  const isAr = language === "ar";
  const canCreate = can(role, "sales");
  const canUpdate = can(role, "manager");
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [showCreate, setShowCreate] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [shipping, setShipping] = useState("0");
  const [message, setMessage] = useState<string | null>(null);
  const orders = useListOrders({ limit: 100, status: filter || undefined });
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
    <Panel><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><PanelTitle>{isAr ? "سجل الطلبات" : "Order ledger"}</PanelTitle><select className={`${inputClass} w-auto min-w-40`} value={filter} onChange={(event) => setFilter(event.target.value as OrderStatus | "")}><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>{orders.isLoading && <LoadingState />}{orders.isError && <ErrorState error={orders.error} onRetry={() => orders.refetch()} />}{orders.data?.length === 0 && <EmptyState icon={<ShoppingBag className="h-5 w-5" />} title="No orders found" detail="Orders created here or synced from Shopify will appear here." />}{orders.data && orders.data.length > 0 && <div className="grid gap-3">{orders.data.map((order) => <div key={order.id} className="grid gap-4 border border-border p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-3"><span className="font-mono-ui text-xs text-primary">{order.orderNumber}</span><span className="text-xs capitalize text-muted-foreground">{order.paymentMethod}</span><span className="text-xs text-muted-foreground">{dateLabel(order.createdAt, language)}</span></div><p className="mt-2 font-medium">{order.customerName}</p><p className="mt-1 text-xs text-muted-foreground">{order.items.length} item(s){order.customerPhone ? ` · ${order.customerPhone}` : ""}</p></div><p className="font-display text-2xl">{money(order.totalMinor, language)}</p>{canUpdate ? <select className={`${inputClass} w-auto`} value={order.status} onChange={(event) => changeStatus(order.id, event.target.value as OrderStatus)} disabled={update.isPending}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select> : <span className="border border-border px-3 py-2 text-xs capitalize text-muted-foreground">{order.status}</span>}</div>)}</div>}</Panel><Toast message={message} onClose={() => setMessage(null)} />
  </div>;
}
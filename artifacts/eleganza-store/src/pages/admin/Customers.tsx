import { useMemo, useState } from "react";
import { ExternalLink, MapPin, Search, ShoppingBag, Users, X } from "lucide-react";
import { useListCustomerOrders, useListCustomers, useListProducts, type Customer } from "@workspace/api-client-react";
import { EmptyState, ErrorState, LoadingState, money, PageHeader, Panel, PanelTitle, useAdmin, dateLabel, inputClass } from "@/components/admin/AdminUI";

function CustomerDetailsModal({ customer, isAr, language, onClose }: { customer: Customer; isAr: boolean; language: "ar" | "en"; onClose: () => void }) {
  const orders = useListCustomerOrders(encodeURIComponent(customer.id));
  const products = useListProducts({ limit: 100 });
  const [address, mapUrlValue] = (customer.customerAddress ?? "").split("\nGoogle Maps: ");
  let mapUrl: string | null = null;
  try {
    const parsed = new URL(mapUrlValue ?? "");
    if (parsed.protocol === "http:" || parsed.protocol === "https:") mapUrl = parsed.toString();
  } catch { /* No valid map link was saved with this address. */ }
  const productNames = new Map((products.data ?? []).map((product) => [product.id, isAr ? product.nameAr || product.nameEn : product.nameEn]));
  const statusLabels: Record<string, string> = isAr
    ? { pending: "معلّق", confirmed: "مؤكد", processing: "قيد التجهيز", completed: "مكتمل", cancelled: "ملغى", returned: "مرتجع" }
    : { pending: "Pending", confirmed: "Confirmed", processing: "Processing", completed: "Completed", cancelled: "Cancelled", returned: "Returned" };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6" onClick={onClose} role="presentation">
    <section className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden border border-border bg-card shadow-2xl" dir={isAr ? "rtl" : "ltr"} role="dialog" aria-modal="true" aria-labelledby="customer-detail-title" onClick={(event) => event.stopPropagation()}>
      <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
        <div><p className="font-mono-ui text-xs uppercase tracking-[.16em] text-primary">{isAr ? "ملف الزبون" : "Customer profile"}</p><h2 id="customer-detail-title" className="mt-2 font-display text-3xl">{customer.customerName}</h2></div>
        <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center border border-border hover:bg-muted" aria-label={isAr ? "إغلاق" : "Close"}><X className="h-4 w-4" /></button>
      </header>
      <div className="admin-nav-scroll overflow-y-auto p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-border p-4"><p className="text-xs text-muted-foreground">{isAr ? "رقم الهاتف" : "Phone"}</p><p className="mt-2" dir="ltr">{customer.customerPhone ? <a className="text-primary hover:underline" href={`tel:${encodeURIComponent(customer.customerPhone)}`}>{customer.customerPhone}</a> : "—"}</p></div>
          <div className="border border-border p-4"><p className="text-xs text-muted-foreground">{isAr ? "البريد الإلكتروني" : "Email"}</p><p className="mt-2 break-all" dir="ltr">{customer.customerEmail || "—"}</p></div>
          <div className="border border-border p-4"><p className="text-xs text-muted-foreground">{isAr ? "تاريخ إنشاء الحساب" : "Account created"}</p><p className="mt-2">{customer.accountCreatedAt ? dateLabel(customer.accountCreatedAt, language) : "—"}</p></div>
          <div className="border border-border p-4"><p className="text-xs text-muted-foreground">{isAr ? "إجمالي المشتريات" : "Total spent"}</p><p className="mt-2 font-mono-ui font-semibold">{money(customer.totalSpentMinor, language)}</p></div>
          <div className="border border-border p-4 sm:col-span-2"><p className="text-xs text-muted-foreground">{isAr ? "العنوان الكامل" : "Full address"}</p><p className="mt-2 whitespace-pre-wrap leading-6">{address || (isAr ? "العنوان غير متوفر" : "Address not provided")}</p>{mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><MapPin className="h-4 w-4" />{isAr ? "فتح موقع الزبون على الخريطة" : "Open customer location"}<ExternalLink className="h-3.5 w-3.5" /></a>}</div>
        </div>
        <div className="mt-7">
          <div className="mb-3 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-semibold"><ShoppingBag className="h-4 w-4 text-primary" />{isAr ? "سجل المشتريات" : "Purchase history"}</h3><span className="text-xs text-muted-foreground">{customer.orderCount} {isAr ? "طلب" : "orders"}</span></div>
          {orders.isLoading && <LoadingState label={isAr ? "جارٍ تحميل سجل المشتريات…" : "Loading purchase history…"} />}
          {orders.isError && <ErrorState error={orders.error} onRetry={() => orders.refetch()} />}
          {orders.data?.length === 0 && <p className="border border-border p-4 text-sm text-muted-foreground">{isAr ? "لا توجد مشتريات مسجلة." : "No purchases recorded."}</p>}
          <div className="grid gap-3">{orders.data?.map((order) => <article key={order.id} className="border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><p className="font-mono-ui text-xs text-primary">{order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{dateLabel(order.createdAt, language)}</p></div>
              <div className="text-end"><p className="font-semibold">{money(order.totalMinor, language)}</p><p className="mt-1 text-xs text-muted-foreground">{statusLabels[order.status] ?? order.status}</p></div>
            </div>
            <ul className="mt-3 grid gap-2 border-t border-border pt-3 text-sm">{order.items.map((item) => <li key={item.id} className="flex flex-wrap justify-between gap-x-4 gap-y-1"><span>{productNames.get(item.productId) ?? `${isAr ? "منتج" : "Product"} #${item.productId}`} × {item.quantity}</span><span className="font-mono-ui text-muted-foreground">{money(item.unitPriceMinor * item.quantity, language)}</span></li>)}</ul>
          </article>)}</div>
        </div>
      </div>
    </section>
  </div>;
}

export default function Customers() {
  const { language } = useAdmin();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const customers = useListCustomers();
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return customers.data ?? [];
    return (customers.data ?? []).filter((customer) =>
      [customer.customerName, customer.customerPhone ?? "", customer.customerEmail ?? "", customer.customerAddress ?? ""]
        .some((value) => value.toLocaleLowerCase().includes(query)),
    );
  }, [customers.data, search]);

  return <div className="grid gap-6">
    <PageHeader
      eyebrow={isAr ? "البيع وخدمة العملاء" : "Sales & care"}
      title={isAr ? "الزبائن" : "Customers"}
      description={isAr ? "حسابات الزبائن وبيانات مشترياتهم المسجلة في المتجر." : "Customer accounts and their recorded purchase history."}
    />
    <Panel>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <PanelTitle detail={<span className="font-mono-ui text-xs text-muted-foreground">{filtered.length}</span>}>
          {isAr ? "سجل الزبائن" : "Customer directory"}
        </PanelTitle>
        <label className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
          <input className={`${inputClass} ps-9`} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={isAr ? "ابحث بالاسم أو الهاتف أو العنوان" : "Search name, phone, or address"} aria-label={isAr ? "ابحث عن زبون" : "Search customers"} />
        </label>
      </div>
      {customers.isLoading && <LoadingState label={isAr ? "جارٍ تحميل الزبائن…" : "Loading customers…"} />}
      {customers.isError && <ErrorState error={customers.error} onRetry={() => customers.refetch()} />}
       {!customers.isLoading && !customers.isError && filtered.length === 0 && <EmptyState icon={<Users className="h-5 w-5" />} title={search ? (isAr ? "لا توجد نتائج" : "No matches") : (isAr ? "لا يوجد زبائن بعد" : "No customers yet")} detail={search ? (isAr ? "جرّب اسمًا أو رقم هاتف أو بريدًا مختلفًا." : "Try another name, phone, or email.") : (isAr ? "سيظهر الزبائن هنا عند إنشاء حساب أو تسجيل طلب." : "Customers appear here after creating an account or placing an order.")} />}
      {filtered.length > 0 && <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-start">{isAr ? "الزبون" : "Customer"}</th>
              <th className="px-3 py-3 text-start">{isAr ? "الهاتف" : "Phone"}</th>
              <th className="px-3 py-3 text-start">{isAr ? "العنوان" : "Address"}</th>
              <th className="px-3 py-3 text-end">{isAr ? "الطلبات" : "Orders"}</th>
              <th className="px-3 py-3 text-end">{isAr ? "إجمالي المشتريات" : "Total spent"}</th>
              <th className="px-3 py-3 text-end">{isAr ? "آخر طلب" : "Last order"}</th>
              <th className="px-3 py-3 text-end">{isAr ? "التفاصيل" : "Details"}</th>
            </tr>
          </thead>
          <tbody>{filtered.map((customer) => {
            const address = customer.customerAddress?.split("\nGoogle Maps: ")[0];
            return <tr key={customer.id} className="border-b border-border last:border-0">
              <td className="px-3 py-4 font-medium">{customer.customerName}</td>
              <td className="px-3 py-4" dir="ltr">{customer.customerPhone ? <a className="text-primary hover:underline" href={`tel:${encodeURIComponent(customer.customerPhone)}`}>{customer.customerPhone}</a> : "—"}</td>
              <td className="max-w-xs px-3 py-4 text-muted-foreground">{address || "—"}</td>
              <td className="px-3 py-4 text-end">{customer.orderCount}</td>
              <td className="px-3 py-4 text-end font-mono-ui">{money(customer.totalSpentMinor, language)}</td>
              <td className="px-3 py-4 text-end text-xs text-muted-foreground">{customer.lastOrderAt ? dateLabel(customer.lastOrderAt, language) : "—"}</td>
              <td className="px-3 py-4 text-end"><button type="button" onClick={() => setSelectedCustomer(customer)} className="border border-primary px-3 py-2 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground">{isAr ? "عرض" : "View"}</button></td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </Panel>
    {selectedCustomer && <CustomerDetailsModal customer={selectedCustomer} isAr={isAr} language={language} onClose={() => setSelectedCustomer(null)} />}
  </div>;
}

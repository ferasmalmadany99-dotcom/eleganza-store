import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { useListCustomers } from "@workspace/api-client-react";
import { EmptyState, ErrorState, LoadingState, money, PageHeader, Panel, PanelTitle, useAdmin, dateLabel, inputClass } from "@/components/admin/AdminUI";

export default function Customers() {
  const { language } = useAdmin();
  const isAr = language === "ar";
  const [search, setSearch] = useState("");
  const customers = useListCustomers();
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return customers.data ?? [];
    return (customers.data ?? []).filter((customer) =>
      [customer.customerName, customer.customerPhone ?? "", customer.customerAddress ?? ""]
        .some((value) => value.toLocaleLowerCase().includes(query)),
    );
  }, [customers.data, search]);

  return <div className="grid gap-6">
    <PageHeader
      eyebrow={isAr ? "البيع وخدمة العملاء" : "Sales & care"}
      title={isAr ? "الزبائن" : "Customers"}
      description={isAr ? "قائمة الزبائن المستخرجة من الطلبات المسجلة في المتجر." : "Customers summarized from orders recorded by the store."}
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
      {!customers.isLoading && !customers.isError && filtered.length === 0 && <EmptyState icon={<Users className="h-5 w-5" />} title={search ? (isAr ? "لا توجد نتائج" : "No matches") : (isAr ? "لا يوجد زبائن بعد" : "No customers yet")} detail={search ? (isAr ? "جرّب اسمًا أو رقم هاتف مختلفًا." : "Try another name or phone number.") : (isAr ? "سيظهر الزبائن هنا بعد تسجيل طلباتهم." : "Customers will appear here after their orders are recorded.")} />}
      {filtered.length > 0 && <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-start">{isAr ? "الزبون" : "Customer"}</th>
              <th className="px-3 py-3 text-start">{isAr ? "الهاتف" : "Phone"}</th>
              <th className="px-3 py-3 text-start">{isAr ? "العنوان" : "Address"}</th>
              <th className="px-3 py-3 text-end">{isAr ? "الطلبات" : "Orders"}</th>
              <th className="px-3 py-3 text-end">{isAr ? "إجمالي المشتريات" : "Total spent"}</th>
              <th className="px-3 py-3 text-end">{isAr ? "آخر طلب" : "Last order"}</th>
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
              <td className="px-3 py-4 text-end text-xs text-muted-foreground">{dateLabel(customer.lastOrderAt, language)}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </Panel>
  </div>;
}

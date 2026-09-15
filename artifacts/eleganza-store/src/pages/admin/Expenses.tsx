import { Plus, WalletCards } from "lucide-react";
import { useState } from "react";
import { useCreateExpense, useListExpenses } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { buttonClass, can, EmptyState, ErrorState, Field, getErrorMessage, inputClass, LoadingState, money, PageHeader, Panel, PanelTitle, quietButtonClass, Toast, useAdmin, dateLabel } from "@/components/admin/AdminUI";

export default function Expenses() {
  const { language, role } = useAdmin();
  const isAr = language === "ar";
  const canWrite = can(role, "manager");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ description: "", category: "operations", amountDinar: "", expenseDate: new Date().toISOString().slice(0, 10) });
  const [message, setMessage] = useState<string | null>(null);
  const expenses = useListExpenses({ limit: 100 });
  const create = useCreateExpense();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await create.mutateAsync({ data: { description: form.description, category: form.category, amountMinor: Math.round(Math.max(0, Number(form.amountDinar) || 0) * 100), expenseDate: form.expenseDate } });
      await queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      setForm({ description: "", category: "operations", amountDinar: "", expenseDate: new Date().toISOString().slice(0, 10) });
      setShowCreate(false); setMessage(isAr ? "تم تسجيل المصروف" : "Expense recorded");
    } catch (error) { setMessage(getErrorMessage(error)); }
  }

  return <div><PageHeader eyebrow={isAr ? "المالية" : "Finance"} title={isAr ? "المصروفات" : "Expenses"} description={isAr ? "سجّل المصروفات التشغيلية حتى تعكس لوحة الملخص الربح الحقيقي." : "Record operating costs so the summary reflects a more honest profit picture."} action={canWrite ? <button className={buttonClass} onClick={() => setShowCreate(!showCreate)}><Plus className="h-3.5 w-3.5" />{isAr ? "مصروف جديد" : "New expense"}</button> : undefined} />
     {showCreate && <Panel className="mb-5"><PanelTitle>{isAr ? "تسجيل مصروف" : "Record expense"}</PanelTitle><form onSubmit={submit} className="grid gap-4 md:grid-cols-2"><Field label={isAr ? "الوصف" : "Description"}><input className={inputClass} required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></Field><Field label={isAr ? "الفئة" : "Category"}><input className={inputClass} required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></Field><Field label={isAr ? "المبلغ بالدينار" : "Amount (LYD)"} labelClassName="whitespace-nowrap" hint={isAr ? "بالدينار الليبي، مثل 10.50" : "In LYD, e.g. 10.50"}><input className={inputClass} type="number" min="0" step="0.01" required value={form.amountDinar} onChange={(event) => setForm({ ...form, amountDinar: event.target.value })} /></Field><Field label={isAr ? "التاريخ" : "Date"}><input className={inputClass} type="date" required value={form.expenseDate} onChange={(event) => setForm({ ...form, expenseDate: event.target.value })} /></Field><div className="flex justify-end gap-2 md:col-span-2"><button type="button" className={quietButtonClass} onClick={() => setShowCreate(false)}>Cancel</button><button className={buttonClass} disabled={create.isPending}>Save expense</button></div></form></Panel>}
    <Panel><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{expenses.data?.length ?? 0} entries</span>}>{isAr ? "سجل المصروفات" : "Expense ledger"}</PanelTitle>{expenses.isLoading && <LoadingState />}{expenses.isError && <ErrorState error={expenses.error} onRetry={() => expenses.refetch()} />}{expenses.data?.length === 0 && <EmptyState icon={<WalletCards className="h-5 w-5" />} title="No expenses recorded" detail="Costs added by managers will appear here." />}{expenses.data && expenses.data.length > 0 && <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="font-mono-ui text-[10px] uppercase tracking-[.14em] text-muted-foreground"><tr><th className="pb-3 text-start">Description</th><th className="pb-3 text-start">Category</th><th className="pb-3 text-end">Date</th><th className="pb-3 text-end">Amount</th></tr></thead><tbody>{expenses.data.map((expense) => <tr key={expense.id} className="border-t border-border"><td className="py-4 font-medium">{expense.description}</td><td className="py-4 capitalize text-muted-foreground">{expense.category}</td><td className="py-4 text-end text-xs text-muted-foreground">{dateLabel(expense.expenseDate, language)}</td><td className="py-4 text-end font-display text-xl">{money(expense.amountMinor, language)}</td></tr>)}</tbody></table></div>}</Panel><Toast message={message} onClose={() => setMessage(null)} />
  </div>;
}
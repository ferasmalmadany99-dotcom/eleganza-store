import { BookOpen, Plus, Save } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useCreateAccount,
  useCreateJournalEntry,
  useListAccounts,
  useListJournalEntries,
  useUpdateAccount,
  type AccountType,
  type JournalEntryInput,
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import {
  buttonClass,
  EmptyState,
  ErrorState,
  Field,
  getErrorMessage,
  inputClass,
  LoadingState,
  money,
  PageHeader,
  Panel,
  PanelTitle,
  quietButtonClass,
  Toast,
  useAdmin,
} from "@/components/admin/AdminUI";

const accountTypes: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"];

export default function Accounting() {
  const { language, role } = useAdmin();
  const isAr = language === "ar";
  const accounts = useListAccounts();
  const journal = useListJournalEntries({ limit: 100 });
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const createJournal = useCreateJournalEntry();
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [accountForm, setAccountForm] = useState({ code: "", nameEn: "", nameAr: "", type: "expense" as AccountType });
  const [journalForm, setJournalForm] = useState({ entryDate: new Date().toISOString().slice(0, 10), description: "", debitAccountId: "", creditAccountId: "", amount: "", memo: "" });
  const accountNames = useMemo(() => new Map((accounts.data ?? []).map((account) => [account.id, isAr ? account.nameAr || account.nameEn : account.nameEn])), [accounts.data, isAr]);
  const canWrite = role === "owner" || role === "manager";

  async function submitAccount(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (editingId) {
        await updateAccount.mutateAsync({ id: editingId, data: { ...accountForm, active: true } });
      } else {
        await createAccount.mutateAsync({ data: { ...accountForm, active: true } });
      }
      await queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setEditingId(null);
      setAccountForm({ code: "", nameEn: "", nameAr: "", type: "expense" });
      setMessage(isAr ? (editingId ? "تم تحديث الحساب" : "تمت إضافة الحساب") : (editingId ? "Account updated" : "Account added"));
    } catch (error) { setMessage(getErrorMessage(error)); }
  }

  async function submitJournal(event: React.FormEvent) {
    event.preventDefault();
    const amountMinor = Math.round(Number(journalForm.amount) * 100);
    const payload: JournalEntryInput = {
      entryDate: journalForm.entryDate,
      description: journalForm.description,
      lines: [
        { accountId: Number(journalForm.debitAccountId), debitMinor: amountMinor, memo: journalForm.memo || undefined },
        { accountId: Number(journalForm.creditAccountId), creditMinor: amountMinor, memo: journalForm.memo || undefined },
      ],
    };
    try {
      await createJournal.mutateAsync({ data: payload });
      await queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setJournalForm({ entryDate: new Date().toISOString().slice(0, 10), description: "", debitAccountId: "", creditAccountId: "", amount: "", memo: "" });
      setMessage(isAr ? "تم حفظ قيد اليومية" : "Journal entry saved");
    } catch (error) { setMessage(getErrorMessage(error)); }
  }

  return <div>
    <PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "الحسابات ودفتر اليومية" : "Accounts & journal"} description={isAr ? "شجرة الحسابات والقيود اليومية المتوازنة للمبيعات والمصروفات والتسويات." : "A structured chart of accounts and balanced journal entries for sales, expenses, and reconciliations."} />
    <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
      <Panel>
        <PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{accounts.data?.length ?? 0} accounts</span>}>{isAr ? "شجرة الحسابات" : "Chart of accounts"}</PanelTitle>
        {accounts.isLoading && <LoadingState />}
        {accounts.isError && <ErrorState error={accounts.error} onRetry={() => accounts.refetch()} />}
        {accounts.data?.length === 0 && <EmptyState icon={<BookOpen className="h-5 w-5" />} title="No accounts" detail="Default accounts will be created when this page loads." />}
        {accounts.data && accounts.data.length > 0 && <div className="grid gap-2">{accounts.data.map((account) => <div key={account.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-border py-3 text-sm"><span className="font-mono-ui text-xs text-primary">{account.code}</span><div><p>{isAr ? account.nameAr || account.nameEn : account.nameEn}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-muted-foreground">{account.type}</p></div>{canWrite ? <button className="text-xs text-muted-foreground hover:text-primary" onClick={() => { setEditingId(account.id); setAccountForm({ code: account.code, nameEn: account.nameEn, nameAr: account.nameAr, type: account.type }); }}>{isAr ? "تعديل" : "Edit"}</button> : <span className="h-2 w-2 rounded-full bg-primary" />}</div>)}</div>}
        {canWrite && <form onSubmit={submitAccount} className="mt-6 grid gap-3 border-t border-border pt-5"><p className="font-mono-ui text-[10px] uppercase tracking-[.15em] text-primary">{isAr ? (editingId ? "تعديل الحساب" : "حساب جديد") : (editingId ? "Edit account" : "New account")}</p><div className="grid gap-3 sm:grid-cols-2"><Field label={isAr ? "الرمز" : "Code"}><input className={inputClass} required value={accountForm.code} onChange={(event) => setAccountForm({ ...accountForm, code: event.target.value })} placeholder="6500" /></Field><Field label={isAr ? "النوع" : "Type"}><select className={inputClass} value={accountForm.type} onChange={(event) => setAccountForm({ ...accountForm, type: event.target.value as AccountType })}>{accountTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></Field></div><Field label={isAr ? "الاسم بالإنجليزية" : "English name"}><input className={inputClass} required value={accountForm.nameEn} onChange={(event) => setAccountForm({ ...accountForm, nameEn: event.target.value })} /></Field><Field label={isAr ? "الاسم بالعربية" : "Arabic name"}><input className={inputClass} value={accountForm.nameAr} onChange={(event) => setAccountForm({ ...accountForm, nameAr: event.target.value })} dir="rtl" /></Field><div className="flex gap-2"><button className={quietButtonClass} disabled={createAccount.isPending || updateAccount.isPending}><Plus className="h-4 w-4" />{isAr ? (editingId ? "حفظ التعديل" : "إضافة الحساب") : (editingId ? "Save changes" : "Add account")}</button>{editingId && <button type="button" className={quietButtonClass} onClick={() => { setEditingId(null); setAccountForm({ code: "", nameEn: "", nameAr: "", type: "expense" }); }}>{isAr ? "إلغاء" : "Cancel"}</button>}</div></form>}
      </Panel>
      <Panel>
        <PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{journal.data?.length ?? 0} entries</span>}>{isAr ? "قيد يومية جديد" : "New journal entry"}</PanelTitle>
        {!canWrite && <p className="mb-4 border border-border bg-muted/40 p-3 text-sm text-muted-foreground">{isAr ? "تحتاج إلى صلاحية مدير لإضافة قيود." : "Manager access is required to add journal entries."}</p>}
        {canWrite && <form onSubmit={submitJournal} className="grid gap-4"><div className="grid gap-3 sm:grid-cols-2"><Field label={isAr ? "التاريخ" : "Date"}><input className={inputClass} type="date" required value={journalForm.entryDate} onChange={(event) => setJournalForm({ ...journalForm, entryDate: event.target.value })} /></Field><Field label={isAr ? "المبلغ بالدينار" : "Amount in LYD"}><input className={inputClass} type="number" min="0.01" step="0.01" required value={journalForm.amount} onChange={(event) => setJournalForm({ ...journalForm, amount: event.target.value })} /></Field></div><Field label={isAr ? "البيان" : "Description"}><input className={inputClass} required value={journalForm.description} onChange={(event) => setJournalForm({ ...journalForm, description: event.target.value })} placeholder={isAr ? "بيع عطر أو مصروف تشغيلي" : "Sale or operating expense"} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label={isAr ? "مدين" : "Debit"}><select className={inputClass} required value={journalForm.debitAccountId} onChange={(event) => setJournalForm({ ...journalForm, debitAccountId: event.target.value })}><option value="">Select account</option>{accounts.data?.map((account) => <option key={account.id} value={account.id}>{account.code} · {isAr ? account.nameAr || account.nameEn : account.nameEn}</option>)}</select></Field><Field label={isAr ? "دائن" : "Credit"}><select className={inputClass} required value={journalForm.creditAccountId} onChange={(event) => setJournalForm({ ...journalForm, creditAccountId: event.target.value })}><option value="">Select account</option>{accounts.data?.map((account) => <option key={account.id} value={account.id}>{account.code} · {isAr ? account.nameAr || account.nameEn : account.nameEn}</option>)}</select></Field></div><Field label={isAr ? "ملاحظة" : "Memo"}><input className={inputClass} value={journalForm.memo} onChange={(event) => setJournalForm({ ...journalForm, memo: event.target.value })} /></Field><button className={buttonClass} disabled={createJournal.isPending}><Save className="h-4 w-4" />{isAr ? "حفظ القيد المتوازن" : "Save balanced entry"}</button></form>}
      </Panel>
    </div>
    <Panel className="mt-5"><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">Debit = Credit</span>}>{isAr ? "دفتر اليومية" : "Journal ledger"}</PanelTitle>{journal.isLoading && <LoadingState />}{journal.isError && <ErrorState error={journal.error} onRetry={() => journal.refetch()} />}{journal.data?.length === 0 && <EmptyState icon={<BookOpen className="h-5 w-5" />} title="No journal entries" detail="Completed sales, expenses, and manual entries will appear here." />}{journal.data && journal.data.length > 0 && <div className="grid gap-3">{journal.data.map((entry) => <article key={entry.id} className="border-b border-border pb-4 last:border-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="font-mono-ui text-xs text-primary">{entry.entryNumber}</span><span className="ms-3 text-xs text-muted-foreground">{entry.entryDate}</span><p className="mt-2 font-medium">{entry.description}</p></div><span className="text-xs text-muted-foreground">{entry.referenceType ?? "manual"}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{entry.lines.map((line) => <div key={line.id} className="flex justify-between border-s-2 border-border bg-muted/30 px-3 py-2 text-xs"><span>{accountNames.get(line.accountId) ?? `#${line.accountId}`}</span><span className="font-mono-ui">{line.debitMinor > 0 ? `Dr ${money(line.debitMinor, language)}` : `Cr ${money(line.creditMinor, language)}`}</span></div>)}</div></article>)}</div>}</Panel>
    <Toast message={message} onClose={() => setMessage(null)} />
  </div>;
}
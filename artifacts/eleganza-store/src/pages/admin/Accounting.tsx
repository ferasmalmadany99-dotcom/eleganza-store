import { BookOpen, ClipboardList, FileBarChart, Landmark, PackageSearch, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useCreateAccount,
  useListAccounts,
  useListJournalEntries,
  useListInventoryMovements,
  type AccountType,
} from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import {
  buttonClass,
  EmptyState,
  ErrorState,
  Field,
  inputClass,
  LoadingState,
  money,
  PageHeader,
  Panel,
  PanelTitle,
  quietButtonClass,
  useAdmin,
} from "@/components/admin/AdminUI";

const accountTypes: AccountType[] = ["asset", "liability", "equity", "revenue", "expense"];
type AccountingSection = "journal" | "chart" | "ledger" | "inventory" | "statement";

const accountingSections: { id: AccountingSection; label: string; arabic: string; icon: typeof BookOpen }[] = [
  { id: "journal", label: "Journal entries", arabic: "قيود اليومية", icon: BookOpen },
  { id: "chart", label: "Chart of accounts", arabic: "شجرة الحسابات", icon: Landmark },
  { id: "ledger", label: "General ledger", arabic: "دفتر الأستاذ", icon: ClipboardList },
  { id: "inventory", label: "Inventory report", arabic: "تقرير المخزون", icon: PackageSearch },
  { id: "statement", label: "Account statement", arabic: "كشف حساب", icon: FileBarChart },
];

function sortAccountsByCode<T extends { code: string }>(left: T, right: T) {
  return Number(left.code) - Number(right.code) || left.code.localeCompare(right.code);
}

function nextChildCode<T extends { id: number; code: string; parentId?: number | null }>(accounts: T[], parentId: number) {
  const parentAccount = accounts.find((account) => account.id === parentId);
  const parentCode = parentAccount?.code ?? "1000";
  const children = accounts.filter((account) => account.parentId === parentId).map((account) => Number(account.code)).filter(Number.isFinite);
  return String(Math.max(Number(parentCode), ...children) + 1);
}

export default function Accounting() {
  const { language } = useAdmin();
  const [section, setSection] = useState<AccountingSection>("journal");
  const active = accountingSections.find((item) => item.id === section) ?? accountingSections[0];

  return <div className="grid gap-5 xl:grid-cols-[220px_1fr]">
    <aside className="border border-border bg-card p-4 xl:self-start"><div className="border-b border-border pb-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">{language === "ar" ? "مساحة المحاسبة" : "Accounting workspace"}</p><p className="mt-2 text-sm text-muted-foreground">{language === "ar" ? "اختر القسم المطلوب" : "Choose a section"}</p></div><nav className="mt-3 grid gap-1">{accountingSections.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setSection(item.id)} className={`flex items-center gap-3 px-3 py-3 text-start text-sm transition ${section === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4" />{language === "ar" ? item.arabic : item.label}</button>; })}</nav></aside>
    <div>{section === "journal" ? <AccountingJournal /> : <AccountingSectionPage section={active.id} />}</div>
  </div>;
}

function AccountingSectionPage({ section }: { section: AccountingSection }) {
  const { language } = useAdmin();
  const isAr = language === "ar";
  const accounts = useListAccounts();
  const journal = useListJournalEntries({ limit: 100 });
  const movements = useListInventoryMovements({ limit: 100 });
  const [selectedAccount, setSelectedAccount] = useState("");
  const activeAccount = accounts.data?.find((account) => String(account.id) === selectedAccount) ?? accounts.data?.[0];
  const createAccount = useCreateAccount();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ code: "", nameEn: "", nameAr: "", type: "expense" as AccountType, parentId: "" });
  const activeAccountId = activeAccount?.id;
  const statementRows = (journal.data ?? []).flatMap((entry) => entry.lines.filter((line) => line.accountId === activeAccountId).map((line) => ({ entry, line })));
  const debitTotal = statementRows.reduce((total, row) => total + row.line.debitMinor, 0);
  const creditTotal = statementRows.reduce((total, row) => total + row.line.creditMinor, 0);
  const isCreditNormal = activeAccount?.type === "liability" || activeAccount?.type === "equity" || activeAccount?.type === "revenue";
  const finalBalance = isCreditNormal ? creditTotal - debitTotal : debitTotal - creditTotal;

  async function submitNewAccount(event: React.FormEvent) {
    event.preventDefault();
    try {
      await createAccount.mutateAsync({ data: { ...newAccount, parentId: newAccount.parentId ? Number(newAccount.parentId) : undefined, active: true } });
      await queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setNewAccount({ code: "", nameEn: "", nameAr: "", type: "expense", parentId: "" });
      setShowAccountForm(false);
    } catch {
      // The shared API error surface is used by the journal workspace.
    }
  }

  if (section === "chart") {
    const orderedAccounts = [...(accounts.data ?? [])].sort(sortAccountsByCode);
    return <div><PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "شجرة الحسابات" : "Chart of accounts"} description={isAr ? "الحسابات مرتبة رقميًا مع حسابات فرعية متسلسلة تحت كل حساب رئيسي." : "Accounts are sorted numerically with sequential subaccounts under each parent."} /><Panel><div className="mb-5 flex items-center justify-between gap-3"><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{orderedAccounts.length} accounts</span>}>{isAr ? "الحسابات" : "Accounts"}</PanelTitle><button className={quietButtonClass} onClick={() => setShowAccountForm(!showAccountForm)}><Plus className="h-4 w-4" />{isAr ? "إضافة حساب" : "Add account"}</button></div>{showAccountForm && <form onSubmit={submitNewAccount} className="mb-5 grid gap-3 border border-primary/25 bg-primary/5 p-4 sm:grid-cols-2"><Field label={isAr ? "الحساب الرئيسي" : "Parent account"}><select className={inputClass} value={newAccount.parentId} onChange={(event) => { const parentId = event.target.value; const parent = accounts.data?.find((account) => String(account.id) === parentId); setNewAccount({ ...newAccount, parentId, code: parentId ? nextChildCode(accounts.data ?? [], Number(parentId)) : newAccount.code, type: parent?.type ?? newAccount.type }); }}><option value="">{isAr ? "حساب رئيسي جديد" : "New top-level account"}</option>{orderedAccounts.map((account) => <option key={account.id} value={account.id}>{account.code} · {isAr ? account.nameAr || account.nameEn : account.nameEn}</option>)}</select></Field><Field label={isAr ? "الرمز التسلسلي" : "Sequential code"}><input className={inputClass} required value={newAccount.code} onChange={(event) => setNewAccount({ ...newAccount, code: event.target.value })} /></Field><Field label={isAr ? "النوع" : "Type"}><select className={inputClass} value={newAccount.type} onChange={(event) => setNewAccount({ ...newAccount, type: event.target.value as AccountType })}>{accountTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select></Field><Field label={isAr ? "الاسم بالإنجليزية" : "English name"}><input className={inputClass} required value={newAccount.nameEn} onChange={(event) => setNewAccount({ ...newAccount, nameEn: event.target.value })} /></Field><Field label={isAr ? "الاسم بالعربية" : "Arabic name"}><input className={inputClass} dir="rtl" value={newAccount.nameAr} onChange={(event) => setNewAccount({ ...newAccount, nameAr: event.target.value })} /></Field><button className={buttonClass} disabled={createAccount.isPending}>{isAr ? "حفظ الحساب" : "Save account"}</button></form>}<div className="grid gap-2">{orderedAccounts.map((account) => <div key={account.id} className={`grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-b border-border py-4 text-sm ${account.parentId ? "ps-8" : ""}`}><span className="font-mono-ui text-xs text-primary">{account.code}</span><div><p>{isAr ? account.nameAr || account.nameEn : account.nameEn}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-muted-foreground">{account.parentId ? (isAr ? "حساب فرعي" : "Subaccount") : (isAr ? "حساب رئيسي" : "Main account")} · {account.type}</p></div><button className="text-xs text-muted-foreground hover:text-primary" onClick={() => { setShowAccountForm(true); setNewAccount({ code: nextChildCode(accounts.data ?? [], account.id), nameEn: "", nameAr: "", type: account.type, parentId: String(account.id) }); }}>{isAr ? "إضافة فرعي" : "Add child"}</button></div>)}</div></Panel></div>;
  }
  if (section === "inventory") return <div><PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "تقرير المخزون" : "Inventory report"} description={isAr ? "حركات المخزون وأثرها على قيمة المخزون المحاسبية." : "Inventory movements and their accounting impact."} /><Panel><PanelTitle>{isAr ? "آخر الحركات" : "Recent movements"}</PanelTitle>{movements.data?.map((movement) => <div key={movement.id} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border py-4 text-sm"><div><p>{isAr ? movement.productNameAr || movement.productNameEn || `#${movement.productId}` : movement.productNameEn || `#${movement.productId}`}</p><p className="mt-1 text-xs text-muted-foreground">{movement.type}</p></div><span className={movement.quantity >= 0 ? "text-primary" : "text-destructive"}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</span><span className="font-mono-ui text-xs">{movement.quantityAfter}</span></div>)}</Panel></div>;
  if (section === "statement") return <div><PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "كشف حساب" : "Account statement"} description={isAr ? "راجع حركة حساب محدد مع رصيده الختامي." : "Review activity and balance for a selected account."} /><Panel><PanelTitle>{isAr ? "الحساب" : "Account"}</PanelTitle><select className={inputClass} value={selectedAccount || String(activeAccount?.id ?? "")} onChange={(event) => setSelectedAccount(event.target.value)}>{accounts.data?.map((account) => <option key={account.id} value={account.id}>{account.code} · {isAr ? account.nameAr || account.nameEn : account.nameEn}</option>)}</select><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="border border-border p-4"><p className="text-xs text-muted-foreground">{isAr ? "إجمالي المدين" : "Total debit"}</p><p className="mt-3 font-display text-2xl">{money(debitTotal, language)}</p></div><div className="border border-border p-4"><p className="text-xs text-muted-foreground">{isAr ? "إجمالي الدائن" : "Total credit"}</p><p className="mt-3 font-display text-2xl">{money(creditTotal, language)}</p></div><div className="border border-primary/30 bg-primary/5 p-4"><p className="text-xs text-muted-foreground">{isAr ? "الرصيد النهائي" : "Final balance"}</p><p className="mt-3 font-display text-2xl">{money(finalBalance, language)}</p></div></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="text-[10px] uppercase tracking-[.14em] text-muted-foreground"><tr><th className="pb-3 text-start">{isAr ? "التاريخ والبيان" : "Date & description"}</th><th className="pb-3 text-end">{isAr ? "مدين" : "Debit"}</th><th className="pb-3 text-end">{isAr ? "دائن" : "Credit"}</th><th className="pb-3 text-end">{isAr ? "ملاحظة" : "Memo"}</th></tr></thead><tbody>{statementRows.map(({ entry, line }) => <tr key={line.id} className="border-t border-border"><td className="py-4"><span className="font-mono-ui text-xs text-primary">{entry.entryDate} · {entry.entryNumber}</span><p className="mt-1">{entry.description}</p></td><td className="py-4 text-end">{line.debitMinor ? money(line.debitMinor, language) : "—"}</td><td className="py-4 text-end">{line.creditMinor ? money(line.creditMinor, language) : "—"}</td><td className="py-4 text-end text-xs text-muted-foreground">{line.memo || "—"}</td></tr>)}</tbody></table>{statementRows.length === 0 && <EmptyState icon={<FileBarChart className="h-5 w-5" />} title={isAr ? "لا توجد حركات" : "No movements"} detail={isAr ? "ستظهر الحركات عند ترحيل قيود على هذا الحساب." : "Movements will appear when entries are posted to this account."} />}</div></Panel></div>;
  return <div><PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={section === "ledger" ? (isAr ? "دفتر الأستاذ" : "General ledger") : (isAr ? "قيود اليومية" : "Journal entries")} description={section === "ledger" ? (isAr ? "عرض القيود مجمعة حسب الحساب." : "Review entries grouped across accounts.") : (isAr ? "القيود المرتبطة بالمبيعات والمصروفات والتسويات." : "Entries generated from sales, expenses, and reconciliations.")} /><Panel><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{journal.data?.length ?? 0} entries</span>}>{isAr ? "السجل" : "Ledger"}</PanelTitle>{journal.data?.map((entry) => <div key={entry.id} className="border-b border-border py-4 last:border-0"><div className="flex flex-wrap justify-between gap-3"><div><span className="font-mono-ui text-xs text-primary">{entry.entryNumber}</span><p className="mt-2 text-sm font-medium">{entry.description}</p></div><span className="text-xs text-muted-foreground">{entry.entryDate}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{entry.lines.map((line) => <div key={line.id} className="flex justify-between bg-muted/30 px-3 py-2 text-xs"><span>#{line.accountId}</span><span className="font-mono-ui">{line.debitMinor > 0 ? `Dr ${money(line.debitMinor, language)}` : `Cr ${money(line.creditMinor, language)}`}</span></div>)}</div></div>)}</Panel></div>;
}

function AccountingJournal() {
  const { language } = useAdmin();
  const isAr = language === "ar";
  const accounts = useListAccounts();
  const journal = useListJournalEntries({ limit: 100 });
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const accountNames = useMemo(() => new Map((accounts.data ?? []).map((account) => [account.id, isAr ? account.nameAr || account.nameEn : account.nameEn])), [accounts.data, isAr]);
  const selectedEntry = selectedEntryId === null ? undefined : journal.data?.find((entry) => entry.id === selectedEntryId);

  function entryAmount(entry: NonNullable<typeof journal.data>[number]) {
    return entry.lines.reduce((total, line) => total + line.debitMinor, 0);
  }

  return <div>
    <PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "قيود اليومية" : "Journal entries"} description={isAr ? "قائمة القيود المسجلة مع عرض تفاصيل كل قيد في نافذة مستقلة." : "Recorded journal entries with each entry available in a separate detail window."} />
    <Panel>
      <PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{journal.data?.length ?? 0} {isAr ? "قيد" : "entries"}</span>}>{isAr ? "القيود المسجلة" : "Recorded entries"}</PanelTitle>
      {journal.isLoading && <LoadingState />}
      {journal.isError && <ErrorState error={journal.error} onRetry={() => journal.refetch()} />}
      {journal.data?.length === 0 && <EmptyState icon={<BookOpen className="h-5 w-5" />} title={isAr ? "لا توجد قيود مسجلة" : "No journal entries"} detail={isAr ? "ستظهر القيود الناتجة عن المبيعات والمصروفات والقيود اليدوية هنا." : "Sales, expenses, and manual entries will appear here."} />}
      {journal.data && journal.data.length > 0 && <div className="grid gap-2">{journal.data.map((entry) => <article key={entry.id} className="grid gap-4 border-b border-border p-4 last:border-0 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-3"><span className="font-mono-ui text-xs text-primary">{entry.entryNumber}</span><span className="text-xs text-muted-foreground">{entry.entryDate}</span></div><p className="mt-2 font-medium">{entry.description}</p><p className="mt-1 text-xs text-muted-foreground">{entry.referenceType ?? (isAr ? "قيد يدوي" : "Manual entry")}</p></div><div className="sm:text-end"><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "القيمة" : "Amount"}</p><p className="mt-1 font-display text-2xl">{money(entryAmount(entry), language)}</p></div><button type="button" className={quietButtonClass} onClick={() => setSelectedEntryId(entry.id)}>{isAr ? "عرض" : "View"}</button></article>)}</div>}
    </Panel>
    {selectedEntry && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEntryId(null); }}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-border bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="journal-entry-dialog-title">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-primary">{isAr ? "تفاصيل القيد" : "Journal entry details"}</p><h2 id="journal-entry-dialog-title" className="mt-2 font-display text-2xl">{selectedEntry.description}</h2></div>
          <button type="button" className={quietButtonClass} aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setSelectedEntryId(null)}><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "رقم القيد" : "Entry number"}</p><p className="mt-1 font-mono-ui text-sm text-primary">{selectedEntry.entryNumber}</p></div>
          <div><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "التاريخ" : "Date"}</p><p className="mt-1 text-sm">{selectedEntry.entryDate}</p></div>
          <div><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "القيمة" : "Amount"}</p><p className="mt-1 font-display text-2xl">{money(entryAmount(selectedEntry), language)}</p></div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {selectedEntry.lines.map((line) => <div key={line.id} className="border border-border bg-muted/30 p-3"><div className="flex justify-between gap-3 text-sm"><span>{accountNames.get(line.accountId) ?? `#${line.accountId}`}</span><span className="font-mono-ui text-xs">{line.debitMinor > 0 ? `Dr ${money(line.debitMinor, language)}` : `Cr ${money(line.creditMinor, language)}`}</span></div><p className="mt-2 text-xs text-muted-foreground">{line.memo || (isAr ? "بدون ملاحظة" : "No memo")}</p></div>)}
        </div>
      </div>
    </div>}
   </div>;
}
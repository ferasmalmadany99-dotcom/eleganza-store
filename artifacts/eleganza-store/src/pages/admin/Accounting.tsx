import { BookOpen, ClipboardList, FileBarChart, Landmark, PackageSearch, Plus, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useCreateAccount,
  useCreateJournalEntry,
  useListAccounts,
  useListJournalEntries,
  useListInventoryMovements,
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

type AccountPickerOption = { id: number; code: string; nameEn: string; nameAr: string };

function AccountPicker({
  id,
  accounts,
  value,
  language,
  onChange,
}: {
  id: string;
  accounts: AccountPickerOption[];
  value: string;
  language: "en" | "ar";
  onChange: (accountId: string) => void;
}) {
  const isAr = language === "ar";
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const selected = accounts.find((account) => String(account.id) === value);
    if (selected) setText(`${selected.code} · ${isAr ? selected.nameAr || selected.nameEn : selected.nameEn}`);
    if (!value) setText("");
  }, [accounts, isAr, value]);

  const filteredAccounts = useMemo(() => {
    const query = text.trim().toLocaleLowerCase();
    if (!query) return accounts.slice(0, 12);
    return accounts.filter((account) => [account.code, account.nameEn, account.nameAr].some((option) => option.toLocaleLowerCase().includes(query))).slice(0, 12);
  }, [accounts, text]);

  function handleChange(nextText: string) {
    setText(nextText);
    setOpen(true);
    const normalized = nextText.trim().toLocaleLowerCase();
    const selected = accounts.find((account) => [
      account.code,
      account.nameEn,
      account.nameAr,
      `${account.code} · ${account.nameEn}`,
      `${account.code} · ${account.nameAr}`,
    ].some((option) => option.trim().toLocaleLowerCase() === normalized));
    onChange(selected ? String(selected.id) : "");
  }

  function selectAccount(account: AccountPickerOption) {
    setText(`${account.code} · ${isAr ? account.nameAr || account.nameEn : account.nameEn}`);
    onChange(String(account.id));
    setOpen(false);
  }

  return <div className="relative grid gap-2">
    <input
      id={id}
      className={inputClass}
      required
      value={text}
      onChange={(event) => handleChange(event.target.value)}
      onFocus={() => setOpen(true)}
      onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      placeholder={isAr ? "اكتب اسم الحساب أو رمزه" : "Type an account name or code"}
      autoComplete="off"
    />
    {open && <div className="absolute inset-x-0 top-11 z-30 max-h-60 overflow-y-auto border border-border bg-card p-1 shadow-xl">
      {filteredAccounts.length > 0 ? filteredAccounts.map((account) => <button
        key={account.id}
        type="button"
        className="flex w-full items-start justify-between gap-3 px-3 py-2 text-start text-sm transition hover:bg-muted"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => selectAccount(account)}
      >
        <span><span className="font-mono-ui text-xs text-primary">{account.code}</span><span className="ms-2">{isAr ? account.nameAr || account.nameEn : account.nameEn}</span></span>
        <span className="text-[10px] text-muted-foreground">{isAr ? account.nameEn : account.nameAr}</span>
      </button>) : <p className="px-3 py-3 text-xs text-muted-foreground">{isAr ? "لا يوجد حساب مطابق." : "No matching account."}</p>}
    </div>}
    {text && !value && <span className="text-xs text-destructive">{isAr ? "اختر حسابًا موجودًا من الاقتراحات." : "Choose an existing account from the suggestions."}</span>}
  </div>;
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
  const { language, role } = useAdmin();
  const isAr = language === "ar";
  const accounts = useListAccounts();
  const journal = useListJournalEntries({ limit: 100 });
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const createJournal = useCreateJournalEntry();
  const [message, setMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [accountForm, setAccountForm] = useState({ code: "", nameEn: "", nameAr: "", type: "expense" as AccountType });
  const [journalForm, setJournalForm] = useState({ entryDate: new Date().toISOString().slice(0, 10), description: "", debitAccountId: "", creditAccountId: "", amount: "", memo: "" });
  const accountNames = useMemo(() => new Map((accounts.data ?? []).map((account) => [account.id, isAr ? account.nameAr || account.nameEn : account.nameEn])), [accounts.data, isAr]);
  const canWrite = role === "owner" || role === "manager";
  const selectedEntry = journal.data?.find((entry) => entry.id === selectedEntryId) ?? journal.data?.[0];

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
    if (!journalForm.debitAccountId || !journalForm.creditAccountId) {
      setMessage(isAr ? "اختر حسابًا صحيحًا للمدين والدائن" : "Choose a valid debit and credit account");
      return;
    }
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
        {canWrite && <form onSubmit={submitJournal} className="grid gap-4"><div className="grid gap-3 sm:grid-cols-2"><Field label={isAr ? "التاريخ" : "Date"}><input className={inputClass} type="date" required value={journalForm.entryDate} onChange={(event) => setJournalForm({ ...journalForm, entryDate: event.target.value })} /></Field><Field label={isAr ? "المبلغ بالدينار" : "Amount in LYD"}><input className={inputClass} type="number" min="0.01" step="0.01" required value={journalForm.amount} onChange={(event) => setJournalForm({ ...journalForm, amount: event.target.value })} /></Field></div><Field label={isAr ? "البيان" : "Description"}><input className={inputClass} required value={journalForm.description} onChange={(event) => setJournalForm({ ...journalForm, description: event.target.value })} placeholder={isAr ? "بيع عطر أو مصروف تشغيلي" : "Sale or operating expense"} /></Field><div className="grid gap-3 sm:grid-cols-2"><Field label={isAr ? "المدين" : "Debit account"}><AccountPicker id="debit-account-options" accounts={accounts.data ?? []} value={journalForm.debitAccountId} language={language} onChange={(accountId) => setJournalForm({ ...journalForm, debitAccountId: accountId })} /></Field><Field label={isAr ? "الدائن" : "Credit account"}><AccountPicker id="credit-account-options" accounts={accounts.data ?? []} value={journalForm.creditAccountId} language={language} onChange={(accountId) => setJournalForm({ ...journalForm, creditAccountId: accountId })} /></Field></div><Field label={isAr ? "ملاحظة" : "Memo"}><input className={inputClass} value={journalForm.memo} onChange={(event) => setJournalForm({ ...journalForm, memo: event.target.value })} /></Field><button className={buttonClass} disabled={createJournal.isPending}><Save className="h-4 w-4" />{isAr ? "حفظ القيد المتوازن" : "Save balanced entry"}</button></form>}
      </Panel>
    </div>
    <Panel className="mt-5"><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">Debit = Credit</span>}>{isAr ? "دفتر اليومية" : "Journal ledger"}</PanelTitle>{journal.isLoading && <LoadingState />}{journal.isError && <ErrorState error={journal.error} onRetry={() => journal.refetch()} />}{journal.data?.length === 0 && <EmptyState icon={<BookOpen className="h-5 w-5" />} title="No journal entries" detail="Completed sales, expenses, and manual entries will appear here." />}{journal.data && journal.data.length > 0 && <div className="grid gap-3">{journal.data.map((entry) => <article key={entry.id} className="border-b border-border pb-4 last:border-0 last:pb-0"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="font-mono-ui text-xs text-primary">{entry.entryNumber}</span><span className="ms-3 text-xs text-muted-foreground">{entry.entryDate}</span><p className="mt-2 font-medium">{entry.description}</p></div><span className="text-xs text-muted-foreground">{entry.referenceType ?? "manual"}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{entry.lines.map((line) => <div key={line.id} className="flex justify-between border-s-2 border-border bg-muted/30 px-3 py-2 text-xs"><span>{accountNames.get(line.accountId) ?? `#${line.accountId}`}</span><span className="font-mono-ui">{line.debitMinor > 0 ? `Dr ${money(line.debitMinor, language)}` : `Cr ${money(line.creditMinor, language)}`}</span></div>)}</div></article>)}</div>}</Panel>
     <Panel className="mt-5">
       <PanelTitle>{isAr ? "عرض القيد وأطرافه" : "Journal entry details"}</PanelTitle>
       <select className={inputClass} value={selectedEntry?.id ?? ""} onChange={(event) => setSelectedEntryId(Number(event.target.value))}>
         {journal.data?.map((entry) => <option key={entry.id} value={entry.id}>{entry.entryNumber} · {entry.description}</option>)}
       </select>
       {selectedEntry && <div className="mt-5 grid gap-4">
         <div className="grid gap-3 sm:grid-cols-3">
           <div><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "رقم القيد" : "Entry number"}</p><p className="mt-1 font-mono-ui text-sm text-primary">{selectedEntry.entryNumber}</p></div>
           <div><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "التاريخ" : "Date"}</p><p className="mt-1 text-sm">{selectedEntry.entryDate}</p></div>
           <div><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "المرجع" : "Reference"}</p><p className="mt-1 text-sm">{selectedEntry.referenceType ?? (isAr ? "يدوي" : "Manual")}{selectedEntry.referenceId ? ` · ${selectedEntry.referenceId}` : ""}</p></div>
         </div>
         <div className="border-t border-border pt-4"><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "البيان" : "Description"}</p><p className="mt-2 text-sm font-medium">{selectedEntry.description}</p></div>
         <div className="grid gap-2 sm:grid-cols-2">{selectedEntry.lines.map((line) => <div key={line.id} className="border border-border bg-muted/30 p-3"><div className="flex justify-between gap-3 text-sm"><span>{accountNames.get(line.accountId) ?? `#${line.accountId}`}</span><span className="font-mono-ui text-xs">{line.debitMinor > 0 ? `Dr ${money(line.debitMinor, language)}` : `Cr ${money(line.creditMinor, language)}`}</span></div><p className="mt-2 text-xs text-muted-foreground">{line.memo || (isAr ? "بدون ملاحظة" : "No memo")}</p></div>)}</div>
       </div>}
     </Panel>
     <Toast message={message} onClose={() => setMessage(null)} />
  </div>;
}
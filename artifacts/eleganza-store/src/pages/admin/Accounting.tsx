import { BookOpen, ClipboardList, FileBarChart, Landmark, PackageSearch, Plus, Save, Scale, TrendingUp, Wallet, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  useCreateAccount,
  useCreateJournalEntry,
  useListAccounts,
  useListJournalEntries,
  useListInventoryMovements,
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
type AccountingSection = "journal" | "chart" | "ledger" | "cashboxes" | "trialBalance" | "balanceSheet" | "incomeStatement" | "inventory" | "statement";

const accountingSections: { id: AccountingSection; label: string; arabic: string; icon: typeof BookOpen }[] = [
  { id: "journal", label: "Journal entries", arabic: "قيود اليومية", icon: BookOpen },
  { id: "chart", label: "Chart of accounts", arabic: "شجرة الحسابات", icon: Landmark },
  { id: "ledger", label: "General ledger", arabic: "دفتر الأستاذ", icon: ClipboardList },
  { id: "cashboxes", label: "Cashboxes", arabic: "الخزائن", icon: Wallet },
  { id: "trialBalance", label: "Trial balance", arabic: "ميزان المراجعة", icon: Scale },
  { id: "balanceSheet", label: "Balance sheet", arabic: "الميزانية العمومية", icon: Scale },
  { id: "incomeStatement", label: "Income statement", arabic: "قائمة الدخل", icon: TrendingUp },
  { id: "inventory", label: "Inventory report", arabic: "تقرير المخزون", icon: PackageSearch },
  { id: "statement", label: "Account statement", arabic: "كشف حساب", icon: FileBarChart },
];

function sortAccountsByCode<T extends { code: string }>(left: T, right: T) {
  return Number(left.code) - Number(right.code) || left.code.localeCompare(right.code);
}

function accountTypeLabel(type: AccountType | undefined, isAr: boolean) {
  const labels: Record<AccountType, { en: string; ar: string }> = {
    asset: { en: "Asset", ar: "أصل" },
    liability: { en: "Liability", ar: "التزام" },
    equity: { en: "Equity", ar: "حقوق ملكية" },
    revenue: { en: "Revenue", ar: "إيراد" },
    expense: { en: "Expense", ar: "مصروف" },
  };
  return type ? labels[type][isAr ? "ar" : "en"] : (isAr ? "غير محدد" : "Unclassified");
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
    {open && <div className="absolute inset-x-0 top-11 z-[60] max-h-60 overflow-y-auto border border-border bg-card p-1 shadow-xl">
      {filteredAccounts.length > 0 ? filteredAccounts.map((account) => <button key={account.id} type="button" className="flex w-full items-start justify-between gap-3 px-3 py-2 text-start text-sm transition hover:bg-muted" onMouseDown={(event) => event.preventDefault()} onClick={() => selectAccount(account)}>
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
    <aside className="rounded-2xl border border-border bg-card p-4 xl:self-start"><div className="border-b border-border pb-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">{language === "ar" ? "مساحة المحاسبة" : "Accounting workspace"}</p><p className="mt-2 text-sm text-muted-foreground">{language === "ar" ? "اختر القسم المطلوب" : "Choose a section"}</p></div><nav className="mt-3 grid gap-1">{accountingSections.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setSection(item.id)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-start text-sm transition ${section === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4" />{language === "ar" ? item.arabic : item.label}</button>; })}</nav></aside>
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
  const [hasInitializedAccount, setHasInitializedAccount] = useState(false);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState("");
  const activeAccount = accounts.data?.find((account) => String(account.id) === selectedAccount);
  const createAccount = useCreateAccount();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ code: "", nameEn: "", nameAr: "", type: "expense" as AccountType, parentId: "" });
  const activeAccountId = activeAccount?.id;
  const statementRows = (journal.data ?? []).flatMap((entry) => entry.lines.filter((line) => line.accountId === activeAccountId).map((line) => ({ entry, line })));
  const debitTotal = statementRows.reduce((total, row) => total + row.line.debitMinor, 0);
  const creditTotal = statementRows.reduce((total, row) => total + row.line.creditMinor, 0);
  const isCreditNormal = activeAccount?.type === "liability" || activeAccount?.type === "equity" || activeAccount?.type === "revenue";
  const finalBalance = isCreditNormal ? creditTotal - debitTotal : debitTotal - creditTotal;

  useEffect(() => {
    if (!hasInitializedAccount && accounts.data?.length) {
      setSelectedAccount(String(accounts.data[0].id));
      setHasInitializedAccount(true);
    }
  }, [accounts.data, hasInitializedAccount]);

  const journalTotals = useMemo(() => {
    const totals = new Map<number, { debitMinor: number; creditMinor: number }>();
    (journal.data ?? []).forEach((entry) => entry.lines.forEach((line) => {
      const current = totals.get(line.accountId) ?? { debitMinor: 0, creditMinor: 0 };
      current.debitMinor += line.debitMinor;
      current.creditMinor += line.creditMinor;
      totals.set(line.accountId, current);
    }));
    return totals;
  }, [journal.data]);

  const cashboxRows = useMemo(() => {
    const cashAccountId = accounts.data?.find((account) => account.code === "1000")?.id;
    return (accounts.data ?? [])
    .filter((account) => {
      const searchable = `${account.code} ${account.nameEn} ${account.nameAr}`.toLocaleLowerCase();
      const isCashAccount = account.code === "1000" || account.id === cashAccountId || account.parentId === cashAccountId;
      return isCashAccount || ["cash", "cashbox", "bank", "vault", "نقد", "خزينة", "مصرف", "بنك"].some((term) => searchable.includes(term));
    })
    .sort(sortAccountsByCode)
    .map((account) => {
      const totals = journalTotals.get(account.id) ?? { debitMinor: 0, creditMinor: 0 };
      return { account, totals, balance: totals.debitMinor - totals.creditMinor };
    });
  }, [accounts.data, journalTotals]);

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
  if (section === "ledger") {
    const ledgerAccount = accounts.data?.find((account) => String(account.id) === selectedLedgerAccount);
    const ledgerGroups = ledgerAccount ? [ledgerAccount].map((account) => {
      const rows = (journal.data ?? []).flatMap((entry) => entry.lines
        .filter((line) => line.accountId === account.id)
        .map((line) => ({ entry, line })));
      const totals = journalTotals.get(account.id) ?? { debitMinor: 0, creditMinor: 0 };
      return { account, rows, totals, balance: totals.debitMinor - totals.creditMinor };
    }) : [];
    const lineCount = ledgerGroups.reduce((total, group) => total + group.rows.length, 0);

    return <div>
      <PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "دفتر الأستاذ" : "General ledger"} description={isAr ? "عرض حركة كل حساب مع إجماليات المدين والدائن والرصيد الحالي." : "Review every account's activity with debit, credit, and current balance totals."} />
      <Panel>
        <div className="mb-5 grid gap-2">
          <label htmlFor="ledger-account-picker" className="text-sm font-medium text-foreground">{isAr ? "اختر الحساب" : "Choose account"}</label>
          <AccountPicker id="ledger-account-picker" accounts={accounts.data ?? []} value={selectedLedgerAccount} language={language} onChange={setSelectedLedgerAccount} />
          <p className="text-xs text-muted-foreground">{isAr ? "اكتب اسم الحساب أو رقمه ثم اختره من القائمة." : "Type an account name or code, then choose it from the list."}</p>
        </div>
        <PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{lineCount} {isAr ? "حركة" : "lines"}</span>}>{isAr ? "حركة الحسابات" : "Account activity"}</PanelTitle>
        {journal.isLoading || accounts.isLoading ? <LoadingState label={isAr ? "جاري تحميل دفتر الأستاذ..." : "Loading general ledger..."} /> : journal.isError ? <ErrorState error={journal.error} onRetry={() => journal.refetch()} /> : accounts.isError ? <ErrorState error={accounts.error} onRetry={() => accounts.refetch()} /> : !selectedLedgerAccount ? <EmptyState icon={<ClipboardList className="h-5 w-5" />} title={isAr ? "اختر حسابًا لعرض دفتر الأستاذ" : "Choose an account to view the ledger"} detail={isAr ? "استخدم خانة البحث أعلاه، وستظهر الحسابات المطابقة في قائمة الاختيار." : "Use the search field above to find and select an account."} /> : ledgerGroups.length === 0 ? <EmptyState icon={<ClipboardList className="h-5 w-5" />} title={isAr ? "الحساب غير موجود" : "Account not found"} detail={isAr ? "اختر حسابًا من القائمة المقترحة." : "Choose an account from the suggestions."} /> : <div className="grid gap-6">
          {ledgerGroups.map(({ account, rows, totals, balance }) => <section key={account.id} className="border border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
              <div><p className="font-mono-ui text-xs text-primary">{account.code}</p><p className="mt-1 text-sm font-medium">{isAr ? account.nameAr || account.nameEn : account.nameEn}</p></div>
              <div className="text-end"><p className="text-[10px] uppercase tracking-[.12em] text-muted-foreground">{isAr ? "الرصيد" : "Balance"}</p><p className="mt-1 font-mono-ui text-sm">{money(balance, language)}</p></div>
            </div>
            <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-sm"><thead className="text-[10px] uppercase tracking-[.12em] text-muted-foreground"><tr><th className="px-4 py-3 text-start">{isAr ? "التاريخ والبيان" : "Date & description"}</th><th className="px-4 py-3 text-end">{isAr ? "مدين" : "Debit"}</th><th className="px-4 py-3 text-end">{isAr ? "دائن" : "Credit"}</th></tr></thead><tbody>{rows.map(({ entry, line }) => <tr key={line.id} className="border-t border-border"><td className="px-4 py-3"><span className="font-mono-ui text-xs text-primary">{entry.entryDate} · {entry.entryNumber}</span><p className="mt-1">{entry.description}</p></td><td className="px-4 py-3 text-end">{line.debitMinor ? money(line.debitMinor, language) : "—"}</td><td className="px-4 py-3 text-end">{line.creditMinor ? money(line.creditMinor, language) : "—"}</td></tr>)}{rows.length === 0 && <tr><td colSpan={3} className="px-4 py-5 text-sm text-muted-foreground">{isAr ? "لا توجد حركات لهذا الحساب." : "No activity for this account."}</td></tr>}</tbody><tfoot><tr className="border-t-2 border-border text-sm font-semibold"><td className="px-4 py-3">{isAr ? "الإجمالي" : "Total"}</td><td className="px-4 py-3 text-end">{money(totals.debitMinor, language)}</td><td className="px-4 py-3 text-end">{money(totals.creditMinor, language)}</td></tr></tfoot></table></div>
          </section>)}
        </div>}
      </Panel>
    </div>;
  }
  if (section === "cashboxes") {
    const totalCashboxBalance = cashboxRows.reduce((total, row) => total + row.balance, 0);
    return <div>
      <PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "الخزائن" : "Cashboxes"} description={isAr ? "عرض أرصدة النقد والخزائن والمصارف بناءً على القيود المحاسبية." : "Review cash, cashbox, and bank balances from posted journal entries."} />
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="border border-primary/30 bg-primary/5 p-4"><p className="text-xs text-muted-foreground">{isAr ? "إجمالي الخزائن" : "Total cash available"}</p><p className="mt-3 font-display text-3xl">{money(totalCashboxBalance, language)}</p></div>
        <div className="border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{isAr ? "عدد الخزائن والحسابات النقدية" : "Cash and bank accounts"}</p><p className="mt-3 font-display text-3xl">{cashboxRows.length}</p></div>
      </div>
      <Panel>
        <PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{cashboxRows.length} {isAr ? "حساب" : "accounts"}</span>}>{isAr ? "أرصدة الخزائن" : "Cashbox balances"}</PanelTitle>
        {journal.isLoading || accounts.isLoading ? <LoadingState label={isAr ? "جاري تحميل أرصدة الخزائن..." : "Loading cashbox balances..."} /> : journal.isError ? <ErrorState error={journal.error} onRetry={() => journal.refetch()} /> : accounts.isError ? <ErrorState error={accounts.error} onRetry={() => accounts.refetch()} /> : cashboxRows.length === 0 ? <EmptyState icon={<Wallet className="h-5 w-5" />} title={isAr ? "لا توجد خزائن مسجلة" : "No cashboxes found"} detail={isAr ? "أضف حسابًا من نوع أصل باسم خزينة أو مصرف ليظهر هنا." : "Add an asset account named Cash, Cashbox, or Bank to show it here."} /> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="text-[10px] uppercase tracking-[.14em] text-muted-foreground"><tr><th className="pb-3 text-start">{isAr ? "الخزينة" : "Cashbox"}</th><th className="pb-3 text-end">{isAr ? "إجمالي المدين" : "Total debit"}</th><th className="pb-3 text-end">{isAr ? "إجمالي الدائن" : "Total credit"}</th><th className="pb-3 text-end">{isAr ? "الرصيد" : "Balance"}</th></tr></thead><tbody>{cashboxRows.map(({ account, totals, balance }) => <tr key={account.id} className="border-t border-border"><td className="py-4"><span className="font-mono-ui text-xs text-primary">{account.code}</span><span className="ms-3">{isAr ? account.nameAr || account.nameEn : account.nameEn}</span></td><td className="py-4 text-end">{money(totals.debitMinor, language)}</td><td className="py-4 text-end">{money(totals.creditMinor, language)}</td><td className="py-4 text-end font-medium">{money(balance, language)}</td></tr>)}</tbody></table></div>}
      </Panel>
    </div>;
  }
  if (section === "trialBalance") {
    const orderedAccounts = [...(accounts.data ?? [])].sort(sortAccountsByCode);
    const rows = orderedAccounts.map((account) => ({ account, totals: journalTotals.get(account.id) ?? { debitMinor: 0, creditMinor: 0 } }));
    const totalDebit = rows.reduce((total, row) => total + row.totals.debitMinor, 0);
    const totalCredit = rows.reduce((total, row) => total + row.totals.creditMinor, 0);
    return <div><PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "ميزان المراجعة" : "Trial balance"} description={isAr ? "مقارنة إجماليات المدين والدائن لكل حساب للتأكد من توازن القيود." : "Compare debit and credit totals for every account to verify journal balance."} /><Panel><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{rows.length} {isAr ? "حساب" : "accounts"}</span>}>{isAr ? "أرصدة الحسابات" : "Account balances"}</PanelTitle>{journal.isLoading || accounts.isLoading ? <LoadingState /> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="text-[10px] uppercase tracking-[.14em] text-muted-foreground"><tr><th className="pb-3 text-start">{isAr ? "الحساب" : "Account"}</th><th className="pb-3 text-end">{isAr ? "مدين" : "Debit"}</th><th className="pb-3 text-end">{isAr ? "دائن" : "Credit"}</th><th className="pb-3 text-end">{isAr ? "الرصيد" : "Balance"}</th></tr></thead><tbody>{rows.map(({ account, totals }) => <tr key={account.id} className="border-t border-border"><td className="py-3"><span className="font-mono-ui text-xs text-primary">{account.code}</span><span className="ms-3">{isAr ? account.nameAr || account.nameEn : account.nameEn}</span></td><td className="py-3 text-end">{totals.debitMinor ? money(totals.debitMinor, language) : "—"}</td><td className="py-3 text-end">{totals.creditMinor ? money(totals.creditMinor, language) : "—"}</td><td className="py-3 text-end font-medium">{money(Math.abs(totals.debitMinor - totals.creditMinor), language)}</td></tr>)}</tbody><tfoot><tr className="border-t-2 border-border font-semibold"><td className="py-4">{isAr ? "الإجمالي" : "Total"}</td><td className="py-4 text-end">{money(totalDebit, language)}</td><td className="py-4 text-end">{money(totalCredit, language)}</td><td className="py-4 text-end">{money(Math.abs(totalDebit - totalCredit), language)}</td></tr></tfoot></table></div>}</Panel></div>;
  }
  if (section === "balanceSheet") {
    const accountRows = (type: AccountType) => (accounts.data ?? [])
      .filter((account) => account.type === type)
      .sort(sortAccountsByCode)
      .map((account) => {
        const totals = journalTotals.get(account.id) ?? { debitMinor: 0, creditMinor: 0 };
        const amount = type === "asset" ? totals.debitMinor - totals.creditMinor : totals.creditMinor - totals.debitMinor;
        return { account, amount };
      })
      .filter(({ amount }) => amount !== 0);
    const assetRows = accountRows("asset");
    const liabilityRows = accountRows("liability");
    const equityRows = accountRows("equity");
    const revenueTotal = (accounts.data ?? []).filter((account) => account.type === "revenue").reduce((total, account) => {
      const totals = journalTotals.get(account.id) ?? { debitMinor: 0, creditMinor: 0 };
      return total + totals.creditMinor - totals.debitMinor;
    }, 0);
    const expenseTotal = (accounts.data ?? []).filter((account) => account.type === "expense").reduce((total, account) => {
      const totals = journalTotals.get(account.id) ?? { debitMinor: 0, creditMinor: 0 };
      return total + totals.debitMinor - totals.creditMinor;
    }, 0);
    const netIncome = revenueTotal - expenseTotal;
    const totalAssets = assetRows.reduce((total, row) => total + row.amount, 0);
    const totalLiabilities = liabilityRows.reduce((total, row) => total + row.amount, 0);
    const totalEquity = equityRows.reduce((total, row) => total + row.amount, 0) + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const balanceDifference = totalAssets - totalLiabilitiesAndEquity;
    const AccountBalanceRows = ({ rows }: { rows: Array<{ account: { id: number; code: string; nameEn: string; nameAr: string }; amount: number }> }) => rows.length === 0
      ? <p className="py-3 text-sm text-muted-foreground">{isAr ? "لا توجد أرصدة" : "No balances"}</p>
      : <div>{rows.map(({ account, amount }) => <div key={account.id} className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm last:border-0"><span><span className="font-mono-ui text-xs text-primary">{account.code}</span><span className="ms-3">{isAr ? account.nameAr || account.nameEn : account.nameEn}</span></span><span className="font-mono-ui">{money(amount, language)}</span></div>)}</div>;
    return <div><PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "الميزانية العمومية" : "Balance sheet"} description={isAr ? "عرض الأصول والالتزامات وحقوق الملكية للتحقق من المعادلة المحاسبية." : "Review assets, liabilities, and equity against the accounting equation."} />{journal.isLoading || accounts.isLoading ? <LoadingState /> : <div className="grid gap-5 xl:grid-cols-2"><Panel><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{isAr ? "الأصول" : "Assets"}</span>}>{isAr ? "الأصول" : "Assets"}</PanelTitle><AccountBalanceRows rows={assetRows} /><div className="mt-3 flex justify-between border-t-2 border-border pt-3 text-sm font-semibold"><span>{isAr ? "إجمالي الأصول" : "Total assets"}</span><span className="font-mono-ui">{money(totalAssets, language)}</span></div></Panel><div className="grid gap-5"><Panel><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{isAr ? "الالتزامات" : "Liabilities"}</span>}>{isAr ? "الالتزامات" : "Liabilities"}</PanelTitle><AccountBalanceRows rows={liabilityRows} /><div className="mt-3 flex justify-between border-t-2 border-border pt-3 text-sm font-semibold"><span>{isAr ? "إجمالي الالتزامات" : "Total liabilities"}</span><span className="font-mono-ui">{money(totalLiabilities, language)}</span></div></Panel><Panel><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{isAr ? "حقوق الملكية" : "Equity"}</span>}>{isAr ? "حقوق الملكية" : "Equity"}</PanelTitle><AccountBalanceRows rows={equityRows} /><div className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm"><span>{isAr ? "صافي الربح / (الخسارة)" : "Net income / (loss)"}</span><span className="font-mono-ui">{money(netIncome, language)}</span></div><div className="mt-3 flex justify-between border-t-2 border-border pt-3 text-sm font-semibold"><span>{isAr ? "إجمالي الالتزامات وحقوق الملكية" : "Total liabilities & equity"}</span><span className="font-mono-ui">{money(totalLiabilitiesAndEquity, language)}</span></div></Panel></div></div>}<div className={`mt-5 border p-4 text-sm ${balanceDifference === 0 ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"}`}><div className="flex flex-wrap items-center justify-between gap-3"><span>{isAr ? "حالة الميزانية" : "Balance status"}</span><span className="font-medium">{balanceDifference === 0 ? (isAr ? "متوازنة" : "Balanced") : (isAr ? "تحتاج إلى مراجعة" : "Needs review")}</span></div>{balanceDifference !== 0 && <p className="mt-2 text-xs text-muted-foreground">{isAr ? `الفرق بين الأصول والالتزامات وحقوق الملكية: ${money(Math.abs(balanceDifference), language)}` : `Difference between assets and liabilities & equity: ${money(Math.abs(balanceDifference), language)}`}</p>}</div></div>;
  }
  if (section === "incomeStatement") {
    const revenueRows = (accounts.data ?? []).filter((account) => account.type === "revenue").sort(sortAccountsByCode).map((account) => {
      const totals = journalTotals.get(account.id) ?? { debitMinor: 0, creditMinor: 0 };
      return { account, amount: totals.creditMinor - totals.debitMinor };
    });
    const expenseRows = (accounts.data ?? []).filter((account) => account.type === "expense").sort(sortAccountsByCode).map((account) => {
      const totals = journalTotals.get(account.id) ?? { debitMinor: 0, creditMinor: 0 };
      return { account, amount: totals.debitMinor - totals.creditMinor };
    });
    const totalRevenue = revenueRows.reduce((total, row) => total + row.amount, 0);
    const totalExpenses = expenseRows.reduce((total, row) => total + row.amount, 0);
    const netIncome = totalRevenue - totalExpenses;
    return <div><PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "قائمة الدخل" : "Income statement"} description={isAr ? "عرض الإيرادات والمصروفات وصافي الربح بناءً على القيود المسجلة." : "Review revenue, expenses, and net income from recorded journal entries."} /><div className="mb-5 grid gap-3 sm:grid-cols-3"><div className="border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{isAr ? "إجمالي الإيرادات" : "Total revenue"}</p><p className="mt-3 font-display text-2xl">{money(totalRevenue, language)}</p></div><div className="border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{isAr ? "إجمالي المصروفات" : "Total expenses"}</p><p className="mt-3 font-display text-2xl">{money(totalExpenses, language)}</p></div><div className="border border-primary/30 bg-primary/5 p-4"><p className="text-xs text-muted-foreground">{isAr ? "صافي الربح" : "Net income"}</p><p className="mt-3 font-display text-2xl">{money(netIncome, language)}</p></div></div><div className="grid gap-5 xl:grid-cols-2"><Panel><PanelTitle>{isAr ? "الإيرادات" : "Revenue"}</PanelTitle>{revenueRows.length === 0 ? <EmptyState title={isAr ? "لا توجد إيرادات" : "No revenue"} detail={isAr ? "ستظهر الإيرادات عند ترحيل قيود على حسابات الإيرادات." : "Revenue appears when entries are posted to revenue accounts."} /> : <div>{revenueRows.map(({ account, amount }) => <div key={account.id} className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm last:border-0"><span><span className="font-mono-ui text-xs text-primary">{account.code}</span><span className="ms-3">{isAr ? account.nameAr || account.nameEn : account.nameEn}</span></span><span className="font-mono-ui">{money(amount, language)}</span></div>)}</div>}</Panel><Panel><PanelTitle>{isAr ? "المصروفات" : "Expenses"}</PanelTitle>{expenseRows.length === 0 ? <EmptyState title={isAr ? "لا توجد مصروفات" : "No expenses"} detail={isAr ? "ستظهر المصروفات عند ترحيل قيود على حسابات المصروفات." : "Expenses appear when entries are posted to expense accounts."} /> : <div>{expenseRows.map(({ account, amount }) => <div key={account.id} className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm last:border-0"><span><span className="font-mono-ui text-xs text-primary">{account.code}</span><span className="ms-3">{isAr ? account.nameAr || account.nameEn : account.nameEn}</span></span><span className="font-mono-ui">{money(amount, language)}</span></div>)}</div>}</Panel></div></div>;
  }
  if (section === "inventory") return <div><PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "تقرير المخزون" : "Inventory report"} description={isAr ? "حركات المخزون وأثرها على قيمة المخزون المحاسبية." : "Inventory movements and their accounting impact."} /><Panel><PanelTitle>{isAr ? "آخر الحركات" : "Recent movements"}</PanelTitle>{movements.data?.map((movement) => <div key={movement.id} className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border py-4 text-sm"><div><p>{isAr ? movement.productNameAr || movement.productNameEn || `#${movement.productId}` : movement.productNameEn || `#${movement.productId}`}</p><p className="mt-1 text-xs text-muted-foreground">{movement.type}</p></div><span className={movement.quantity >= 0 ? "text-primary" : "text-destructive"}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</span><span className="font-mono-ui text-xs">{movement.quantityAfter}</span></div>)}</Panel></div>;
  if (section === "statement") return <div><PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "كشف حساب" : "Account statement"} description={isAr ? "راجع حركة حساب محدد مع رصيده الختامي." : "Review activity and balance for a selected account."} /><Panel><PanelTitle>{isAr ? "الحساب" : "Account"}</PanelTitle><AccountPicker id="statement-account" accounts={accounts.data ?? []} value={selectedAccount} language={language} onChange={setSelectedAccount} /><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="border border-border p-4"><p className="text-xs text-muted-foreground">{isAr ? "إجمالي المدين" : "Total debit"}</p><p className="mt-3 font-display text-2xl">{money(debitTotal, language)}</p></div><div className="border border-border p-4"><p className="text-xs text-muted-foreground">{isAr ? "إجمالي الدائن" : "Total credit"}</p><p className="mt-3 font-display text-2xl">{money(creditTotal, language)}</p></div><div className="border border-primary/30 bg-primary/5 p-4"><p className="text-xs text-muted-foreground">{isAr ? "الرصيد النهائي" : "Final balance"}</p><p className="mt-3 font-display text-2xl">{money(finalBalance, language)}</p></div></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="text-[10px] uppercase tracking-[.14em] text-muted-foreground"><tr><th className="pb-3 text-start">{isAr ? "التاريخ والبيان" : "Date & description"}</th><th className="pb-3 text-end">{isAr ? "مدين" : "Debit"}</th><th className="pb-3 text-end">{isAr ? "دائن" : "Credit"}</th><th className="pb-3 text-end">{isAr ? "ملاحظة" : "Memo"}</th></tr></thead><tbody>{statementRows.map(({ entry, line }) => <tr key={line.id} className="border-t border-border"><td className="py-4"><span className="font-mono-ui text-xs text-primary">{entry.entryDate} · {entry.entryNumber}</span><p className="mt-1">{entry.description}</p></td><td className="py-4 text-end">{line.debitMinor ? money(line.debitMinor, language) : "—"}</td><td className="py-4 text-end">{line.creditMinor ? money(line.creditMinor, language) : "—"}</td><td className="py-4 text-end text-xs text-muted-foreground">{line.memo || "—"}</td></tr>)}</tbody></table>{statementRows.length === 0 && <EmptyState icon={<FileBarChart className="h-5 w-5" />} title={isAr ? "لا توجد حركات" : "No movements"} detail={isAr ? "ستظهر الحركات عند ترحيل قيود على هذا الحساب." : "Movements will appear when entries are posted to this account."} />}</div></Panel></div>;
  return <div><PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "قيود اليومية" : "Journal entries"} description={isAr ? "القيود المرتبطة بالمبيعات والمصروفات والتسويات." : "Entries generated from sales, expenses, and reconciliations."} /><Panel><PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{journal.data?.length ?? 0} entries</span>}>{isAr ? "السجل" : "Ledger"}</PanelTitle>{journal.data?.map((entry) => <div key={entry.id} className="border-b border-border py-4 last:border-0"><div className="flex flex-wrap justify-between gap-3"><div><span className="font-mono-ui text-xs text-primary">{entry.entryNumber}</span><p className="mt-2 text-sm font-medium">{entry.description}</p></div><span className="text-xs text-muted-foreground">{entry.entryDate}</span></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{entry.lines.map((line) => <div key={line.id} className="flex justify-between bg-muted/30 px-3 py-2 text-xs"><span>#{line.accountId}</span><span className="font-mono-ui">{line.debitMinor > 0 ? `Dr ${money(line.debitMinor, language)}` : `Cr ${money(line.creditMinor, language)}`}</span></div>)}</div></div>)}</Panel></div>;
}

function AccountingJournal() {
  const { language, role } = useAdmin();
  const isAr = language === "ar";
  const accounts = useListAccounts();
  const journal = useListJournalEntries({ limit: 100 });
  const createJournal = useCreateJournalEntry();
  const [createOpen, setCreateOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<number | null>(null);
  const [journalForm, setJournalForm] = useState({ entryDate: new Date().toISOString().slice(0, 10), description: "", debitAccountId: "", creditAccountId: "", amount: "", memo: "" });
  const accountNames = useMemo(() => new Map((accounts.data ?? []).map((account) => [account.id, isAr ? account.nameAr || account.nameEn : account.nameEn])), [accounts.data, isAr]);
  const accountDetails = useMemo(() => new Map((accounts.data ?? []).map((account) => [account.id, account])), [accounts.data]);
  const canWrite = role === "owner" || role === "manager";
  const selectedEntry = selectedEntryId === null ? undefined : journal.data?.find((entry) => entry.id === selectedEntryId);

  function entryAmount(entry: NonNullable<typeof journal.data>[number]) {
    return entry.lines.reduce((total, line) => total + line.debitMinor, 0);
  }

  function resetJournalForm() {
    setJournalForm({ entryDate: new Date().toISOString().slice(0, 10), description: "", debitAccountId: "", creditAccountId: "", amount: "", memo: "" });
  }

  async function submitJournal(event: React.FormEvent) {
    event.preventDefault();
    if (!journalForm.debitAccountId || !journalForm.creditAccountId) {
      setMessage(isAr ? "اختر حسابًا صحيحًا للمدين والدائن" : "Choose a valid debit and credit account");
      return;
    }
    const amountMinor = Math.round(Number(journalForm.amount) * 100);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      setMessage(isAr ? "أدخل مبلغًا صحيحًا أكبر من صفر" : "Enter a valid amount greater than zero");
      return;
    }
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
      resetJournalForm();
      setCreateOpen(false);
      setMessage(isAr ? "تم حفظ قيد اليومية" : "Journal entry saved");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return <div>
    <PageHeader eyebrow={isAr ? "المحاسبة" : "Accounting"} title={isAr ? "قيود اليومية" : "Journal entries"} description={isAr ? "قائمة القيود المسجلة مع عرض تفاصيل كل قيد في نافذة مستقلة." : "Recorded journal entries with each entry available in a separate detail window."} />
    <Panel>
      <div className="mb-5 flex items-center justify-between gap-3">
        <PanelTitle detail={<span className="font-mono-ui text-[10px] text-muted-foreground">{journal.data?.length ?? 0} {isAr ? "قيد" : "entries"}</span>}>{isAr ? "القيود المسجلة" : "Recorded entries"}</PanelTitle>
        {canWrite && <button type="button" className={buttonClass} onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" />{isAr ? "إنشاء قيد" : "Create entry"}</button>}
      </div>
      {journal.isLoading && <LoadingState />}
      {journal.isError && <ErrorState error={journal.error} onRetry={() => journal.refetch()} />}
      {journal.data?.length === 0 && <EmptyState icon={<BookOpen className="h-5 w-5" />} title={isAr ? "لا توجد قيود مسجلة" : "No journal entries"} detail={isAr ? "ستظهر القيود الناتجة عن المبيعات والمصروفات والقيود اليدوية هنا." : "Sales, expenses, and manual entries will appear here."} />}
      {journal.data && journal.data.length > 0 && <div className="grid gap-2">{journal.data.map((entry) => <article key={entry.id} className="grid gap-4 border-b border-border p-4 last:border-0 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><div className="flex flex-wrap items-center gap-3"><span className="font-mono-ui text-xs text-primary">{entry.entryNumber}</span><span className="text-xs text-muted-foreground">{entry.entryDate}</span></div><p className="mt-2 font-medium">{entry.description}</p><p className="mt-1 text-xs text-muted-foreground">{entry.referenceType ?? (isAr ? "قيد يدوي" : "Manual entry")}</p></div><div className="sm:text-end"><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "القيمة" : "Amount"}</p><p className="mt-1 font-display text-2xl">{money(entryAmount(entry), language)}</p></div><button type="button" className={quietButtonClass} onClick={() => setSelectedEntryId(entry.id)}>{isAr ? "عرض" : "View"}</button></article>)}</div>}
    </Panel>
    {createOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCreateOpen(false); }}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="create-journal-dialog-title">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div><p className="font-mono-ui text-[10px] uppercase tracking-[.16em] text-primary">{isAr ? "قيد يومية جديد" : "New journal entry"}</p><h2 id="create-journal-dialog-title" className="mt-2 font-display text-2xl">{isAr ? "إنشاء قيد" : "Create journal entry"}</h2></div>
          <button type="button" className={quietButtonClass} aria-label={isAr ? "إغلاق" : "Close"} onClick={() => setCreateOpen(false)}><X className="h-4 w-4" /></button>
        </div>
        {accounts.isLoading && <LoadingState label={isAr ? "جاري تحميل الحسابات..." : "Loading accounts..."} />}
        {accounts.isError && <ErrorState error={accounts.error} onRetry={() => accounts.refetch()} />}
        {accounts.data && <form onSubmit={submitJournal} className="mt-5 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={isAr ? "التاريخ" : "Date"}><input className={inputClass} type="date" required value={journalForm.entryDate} onChange={(event) => setJournalForm({ ...journalForm, entryDate: event.target.value })} /></Field>
            <Field label={isAr ? "المبلغ بالدينار" : "Amount in LYD"}><input className={inputClass} type="number" min="0.01" step="0.01" required value={journalForm.amount} onChange={(event) => setJournalForm({ ...journalForm, amount: event.target.value })} /></Field>
          </div>
          <Field label={isAr ? "البيان" : "Description"}><input className={inputClass} required value={journalForm.description} onChange={(event) => setJournalForm({ ...journalForm, description: event.target.value })} placeholder={isAr ? "بيع عطر أو مصروف تشغيلي" : "Sale or operating expense"} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={isAr ? "المدين" : "Debit account"}><AccountPicker id="create-debit-account" accounts={accounts.data} value={journalForm.debitAccountId} language={language} onChange={(accountId) => setJournalForm({ ...journalForm, debitAccountId: accountId })} /></Field>
            <Field label={isAr ? "الدائن" : "Credit account"}><AccountPicker id="create-credit-account" accounts={accounts.data} value={journalForm.creditAccountId} language={language} onChange={(accountId) => setJournalForm({ ...journalForm, creditAccountId: accountId })} /></Field>
          </div>
          <Field label={isAr ? "ملاحظة" : "Memo"}><input className={inputClass} value={journalForm.memo} onChange={(event) => setJournalForm({ ...journalForm, memo: event.target.value })} /></Field>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={buttonClass} disabled={createJournal.isPending}><Save className="h-4 w-4" />{isAr ? "حفظ القيد" : "Save entry"}</button>
            <button type="button" className={quietButtonClass} onClick={() => { resetJournalForm(); setCreateOpen(false); }}>{isAr ? "إلغاء" : "Cancel"}</button>
          </div>
        </form>}
      </div>
    </div>}
    {selectedEntry && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedEntryId(null); }}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="journal-entry-dialog-title">
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
           {selectedEntry.lines.map((line) => { const account = accountDetails.get(line.accountId); return <div key={line.id} className="rounded-xl border border-border bg-muted/30 p-3"><div className="flex justify-between gap-3 text-sm"><span>{accountNames.get(line.accountId) ?? `#${line.accountId}`}</span><span className="font-mono-ui text-xs">{line.debitMinor > 0 ? `Dr ${money(line.debitMinor, language)}` : `Cr ${money(line.creditMinor, language)}`}</span></div><p className="mt-2 text-xs text-primary">{isAr ? "تصنيف الحساب" : "Account classification"}: {accountTypeLabel(account?.type, isAr)}</p>{line.memo && <p className="mt-1 text-xs text-muted-foreground">{isAr ? "الملاحظة" : "Memo"}: {line.memo}</p>}</div>; })}
        </div>
      </div>
    </div>}
    <Toast message={message} onClose={() => setMessage(null)} />
   </div>;
}
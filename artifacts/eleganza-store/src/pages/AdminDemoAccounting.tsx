import { ArrowLeft, BookOpen, ClipboardList, FileBarChart, FileText, Globe2, Landmark, Menu, PackageSearch, ReceiptText, Store, WalletCards, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { usePersistentAdminLanguage } from "@/components/admin/AdminUI";

type AccountingSection = "journal" | "chart" | "ledger" | "inventory" | "statement";

const sections: { id: AccountingSection; label: string; arabic: string; icon: typeof BookOpen }[] = [
  { id: "journal", label: "Journal entries", arabic: "قيود اليومية", icon: BookOpen },
  { id: "chart", label: "Chart of accounts", arabic: "شجرة الحسابات", icon: Landmark },
  { id: "ledger", label: "General ledger", arabic: "دفتر الأستاذ", icon: ClipboardList },
  { id: "inventory", label: "Inventory report", arabic: "تقرير المخزون", icon: PackageSearch },
  { id: "statement", label: "Account statement", arabic: "كشف حساب", icon: FileBarChart },
];

type DemoAccount = [code: string, english: string, arabic: string, type: string, parentCode?: string];

const defaultAccounts: DemoAccount[] = [
  ["1000", "Cash", "النقدية", "Asset"],
  ["1200", "Inventory", "المخزون", "Asset"],
  ["2000", "Accounts payable", "ذمم دائنة", "Liability"],
  ["3000", "Owner equity", "حقوق الملكية", "Equity"],
  ["4000", "Sales revenue", "إيرادات المبيعات", "Revenue"],
  ["5000", "Cost of goods sold", "تكلفة البضاعة المباعة", "Expense"],
  ["6000", "Operating expenses", "المصروفات التشغيلية", "Expense"],
];

function sortDemoAccounts(left: DemoAccount, right: DemoAccount) {
  return Number(left[0]) - Number(right[0]) || left[0].localeCompare(right[0]);
}

function nextDemoChildCode(accounts: DemoAccount[], parentCode: string) {
  const children = accounts.filter((account) => account[4] === parentCode).map((account) => Number(account[0])).filter(Number.isFinite);
  return String(Math.max(Number(parentCode), ...children) + 1);
}

const entries = [
  { number: "JE-8F2A", date: "15 Sep 2026", description: "Sale ELZ-9K3F", arabic: "بيع ELZ-9K3F", lines: "Cash / Sales revenue", amount: "د.ل 257.00" },
  { number: "JE-8F1C", date: "15 Sep 2026", description: "Packaging materials", arabic: "مواد تغليف", lines: "Operating expenses / Cash", amount: "د.ل 420.00" },
  { number: "JE-8D91", date: "14 Sep 2026", description: "Inventory reconciliation", arabic: "تسوية مخزون", lines: "Inventory adjustments / Inventory", amount: "د.ل 68.00" },
];

const movements = [
  ["Aurelia Drops", "Purchase", "+12", "24"],
  ["Silk Petal", "Sale", "-2", "0"],
  ["Dawn Flush", "Return", "+1", "8"],
  ["Amber Reverie", "Damage", "-1", "18"],
];

export default function AdminDemoAccounting() {
  const { language, setLanguage } = usePersistentAdminLanguage();
  const arabic = language === "ar";
  const [section, setSection] = useState<AccountingSection>("journal");
  const [selectedAccount, setSelectedAccount] = useState("1000");
  const [accounts, setAccounts] = useState(defaultAccounts);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAr = arabic;
  const active = sections.find((item) => item.id === section) ?? sections[0];

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-background text-foreground">
      <aside className={`fixed inset-y-0 start-0 z-40 w-72 border-e border-border bg-card transition-transform lg:!translate-x-0 ${mobileOpen ? "translate-x-0" : "ltr:-translate-x-full rtl:translate-x-full"}`}>
        <div className="flex h-full flex-col p-6">
          <div className="flex items-start justify-between"><Link href="/admin-demo" className="block" onClick={() => setMobileOpen(false)}><p className="font-mono-ui text-[9px] uppercase tracking-[.24em] text-primary">Eleganza</p><p className="mt-1 font-display text-3xl leading-none">Accounting desk</p></Link><button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label={isAr ? "إغلاق القائمة" : "Close menu"}><X className="h-5 w-5" /></button></div>
          <div className="mt-8 border-y border-border py-4">
            <p className="font-mono-ui text-[9px] uppercase tracking-[.2em] text-muted-foreground">{isAr ? "مساحة المحاسبة" : "Accounting workspace"}</p>
            <p className="mt-2 text-sm font-medium">{isAr ? "نسخة تجريبية" : "Demo workspace"}</p>
            <p className="mt-1 font-mono-ui text-[10px] uppercase tracking-[.12em] text-primary">{isAr ? "بيانات تجريبية" : "Sample data"}</p>
          </div>
          <nav className="mt-6 grid gap-1">
            {sections.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} onClick={() => { setSection(item.id); setMobileOpen(false); }} className={`flex items-center gap-3 px-3 py-3 text-sm transition ${section === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="h-4 w-4" />{isAr ? item.arabic : item.label}</button>;
            })}
          </nav>
          <div className="mt-auto grid gap-2">
            <Link href="/admin-demo" className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><ArrowLeft className="h-4 w-4" />{isAr ? "العودة للوحة" : "Back to dashboard"}</Link>
            <Link href="/" className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Store className="h-4 w-4" />{isAr ? "المتجر العام" : "Public storefront"}</Link>
            <button onClick={() => setLanguage(isAr ? "en" : "ar")} className="flex items-center gap-3 px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><Globe2 className="h-4 w-4" />{isAr ? "English" : "العربية"}</button>
          </div>
        </div>
      </aside>
      {mobileOpen && <button aria-label={isAr ? "إغلاق القائمة" : "Close navigation"} className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setMobileOpen(false)} />}
      <main className="min-h-screen lg:ps-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-border bg-background/90 px-5 py-3 backdrop-blur lg:px-10">
          <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label={isAr ? "فتح القائمة" : "Open menu"}><Menu className="h-5 w-5" /></button><div><p className="font-mono-ui text-[10px] uppercase tracking-[.18em] text-primary">{isAr ? "المحاسبة" : "Accounting"}</p><p className="text-xs text-muted-foreground">{isAr ? "مساحة مستقلة للحسابات والتقارير" : "A dedicated space for accounts and reports"}</p></div>
          <span className="border border-primary/30 px-3 py-2 text-[10px] uppercase tracking-[.13em] text-primary">{isAr ? "بيانات تجريبية" : "Sample data"}</span>
        </header>
        <div className="mx-auto max-w-[1500px] p-5 lg:p-10">
          <div className="mb-8 border border-primary/25 bg-primary/5 px-5 py-4"><p className="font-mono-ui text-[10px] uppercase tracking-[.2em] text-primary">{isAr ? "مركز المحاسبة" : "Accounting centre"}</p><h1 className="mt-2 font-display text-5xl leading-none">{isAr ? active.arabic : active.label}</h1><p className="mt-3 text-sm text-muted-foreground">{isAr ? "اختر قسمًا من القائمة الجانبية لإدارة ومراجعة البيانات المالية." : "Choose a section from the accounting sidebar to review financial data."}</p></div>
          {section === "journal" && <JournalSection isAr={isAr} />}
          {section === "chart" && <ChartSection isAr={isAr} accounts={accounts} setAccounts={setAccounts} />}
          {section === "ledger" && <LedgerSection isAr={isAr} />}
          {section === "inventory" && <InventorySection isAr={isAr} />}
          {section === "statement" && <StatementSection isAr={isAr} accounts={accounts} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount} />}
        </div>
      </main>
    </div>
  );
}

function JournalSection({ isAr }: { isAr: boolean }) {
  const [selectedNumber, setSelectedNumber] = useState(entries[0].number);
  const selected = entries.find((entry) => entry.number === selectedNumber) ?? entries[0];
  return <div className="grid gap-5"><section className="border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl">{isAr ? "قيد يومية جديد" : "New journal entry"}</h2><span className="border border-primary/30 px-2 py-1 text-[10px] uppercase tracking-[.12em] text-primary">Debit = Credit</span></div><div className="grid gap-3 sm:grid-cols-4"><div className="border border-border bg-background px-3 py-3 text-xs text-muted-foreground">{isAr ? "التاريخ" : "Date"}<strong className="mt-2 block text-foreground">15 Sep 2026</strong></div><div className="border border-border bg-background px-3 py-3 text-xs text-muted-foreground">{isAr ? "مدين" : "Debit"}<strong className="mt-2 block text-foreground">{isAr ? "النقدية" : "Cash"}</strong></div><div className="border border-border bg-background px-3 py-3 text-xs text-muted-foreground">{isAr ? "دائن" : "Credit"}<strong className="mt-2 block text-foreground">{isAr ? "المبيعات" : "Sales revenue"}</strong></div><div className="border border-border bg-background px-3 py-3 text-xs text-muted-foreground">{isAr ? "المبلغ" : "Amount"}<strong className="mt-2 block text-foreground">د.ل 0.00</strong></div></div><button className="mt-2 inline-flex h-10 w-fit items-center gap-2 border border-primary bg-primary px-4 text-xs font-semibold uppercase tracking-[.12em] text-primary-foreground"><ReceiptText className="h-4 w-4" />{isAr ? "حفظ القيد" : "Save entry"}</button></section><div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="border border-border bg-card p-5"><h2 className="mb-5 font-display text-2xl">{isAr ? "القيود المسجلة" : "Recorded entries"}</h2>{entries.map((entry) => <button key={entry.number} onClick={() => setSelectedNumber(entry.number)} className={`w-full border-t border-border p-4 text-start transition ${selectedNumber === entry.number ? "bg-primary/10" : "hover:bg-muted/40"}`}><div className="flex items-center justify-between gap-3"><span className="font-mono-ui text-xs text-primary">{entry.number}</span><span className="text-xs text-muted-foreground">{entry.date}</span></div><p className="mt-2 font-medium">{isAr ? entry.arabic : entry.description}</p></button>)}</section><section className="border border-primary/30 bg-primary/5 p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-2xl">{isAr ? "عرض القيد" : "Entry details"}</h2><span className="font-mono-ui text-xs text-primary">{selected.number}</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "التاريخ" : "Date"}</p><p className="mt-1 text-sm">{selected.date}</p></div><div><p className="text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "البيان" : "Description"}</p><p className="mt-1 text-sm font-medium">{isAr ? selected.arabic : selected.description}</p></div></div><div className="mt-5 border-t border-primary/20 pt-4"><p className="mb-3 text-[10px] uppercase tracking-[.14em] text-muted-foreground">{isAr ? "أطراف القيد" : "Entry lines"}</p><div className="grid gap-2">{selected.lines.split(" / ").map((line, index) => <div key={line} className="flex justify-between border border-border bg-background px-3 py-3 text-sm"><span>{line}</span><span className="font-mono-ui text-xs">{index === 0 ? "Dr" : "Cr"} · {selected.amount}</span></div>)}</div></div></section></div><LedgerEntries isAr={isAr} /></div>;
}

function ChartSection({ isAr, accounts, setAccounts }: { isAr: boolean; accounts: DemoAccount[]; setAccounts: (accounts: DemoAccount[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", en: "", ar: "", type: "Expense", parentCode: "" });
  const orderedAccounts = [...accounts].sort(sortDemoAccounts);
  function addAccount(event: React.FormEvent) {
    event.preventDefault();
    if (!form.code.trim() || !form.en.trim()) return;
    setAccounts([...accounts, [form.code.trim(), form.en.trim(), form.ar.trim() || form.en.trim(), form.type, form.parentCode || undefined]]);
    setForm({ code: "", en: "", ar: "", type: "Expense", parentCode: "" });
    setShowForm(false);
  }
  return <section className="border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl">{isAr ? "شجرة الحسابات" : "Chart of accounts"}</h2><button onClick={() => setShowForm(!showForm)} className="inline-flex h-9 items-center gap-2 border border-border px-3 text-xs font-semibold hover:border-primary"><Landmark className="h-4 w-4" />{isAr ? "إضافة حساب" : "Add account"}</button></div>{showForm && <form onSubmit={addAccount} className="mb-5 grid gap-3 border border-primary/25 bg-primary/5 p-4 sm:grid-cols-2"><select className="h-10 border border-input bg-background px-3 text-sm" value={form.parentCode} onChange={(event) => { const parentCode = event.target.value; setForm({ ...form, parentCode, code: parentCode ? nextDemoChildCode(accounts, parentCode) : form.code, type: accounts.find((account) => account[0] === parentCode)?.[3] ?? form.type }); }}><option value="">{isAr ? "حساب رئيسي جديد" : "New top-level account"}</option>{orderedAccounts.map(([code, en, ar]) => <option key={code} value={code}>{code} · {isAr ? ar : en}</option>)}</select><input required className="h-10 border border-input bg-background px-3 text-sm" placeholder={isAr ? "الرمز التسلسلي" : "Sequential code"} value={form.code} onChange={(event) => setForm({ ...form, code: event.target.value })} /><select className="h-10 border border-input bg-background px-3 text-sm" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>{["Asset", "Liability", "Equity", "Revenue", "Expense"].map((type) => <option key={type}>{type}</option>)}</select><input required className="h-10 border border-input bg-background px-3 text-sm" placeholder={isAr ? "اسم الحساب بالإنجليزية" : "English name"} value={form.en} onChange={(event) => setForm({ ...form, en: event.target.value })} /><input className="h-10 border border-input bg-background px-3 text-sm" dir="rtl" placeholder={isAr ? "اسم الحساب بالعربية" : "Arabic name"} value={form.ar} onChange={(event) => setForm({ ...form, ar: event.target.value })} /><button className="h-10 w-fit bg-primary px-4 text-xs font-semibold uppercase tracking-[.12em] text-primary-foreground">{isAr ? "حفظ الحساب" : "Save account"}</button></form>}<div className="grid gap-2">{orderedAccounts.map(([code, en, ar, type, parentCode]) => <div key={code} className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 border-t border-border py-4 text-sm ${parentCode ? "ps-8" : ""}`}><div><span className="font-mono-ui text-xs text-primary">{code}</span><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-muted-foreground">{parentCode ? (isAr ? `فرعي تحت ${parentCode}` : `Child of ${parentCode}`) : (isAr ? "حساب رئيسي" : "Main account")}</p></div><span>{isAr ? ar : en}</span><button className="text-xs text-muted-foreground hover:text-primary" onClick={() => { setShowForm(true); setForm({ code: nextDemoChildCode(accounts, code), en: "", ar: "", type, parentCode: code }); }}>{isAr ? "إضافة فرعي" : "Add child"}</button></div>)}</div></section>;
}

function LedgerSection({ isAr }: { isAr: boolean }) {
  return <section className="border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl">{isAr ? "دفتر الأستاذ العام" : "General ledger"}</h2><span className="text-xs text-muted-foreground">3 {isAr ? "قيود" : "entries"}</span></div><LedgerEntries isAr={isAr} /></section>;
}

function LedgerEntries({ isAr }: { isAr: boolean }) {
  return <div className="grid gap-4">{entries.map((entry) => <article key={entry.number} className="border-t border-border pt-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="font-mono-ui text-xs text-primary">{entry.number}</span><span className="ms-3 text-xs text-muted-foreground">{entry.date}</span><p className="mt-2 font-medium">{isAr ? entry.arabic : entry.description}</p></div><span className="font-display text-xl">{entry.amount}</span></div><p className="mt-3 text-xs text-muted-foreground">{entry.lines}</p></article>)}</div>;
}

function InventorySection({ isAr }: { isAr: boolean }) {
  return <section className="border border-border bg-card p-5"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-2xl">{isAr ? "تقرير المخزون" : "Inventory report"}</h2><span className="text-xs text-muted-foreground">{isAr ? "آخر تحديث اليوم" : "Updated today"}</span></div><div className="grid gap-3 md:grid-cols-2">{movements.map(([product, type, change, balance]) => <div key={product} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-border py-4 text-sm"><div><p className="font-medium">{product}</p><p className="mt-1 text-xs text-muted-foreground">{type}</p></div><span className={change.startsWith("+") ? "text-primary" : "text-destructive"}>{change}</span><span className="font-mono-ui text-xs">{isAr ? `الرصيد ${balance}` : `Balance ${balance}`}</span></div>)}</div></section>;
}

function StatementSection({ isAr, accounts, selectedAccount, setSelectedAccount }: { isAr: boolean; accounts: DemoAccount[]; selectedAccount: string; setSelectedAccount: (value: string) => void }) {
  const selected = accounts.find(([code]) => code === selectedAccount) ?? accounts[0];
  const rows = entries.map((entry, index) => ({ entry, debit: index === 0 ? "د.ل 257.00" : index === 1 ? "د.ل 420.00" : "د.ل 68.00", credit: index === 0 ? "—" : "د.ل 0.00" })).filter((row) => selected[0] === "1000" || selected[0] === "1200" || selected[0] === "6000");
  return <section className="border border-border bg-card p-5"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl">{isAr ? "كشف حساب" : "Account statement"}</h2><p className="mt-1 text-sm text-muted-foreground">{isAr ? selected[2] : selected[1]} · {selected[0]}</p></div><select className="h-10 border border-input bg-background px-3 text-sm" value={selectedAccount} onChange={(event) => setSelectedAccount(event.target.value)}>{accounts.map(([code, en, ar]) => <option key={code} value={code}>{code} · {isAr ? ar : en}</option>)}</select></div><div className="grid gap-3 sm:grid-cols-3"><div className="border border-border p-4"><p className="text-xs text-muted-foreground">{isAr ? "إجمالي المدين" : "Total debit"}</p><p className="mt-3 font-display text-2xl">د.ل 745.00</p></div><div className="border border-border p-4"><p className="text-xs text-muted-foreground">{isAr ? "إجمالي الدائن" : "Total credit"}</p><p className="mt-3 font-display text-2xl">د.ل 68.00</p></div><div className="border border-primary/30 bg-primary/5 p-4"><p className="text-xs text-muted-foreground">{isAr ? "الرصيد النهائي" : "Final balance"}</p><p className="mt-3 font-display text-2xl">د.ل 677.00</p></div></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[620px] text-sm"><thead className="text-[10px] uppercase tracking-[.14em] text-muted-foreground"><tr><th className="pb-3 text-start">{isAr ? "القيد والبيان" : "Entry & description"}</th><th className="pb-3 text-end">{isAr ? "مدين" : "Debit"}</th><th className="pb-3 text-end">{isAr ? "دائن" : "Credit"}</th><th className="pb-3 text-end">{isAr ? "الرصيد" : "Balance"}</th></tr></thead><tbody>{rows.map((row, index) => <tr key={row.entry.number} className="border-t border-border"><td className="py-4"><span className="font-mono-ui text-xs text-primary">{row.entry.number}</span><p className="mt-1">{isAr ? row.entry.arabic : row.entry.description}</p></td><td className="py-4 text-end">{row.debit}</td><td className="py-4 text-end">{row.credit}</td><td className="py-4 text-end font-mono-ui">د.ل {[257, 677, 677][index] ?? 677}.00</td></tr>)}</tbody></table></div></section>;
}
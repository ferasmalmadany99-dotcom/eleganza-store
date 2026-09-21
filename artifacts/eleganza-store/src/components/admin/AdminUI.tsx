import { AlertCircle, Loader2, Search, X } from "lucide-react";
import { createContext, useContext, useState } from "react";

export type AdminLanguage = "en" | "ar";
export const ADMIN_LANGUAGE_STORAGE_KEY = "eleganza-admin-language";

function readStoredAdminLanguage(): AdminLanguage {
  if (typeof window === "undefined") return "en";
  try {
    return window.localStorage.getItem(ADMIN_LANGUAGE_STORAGE_KEY) === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

export function usePersistentAdminLanguage() {
  const [language, setLanguageState] = useState<AdminLanguage>(readStoredAdminLanguage);
  const setLanguage = (nextLanguage: AdminLanguage) => {
    setLanguageState(nextLanguage);
    try {
      window.localStorage.setItem(ADMIN_LANGUAGE_STORAGE_KEY, nextLanguage);
    } catch {
      // The UI still works when browser storage is unavailable.
    }
  };
  return { language, setLanguage };
}

export type AdminContextValue = {
  language: AdminLanguage;
  setLanguage: (language: AdminLanguage) => void;
  dir: "ltr" | "rtl";
  role: string;
  permissions: string[];
};

export const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin must be used inside AdminLayout");
  return context;
}

export function money(minor: number, language: AdminLanguage) {
  const amount = new Intl.NumberFormat(language === "ar" ? "ar-LY" : "en-LY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((minor || 0) / 100);
  return `${amount} ${language === "ar" ? "د.ل" : "LYD"}`;
}

export function dateLabel(value: string | Date, language: AdminLanguage) {
  const rawValue = value instanceof Date ? value : value.trim();
  const date = rawValue instanceof Date
    ? rawValue
    : /^\d{4}-\d{2}-\d{2}$/.test(rawValue)
      ? new Date(`${rawValue}T12:00:00`)
      : new Date(rawValue);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(language === "ar" ? "ar-LY" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong") {
  if (error && typeof error === "object" && "data" in error) {
    const data = (error as { data?: { error?: string } }).data;
    if (data?.error) return data.error;
  }
  return error instanceof Error ? error.message : fallback;
}

export function can(roleOrPermissions: string | string[], capability: "manager" | "owner" | "inventory" | "sales") {
  const permissions = Array.isArray(roleOrPermissions) ? roleOrPermissions : [roleOrPermissions];
  if (capability === "owner") return permissions.includes("owner");
  if (capability === "manager") return permissions.some((permission) => ["owner", "manager"].includes(permission));
  if (capability === "inventory") return permissions.some((permission) => ["owner", "manager", "inventory"].includes(permission));
  if (capability === "sales") return permissions.some((permission) => ["owner", "manager", "sales"].includes(permission));
  return false;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex min-w-0 flex-col gap-5 border-b border-border pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="font-mono-ui text-[10px] uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
        <h1 className="mt-2 font-display text-4xl leading-none text-foreground md:text-5xl">{title}</h1>
        {description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="flex w-full shrink-0 flex-wrap justify-start gap-2 lg:w-auto lg:justify-end">{action}</div>}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-2xl border border-border bg-card p-5 shadow-[0_8px_30px_hsl(var(--foreground)/.03)] ${className}`}>{children}</section>;
}

export function PanelTitle({ children, detail }: { children: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <h2 className="min-w-0 font-display text-2xl text-foreground">{children}</h2>
      <div className="shrink-0">{detail}</div>
    </div>
  );
}

export function LoadingState({ label = "Loading workspace…" }: { label?: string }) {
  return <div className="flex min-h-44 items-center justify-center gap-3 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin text-primary" />{label}</div>;
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
      <AlertCircle className="h-5 w-5 text-destructive" />
      <p className="max-w-lg text-sm text-destructive">{getErrorMessage(error)}</p>
      {onRetry && <button className="text-xs font-semibold uppercase tracking-[.16em] text-primary underline underline-offset-4" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, detail, icon = <Search className="h-5 w-5" /> }: { title: string; detail: string; icon?: React.ReactNode }) {
  return <div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground"><span className="text-primary">{icon}</span><p className="font-medium text-foreground">{title}</p><p className="max-w-sm text-sm">{detail}</p></div>;
}

export function Field({ label, children, hint, labelClassName = "" }: { label: string; children: React.ReactNode; hint?: string; labelClassName?: string }) {
  return <label className="grid gap-2 text-sm"><span className={`font-medium text-foreground ${labelClassName}`}>{label}</span>{children}{hint && <span className="text-xs text-muted-foreground">{hint}</span>}</label>;
}

export const inputClass = "h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
export const textareaClass = "min-h-24 w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";
export const buttonClass = "inline-flex h-10 shrink-0 whitespace-nowrap items-center justify-center gap-2 rounded-xl border border-primary bg-primary px-4 text-xs font-semibold uppercase tracking-[.13em] text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
export const quietButtonClass = "inline-flex h-10 shrink-0 whitespace-nowrap items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-xs font-semibold uppercase tracking-[.13em] text-foreground transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50";

export function Toast({ message, onClose }: { message: string | null; onClose: () => void }) {
  if (!message) return null;
  return <div className="fixed bottom-5 end-5 z-50 flex max-w-sm items-center gap-3 border border-border bg-card px-4 py-3 text-sm text-foreground shadow-xl"><span>{message}</span><button onClick={onClose} aria-label="Close"><X className="h-4 w-4" /></button></div>;
}
import { MailPlus, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useInviteStaff, useListStaff, useUpdateStaff, type StaffRole, type StaffStatus } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buttonClass, EmptyState, ErrorState, Field, getErrorMessage, inputClass, LoadingState, PageHeader, Panel, PanelTitle, Toast, useAdmin, dateLabel } from "@/components/admin/AdminUI";

const roles: StaffRole[] = ["owner", "manager", "inventory", "sales", "viewer"];
const roleDetails: Record<StaffRole, { en: string; ar: string; permissionsEn: string; permissionsAr: string }> = {
  owner: { en: "Owner", ar: "مالك", permissionsEn: "Full access, including team and permissions", permissionsAr: "صلاحيات كاملة، بما فيها الفريق والصلاحيات" },
  manager: { en: "Manager", ar: "مدير", permissionsEn: "Operations, accounting, and audit", permissionsAr: "التشغيل والمحاسبة وسجل التدقيق" },
  inventory: { en: "Inventory", ar: "مخزون", permissionsEn: "Products and inventory movements", permissionsAr: "المنتجات وحركات المخزون" },
  sales: { en: "Sales", ar: "مبيعات", permissionsEn: "Products, orders, and sales operations", permissionsAr: "المنتجات والطلبات وعمليات البيع" },
  viewer: { en: "Viewer", ar: "مشاهد", permissionsEn: "Read-only workspace access", permissionsAr: "عرض البيانات دون تعديل" },
};

export default function Team() {
  const { language, dir } = useAdmin();
  const isAr = language === "ar";
  const [message, setMessage] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("viewer");
  const staff = useListStaff();
  const update = useUpdateStaff();
  const invite = useInviteStaff();

  async function updateStaff(id: number, data: { role?: StaffRole; status?: StaffStatus }) {
    try { await update.mutateAsync({ id, data }); await queryClient.invalidateQueries({ queryKey: ["/api/staff"] }); setMessage(isAr ? "تم تحديث صلاحيات الفريق" : "Team permissions updated"); } catch (error) { setMessage(getErrorMessage(error)); }
  }

  async function submitInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await invite.mutateAsync({ data: { displayName: displayName.trim(), email: email.trim(), role } });
      await queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setDisplayName("");
      setEmail("");
      setRole("viewer");
      setInviteOpen(false);
      setMessage(isAr ? "تم إرسال دعوة الموظف بالبريد الإلكتروني" : "The staff invitation was sent by email");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  return <div>
    <PageHeader
      eyebrow={isAr ? "الحوكمة" : "Governance"}
      title={isAr ? "الفريق والصلاحيات" : "Team & permissions"}
      description={isAr ? "أضف مستخدمًا جديدًا، اختر صلاحياته، ثم فعّل حسابه بعد التسجيل." : "Invite a user, choose their permissions, then activate their account after signup."}
      action={<button type="button" className={buttonClass} onClick={() => setInviteOpen((open) => !open)}><MailPlus className="h-4 w-4" />{isAr ? "إضافة مستخدم أو موظف" : "Add user or employee"}</button>}
    />
    {inviteOpen && <Panel className="mb-5 border-primary/30 bg-primary/5">
      <PanelTitle detail={<span className="text-xs text-muted-foreground">{isAr ? "دعوة عبر البريد" : "Email invitation"}</span>}>{isAr ? "إضافة مستخدم أو موظف" : "Add user or employee"}</PanelTitle>
      <form onSubmit={submitInvite} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={isAr ? "اسم الموظف" : "Employee name"}><input className={inputClass} required minLength={2} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder={isAr ? "مثال: أحمد محمد" : "e.g. Alex Morgan"} /></Field>
          <Field label={isAr ? "البريد الإلكتروني" : "Email address"}><input className={inputClass} required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></Field>
        </div>
        <Field label={isAr ? "الصلاحية" : "Permission role"}>
          <Select dir={dir} value={role} onValueChange={(value) => setRole(value as StaffRole)}>
            <SelectTrigger className={inputClass}><SelectValue /></SelectTrigger>
            <SelectContent className="border-border bg-popover text-popover-foreground shadow-xl">
              {roles.map((option) => <SelectItem key={option} value={option}>{isAr ? roleDetails[option].ar : roleDetails[option].en}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{isAr ? roleDetails[role].permissionsAr : roleDetails[role].permissionsEn}</span>
        </Field>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={buttonClass} disabled={invite.isPending}><MailPlus className="h-4 w-4" />{invite.isPending ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الدعوة" : "Send invitation")}</button>
          <button type="button" className="h-10 border border-border px-4 text-xs font-semibold uppercase tracking-[.1em] text-foreground" onClick={() => setInviteOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</button>
        </div>
      </form>
    </Panel>}
    <Panel>
      <PanelTitle detail={<span className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />{isAr ? "للمالك فقط" : "Owner only"}</span>}>{isAr ? "أعضاء الفريق" : "Staff members"}</PanelTitle>
      {staff.isLoading && <LoadingState />}
      {staff.isError && <ErrorState error={staff.error} onRetry={() => staff.refetch()} />}
      {staff.data?.length === 0 && <EmptyState icon={<UserRound className="h-5 w-5" />} title={isAr ? "لا يوجد موظفون بعد" : "No staff yet"} detail={isAr ? "أرسل دعوة لإضافة أول موظف." : "Send an invitation to add the first staff member."} />}
      {staff.data && staff.data.length > 0 && <div className="grid gap-3">{staff.data.map((member) => <div key={member.id} className="grid gap-4 border border-border p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><p className="font-medium">{member.displayName}</p><p className="mt-1 text-xs text-muted-foreground">{member.email || member.clerkUserId} · {isAr ? "انضم" : "joined"} {dateLabel(member.createdAt, language)}</p></div><select aria-label={isAr ? `صلاحية ${member.displayName}` : `${member.displayName} role`} className={`${inputClass} w-auto min-w-32`} value={member.role} onChange={(event) => updateStaff(member.id, { role: event.target.value as StaffRole })} disabled={update.isPending}>{roles.map((option) => <option key={option} value={option}>{isAr ? roleDetails[option].ar : roleDetails[option].en}</option>)}</select><button className={`h-10 min-w-24 border px-3 text-xs font-semibold uppercase tracking-[.1em] transition ${member.status === "active" ? "border-primary/30 text-primary hover:bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`} onClick={() => updateStaff(member.id, { status: member.status === "active" ? "inactive" : "active" })} disabled={update.isPending}>{member.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "تفعيل" : "Activate")}</button></div>)}</div>}
    </Panel>
    <Toast message={message} onClose={() => setMessage(null)} />
  </div>;
}
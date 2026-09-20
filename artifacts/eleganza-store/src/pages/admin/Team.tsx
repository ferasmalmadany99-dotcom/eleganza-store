import { Edit3, MailPlus, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useInviteStaff, useListStaff, useUpdateStaff, type Staff, type StaffRole, type StaffStatus } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { buttonClass, EmptyState, ErrorState, Field, getErrorMessage, inputClass, LoadingState, PageHeader, Panel, PanelTitle, Toast, useAdmin, dateLabel } from "@/components/admin/AdminUI";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const roles: StaffRole[] = ["owner", "manager", "inventory", "sales", "viewer"];
const roleDetails: Record<StaffRole, { en: string; ar: string; permissionsEn: string; permissionsAr: string }> = {
  owner: { en: "Owner", ar: "مالك", permissionsEn: "Full access, including team and permissions", permissionsAr: "صلاحيات كاملة، بما فيها الفريق والصلاحيات" },
  manager: { en: "Manager", ar: "مدير", permissionsEn: "Operations, accounting, and audit", permissionsAr: "التشغيل والمحاسبة وسجل التدقيق" },
  inventory: { en: "Inventory", ar: "مخزون", permissionsEn: "Products and inventory movements", permissionsAr: "المنتجات وحركات المخزون" },
  sales: { en: "Sales", ar: "مبيعات", permissionsEn: "Products, orders, and sales operations", permissionsAr: "المنتجات والطلبات وعمليات البيع" },
  viewer: { en: "Viewer", ar: "مشاهد", permissionsEn: "Read-only workspace access", permissionsAr: "عرض البيانات دون تعديل" },
};

export default function Team() {
  const { language } = useAdmin();
  const isAr = language === "ar";
  const [message, setMessage] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [permissions, setPermissions] = useState<StaffRole[]>(["viewer"]);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPermissions, setEditPermissions] = useState<StaffRole[]>([]);
  const [editStatus, setEditStatus] = useState<StaffStatus>("inactive");
  const staff = useListStaff();
  const update = useUpdateStaff();
  const invite = useInviteStaff();

  async function updateStaff(id: number, data: { role?: StaffRole; permissions?: StaffRole[]; status?: StaffStatus; displayName?: string; email?: string }) {
    try { await update.mutateAsync({ id, data }); await queryClient.invalidateQueries({ queryKey: ["/api/staff"] }); setMessage(isAr ? "تم تحديث صلاحيات الفريق" : "Team permissions updated"); } catch (error) { setMessage(getErrorMessage(error)); }
  }

  function togglePermission(current: StaffRole[], permission: StaffRole) {
    return current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission];
  }

  function permissionChoices(selected: StaffRole[], onChange: (next: StaffRole[]) => void) {
    return <div className="grid gap-2 sm:grid-cols-2">{roles.map((option) => <label key={option} className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition hover:border-primary has-[:checked]:border-primary has-[:checked]:bg-primary/5"><input type="checkbox" className="mt-1 h-4 w-4 accent-[hsl(var(--primary))]" checked={selected.includes(option)} onChange={() => onChange(togglePermission(selected, option))} /><span><span className="block text-sm font-medium">{isAr ? roleDetails[option].ar : roleDetails[option].en}</span><span className="mt-0.5 block text-xs text-muted-foreground">{isAr ? roleDetails[option].permissionsAr : roleDetails[option].permissionsEn}</span></span></label>)}</div>;
  }

  function openEdit(member: Staff) {
    setEditing(member);
    setEditDisplayName(member.displayName);
    setEditEmail(member.email ?? "");
    setEditPermissions(member.permissions?.length ? member.permissions : [member.role]);
    setEditStatus(member.status);
  }

  async function submitEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || editPermissions.length === 0) {
      setMessage(isAr ? "اختر وظيفة واحدة على الأقل" : "Choose at least one service");
      return;
    }
    try {
      await update.mutateAsync({
        id: editing.id,
        data: {
          displayName: editDisplayName.trim(),
          email: editEmail.trim(),
          role: editPermissions[0],
          permissions: editPermissions,
          status: editStatus,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setEditing(null);
      setMessage(isAr ? "تم تحديث بيانات الموظف" : "Employee details updated");
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  async function submitInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (permissions.length === 0) {
      setMessage(isAr ? "اختر وظيفة واحدة على الأقل" : "Choose at least one service");
      return;
    }
    try {
      await invite.mutateAsync({ data: { displayName: displayName.trim(), email: email.trim(), permissions } });
      await queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setDisplayName("");
      setEmail("");
      setPermissions(["viewer"]);
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
          {permissionChoices(permissions, setPermissions)}
          <span className="text-xs text-muted-foreground">{isAr ? "يمكن اختيار أكثر من وظيفة للموظف نفسه." : "You can select more than one service for the same employee."}</span>
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
      {staff.data && staff.data.length > 0 && <div className="grid gap-3">{staff.data.map((member) => <div key={member.id} className="flex flex-col gap-4 border border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{member.displayName}</p><span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[.1em] ${member.status === "active" ? "border-primary/30 text-primary" : "border-border text-muted-foreground"}`}>{member.status === "active" ? (isAr ? "نشط" : "Active") : (isAr ? "غير نشط" : "Inactive")}</span></div><p className="mt-1 text-xs text-muted-foreground">{member.email || member.clerkUserId} · {isAr ? "انضم" : "joined"} {dateLabel(member.createdAt, language)}</p><p className="mt-2 text-xs text-muted-foreground">{(member.permissions?.length ? member.permissions : [member.role]).map((permission) => isAr ? roleDetails[permission].ar : roleDetails[permission].en).join(isAr ? "، " : ", ")}</p></div><button type="button" className="inline-flex h-10 items-center justify-center gap-2 border border-border px-4 text-xs font-semibold uppercase tracking-[.1em] transition hover:border-primary hover:text-primary sm:min-w-28" onClick={() => openEdit(member)}><Edit3 className="h-4 w-4" />{isAr ? "تعديل" : "Edit"}</button></div>)}</div>}
    </Panel>
    <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
      <DialogContent dir={isAr ? "rtl" : "ltr"} className="max-w-2xl">
        <DialogHeader className={isAr ? "text-right" : "text-left"}>
          <DialogTitle>{isAr ? "تعديل بيانات الموظف" : "Edit employee details"}</DialogTitle>
          <DialogDescription>{isAr ? "عدّل بيانات الموظف ووظائفه وحالة حسابه ثم احفظ التغييرات." : "Update the employee details, services, and account status."}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submitEdit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={isAr ? "اسم الموظف" : "Employee name"}><input className={inputClass} required minLength={2} value={editDisplayName} onChange={(event) => setEditDisplayName(event.target.value)} /></Field>
            <Field label={isAr ? "البريد الإلكتروني" : "Email address"}><input className={inputClass} required type="email" value={editEmail} onChange={(event) => setEditEmail(event.target.value)} /></Field>
          </div>
          <Field label={isAr ? "الوظائف والصلاحيات" : "Services and permissions"}>
            {permissionChoices(editPermissions, setEditPermissions)}
            <span className="text-xs text-muted-foreground">{isAr ? "يمكن اختيار أكثر من وظيفة للموظف نفسه." : "Select one or more services for this employee."}</span>
          </Field>
          <Field label={isAr ? "حالة الحساب" : "Account status"}>
            <select className={inputClass} value={editStatus} onChange={(event) => setEditStatus(event.target.value as StaffStatus)}>
              <option value="active">{isAr ? "نشط — يمكنه الدخول" : "Active — can access the workspace"}</option>
              <option value="inactive">{isAr ? "غير نشط — يحتاج إلى تفعيل" : "Inactive — access is disabled"}</option>
            </select>
          </Field>
          <DialogFooter className="gap-2 sm:space-x-0">
            <button type="submit" className={buttonClass} disabled={update.isPending}>{update.isPending ? (isAr ? "جاري الحفظ..." : "Saving...") : (isAr ? "حفظ التغييرات" : "Save changes")}</button>
            <button type="button" className="h-10 border border-border px-4 text-xs font-semibold uppercase tracking-[.1em]" onClick={() => setEditing(null)}>{isAr ? "إلغاء" : "Cancel"}</button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <Toast message={message} onClose={() => setMessage(null)} />
  </div>;
}
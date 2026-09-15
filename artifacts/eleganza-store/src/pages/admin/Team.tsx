import { ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";
import { useListStaff, useUpdateStaff, type StaffRole, type StaffStatus } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { buttonClass, EmptyState, ErrorState, getErrorMessage, inputClass, LoadingState, PageHeader, Panel, PanelTitle, Toast, useAdmin, dateLabel } from "@/components/admin/AdminUI";

const roles: StaffRole[] = ["owner", "manager", "inventory", "sales", "viewer"];

export default function Team() {
  const { language } = useAdmin();
  const isAr = language === "ar";
  const [message, setMessage] = useState<string | null>(null);
  const staff = useListStaff();
  const update = useUpdateStaff();

  async function updateStaff(id: number, data: { role?: StaffRole; status?: StaffStatus }) {
    try { await update.mutateAsync({ id, data }); await queryClient.invalidateQueries({ queryKey: ["/api/staff"] }); setMessage(isAr ? "تم تحديث صلاحيات الفريق" : "Team permissions updated"); } catch (error) { setMessage(getErrorMessage(error)); }
  }

  return <div><PageHeader eyebrow={isAr ? "الحوكمة" : "Governance"} title={isAr ? "الفريق والصلاحيات" : "Team & permissions"} description={isAr ? "يبدأ المستخدم الجديد غير نشط، ولا يتمكن من العمل قبل تفعيله." : "Newly signed-up staff start inactive and cannot work until an owner activates them."} /><Panel><PanelTitle detail={<span className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 text-primary" />Owner only</span>}>{isAr ? "أعضاء الفريق" : "Staff members"}</PanelTitle>{staff.isLoading && <LoadingState />}{staff.isError && <ErrorState error={staff.error} onRetry={() => staff.refetch()} />}{staff.data?.length === 0 && <EmptyState icon={<UserRound className="h-5 w-5" />} title="No staff yet" detail="The first authenticated user becomes the development owner." />}{staff.data && staff.data.length > 0 && <div className="grid gap-3">{staff.data.map((member) => <div key={member.id} className="grid gap-4 border border-border p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><p className="font-medium">{member.displayName}</p><p className="mt-1 text-xs text-muted-foreground">{member.email || member.clerkUserId} · joined {dateLabel(member.createdAt, language)}</p></div><select className={`${inputClass} w-auto min-w-32`} value={member.role} onChange={(event) => updateStaff(member.id, { role: event.target.value as StaffRole })} disabled={update.isPending}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select><button className={`h-10 min-w-24 border px-3 text-xs font-semibold uppercase tracking-[.1em] transition ${member.status === "active" ? "border-primary/30 text-primary hover:bg-primary/5" : "border-border text-muted-foreground hover:border-primary hover:text-primary"}`} onClick={() => updateStaff(member.id, { status: member.status === "active" ? "inactive" : "active" })} disabled={update.isPending}>{member.status === "active" ? "Active" : "Activate"}</button></div>)}</div>}</Panel><Toast message={message} onClose={() => setMessage(null)} /></div>;
}
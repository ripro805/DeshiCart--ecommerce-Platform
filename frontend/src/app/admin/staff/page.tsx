"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, BadgeCheck, Briefcase } from "lucide-react";
import { apiGet } from "@/lib/api";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/feedback/states";
import { formatDate } from "@/lib/utils";

const ROLE_TONE: Record<string, string> = {
  admin: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300",
  manager: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
  support: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  finance: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  superuser: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
};

export default function StaffPage() {
  const { allowed, loading: permLoading } = usePermissionState("manage_users");
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      try {
        const res: any = await apiGet("/admin/profiles/");
        setStaff(Array.isArray(res) ? res : res?.results || []);
      } catch (e: any) {
        setLoadError(e?.message || "Failed to load staff");
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed]);

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need manage_users to view this page." />;
  if (loading) return <LoadingState label="Loading staff…" />;
  if (loadError) return <ErrorState title="Couldn't load staff" description={loadError} />;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Staff & Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Administrators and team members ({staff.length})
          </p>
        </div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
        >
          Manage All Users →
        </Link>
      </header>

      {staff.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <EmptyState
            icon={Shield}
            title="No staff members yet"
            description="Invite administrators from the Users page to populate your staff roster."
            action={{ label: "Go to Users", href: "/admin/users" }}
          />
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Permissions</th>
                  <th className="px-5 py-3 font-medium">Hired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {staff.map((u) => {
                  const role = (u.role || "").toString();
                  const tone = ROLE_TONE[role.toLowerCase()] || "bg-muted text-muted-foreground";
                  const perms: string[] = Array.isArray(u.permissions)
                    ? u.permissions
                    : u.permissions && typeof u.permissions === "object"
                    ? Object.keys(u.permissions).filter((k) => u.permissions[k])
                    : [];
                  return (
                    <tr key={u.id} className="transition hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {(u.full_name?.[0] || u.user_email?.[0] || "?").toUpperCase()}
                          </div>
                          <span className="font-medium text-foreground">
                            {u.full_name || u.user_email}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{u.user_email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
                          <Briefcase className="h-3 w-3" />
                          {role || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            <BadgeCheck className="h-3 w-3" />
                            active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                            inactive
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {perms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {perms.slice(0, 3).map((p) => (
                              <span
                                key={p}
                                className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                              >
                                {p}
                              </span>
                            ))}
                            {perms.length > 3 && (
                              <span className="text-[10px] text-muted-foreground">
                                +{perms.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {u.hired_at ? formatDate(u.hired_at) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
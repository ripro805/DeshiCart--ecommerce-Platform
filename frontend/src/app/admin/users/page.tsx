"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCog,
  UserPlus,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { toast } from "@/components/admin/feedback/toast-store";
import { useConfirm } from "@/components/admin/feedback/confirm-dialog";
import { usePermission } from "@/components/admin/layout/role-guard";
import { formatDate } from "@/lib/utils";

const PAGE_SIZE = 20;

type UserRow = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  avatar?: string | null;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_blocked?: boolean;
  role?: string;
  date_joined: string;
};

type Stats = {
  total: number;
  staff: number;
  super: number;
  customers: number;
  active: number;
  blocked: number;
};

function initials(u: UserRow) {
  const a = (u.first_name?.[0] || u.email?.[0] || "U").toUpperCase();
  const b = (u.last_name?.[0] || "").toUpperCase();
  return `${a}${b}`.trim();
}

function roleLabel(u: UserRow) {
  if (u.is_superuser) return "Superuser";
  if (u.is_staff) return "Staff";
  if (u.is_blocked) return "Blocked";
  return "Customer";
}

function roleTone(u: UserRow): { pill: string; icon: typeof Shield } {
  if (u.is_superuser) return { pill: "bg-amber-500/15 text-amber-700", icon: ShieldAlert };
  if (u.is_staff) return { pill: "bg-primary/10 text-primary", icon: ShieldCheck };
  if (u.is_blocked) return { pill: "bg-rose-500/15 text-rose-700", icon: Ban };
  return { pill: "bg-muted text-muted-foreground", icon: UsersIcon };
}

export default function UsersPage() {
  const canManage = usePermission("manage_users");
  const canSetRole = usePermission("set_role");
  const canDelete = usePermission("delete_user");
  const canInvite = canSetRole; // inviting users can promote them to staff → super-only
  const { ask, dialog: confirmDialog } = useConfirm();

  const [items, setItems] = useState<UserRow[]>([]);
  const [count, setCount] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState<"all" | "admin" | "customer">("all");
  const [status, setStatus] = useState<"all" | "active" | "blocked">("all");
  const [sort, setSort] = useState<"-date_joined" | "date_joined" | "email" | "-email">(
    "-date_joined"
  );
  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Debounce search.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset page when filters change.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status, sort]);

  // Load listing.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(PAGE_SIZE));
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (role !== "all") params.set("role", role);
      if (status === "active") params.set("is_active", "true");
      if (status === "blocked") params.set("is_blocked", "true");
      if (sort) params.set("ordering", sort);

      const res: any = await apiGet(`/admin/users/?${params.toString()}`);
      const list: UserRow[] = Array.isArray(res) ? res : res?.results || [];
      setItems(list);
      setCount(typeof res?.count === "number" ? res.count : list.length);
    } catch (e: any) {
      setError(e?.message || "Failed to load users");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, role, status, sort]);

  useEffect(() => {
    void load();
  }, [load]);

  // Load stats.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Pull a generous page for stat counts (cheap because admin endpoints index these).
        const res: any = await apiGet(`/admin/users/?page_size=200`);
        if (cancelled) return;
        const list: UserRow[] = Array.isArray(res) ? res : res?.results || [];
        const next: Stats = {
          total: typeof res?.count === "number" ? res.count : list.length,
          staff: list.filter((u) => u.is_staff && !u.is_superuser).length,
          super: list.filter((u) => u.is_superuser).length,
          customers: list.filter((u) => !u.is_staff && !u.is_superuser).length,
          active: list.filter((u) => u.is_active && !u.is_blocked).length,
          blocked: list.filter((u) => u.is_blocked || !u.is_active).length,
        };
        setStats(next);
      } catch {
        if (!cancelled) setStats(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Toggle staff (super only — promoting/demoting is a privileged action).
  const onToggleStaff = useCallback(
    async (u: UserRow) => {
      if (!canSetRole) {
        toast.error("Only super admins can change roles.");
        return;
      }
      const next = !u.is_staff;
      const target = next ? "Staff" : "Customer";
      const ok = await ask({
        title: next ? "Promote to staff?" : "Demote to customer?",
        description: `${u.email} will become ${target}. Their admin actions will ${next ? "be enabled" : "be revoked"}.`,
        confirmLabel: next ? "Promote" : "Demote",
        tone: "warn",
      });
      if (!ok) return;
      setBusyId(u.id);
      try {
        await apiPost(`/admin/users/${u.id}/${next ? "make-staff" : "remove-staff"}/`);
        setItems((xs) =>
          xs.map((x) => (x.id === u.id ? { ...x, is_staff: next } : x))
        );
        toast.success(`${u.email} is now ${target.toLowerCase()}.`);
      } catch (e: any) {
        toast.error(e?.message || "Role update failed.");
      } finally {
        setBusyId(null);
      }
    },
    [ask, canSetRole]
  );

  // Toggle blocked (super only — blocking affects auth/login globally).
  const onToggleBlock = useCallback(
    async (u: UserRow) => {
      if (!canSetRole) {
        toast.error("Only super admins can change user status.");
        return;
      }
      const blocking = !u.is_blocked;
      const ok = await ask({
        title: blocking ? "Block this user?" : "Unblock this user?",
        description: blocking
          ? `${u.email} will be unable to sign in until unblocked.`
          : `${u.email} will regain access.`,
        confirmLabel: blocking ? "Block" : "Unblock",
        tone: blocking ? "danger" : "warn",
      });
      if (!ok) return;
      setBusyId(u.id);
      try {
        await apiPost(`/admin/users/${u.id}/${blocking ? "block" : "unblock"}/`);
        setItems((xs) =>
          xs.map((x) =>
            x.id === u.id
              ? { ...x, is_blocked: blocking, is_active: !blocking }
              : x
          )
        );
        toast.success(blocking ? "User blocked." : "User unblocked.");
      } catch (e: any) {
        toast.error(e?.message || "Action failed.");
      } finally {
        setBusyId(null);
      }
    },
    [ask, canSetRole]
  );

  // Toggle active (PATCH).
  const onToggleActive = useCallback(
    async (u: UserRow) => {
      if (!canManage) {
        toast.error("You do not have permission to change user status.");
        return;
      }
      const next = !u.is_active;
      const ok = await ask({
        title: next ? "Re-enable account?" : "Disable account?",
        description: next
          ? `${u.email} will be able to sign in again.`
          : `${u.email} will lose the ability to sign in until re-enabled.`,
        confirmLabel: next ? "Enable" : "Disable",
        tone: next ? "warn" : "danger",
      });
      if (!ok) return;
      setBusyId(u.id);
      try {
        await apiPatch(`/admin/users/${u.id}/`, { is_active: next });
        setItems((xs) =>
          xs.map((x) => (x.id === u.id ? { ...x, is_active: next } : x))
        );
        toast.success(next ? "Account enabled." : "Account disabled.");
      } catch (e: any) {
        toast.error(e?.message || "Action failed.");
      } finally {
        setBusyId(null);
      }
    },
    [ask, canManage]
  );

  // Optimistic UI helpers.
  const localCounts = useMemo(() => {
    // Pull from current page; backend stat endpoint mirrors this.
    return {
      total: count,
      staff: items.filter((u) => u.is_staff && !u.is_superuser).length,
      super: items.filter((u) => u.is_superuser).length,
      customers: items.filter((u) => !u.is_staff && !u.is_superuser).length,
      active: items.filter((u) => u.is_active && !u.is_blocked).length,
      blocked: items.filter((u) => u.is_blocked || !u.is_active).length,
    };
  }, [items, count]);

  const showingStats = stats ?? localCounts;

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users &amp; staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all registered accounts, staff roles, and access status.
          </p>
        </div>
        {canInvite ? (
          <Link
            href="/admin/users/new"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" />
            Invite user
          </Link>
        ) : null}
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon={UsersIcon} label="Total" value={showingStats.total} tone="indigo" />
        <StatCard icon={ShieldCheck} label="Staff" value={showingStats.staff} tone="primary" />
        <StatCard icon={ShieldAlert} label="Super" value={showingStats.super} tone="amber" />
        <StatCard icon={UsersIcon} label="Customers" value={showingStats.customers} tone="slate" />
        <StatCard icon={CheckCircle2} label="Active" value={showingStats.active} tone="emerald" />
        <StatCard icon={Ban} label="Blocked" value={showingStats.blocked} tone="rose" />
      </div>

      {/* Filters bar */}
      <div className="rounded-lg border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <div className="relative min-w-[220px] max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by email, name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground"
            />
            {search ? (
              <button
                onClick={() => {
                  setSearch("");
                  searchInputRef.current?.focus();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <Segmented
            value={role}
            onChange={setRole}
            options={[
              { value: "all", label: "All roles" },
              { value: "admin", label: "Staff" },
              { value: "customer", label: "Customers" },
            ]}
          />

          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "Any status" },
              { value: "active", label: "Active" },
              { value: "blocked", label: "Blocked" },
            ]}
          />

          <div className="ml-auto flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="-date_joined">Newest first</option>
              <option value="date_joined">Oldest first</option>
              <option value="email">Email A→Z</option>
              <option value="-email">Email Z→A</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
            <p className="text-sm">Loading users…</p>
          </div>
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-sm text-rose-600">{error}</p>
            <button
              onClick={() => void load()}
              className="mt-3 rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-muted"
            >
              Retry
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
            <UsersIcon className="h-10 w-10 opacity-40" />
            <p className="text-sm">No users match the current filters.</p>
            <button
              onClick={() => {
                setSearch("");
                setRole("all");
                setStatus("all");
              }}
              className="text-xs font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold">User</th>
                  <th className="px-5 py-3 text-left font-semibold">Email</th>
                  <th className="px-5 py-3 text-left font-semibold">Role</th>
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Joined</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((u) => {
                  const role = roleTone(u);
                  const RoleIcon = role.icon;
                  const busy = busyId === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={u.avatar}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
                            />
                          ) : (
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {initials(u)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="truncate font-medium text-foreground">
                              {[u.first_name, u.last_name].filter(Boolean).join(" ") ||
                                "—"}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {u.phone || "No phone on file"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-foreground">{u.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${role.pill}`}
                        >
                          <RoleIcon className="h-3 w-3" />
                          {roleLabel(u)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {u.is_blocked ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-700">
                            <Ban className="h-3 w-3" />
                            Blocked
                          </span>
                        ) : u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                            <X className="h-3 w-3" />
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {formatDate(u.date_joined)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {canSetRole && !u.is_superuser ? (
                            <button
                              onClick={() => void onToggleStaff(u)}
                              disabled={busy}
                              title={u.is_staff ? "Demote to customer" : "Promote to staff"}
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50"
                            >
                              {u.is_staff ? (
                                <>
                                  <ShieldOff className="h-3.5 w-3.5" />
                                  Demote
                                </>
                              ) : (
                                <>
                                  <Shield className="h-3.5 w-3.5" />
                                  Promote
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              disabled
                              title={
                                u.is_superuser
                                  ? "Superuser role is locked"
                                  : !canSetRole
                                  ? "Only super admins can change roles"
                                  : "You need manage_users permission"
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-muted-foreground opacity-40"
                            >
                              <UserCog className="h-3.5 w-3.5" />
                              Role
                            </button>
                          )}
                          {canSetRole ? (
                            <button
                              onClick={() => void onToggleBlock(u)}
                              disabled={busy || u.is_superuser}
                              title={
                                u.is_superuser
                                  ? "Cannot block a superuser"
                                  : u.is_blocked
                                  ? "Unblock"
                                  : "Block"
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-500/10 disabled:opacity-40"
                            >
                              <Ban className="h-3.5 w-3.5" />
                              {u.is_blocked ? "Unblock" : "Block"}
                            </button>
                          ) : null}
                          {canManage && !u.is_superuser ? (
                            <button
                              onClick={() => void onToggleActive(u)}
                              disabled={busy}
                              title={u.is_active ? "Disable" : "Enable"}
                              className={`inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50 ${
                                u.is_active ? "text-rose-600" : "text-emerald-700"
                              }`}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {u.is_active ? "Disable" : "Enable"}
                            </button>
                          ) : null}
                          <Link
                            href={`/admin/users/${u.id}`}
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && items.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span>
              Showing{" "}
              <span className="font-medium text-foreground">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, count)}
              </span>{" "}
              of <span className="font-medium text-foreground">{count}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <span className="px-2 text-xs">
                Page <span className="font-medium text-foreground">{page}</span> /{" "}
                {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {confirmDialog}
    </div>
  );
}

// ───── helpers ─────

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: number | string;
  tone: "indigo" | "primary" | "amber" | "slate" | "emerald" | "rose";
}) {
  const toneMap: Record<typeof tone, string> = {
    indigo: "bg-indigo-500/10 text-indigo-600",
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-700",
    slate: "bg-muted text-muted-foreground",
    emerald: "bg-emerald-500/10 text-emerald-700",
    rose: "bg-rose-500/10 text-rose-700",
  };
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <div
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${toneMap[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-xl font-bold tabular-nums text-foreground">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function Segmented<V extends string>({
  value,
  onChange,
  options,
}: {
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: string }[];
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-2 text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-primary/10 text-primary"
              : "bg-surface text-muted-foreground hover:bg-muted"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// Local inline icon to avoid extra import noise.
function ShieldOff(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
  );
}
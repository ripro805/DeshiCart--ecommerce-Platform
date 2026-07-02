"use client";

import { apiGet, apiPatch, apiDelete } from "@/lib/api";
import { useEffect, useState } from "react";
import { Search, Loader2, Mail, Shield, ShieldOff } from "lucide-react";

export default function UsersPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "staff" | "customers">("all");

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/api/auth/users/");
      const data = Array.isArray(res) ? res : res?.results || [];
      setItems(data);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function toggleStaff(u: any) {
    const next = !u.is_staff;
    await apiPatch(`/api/auth/users/${u.id}/`, { is_staff: next });
    setItems((xs) => xs.map((x) => x.id === u.id ? { ...x, is_staff: next } : x));
  }

  async function toggleActive(u: any) {
    const next = !u.is_active;
    await apiPatch(`/api/auth/users/${u.id}/`, { is_active: next });
    setItems((xs) => xs.map((x) => x.id === u.id ? { ...x, is_active: next } : x));
  }

  const filtered = items.filter((u) => {
    if (filter === "staff" && !u.is_staff) return false;
    if (filter === "customers" && u.is_staff) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return u.email?.toLowerCase().includes(q) || u.first_name?.toLowerCase().includes(q) || u.last_name?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <p className="text-sm text-slate-500">{items.length} registered accounts</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md"
            />
          </div>
          <div className="inline-flex border border-slate-200 rounded-md overflow-hidden">
            {(["all", "staff", "customers"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-xs font-medium ${filter === f ? "bg-indigo-50 text-indigo-700" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {f === "all" ? "All" : f === "staff" ? "Staff" : "Customers"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No users</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 inline-flex items-center justify-center text-xs font-medium">
                        {(u.first_name?.[0] || u.email?.[0] || "U").toUpperCase()}{(u.last_name?.[0] || "").toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}</div>
                        <div className="text-xs text-slate-500">{u.phone || ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-slate-700">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.is_staff ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                      {u.is_staff ? "Staff" : "Customer"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                      {u.is_active ? "Active" : "Blocked"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => toggleStaff(u)}
                      title={u.is_staff ? "Demote to customer" : "Promote to staff"}
                      className={`inline-flex p-1.5 rounded mr-1 ${u.is_staff ? "text-indigo-600 hover:bg-indigo-50" : "text-slate-400 hover:bg-slate-100"}`}
                    >
                      {u.is_staff ? <Shield className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      title={u.is_active ? "Block" : "Unblock"}
                      className={`inline-flex p-1.5 rounded ${u.is_active ? "text-rose-500 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"}`}
                    >
                      <Mail className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
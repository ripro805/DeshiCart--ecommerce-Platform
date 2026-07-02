"use client";

import { apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Users, Shield, Loader2 } from "lucide-react";

export default function StaffPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/api/auth/users/?is_staff=true");
        const list = Array.isArray(res) ? res : res?.results || [];
        setStaff(list);
      } catch { setStaff([]); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff & Roles</h1>
          <p className="text-sm text-slate-500">Administrators and team members</p>
        </div>
        <Link href="/admin/users" className="text-sm text-indigo-600 hover:underline">Manage All Users →</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Shield className="h-12 w-12 mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No staff members</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Superuser</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-semibold">
                        {(u.first_name?.[0] || u.email?.[0] || "?").toUpperCase()}
                      </div>
                      <span className="font-medium">{u.first_name || u.last_name ? `${u.first_name || ""} ${u.last_name || ""}`.trim() : "—"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.is_superuser ? <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">superuser</span> : <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">staff</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(u.date_joined).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{u.last_login ? new Date(u.last_login).toLocaleString() : "never"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
"use client";

import { apiGet } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, Loader2, Check } from "lucide-react";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/api/notifications/");
        const list = Array.isArray(res) ? res : res?.results || [];
        setItems(list);
      } catch { setItems([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const unread = items.filter((n) => !n.is_read).length;

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">{unread} unread</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Bell className="h-12 w-12 mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No notifications yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          {items.map((n) => (
            <div key={n.id} className={`p-4 flex items-start gap-3 ${!n.is_read ? "bg-indigo-50/30" : ""}`}>
              <div className={`h-2 w-2 mt-2 rounded-full ${!n.is_read ? "bg-indigo-600" : "bg-slate-300"}`} />
              <div className="flex-1">
                <div className="font-medium text-slate-900">{n.title}</div>
                <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                <div className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                {n.link && <Link href={n.link} className="inline-flex items-center gap-1 mt-2 text-xs text-indigo-600 hover:underline">View →</Link>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
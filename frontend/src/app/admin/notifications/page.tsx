"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useEffect, useState } from "react";
import { Loader2, Send, Plus } from "lucide-react";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", message: "", type: "info", audience: "all" });

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/api/notifications/");
      const data = Array.isArray(res) ? res : res?.results || [];
      setItems(data);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiPost("/api/notifications/send/", form);
      setShowForm(false);
      setForm({ title: "", message: "", type: "info", audience: "all" });
      void load();
    } catch (e: any) { alert("Failed: " + (e?.message || "")); }
    finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
          <p className="text-sm text-slate-500">System and user notifications</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Notification
        </button>
      </div>

      {showForm && (
        <form onSubmit={send} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message *</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="promo">Promotional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Audience</label>
              <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
                <option value="all">All Users</option>
                <option value="customers">Customers Only</option>
                <option value="staff">Staff Only</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
              <Send className="h-4 w-4" /> Send
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg border border-slate-200">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No notifications yet</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items.map((n) => (
              <li key={n.id} className="px-5 py-4 hover:bg-slate-50">
                <div className="flex items-start gap-3">
                  <span className={`inline-block w-2 h-2 rounded-full mt-2 ${n.type === "success" ? "bg-emerald-500" : n.type === "warning" ? "bg-amber-500" : n.type === "promo" ? "bg-fuchsia-500" : "bg-sky-500"}`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-900">{n.title}</h3>
                      <span className="text-xs text-slate-500">{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{n.message}</p>
                    <div className="text-xs text-slate-500 mt-1">To: {n.audience || "all"}</div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
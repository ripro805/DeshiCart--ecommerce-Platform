"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Loader2, Plus } from "lucide-react";

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", priority: "low" });

  async function load() {
    try {
      const res: any = await apiGet("/api/support/tickets/");
      const list = Array.isArray(res) ? res : res?.results || [];
      setTickets(list);
    } catch { setTickets([]); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created: any = await apiPost("/api/support/tickets/", form);
      setShowForm(false);
      setForm({ subject: "", message: "", priority: "low" });
      await load();
      if (created?.id) window.location.href = `/account/support/${created.id}`;
    } catch (e: any) { alert("Failed: " + e?.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support</h1>
          <p className="text-sm text-slate-500">Get help with your orders</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Ticket
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
            <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={5} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 text-sm border border-slate-200 rounded-md">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin inline" /> : "Submit"}
            </button>
          </div>
        </form>
      )}

      {tickets.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <LifeBuoy className="h-12 w-12 mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No support tickets</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
          {tickets.map((t) => (
            <Link key={t.id} href={`/account/support/${t.id}`} className="block p-4 hover:bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t.subject}</div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">{t.message}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${t.status === "open" ? "bg-amber-100 text-amber-700" : t.status === "closed" ? "bg-slate-100 text-slate-700" : "bg-blue-100 text-blue-700"}`}>
                  {t.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
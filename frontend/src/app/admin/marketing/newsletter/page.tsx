"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useEffect, useState } from "react";
import { Loader2, Send, Users } from "lucide-react";

export default function NewsletterPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res: any = await apiGet("/api/marketing/newsletter/subscribers/");
      const data = Array.isArray(res) ? res : res?.results || [];
      setSubs(data);
    } catch { setSubs([]); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!confirm(`Send newsletter to ${subs.length} subscribers?`)) return;
    setSending(true);
    try {
      await apiPost("/api/marketing/newsletter/send/", { subject, body });
      setSubject("");
      setBody("");
      alert("Newsletter sent!");
    } catch (e: any) { alert("Failed: " + (e?.message || "")); }
    finally { setSending(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Newsletter</h1>
        <p className="text-sm text-slate-500">Email newsletters to subscribers</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={send} className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Body *</label>
              <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={12} placeholder="Write your newsletter content here..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md font-mono" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={sending} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
                <Send className="h-4 w-4" /> Send to {subs.length} subscribers
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" /> Subscribers
          </h2>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          ) : subs.length === 0 ? (
            <p className="text-sm text-slate-500">No subscribers yet</p>
          ) : (
            <ul className="space-y-1 max-h-96 overflow-y-auto">
              {subs.map((s) => (
                <li key={s.id} className="text-xs text-slate-600 truncate">{s.email}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
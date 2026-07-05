"use client";

import { apiGet, apiPost } from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Send } from "lucide-react";

export default function SupportDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const res: any = await apiGet(`/support/tickets/${id}/`);
      setTicket(res);
    } catch {}
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function send() {
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await apiPost(`/support/tickets/${id}/reply/`, { message: reply });
      setReply("");
      await load();
    } catch (e: any) { alert("Failed: " + e?.message); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!ticket) return <p className="text-center text-slate-500 py-12">Ticket not found</p>;

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{ticket.subject}</h1>
        <p className="text-sm text-slate-500">Ticket #{ticket.id} · {ticket.status}</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <p className="text-sm whitespace-pre-wrap">{ticket.message}</p>
      </div>

      {ticket.replies?.length > 0 && (
        <div className="space-y-2">
          {ticket.replies.map((r: any, i: number) => (
            <div key={i} className={`rounded-lg border p-3 ${r.from_staff ? "bg-indigo-50/30 border-indigo-200" : "bg-white border-slate-200"}`}>
              <div className="text-xs text-slate-500 mb-1">{r.from_staff ? "Support" : "You"} · {new Date(r.created_at).toLocaleString()}</div>
              <p className="text-sm whitespace-pre-wrap">{r.message}</p>
            </div>
          ))}
        </div>
      )}

      {ticket.status !== "closed" && (
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
          <div className="flex justify-end mt-2">
            <button onClick={send} disabled={submitting || !reply.trim()} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
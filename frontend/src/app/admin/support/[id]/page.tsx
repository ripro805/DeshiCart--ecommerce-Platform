"use client";

import { apiGet, apiPatch } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Send, CheckCircle } from "lucide-react";

export default function SupportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet(`/api/support/tickets/${id}/`);
        setTicket(res);
      } catch { alert("Failed to load"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSubmitting(true);
    try {
      await apiPatch(`/api/support/tickets/${id}/`, { reply });
      setReply("");
      const res: any = await apiGet(`/api/support/tickets/${id}/`);
      setTicket(res);
    } catch (e: any) { alert("Failed: " + e?.message); }
    finally { setSubmitting(false); }
  }

  async function updateStatus(status: string) {
    await apiPatch(`/api/support/tickets/${id}/`, { status });
    const res: any = await apiGet(`/api/support/tickets/${id}/`);
    setTicket(res);
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!ticket) return null;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{ticket.subject}</h1>
          <p className="text-sm text-slate-500">Ticket #{ticket.id} · {ticket.user_email || ticket.user?.email}</p>
        </div>
        <div className="flex gap-2">
          {ticket.status !== "closed" && (
            <button onClick={() => updateStatus("closed")} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100">
              <CheckCircle className="h-4 w-4" /> Close Ticket
            </button>
          )}
          {ticket.status === "closed" && (
            <button onClick={() => updateStatus("open")} className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100">
              Reopen
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Original Message</h3>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.message}</p>
          </div>

          {ticket.replies?.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Conversation</h3>
              {ticket.replies.map((r: any, i: number) => (
                <div key={i} className={`bg-white rounded-lg border p-4 ${r.from_staff ? "border-indigo-200 bg-indigo-50/30" : "border-slate-200"}`}>
                  <div className="text-xs text-slate-500 mb-1">{r.from_staff ? "Support Team" : r.user_email || "Customer"} · {new Date(r.created_at).toLocaleString()}</div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{r.message}</p>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." rows={4} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md" />
            <div className="flex justify-end mt-2">
              <button onClick={sendReply} disabled={submitting || !reply.trim()} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Reply
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Details</h3>
            <div>
              <div className="text-xs text-slate-500">Status</div>
              <select value={ticket.status} onChange={(e) => updateStatus(e.target.value)} className="w-full mt-1 px-2 py-1 text-sm border border-slate-200 rounded-md">
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <div className="text-xs text-slate-500">Priority</div>
              <select value={ticket.priority || "low"} onChange={(e) => apiPatch(`/api/support/tickets/${id}/`, { priority: e.target.value }).then(() => apiGet(`/api/support/tickets/${id}/`).then(setTicket))} className="w-full mt-1 px-2 py-1 text-sm border border-slate-200 rounded-md">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div><div className="text-xs text-slate-500">Created</div><div className="text-sm">{new Date(ticket.created_at).toLocaleString()}</div></div>
            {ticket.order && <div><div className="text-xs text-slate-500">Related Order</div><div className="text-sm">#{ticket.order}</div></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
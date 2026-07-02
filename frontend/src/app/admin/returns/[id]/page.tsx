"use client";

import { apiGet, apiPatch } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Save, CheckCircle, XCircle, Clock } from "lucide-react";

export default function ReturnDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [r, setR] = useState<any>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet(`/api/returns/${id}/`);
        setR(res);
        setNotes(res.admin_notes || "");
      } catch { alert("Failed to load"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  async function setStatus(status: string) {
    setSubmitting(true);
    try {
      await apiPatch(`/api/returns/${id}/`, { status, admin_notes: notes });
      setR((x: any) => ({ ...x, status, admin_notes: notes }));
    } catch (e: any) { alert("Failed: " + (e?.message || "")); }
    finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!r) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Return #{r.id}</h1>
          <p className="text-sm text-slate-500">Order {r.order_number || `#${r.order}`}</p>
        </div>
        <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 capitalize">
          {r.status}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Reason</h2>
            <p className="text-sm text-slate-700">{r.reason || r.description || "No reason provided"}</p>
            {r.images && r.images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {r.images.map((img: string, i: number) => (
                  <img key={i} src={img} alt="" className="w-full h-20 object-cover rounded" />
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Admin Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="Internal notes about this return..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md"
            />
            <button
              onClick={() => setStatus(r.status)}
              disabled={submitting}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-sm rounded-md hover:bg-slate-900 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> Save Notes
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            <Row label="Customer" value={r.user_email || "—"} />
            <Row label="Refund" value={r.refund_amount || "—"} />
            <Row label="Type" value={r.refund_type || r.type || "—"} />
            <Row label="Requested" value={new Date(r.created_at).toLocaleString()} />
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">Actions</h2>
            <button onClick={() => setStatus("approved")} disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm rounded-md hover:bg-emerald-700 disabled:opacity-50">
              <CheckCircle className="h-4 w-4" /> Approve
            </button>
            <button onClick={() => setStatus("rejected")} disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-rose-600 text-white text-sm rounded-md hover:bg-rose-700 disabled:opacity-50">
              <XCircle className="h-4 w-4" /> Reject
            </button>
            <button onClick={() => setStatus("completed")} disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-700 text-white text-sm rounded-md hover:bg-slate-800 disabled:opacity-50">
              <Clock className="h-4 w-4" /> Mark Completed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-900 font-medium">{value}</span>
    </div>
  );
}
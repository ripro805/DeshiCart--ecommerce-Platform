"use client";

import { apiGet } from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, Undo2 } from "lucide-react";

export default function ReturnDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet(`/api/returns/${id}/`);
        setItem(res);
      } catch {}
      finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (!item) return <p className="text-center text-slate-500 py-12">Return not found</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Return #{item.id}</h1>
        <p className="text-sm text-slate-500">Submitted {new Date(item.created_at).toLocaleDateString()}</p>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
        <div className="flex justify-between"><span className="text-slate-500 text-sm">Status</span><span className="font-medium">{item.status}</span></div>
        <div className="flex justify-between"><span className="text-slate-500 text-sm">Reason</span><span className="font-medium">{item.reason}</span></div>
        <div className="flex justify-between"><span className="text-slate-500 text-sm">Order</span><span className="font-medium">#{item.order}</span></div>
        <hr className="border-slate-100" />
        <div>
          <div className="text-slate-500 text-sm mb-1">Description</div>
          <p className="text-sm">{item.description}</p>
        </div>
        {item.admin_notes && (
          <div>
            <div className="text-slate-500 text-sm mb-1">Admin Notes</div>
            <p className="text-sm">{item.admin_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
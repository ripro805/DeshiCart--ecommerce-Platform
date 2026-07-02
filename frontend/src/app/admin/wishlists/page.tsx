"use client";

import { apiGet } from "@/lib/api";
import { useEffect, useState } from "react";
import { Heart, Loader2 } from "lucide-react";

export default function WishlistsPage() {
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await apiGet("/api/wishlists/");
        setLists(Array.isArray(res) ? res : res?.results || []);
      } catch { setLists([]); }
      finally { setLoading(false); }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Wishlists</h1>
        <p className="text-sm text-slate-500">Customer saved-for-later items</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>
      ) : lists.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
          <Heart className="h-12 w-12 mx-auto text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">No wishlists yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600 uppercase">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lists.map((w: any) => (
                <tr key={w.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium">{w.user_email || w.user?.email || "—"}</td>
                  <td className="px-4 py-3">{w.items?.length || w.item_count || 0} products</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(w.updated_at || w.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState, ReactNode } from "react";
import { Loader2, Plus, Search, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { apiGet, apiDelete } from "@/lib/api";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
};

type Props<T> = {
  endpoint: string;
  columns: Column<T>[];
  title: string;
  searchKeys?: (keyof T)[];
  createHref?: string;
  onEdit?: (row: T) => ReactNode;
  transform?: (data: any) => T[];
};

export function DataTable<T extends { id: number | string }>({
  endpoint, columns, title, searchKeys = [], createHref, onEdit, transform,
}: Props<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<number | string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res: any = await apiGet(endpoint);
      const data = transform ? transform(res) : (Array.isArray(res) ? res : res?.results || []);
      setItems(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [endpoint]);

  async function handleDelete(id: number | string) {
    if (!confirm("Delete this item?")) return;
    setDeleting(id);
    try {
      await apiDelete(`${endpoint.replace(/\/$/, "")}/${id}/`);
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch {
      alert("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  const filtered = items.filter((it) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return searchKeys.some((k) => String((it as any)[k] ?? "").toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {createHref && (
          <Link href={createHref} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
            <Plus className="h-4 w-4" />
            Add New
          </Link>
        )}
      </div>

      {error && <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">{error}</div>}

      <div className="bg-white rounded-lg border border-slate-200">
        {searchKeys.length > 0 && (
          <div className="px-5 py-4 border-b border-slate-200">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">No items</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className={`px-5 py-3 text-left ${c.className || ""}`}>{c.header}</th>
                ))}
                {(onEdit || true) && <th className="px-5 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-5 py-3 ${c.className || ""}`}>
                      {c.render ? c.render(row) : String((row as any)[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      {onEdit ? onEdit(row) : (
                        <Link href={`?edit=${row.id}`} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                          <Edit className="h-4 w-4" />
                        </Link>
                      )}
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deleting === row.id}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
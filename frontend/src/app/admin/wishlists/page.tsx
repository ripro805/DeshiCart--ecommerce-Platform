"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { apiGet } from "@/lib/api";
import { usePermissionState } from "@/components/admin/layout/role-guard";
import { EmptyState, ErrorState, LoadingState } from "@/components/admin/feedback/states";
import { formatDate } from "@/lib/utils";

export default function WishlistsPage() {
  const { allowed, loading: permLoading } = usePermissionState("manage_wishlists");
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;
    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res: any = await apiGet("/wishlist/wishlists/");
        setLists(Array.isArray(res) ? res : res?.results || []);
      } catch (e: any) {
        setLoadError(e?.message || "Could not load wishlists");
        setLists([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed]);

  if (permLoading) return <LoadingState label="Checking permissions…" />;
  if (!allowed) return <ErrorState title="Access denied" description="You need manage_wishlists to view this page." />;
  if (loading) return <LoadingState label="Loading wishlists…" />;
  if (loadError) return <ErrorState title="Couldn't load wishlists" description={loadError} />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Wishlists</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer saved-for-later items
        </p>
      </header>

      {lists.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          <EmptyState
            icon={Heart}
            title="No wishlists yet"
            description="Customer wishlists will appear here once shoppers save items."
          />
        </div>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Items</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium">Last Updated</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lists.map((w: any) => {
                  const cust = w.user_name && w.user_name.trim() !== ""
                    ? w.user_name
                    : w.user_email || `#${w.user}`;
                  return (
                    <tr key={w.id} className="transition hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {(w.user_email?.[0] || "?").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{cust}</p>
                            {w.user_email && (
                              <p className="text-xs text-muted-foreground">{w.user_email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:text-rose-300">
                          <Heart className="h-3 w-3" />
                          {w.items?.length || 0}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{formatDate(w.created_at)}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{formatDate(w.updated_at || w.created_at)}</td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/admin/wishlists/${w.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
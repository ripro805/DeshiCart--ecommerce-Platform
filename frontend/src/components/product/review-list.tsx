"use client";

import { useState } from "react";
import type { Review } from "@/types";
import { StarRating } from "@/components/ui/stars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Star, Send } from "lucide-react";
import { formatDate, getErrorMessage } from "@/lib/utils";
import { useProductReviews } from "@/hooks/useProducts";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";

export function ReviewList({ productId }: { productId: number | string }) {
  const { data: reviews = [], isLoading, create } = useProductReviews(productId);
  const isAuth = useAuthStore((s) => !!s.accessToken);

  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await create.mutateAsync({ ratings: rating, comment });
      toast.success("Review posted");
      setComment(""); setRating(5); setOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not post review"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Reviews</h2>
        {isAuth && !open && (
          <Button onClick={() => setOpen(true)} variant="outline">Write a review</Button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="mt-4 rounded-3xl border border-ink-200/60 bg-white/70 p-6 dark:border-ink-800/60 dark:bg-ink-950/60 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Your rating:</span>
            {[1,2,3,4,5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} star`}
              >
                <Star
                  className={n <= rating ? "fill-amber-400 text-amber-400" : "text-ink-300 dark:text-ink-700"}
                  size={22}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike?"
            required
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}><Send className="h-4 w-4" /> Post review</Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="mt-6 text-ink-500">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="mt-6 text-ink-500">Be the first to review this product.</p>
      ) : (
        <ul className="mt-6 space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-3xl border border-ink-200/60 bg-white/70 p-5 dark:border-ink-800/60 dark:bg-ink-950/60">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{r.user?.first_name || r.user?.email}</p>
                  <p className="text-xs text-ink-500">{formatDate(r.created_at)}</p>
                </div>
                <StarRating value={r.ratings} size={14} />
              </div>
              <p className="mt-3 text-sm text-ink-700 dark:text-ink-200">{r.comment}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

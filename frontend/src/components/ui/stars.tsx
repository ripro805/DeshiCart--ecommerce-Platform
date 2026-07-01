"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;             // 0..5
  count?: number;            // number of reviews
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
  className?: string;
}

export function StarRating({
  value,
  count,
  size = 16,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className={cn("inline-flex items-center gap-1", className)}>
      {stars.map((s) => {
        const filled = s <= Math.round(value);
        return (
          <button
            key={s}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(s)}
            className={cn(
              "transition-transform",
              interactive && "hover:scale-110 cursor-pointer"
            )}
            aria-label={`${s} star`}
          >
            <Star
              size={size}
              className={cn(
                filled ? "fill-amber-400 text-amber-400" : "text-ink-300 dark:text-ink-700"
              )}
            />
          </button>
        );
      })}
      {count !== undefined && (
        <span className="ml-1 text-xs text-ink-500 dark:text-ink-400">({count})</span>
      )}
    </div>
  );
}

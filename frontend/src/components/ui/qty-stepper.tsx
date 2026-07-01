"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QtyStepper({
  value,
  min = 1,
  max = 99,
  onChange,
  size = "md",
  className,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
  className?: string;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className={cn(
      "inline-flex items-center rounded-full border border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950",
      className
    )}>
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        className={cn(
          dim, "grid place-items-center rounded-l-full text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-900 disabled:opacity-40 transition-colors"
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={icon} />
      </button>
      <span className="min-w-10 px-3 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        className={cn(
          dim, "grid place-items-center rounded-r-full text-ink-700 dark:text-ink-200 hover:bg-ink-100 dark:hover:bg-ink-900 disabled:opacity-40 transition-colors"
        )}
        aria-label="Increase quantity"
      >
        <Plus className={icon} />
      </button>
    </div>
  );
}

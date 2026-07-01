"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  className?: string;
}) {
  return (
    <div className={cn(
      "inline-flex items-center rounded-full bg-ink-100/70 p-1 dark:bg-ink-900/60",
      className
    )}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-10 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300",
              active
                ? "bg-white text-ink-900 shadow-soft dark:bg-ink-800 dark:text-white"
                : "text-ink-500 hover:text-ink-900 dark:hover:text-white"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

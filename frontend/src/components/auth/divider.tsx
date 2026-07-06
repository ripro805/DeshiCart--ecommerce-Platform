"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function Divider({ label, className, ...props }: DividerProps) {
  if (!label) {
    return (
      <div
        role="separator"
        className={cn("h-px w-full bg-ink-200/70 dark:bg-ink-800/70", className)}
        {...props}
      />
    );
  }
  return (
    <div
      role="separator"
      className={cn(
        "flex w-full items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-ink-400 dark:text-ink-500",
        className
      )}
      {...props}
    >
      <span className="h-px flex-1 bg-ink-200/70 dark:bg-ink-800/70" />
      <span className="font-medium">{label}</span>
      <span className="h-px flex-1 bg-ink-200/70 dark:bg-ink-800/70" />
    </div>
  );
}
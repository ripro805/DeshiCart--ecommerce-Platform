"use client";

import { Loader2, Inbox, AlertCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <div className="rounded-full bg-muted p-3">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="mt-2 text-sm font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50/60 px-4 py-10 text-center dark:border-rose-900 dark:bg-rose-950/40">
      <AlertCircle className="h-7 w-7 text-rose-600 dark:text-rose-400" />
      <h3 className="text-sm font-semibold text-rose-700 dark:text-rose-300">{title}</h3>
      {description && (
        <p className="max-w-sm text-xs leading-relaxed text-rose-700/80 dark:text-rose-300/80">
          {description}
        </p>
      )}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-md border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-3">
          <div className="h-3 w-full max-w-[140px] animate-shimmer rounded bg-gradient-to-r from-muted via-muted-foreground/15 to-muted bg-[length:200%_100%]" />
        </td>
      ))}
    </tr>
  );
}
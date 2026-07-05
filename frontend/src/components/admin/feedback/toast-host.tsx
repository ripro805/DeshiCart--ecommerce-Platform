"use client";

import { useToastStore, type ToastItem } from "./toast-store";
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from "lucide-react";

const VARIANT_STYLES: Record<
  ToastItem["variant"],
  { ring: string; icon: string; Icon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    ring: "border-emerald-500/60 bg-emerald-50 dark:bg-emerald-950/60",
    icon: "text-emerald-600 dark:text-emerald-400",
    Icon: CheckCircle2,
  },
  error: {
    ring: "border-rose-500/60 bg-rose-50 dark:bg-rose-950/60",
    icon: "text-rose-600 dark:text-rose-400",
    Icon: XCircle,
  },
  info: {
    ring: "border-sky-500/60 bg-sky-50 dark:bg-sky-950/60",
    icon: "text-sky-600 dark:text-sky-400",
    Icon: Info,
  },
  warn: {
    ring: "border-amber-500/60 bg-amber-50 dark:bg-amber-950/60",
    icon: "text-amber-600 dark:text-amber-400",
    Icon: AlertTriangle,
  },
};

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[1000] flex w-[min(92vw,380px)] flex-col gap-2">
      {toasts.map((t) => {
        const cfg = VARIANT_STYLES[t.variant];
        const Icon = cfg.Icon;
        return (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto animate-fade-in rounded-lg border ${cfg.ring} px-3 py-2.5 shadow-soft backdrop-blur`}
          >
            <div className="flex items-start gap-2.5">
              <Icon className={`mt-0.5 h-5 w-5 flex-none ${cfg.icon}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-foreground">{t.title}</div>
                {t.description && (
                  <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    {t.description}
                  </div>
                )}
              </div>
              <button
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
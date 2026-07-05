"use client";

import { useState, useRef, useCallback } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

type Tone = "danger" | "warn" | "default";

export type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: Tone;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

const TONE_BTN: Record<Tone, string> = {
  danger: "bg-rose-600 hover:bg-rose-700 text-white",
  warn: "bg-amber-600 hover:bg-amber-700 text-white",
  default: "bg-primary hover:opacity-90 text-primary-foreground",
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  const isDanger = tone === "danger";

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-xl border border-border bg-surface p-5 shadow-elev"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {isDanger && (
            <div className="flex-none rounded-full bg-rose-100 p-2 dark:bg-rose-950/40">
              <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            {description && (
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${TONE_BTN[tone]}`}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type AskOpts = {
  title: string;
  description?: string;
  tone?: Tone;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
};

type DialogState = {
  open: boolean;
  title: string;
  description?: string;
  tone: Tone;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
};

/**
 * Hook-style controller for ergonomic confirmation dialogs.
 * Usage:
 *   const { ask, dialog } = useConfirm();
 *   await ask({ title: 'Delete?', tone: 'danger', onConfirm: async () => { ... } });
 */
export function useConfirm() {
  const [state, setState] = useState<DialogState>({
    open: false,
    title: "",
    tone: "default",
    onConfirm: () => {},
  });
  const [loading, setLoading] = useState(false);
  const resolverRef = useRef<((v: boolean) => void) | null>(null);

  const ask = useCallback((opts: AskOpts): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({
        open: true,
        title: opts.title,
        description: opts.description,
        tone: opts.tone ?? "default",
        confirmLabel: opts.confirmLabel,
        cancelLabel: opts.cancelLabel,
        onConfirm: opts.onConfirm,
      });
    });
  }, []);

  const handleCancel = useCallback(() => {
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    setState((s) => ({ ...s, open: false }));
  }, []);

  const handleConfirm = useCallback(async () => {
    setLoading(true);
    try {
      await state.onConfirm();
      if (resolverRef.current) {
        resolverRef.current(true);
        resolverRef.current = null;
      }
      setState((s) => ({ ...s, open: false }));
    } catch {
      // leave open so the caller can retry
    } finally {
      setLoading(false);
    }
  }, [state]);

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      description={state.description}
      tone={state.tone}
      confirmLabel={state.confirmLabel}
      cancelLabel={state.cancelLabel}
      loading={loading}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { ask, dialog };
}
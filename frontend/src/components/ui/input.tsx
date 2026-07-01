"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 w-full rounded-2xl border border-ink-200 bg-white/80 px-4 py-2 text-sm text-ink-900 placeholder:text-ink-400 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:border-accent",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "dark:border-ink-800 dark:bg-ink-950/60 dark:text-white dark:placeholder:text-ink-500",
          invalid && "border-danger focus-visible:ring-danger/40 focus-visible:border-danger",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[96px] w-full rounded-2xl border border-ink-200 bg-white/80 px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:border-accent",
        "dark:border-ink-800 dark:bg-ink-950/60 dark:text-white dark:placeholder:text-ink-500",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...props }) => (
  <label
    className={cn("text-sm font-medium text-ink-700 dark:text-ink-200", className)}
    {...props}
  />
);

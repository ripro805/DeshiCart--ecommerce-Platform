import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "glass" | "outline" | "accent";

export function Badge({
  className,
  variant = "default",
  ...rest
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const styles: Record<Variant, string> = {
    default: "bg-ink-900 text-white dark:bg-white dark:text-ink-900",
    glass: "bg-white/70 backdrop-blur-md border border-white/40 text-ink-900 dark:bg-ink-950/60 dark:border-white/10 dark:text-white",
    outline: "border border-ink-300 text-ink-700 dark:border-ink-700 dark:text-ink-200",
    accent: "bg-accent/10 text-accent-700 border border-accent/20 dark:bg-accent/20 dark:text-accent-100",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
      {...rest}
    />
  );
}

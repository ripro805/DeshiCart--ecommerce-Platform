"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Lightweight, theme-aware checkbox used in the auth forms.
 * Renders an accessible native <input> behind a styled box so it works in any
 * form without pulling in @radix-ui/react-checkbox.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          "relative inline-flex h-5 w-5 flex-none cursor-pointer select-none items-center justify-center rounded-md border transition-all duration-200",
          checked
            ? "border-primary bg-primary text-white shadow-[0_0_0_3px_rgba(234,88,12,0.10)]"
            : "border-ink-300 bg-white/90 hover:border-ink-400 dark:border-ink-700 dark:bg-ink-950/60",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <Check
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            checked ? "scale-100" : "scale-0"
          )}
          strokeWidth={3}
        />
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";
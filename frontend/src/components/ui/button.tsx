"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 ease-apple focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-white hover:bg-primary-700 shadow-soft hover:shadow-warm dark:bg-primary-500 dark:hover:bg-primary-400 dark:text-secondary",
        accent:
          "bg-accent text-secondary hover:bg-accent-500 shadow-glow",
        outline:
          "border border-ink-200 bg-transparent hover:bg-ink-100 dark:border-ink-800 dark:hover:bg-ink-900",
        ghost:
          "hover:bg-ink-100 dark:hover:bg-ink-900 text-ink-900 dark:text-ink-100",
        glass:
          "bg-white/60 backdrop-blur-xl border border-white/40 hover:bg-white/80 dark:bg-ink-950/60 dark:border-white/10 dark:hover:bg-ink-950/80 text-ink-900 dark:text-white shadow-soft",
        link:
          "text-accent underline-offset-4 hover:underline px-0",
        danger:
          "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base py-3.5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };

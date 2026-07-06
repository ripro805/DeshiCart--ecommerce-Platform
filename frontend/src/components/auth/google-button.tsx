"use client";

import * as React from "react";
import { toast } from "sonner";

export interface GoogleButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** "signin" or "signup" - controls label & icon hint */
  mode?: "signin" | "signup";
}

/**
 * Visual Google sign-in button that matches the production-grade reference
 * styling. If `NEXT_PUBLIC_GOOGLE_OAUTH_URL` is configured it will redirect to
 * that endpoint; otherwise it falls back to a friendly toast so the UI still
 * works in dev environments where social auth is not yet wired up.
 */
export const GoogleButton = React.forwardRef<HTMLButtonElement, GoogleButtonProps>(
  ({ className, mode = "signin", disabled, ...props }, ref) => {
    const label = mode === "signup" ? "Sign up with Google" : "Sign in with Google";
    const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const oauthUrl = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_URL;
      if (oauthUrl) {
        window.location.href = oauthUrl;
        return;
      }
      e.preventDefault();
      toast.info("Google sign-in is being configured. Use your Luxora account for now.");
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={
          "group relative inline-flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-ink-200/70 bg-white/85 px-4 text-[15px] font-medium text-ink-800 shadow-sm backdrop-blur transition-all duration-300 hover:-translate-y-[1px] hover:border-ink-300 hover:bg-white hover:shadow-md active:translate-y-0 active:shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-800/70 dark:bg-ink-950/60 dark:text-ink-100 dark:hover:border-ink-700 dark:hover:bg-ink-900 " +
          (className ?? "")
        }
        {...props}
      >
        <GoogleLogo />
        <span>{label}</span>
      </button>
    );
  }
);
GoogleButton.displayName = "GoogleButton";

/** Inline SVG Google "G" logo (multi-color) - no external dependency. */
function GoogleLogo() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className="h-5 w-5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}
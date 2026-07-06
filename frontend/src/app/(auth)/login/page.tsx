"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { getErrorMessage } from "@/lib/utils";
import { GoogleButton } from "@/components/auth/google-button";
import { Divider } from "@/components/auth/divider";
import { Checkbox } from "@/components/ui/checkbox";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const emailError = emailTouched && !emailValid ? "Please enter a valid email" : null;
  const passwordError =
    passwordTouched && password.length < 6 ? "Password is too short" : null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    if (!emailValid || !password) {
      setFormError("Please fix the highlighted fields.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      // Read the freshly-updated user from the store (the closure-scoped `user`
      // from useAuth is captured at render time and would be stale).
      const current = useAuthStore.getState().user;
      const role = (current?.is_superuser
        ? "SUPER_ADMIN"
        : current?.is_staff
        ? "STAFF_ADMIN"
        : "CUSTOMER") as "CUSTOMER" | "STAFF_ADMIN" | "SUPER_ADMIN";
      if (role !== "CUSTOMER") {
        const nextAdmin =
          typeof next === "string" && next.startsWith("/admin") ? next : "/admin/dashboard";
        router.push(nextAdmin);
      } else {
        router.push(typeof next === "string" && next ? next : "/account");
      }
    } catch (err) {
      const msg = getErrorMessage(err, "Invalid email or password");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.28, 0.11, 0.32, 1] }}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-[1.9rem] font-semibold tracking-tight text-ink-900 dark:text-white sm:text-[2.1rem]">
          Welcome Back
        </h1>
        <p className="mt-1.5 text-sm text-ink-500 dark:text-ink-300">
          Choose from 10,000+ products across 400+ categories
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {formError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            role="alert"
            aria-live="polite"
            className="flex items-start gap-3 rounded-2xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-danger/20 text-danger">
              !
            </span>
            <div>
              <p className="font-semibold">Sign-in failed</p>
              <p className="text-danger/80">{formError}</p>
            </div>
          </motion.div>
        )}

        {/* Google OAuth (social auth) */}
        <GoogleButton mode="signin" disabled={submitting} />

        <Divider label="or" />

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-ink-700 dark:text-ink-200">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            invalid={!!emailError}
            className="mt-1.5 h-12 rounded-2xl border-ink-200/70 bg-white/80 px-4 text-[15px] shadow-sm backdrop-blur transition-all focus:shadow-[0_0_0_4px_rgba(234,88,12,0.10)] dark:border-ink-800/70 dark:bg-ink-950/50"
          />
          {emailError && (
            <p className="mt-1 text-xs text-danger">{emailError}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-ink-700 dark:text-ink-200">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-ink-500 transition hover:text-primary dark:text-ink-400 dark:hover:text-primary-400"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            invalid={!!passwordError}
            className="mt-1.5 h-12 rounded-2xl border-ink-200/70 bg-white/80 px-4 text-[15px] shadow-sm backdrop-blur transition-all focus-within:shadow-[0_0_0_4px_rgba(234,88,12,0.10)] dark:border-ink-800/70 dark:bg-ink-950/50"
          />
          {passwordError && (
            <p className="mt-1 text-xs text-danger">{passwordError}</p>
          )}
        </div>

        {/* Remember me */}
        <label className="flex cursor-pointer select-none items-center gap-2.5 pt-1">
          <Checkbox
            checked={remember}
            onCheckedChange={(v) => setRemember(Boolean(v))}
          />
          <span className="text-sm text-ink-600 dark:text-ink-300">Remember me</span>
        </label>

        {/* Submit */}
        <Button
          type="submit"
          loading={submitting}
          className="group h-12 w-full rounded-2xl bg-gradient-to-br from-[#7C4A28] via-[#8B5A36] to-[#6B3E1F] text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(124,74,40,0.55)] transition-all duration-300 hover:shadow-[0_12px_32px_-8px_rgba(124,74,40,0.7)] active:scale-[0.99] dark:from-primary dark:via-primary-500 dark:to-accent"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Login
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>

      {/* Register link */}
      <p className="mt-6 text-center text-sm text-ink-500 dark:text-ink-300">
        Don&apos;t have an account?{" "}
        <Link
          href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="font-semibold text-primary underline-offset-4 transition hover:underline dark:text-primary-400"
        >
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}
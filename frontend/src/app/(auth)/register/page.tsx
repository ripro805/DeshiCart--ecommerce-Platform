"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, Loader2, Eye, EyeOff, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { GoogleButton } from "@/components/auth/google-button";
import { Divider } from "@/components/auth/divider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";

type FormState = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  re_password: string;
  agree: boolean;
};

export default function RegisterPage() {
  const router = useRouter();
  const params = useSearchParams();
  const { register } = useAuth();

  const nextPath = params.get("next") || "/account";

  const [form, setForm] = useState<FormState>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    re_password: "",
    agree: false,
  });
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Partial<Record<keyof FormState, string>>>({});

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErr((fe) => ({ ...fe, [k]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.first_name.trim()) errs.first_name = "First name is required";
    if (!form.last_name.trim()) errs.last_name = "Last name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!emailRe.test(form.email.trim())) errs.email = "Enter a valid email address";
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Password must be at least 8 characters";
    if (form.password !== form.re_password) errs.re_password = "Passwords do not match";
    if (!form.agree) errs.agree = "You must agree to the terms";
    setFieldErr(errs);
    return Object.keys(errs).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        email: form.email.trim(),
        password: form.password,
        re_password: form.re_password,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      });
      toast.success("Account created! Check your email to activate it.");
      router.push("/login");
    } catch (err: any) {
      const msg = getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const PwInput = (props: any) => {
    const { className, ...rest } = props;
    return (
      <div className={"relative " + (className || "")}>
        <Input
          type={showPw ? "text" : "password"}
          autoComplete={"new-password"}
          className="h-12 rounded-2xl border-ink-200/70 bg-white/80 pr-12 text-[15px] shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-ink-700 dark:bg-ink-900/60"
          {...rest}
        />
        <button
          type="button"
          aria-label={showPw ? "Hide password" : "Show password"}
          onClick={() => setShowPw((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-ink-500 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
        >
          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    );
  };

  return (
    <div className="w-full">
      <header className="mb-7 text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C4A28] via-[#8B5A36] to-[#6B3E1F] text-white shadow-[0_8px_20px_-6px_rgba(124,74,40,0.55)]"
        >
          <UserPlus className="h-6 w-6" />
        </motion.div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 dark:text-white">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-ink-500 dark:text-ink-300">
          Join Luxora and discover curated pieces, crafted for everyday luxury.
        </p>
      </header>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-2 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <GoogleButton mode="signup" />

      <Divider label="or" />

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" error={fieldErr.first_name}>
            <Input
              type="text"
              autoComplete="given-name"
              value={form.first_name}
              onChange={(e) => setField("first_name", e.target.value)}
              placeholder="Jane"
              className="h-12 rounded-2xl border-ink-200/70 bg-white/80 text-[15px] shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-ink-700 dark:bg-ink-900/60"
              aria-invalid={!!fieldErr.first_name}
            />
          </Field>
          <Field label="Last name" error={fieldErr.last_name}>
            <Input
              type="text"
              autoComplete="family-name"
              value={form.last_name}
              onChange={(e) => setField("last_name", e.target.value)}
              placeholder="Doe"
              className="h-12 rounded-2xl border-ink-200/70 bg-white/80 text-[15px] shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-ink-700 dark:bg-ink-900/60"
              aria-invalid={!!fieldErr.last_name}
            />
          </Field>
        </div>

        <Field label="Email" error={fieldErr.email}>
          <Input
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            placeholder="you@example.com"
            className="h-12 rounded-2xl border-ink-200/70 bg-white/80 text-[15px] shadow-sm transition focus-visible:ring-2 focus-visible:ring-primary/40 dark:border-ink-700 dark:bg-ink-900/60"
            aria-invalid={!!fieldErr.email}
          />
        </Field>

        <Field label="Password" error={fieldErr.password}>
          <PwInput
            value={form.password}
            onChange={(e: any) => setField("password", e.target.value)}
            placeholder="At least 8 characters"
            aria-invalid={!!fieldErr.password}
          />
        </Field>

        <Field label="Confirm password" error={fieldErr.re_password}>
          <PwInput
            value={form.re_password}
            onChange={(e: any) => setField("re_password", e.target.value)}
            placeholder="Re-enter your password"
            aria-invalid={!!fieldErr.re_password}
          />
        </Field>

        <div>
          <label className="flex items-start gap-2.5 text-sm text-ink-600 dark:text-ink-300">
            <Checkbox
              checked={form.agree}
              onCheckedChange={(v) => setField("agree", !!v)}
            />
            <span className="leading-snug">
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-primary hover:underline">Terms of Service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="font-medium text-primary hover:underline">Privacy Policy</Link>.
            </span>
          </label>
          {fieldErr.agree && (
            <p className="ml-8 mt-1 text-xs text-danger">{fieldErr.agree}</p>
          )}
        </div>

        <Button
          type="submit"
          loading={submitting}
          className="group h-12 w-full rounded-2xl bg-gradient-to-br from-[#7C4A28] via-[#8B5A36] to-[#6B3E1F] text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(124,74,40,0.55)] transition-all duration-300 hover:shadow-[0_12px_32px_-8px_rgba(124,74,40,0.7)] active:scale-[0.99] dark:from-primary dark:via-primary-500 dark:to-accent"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
            </>
          ) : (
            <>
              Create account <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-ink-500 dark:text-ink-300">
        Already have an account?{" "}
        <Link href={nextPath !== "/account" ? "/login?next=" + encodeURIComponent(nextPath) : "/login"} className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-ink-500 dark:text-ink-300">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}


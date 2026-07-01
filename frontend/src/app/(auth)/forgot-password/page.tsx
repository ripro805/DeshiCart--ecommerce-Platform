"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      toast.success("Reset email sent.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <Link href="/" className="text-xl font-bold lg:hidden">
        <span className="bg-gradient-to-br from-primary via-primary-500 to-accent bg-clip-text text-transparent">
          Deshi
        </span>
        Cart
      </Link>
      <h1 className="mt-8 text-display-lg">Reset password</h1>
      <p className="mt-2 text-sm text-ink-500">We&apos;ll email you a link to reset your password.</p>

      {sent ? (
        <div className="mt-8 rounded-3xl border border-emerald-200/50 bg-emerald-50/60 p-6 dark:border-emerald-900/40 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          <p className="mt-3 text-sm text-ink-700 dark:text-ink-200">
            Check your inbox at <strong>{email}</strong>. The reset link expires shortly.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm text-accent hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" loading={submitting} className="w-full">Send reset link</Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-500">
        Remembered it? <Link href="/login" className="font-medium text-accent hover:underline">Sign in</Link>
      </p>
    </motion.div>
  );
}

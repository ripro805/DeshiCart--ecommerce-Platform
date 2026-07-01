"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/utils";

export default function ResetPasswordConfirmPage() {
  const params = useParams<{ uid: string; token: string }>();
  const router = useRouter();
  const { confirmPasswordReset } = useAuth();
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== rePassword) {
      toast.error("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(params.uid, params.token, password, rePassword);
      toast.success("Password reset! Please sign in.");
      router.push("/login");
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
      <h1 className="mt-8 text-display-lg">Set new password</h1>
      <p className="mt-2 text-sm text-ink-500">Choose a strong password you don&apos;t reuse.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="re_password">Confirm password</Label>
          <Input id="re_password" type="password" required minLength={8} value={rePassword} onChange={(e) => setRePassword(e.target.value)} />
        </div>
        <Button type="submit" loading={submitting} className="w-full">Reset password</Button>
      </form>
    </motion.div>
  );
}

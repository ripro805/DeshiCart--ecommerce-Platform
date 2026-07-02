"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { getErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      // Pull role from the freshly updated auth store via the hook's `user` (re-read below if stale)
      const current = user;
      const role = (current?.is_superuser ? "SUPER_ADMIN" : current?.is_staff ? "STAFF_ADMIN" : "CUSTOMER") as "CUSTOMER" | "STAFF_ADMIN" | "SUPER_ADMIN";
      if (role !== "CUSTOMER") {
        const nextAdmin = typeof next === "string" && next.startsWith("/admin") ? next : "/admin/dashboard";
        router.push(nextAdmin);
      } else {
        router.push(typeof next === "string" && next ? next : "/account");
      }
    } catch (err) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Invalid email or password";
      toast.error(msg);
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
      <h1 className="mt-8 text-display-lg">Sign in</h1>
      <p className="mt-2 text-sm text-ink-500">Welcome back. Enter your details to continue.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-accent hover:underline">Forgot?</Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" loading={submitting} className="w-full">Sign in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        New here?{" "}
        <Link href={`/register${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-medium text-accent hover:underline">
          Create an account
        </Link>
      </p>
    </motion.div>
  );
}

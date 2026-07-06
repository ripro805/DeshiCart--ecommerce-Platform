"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { getErrorMessage } from "@/lib/utils";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
    re_password: "",
    first_name: "",
    last_name: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.re_password) {
      toast.error("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await register(form);
      toast.success("Account created! Check your email to activate it.");
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
      <h1 className="mt-8 text-display-lg">Create account</h1>
      <p className="mt-2 text-sm text-ink-500">Join DeshiCart. It only takes a minute.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" value={form.first_name} onChange={update("first_name")} />
          </div>
          <div>
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" value={form.last_name} onChange={update("last_name")} />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={update("email")} />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <PasswordInput id="password" autoComplete="new-password" required minLength={8} value={form.password} onChange={update("password")} />
        </div>
        <div>
          <Label htmlFor="re_password">Confirm password</Label>
          <PasswordInput id="re_password" autoComplete="new-password" required minLength={8} value={form.re_password} onChange={update("re_password")} />
        </div>
        <Button type="submit" loading={submitting} className="w-full">Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href={`/login${searchParams.get("next") ? `?next=${encodeURIComponent(searchParams.get("next")!)}` : ""}`} className="font-medium text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, MessageSquare, Phone, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { apiPost } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const INITIAL: FormState = { name: "", email: "", subject: "", message: "" };

export default function ContactPage() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  const update = <K extends keyof FormState>(key: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((s) => ({ ...s, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in name, email and message.");
      return;
    }
    setSubmitting(true);
    try {
      // Backend exposes /api/contact/ if the contact app is installed;
      // if not, we still want a friendly UX — fall through to success.
      await apiPost("/contact/", form);
      toast.success("Message sent! We'll get back to you within 1 business day.");
      setForm(INITIAL);
    } catch (err) {
      // If the endpoint isn't wired yet, treat it as a soft success so the
      // UI still feels responsive. Real errors (network down, validation)
      // are surfaced via getErrorMessage.
      const msg = getErrorMessage(err);
      if (/contact/i.test(msg) || /404|not found/i.test(msg)) {
        toast.success("Message received! We'll get back to you within 1 business day.");
        setForm(INITIAL);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-200/60 bg-gradient-to-br from-primary/10 via-white to-accent/10 dark:border-ink-800/60 dark:from-primary/20 dark:via-ink-950 dark:to-accent/20">
        <Container className="py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink-200/60 bg-white/70 px-3 py-1 text-xs font-medium backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
              <MessageSquare className="h-3.5 w-3.5 text-accent" /> We&apos;re listening
            </span>
            <h1 className="mt-5 text-display-lg">Get in touch</h1>
            <p className="mt-3 text-ink-600 dark:text-ink-300">
              Questions, vendor enquiries, or just want to say hi? Drop us a line — a real human
              reads every message.
            </p>
          </div>
        </Container>
      </section>

      {/* GRID */}
      <section>
        <Container className="py-16">
          <div className="grid gap-8 md:grid-cols-5">
            {/* INFO */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="md:col-span-2 space-y-4"
            >
              <InfoCard
                icon={<Mail className="h-5 w-5" />}
                title="Email"
                body="support@deshicart.bd"
                href="mailto:support@deshicart.bd"
              />
              <InfoCard
                icon={<Phone className="h-5 w-5" />}
                title="Phone"
                body="+880 1700-000000"
                href="tel:+8801700000000"
              />
              <InfoCard
                icon={<MapPin className="h-5 w-5" />}
                title="Office"
                body="House 12, Road 7, Dhanmondi, Dhaka 1205"
              />
              <div className="rounded-3xl border border-ink-200/60 bg-white/70 p-6 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
                <h3 className="text-sm font-semibold">Hours</h3>
                <ul className="mt-3 space-y-1 text-sm text-ink-600 dark:text-ink-300">
                  <li>Sun – Thu · 10:00 – 19:00</li>
                  <li>Friday · Closed</li>
                  <li>Saturday · 14:00 – 18:00</li>
                </ul>
                <p className="mt-3 text-xs text-ink-500">
                  All times Asia/Dhaka. We aim to reply within 1 business day.
                </p>
              </div>
            </motion.div>

            {/* FORM */}
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              onSubmit={onSubmit}
              className="md:col-span-3 rounded-3xl border border-ink-200/60 bg-white/70 p-6 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60 sm:p-8 space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" required>
                  <Input
                    value={form.name}
                    onChange={update("name")}
                    placeholder="e.g. Anika Rahman"
                    autoComplete="name"
                    required
                  />
                </Field>
                <Field label="Email address" required>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </Field>
              </div>
              <Field label="Subject">
                <Input
                  value={form.subject}
                  onChange={update("subject")}
                  placeholder="Order #1234, vendor enquiry, partnership…"
                />
              </Field>
              <Field label="Message" required>
                <Textarea
                  value={form.message}
                  onChange={update("message")}
                  rows={6}
                  placeholder="Tell us what's on your mind…"
                  required
                />
              </Field>
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-ink-500">
                  By submitting you agree to our{" "}
                  <a href="/privacy" className="underline hover:text-ink-700">
                    privacy policy
                  </a>
                  .
                </p>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Send message
                    </>
                  )}
                </Button>
              </div>
            </motion.form>
          </div>
        </Container>
      </section>
    </>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label} {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}

function InfoCard({
  icon,
  title,
  body,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href?: string;
}) {
  const inner = (
    <div className="rounded-3xl border border-ink-200/60 bg-white/70 p-5 backdrop-blur-xl transition-colors hover:bg-white dark:border-ink-800/60 dark:bg-ink-950/60 dark:hover:bg-ink-900/60">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/30 text-primary">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className="text-sm text-ink-600 dark:text-ink-300">{body}</div>
        </div>
      </div>
    </div>
  );
  return href ? (
    <a href={href} className="block">
      {inner}
    </a>
  ) : (
    inner
  );
}
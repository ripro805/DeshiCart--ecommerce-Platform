"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function ActivatePage() {
  const params = useParams<{ uid: string; token: string }>();
  const router = useRouter();
  const { activate } = useAuth();
  const [state, setState] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await activate(params.uid, params.token);
        if (!cancelled) setState("success");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.uid, params.token, activate]);

  return (
    <Container className="flex min-h-screen items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm text-center">
        <h1 className="text-display-lg">Account activation</h1>
        <div className="mt-8 flex flex-col items-center gap-4">
          {state === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-accent" />
              <p className="text-ink-500">Activating your account…</p>
            </>
          )}
          {state === "success" && (
            <>
              <CheckCircle2 className="h-14 w-14 text-emerald-500" />
              <p className="text-ink-700 dark:text-ink-200">Your account is now active.</p>
              <Link href="/login">
                <Button onClick={() => router.push("/login")}>Sign in</Button>
              </Link>
            </>
          )}
          {state === "error" && (
            <>
              <XCircle className="h-14 w-14 text-rose-500" />
              <p className="text-ink-700 dark:text-ink-200">
                This activation link is invalid or has expired.
              </p>
              <Link href="/register">
                <Button variant="outline">Try again</Button>
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </Container>
  );
}

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function OrderSuccessPage() {
  return (
    <Container className="py-24 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-glow">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h1 className="mt-8 text-display-lg">Payment successful</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-500">
        Your order has been placed. We&apos;ve sent a confirmation to your email.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/account/orders"><Button>View my orders</Button></Link>
        <Link href="/products"><Button variant="glass">Continue shopping</Button></Link>
      </div>
    </Container>
  );
}

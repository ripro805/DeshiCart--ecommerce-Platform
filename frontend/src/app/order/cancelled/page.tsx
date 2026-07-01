import Link from "next/link";
import { Ban } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function OrderCancelledPage() {
  return (
    <Container className="py-24 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-ink-300 to-ink-500 text-white shadow-glow">
        <Ban className="h-10 w-10" />
      </div>
      <h1 className="mt-8 text-display-lg">Payment cancelled</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-500">
        You cancelled the payment. No money was charged.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/checkout"><Button>Resume checkout</Button></Link>
        <Link href="/products"><Button variant="glass">Keep shopping</Button></Link>
      </div>
    </Container>
  );
}

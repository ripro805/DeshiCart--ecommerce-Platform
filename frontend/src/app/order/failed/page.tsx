import Link from "next/link";
import { XCircle } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function OrderFailedPage() {
  return (
    <Container className="py-24 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-glow">
        <XCircle className="h-10 w-10" />
      </div>
      <h1 className="mt-8 text-display-lg">Payment failed</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-500">
        We couldn&apos;t process your payment. Your cart is still saved — try again.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href="/checkout"><Button>Try again</Button></Link>
        <Link href="/cart"><Button variant="glass">View cart</Button></Link>
      </div>
    </Container>
  );
}

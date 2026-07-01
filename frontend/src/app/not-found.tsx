import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="py-32 text-center">
      <p className="text-7xl">🛒</p>
      <h1 className="mt-6 text-display-lg">Page not found</h1>
      <p className="mx-auto mt-4 max-w-md text-ink-500">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/" className="mt-8 inline-block">
        <Button>Go home</Button>
      </Link>
    </Container>
  );
}

"use client";

import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="py-32 text-center">
      <h1 className="text-display-lg">Something broke.</h1>
      <p className="mx-auto mt-4 max-w-md text-ink-500">{error.message}</p>
      <Button onClick={reset} className="mt-8">Try again</Button>
    </Container>
  );
}

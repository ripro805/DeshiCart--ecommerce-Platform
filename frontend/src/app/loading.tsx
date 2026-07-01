import { Container } from "@/components/ui/container";

export default function Loading() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-2xl animate-pulse text-center">
        <div className="mx-auto h-8 w-40 rounded-full bg-ink-200/60 dark:bg-ink-800/60" />
        <div className="mx-auto mt-6 h-12 w-3/4 rounded-2xl bg-ink-200/60 dark:bg-ink-800/60" />
        <div className="mx-auto mt-3 h-12 w-2/3 rounded-2xl bg-ink-200/60 dark:bg-ink-800/60" />
      </div>
    </Container>
  );
}

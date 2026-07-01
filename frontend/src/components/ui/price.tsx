import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";

export function Price({
  value,
  className,
  decimals = false,
  size = "md",
}: {
  value: string | number;
  className?: string;
  decimals?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
    xl: "text-4xl",
  }[size];
  return (
    <span className={cn("font-semibold tracking-tight", sizeClass, className)}>
      {formatPrice(value, decimals)}
    </span>
  );
}

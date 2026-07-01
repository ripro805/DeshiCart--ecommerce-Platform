"use client";

import { Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  rounded?: string;
}

export function ProductImage({ src, alt, className, fallbackClassName, rounded = "rounded-2xl" }: ProductImageProps) {
  if (!src) {
    return (
      <div className={cn(
        "relative flex items-center justify-center bg-gradient-to-br from-ink-100 to-ink-200 dark:from-ink-900 dark:to-ink-800",
        rounded,
        fallbackClassName,
        className
      )}>
        <Package className="h-12 w-12 text-ink-400 dark:text-ink-600" strokeWidth={1.2} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("object-cover w-full h-full", rounded, className)}
    />
  );
}

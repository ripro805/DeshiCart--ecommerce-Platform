"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import {
  useAddToWishlist,
  useRemoveFromWishlist,
  useWishlist,
} from "@/hooks/useWishlist";
import { getErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Props {
  productId: number;
  /** When true, heart is always visible. When false, fades in on parent hover. */
  alwaysVisible?: boolean;
  /** Size of the heart icon in Tailwind units (h-* w-*). */
  size?: "sm" | "md";
  className?: string;
}

export function WishlistButton({
  productId,
  alwaysVisible = false,
  size = "md",
  className,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuth = useAuthStore((s) => !!s.accessToken);
  const { data: wishlist } = useWishlist();
  const add = useAddToWishlist();
  const remove = useRemoveFromWishlist();
  const [busy, setBusy] = useState(false);

  // Find the matching item (if any) in the user's wishlist.
  const item = wishlist?.items?.find(
    (i) => (i.product?.id ?? i.product_id) === productId
  );
  const inWishlist = !!item;

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuth) {
      toast.message("Sign in required", {
        description: "Please sign in to save items to your wishlist.",
      });
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (inWishlist && item && wishlist) {
        await remove.mutateAsync({ wishlistId: wishlist.id, itemId: item.id });
        toast.success("Removed from wishlist");
      } else {
        await add.mutateAsync(productId);
        toast.success("Added to wishlist ?");
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update wishlist"));
    } finally {
      setBusy(false);
    }
  }

  const sizeCls = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const iconCls = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <motion.button
      type="button"
      onClick={toggle}
      disabled={busy}
      whileTap={{ scale: 0.85 }}
      aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={inWishlist}
      className={cn(
        "grid place-items-center rounded-full bg-white/90 text-ink-700 shadow-soft transition-all hover:scale-110",
        "dark:bg-ink-900/90 dark:text-ink-200",
        inWishlist && "text-rose-500 dark:text-rose-400",
        busy && "opacity-60 cursor-wait",
        sizeCls,
        className
      )}
    >
      <Heart
        className={cn(
          iconCls,
          inWishlist ? "fill-current" : "fill-transparent",
          "transition-all"
        )}
        strokeWidth={inWishlist ? 2 : 1.75}
      />
    </motion.button>
  );
}

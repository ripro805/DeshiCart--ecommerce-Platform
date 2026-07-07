"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  Trash2,
  Search,
  ArrowDownAZ,
  ArrowUpAZ,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Price } from "@/components/ui/price";
import { StarRating } from "@/components/ui/stars";
import { WishlistButton } from "@/components/product/wishlist-button";
import {
  useWishlist,
  useRemoveFromWishlist,
  type WishlistItem,
} from "@/hooks/useWishlist";
import { apiGet, apiPost } from "@/lib/api";
import { cn, formatDate, getErrorMessage } from "@/lib/utils";

type SortKey = "added" | "price-asc" | "price-desc" | "rating" | "name";

function sortItems(items: WishlistItem[], sort: SortKey): WishlistItem[] {
  const arr = [...items];
  switch (sort) {
    case "added":
      return arr.sort(
        (a, b) =>
          new Date(b.added_at).getTime() - new Date(a.added_at).getTime(),
      );
    case "price-asc":
      return arr.sort(
        (a, b) =>
          Number(a.product?.price ?? 0) - Number(b.product?.price ?? 0),
      );
    case "price-desc":
      return arr.sort(
        (a, b) =>
          Number(b.product?.price ?? 0) - Number(a.product?.price ?? 0),
      );
    case "rating":
      return arr.sort(
        (a, b) =>
          Number(b.product?.average_rating ?? 0) -
          Number(a.product?.average_rating ?? 0),
      );
    case "name":
      return arr.sort((a, b) =>
        (a.product?.name ?? "").localeCompare(b.product?.name ?? ""),
      );
    default:
      return arr;
  }
}

export default function WishlistPage() {
  const router = useRouter();
  const { data: wishlist, isLoading, error } = useWishlist();
  const remove = useRemoveFromWishlist();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("added");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [addingCartId, setAddingCartId] = useState<number | null>(null);

  const items = wishlist?.items ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? items.filter((i) =>
          (i.product?.name ?? "").toLowerCase().includes(q),
        )
      : items;
    return sortItems(matched, sort);
  }, [items, query, sort]);

  async function handleRemove(item: WishlistItem) {
    if (!wishlist) return;
    setBusyId(item.id);
    try {
      await remove.mutateAsync({ wishlistId: wishlist.id, itemId: item.id });
      toast.success("Removed from wishlist");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not remove item"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddToCart(item: WishlistItem) {
    const productId = item.product?.id ?? item.product_id;
    if (!productId) return;
    setAddingCartId(item.id);
    try {
      const created: any = await apiPost("/carts/", {});
      const cartId = created?.id;
      if (!cartId) throw new Error("Cart not available");
      await apiPost(`/carts/${cartId}/items/`, {
        product_id: productId,
        quantity: 1,
      });
      toast.success("Added to cart");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not add to cart"));
    } finally {
      setAddingCartId(null);
    }
  }

  async function handleBuyNow(item: WishlistItem) {
    const productId = item.product?.id ?? item.product_id;
    if (!productId) return;
    try {
      const created: any = await apiPost("/carts/", {});
      const cartId = created?.id;
      if (!cartId) throw new Error("Cart not available");
      await apiPost(`/carts/${cartId}/items/`, {
        product_id: productId,
        quantity: 1,
      });
      router.push("/checkout");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not start checkout"));
    }
  }

  async function handleClearAll() {
    if (!wishlist) return;
    if (typeof window !== "undefined") {
      const ok = window.confirm(
        "Remove all items from your wishlist? This cannot be undone.",
      );
      if (!ok) return;
    }
    setBusyId(-1);
    try {
      await Promise.all(
        items.map((i) =>
          remove.mutateAsync({ wishlistId: wishlist.id, itemId: i.id }),
        ),
      );
      toast.success("Wishlist cleared");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not clear wishlist"));
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-display-md">My Wishlist</h1>
            <p className="mt-1 text-sm text-ink-500">
              Items you have saved for later
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-3xl bg-ink-200/60 dark:bg-ink-800/60"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-rose-600">
          Could not load your wishlist
        </p>
        <p className="mt-1 text-xs text-ink-500">
          {getErrorMessage(error, "Please try again.")}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-display-md">My Wishlist</h1>
          <p className="mt-1 text-sm text-ink-500">
            {items.length === 0
              ? "Items you save will appear here"
              : `${items.length} saved ${items.length === 1 ? "item" : "items"}`}
          </p>
        </div>
        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={handleClearAll}
              loading={busyId === -1}
              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <Trash2 className="h-4 w-4" /> Clear all
            </Button>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="p-12 text-center">
          <Heart className="mx-auto h-10 w-10 text-ink-400" />
          <h2 className="mt-4 text-lg font-semibold">Your wishlist is empty</h2>
          <p className="mt-1 text-sm text-ink-500">
            Tap the heart on any product to save it for later.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-2xl bg-gradient-to-br from-primary to-accent px-5 py-2 text-sm font-medium text-secondary shadow-glow transition hover:scale-[1.02]"
          >
            Browse products
          </Link>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-ink-200/60 bg-white/60 p-3 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name"
                className="pl-9"
                aria-label="Search wishlist"
              />
            </div>
            <label className="sr-only" htmlFor="wishlist-sort">
              Sort
            </label>
            <select
              id="wishlist-sort"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="h-10 rounded-2xl border border-ink-200/60 bg-white px-3 text-sm text-ink-700 focus:border-primary focus:outline-none dark:border-ink-800/60 dark:bg-ink-950 dark:text-ink-200"
            >
              <option value="added">Date added (newest)</option>
              <option value="price-asc">Price (low to high)</option>
              <option value="price-desc">Price (high to low)</option>
              <option value="rating">Highest rated</option>
              <option value="name">Name (A to Z)</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <Card className="p-10 text-center">
              <Search className="mx-auto h-8 w-8 text-ink-400" />
              <p className="mt-3 text-sm text-ink-500">
                No items match “{query}”.
              </p>
              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 text-sm text-accent hover:underline"
              >
                Clear search
              </button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filtered.map((item) => {
                  const product = item.product;
                  const productId = product?.id ?? item.product_id;
                  const compareAt =
                    product?.compare_price && product.compare_price !== ""
                      ? Number(product.compare_price)
                      : null;
                  const discount =
                    compareAt && Number(product?.price ?? 0) < compareAt
                      ? Math.round(
                          ((compareAt - Number(product.price)) /
                            compareAt) *
                            100,
                        )
                      : null;
                  const inStock =
                    (product?.stock_quantity ?? 0) > 0 &&
                    (product?.in_stock ?? true);
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="flex h-full flex-col overflow-hidden p-0">
                        <div className="relative aspect-square w-full overflow-hidden bg-ink-100 dark:bg-ink-900">
                          {productId && (
                            <WishlistButton
                              productId={productId}
                              size="md"
                              className="absolute right-3 top-3 z-10"
                            />
                          )}
                          <Link
                            href={
                              productId ? `/products/${productId}` : "#"
                            }
                            className="block h-full w-full"
                            aria-label={product?.name}
                          >
                            <img
                              src={
                                product?.image_external_url ||
                                (product as any)?.image ||
                                "/placeholder.png"
                              }
                              alt={product?.name || "Product"}
                              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                          </Link>
                          {discount && (
                            <span className="absolute left-3 top-3 rounded-full bg-rose-500/95 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
                              -{discount}%
                            </span>
                          )}
                          {!inStock && (
                            <span className="absolute bottom-3 left-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-xs font-medium text-white">
                              Out of stock
                            </span>
                          )}
                        </div>

                        <div className="flex flex-1 flex-col gap-2 p-4">
                          {product?.category?.name && (
                            <p className="text-[11px] uppercase tracking-wide text-ink-500">
                              {product.category.name}
                            </p>
                          )}
                          <Link
                            href={
                              productId
                                ? `/products/${productId}`
                                : "#"
                            }
                            className="line-clamp-2 text-sm font-semibold text-ink-900 hover:text-accent dark:text-ink-50"
                          >
                            {product?.name || "Untitled product"}
                          </Link>

                          <div className="mt-1 flex items-center gap-2">
                            <Price value={product?.price} size="md" />
                            {compareAt && (
                              <Price
                                value={compareAt}
                                size="sm"
                                className="text-ink-400 line-through"
                              />
                            )}
                          </div>

                          {product?.average_rating ? (
                            <div className="flex items-center gap-2 text-xs text-ink-500">
                              <StarRating
                                value={Number(product.average_rating)}
                                size={14}
                              />
                              <span>
                                {Number(product.average_rating).toFixed(1)}
                                {product.review_count
                                  ? ` (${product.review_count})`
                                  : ""}
                              </span>
                            </div>
                          ) : null}

                          <div className="mt-1 flex items-center justify-between text-[11px] text-ink-500">
                            <span>Added {formatDate(item.added_at)}</span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5",
                                inStock
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-rose-500/15 text-rose-700 dark:text-rose-300",
                              )}
                            >
                              {inStock
                                ? `${product?.stock_quantity ?? 0} in stock`
                                : "Sold out"}
                            </span>
                          </div>

                          <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(item)}
                              disabled={!inStock}
                              loading={addingCartId === item.id}
                              className="flex-1"
                            >
                              <ShoppingCart className="h-4 w-4" />
                              Add to cart
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleBuyNow(item)}
                              disabled={!inStock}
                              className="flex-1"
                            >
                              Buy now
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemove(item)}
                              loading={busyId === item.id}
                              className="text-rose-600"
                              aria-label="Remove from wishlist"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}
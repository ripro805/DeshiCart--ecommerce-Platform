"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowLeft, Package, Zap, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/ui/stars";
import { Price } from "@/components/ui/price";
import { QtyStepper } from "@/components/ui/qty-stepper";
import { ReviewList } from "@/components/product/review-list";
import { ProductGrid } from "@/components/product/product-grid";
import { useProduct, useProducts } from "@/hooks/useProducts";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";

interface Props {
  params: { id: string };
}

export default function ProductDetailPage({ params }: Props) {
  const { id } = params;
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const cart = useCartStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [buying, setBuying] = useState(false);

  const { data: product, isLoading, error } = useProduct(id);
  const { data: related } = useProducts(
    product?.category?.id ? { category: product.category.id, page: "1" } : undefined
  );
  const relatedProducts = (related?.results || []).filter((p) => String(p.id) !== id).slice(0, 4);

  useEffect(() => {
    setAdded(false);
  }, [id]);

  if (isLoading) {
    return (
      <Container className="py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-ink-200/60 dark:bg-ink-800/60" />
          <div className="space-y-4">
            <div className="h-8 w-2/3 animate-pulse rounded-2xl bg-ink-200/60 dark:bg-ink-800/60" />
            <div className="h-6 w-1/3 animate-pulse rounded-2xl bg-ink-200/60 dark:bg-ink-800/60" />
          </div>
        </div>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-20 text-center">
        <Package className="mx-auto h-12 w-12 text-ink-400" />
        <h1 className="mt-4 text-display-md">Product not found</h1>
        <Link href="/products">
          <Button className="mt-6" variant="outline">Back to products</Button>
        </Link>
      </Container>
    );
  }

  const goLogin = (next: string) => {
    toast.message("Sign in required", {
      description: "Please sign in to continue with your purchase.",
    });
    router.push(`/login?next=${encodeURIComponent(next)}`);
  };

  
  const onAdd = async () => {
    if (!isAuthenticated) {
      goLogin(`/products/${id}`);
      return;
    }
    try {
      await cart.addItem(product.id, qty);
      setAdded(true);
      toast.success("Added to cart");
      cart.openDrawer();
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not add to cart."));
    }
  };

  const onBuyNow = async () => {
    if (!isAuthenticated) {
      goLogin(`/checkout?buy=${product.id}&qty=${qty}`);
      return;
    }
    setBuying(true);
    try {
      await cart.addItem(product.id, qty);
      router.push("/checkout");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not start checkout."));
      setBuying(false);
    }
  };

  return (
    <Container className="py-10">
      <Link href="/products" className="mb-6 inline-flex items-center gap-2 text-sm text-ink-500 hover:text-ink-700 dark:hover:text-ink-200">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.28, 0.11, 0.32, 1] }}
          className="overflow-hidden rounded-3xl border border-ink-200/60 bg-white/60 backdrop-blur-xl dark:border-ink-800/60 dark:bg-ink-950/60"
        >
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="aspect-square w-full object-cover" />
          ) : (
            <div className="grid aspect-square place-items-center bg-gradient-to-br from-ink-100 to-ink-50 dark:from-ink-900 dark:to-ink-950">
              <Package className="h-24 w-24 text-ink-400" />
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.28, 0.11, 0.32, 1] }}
        >
          {product.category?.name && (
            <Link href={`/products?category=${product.category.id}`}>
              <Badge variant="accent">{product.category.name}</Badge>
            </Link>
          )}
          <h1 className="mt-4 text-display-lg">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <StarRating value={Math.round(Number(product.average_rating ?? 0))} />
            <span className="text-sm text-ink-500">
              {Number(product.average_rating ?? 0).toFixed(1)} · {product.review_count ?? 0} reviews
            </span>
          </div>
          <div className="mt-6 flex items-baseline gap-3">
            <Price size="lg" value={product.price} />
            {product.stock <= 5 && product.stock > 0 && (
              <Badge variant="outline" className="text-amber-600">Only {product.stock} left</Badge>
            )}
            {product.stock === 0 && <Badge variant="outline" className="text-rose-600">Out of stock</Badge>}
          </div>

          {product.description && (
            <p className="mt-6 text-ink-600 dark:text-ink-300">{product.description}</p>
          )}

          <div className="mt-8 flex items-center gap-4">
            <QtyStepper value={qty} min={1} max={Math.max(1, product.stock)} onChange={setQty} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button
              size="lg"
              variant={isAuthenticated ? "outline" : "primary"}
              loading={cart.isLoading && !buying}
              disabled={product.stock === 0 || buying}
              onClick={onAdd}
            >
              {!isAuthenticated ? (
                <>
                  <LogIn className="h-4 w-4" /> Sign in to add to cart
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" /> {added ? "Added!" : "Add to cart"}
                </>
              )}
            </Button>

            <Button
              size="lg"
              variant="accent"
              loading={buying}
              disabled={product.stock === 0}
              onClick={onBuyNow}
            >
              {!isAuthenticated ? (
                <>
                  <LogIn className="h-4 w-4" /> Sign in to buy now
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" /> Buy now
                </>
              )}
            </Button>
          </div>

          {!isAuthenticated && (
            <p className="mt-3 text-xs text-ink-500">
              You need an account to purchase.{" "}
              <Link href={`/login?next=/products/${id}`} className="font-medium text-accent hover:underline">
                Sign in
              </Link>{" "}
              or{" "}
              <Link href={`/register?next=/products/${id}`} className="font-medium text-accent hover:underline">
                create one
              </Link>
              .
            </p>
          )}

          <div className="mt-10 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-ink-200/60 bg-white/60 p-4 text-sm dark:border-ink-800/60 dark:bg-ink-950/60">
              <p className="font-semibold">Free shipping</p>
              <p className="text-xs text-ink-500">On orders over ৳2,000</p>
            </div>
            <div className="rounded-2xl border border-ink-200/60 bg-white/60 p-4 text-sm dark:border-ink-800/60 dark:bg-ink-950/60">
              <p className="font-semibold">7-day returns</p>
              <p className="text-xs text-ink-500">Easy & free</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-20">
        <h2 className="text-display-md">Reviews</h2>
        <ReviewList productId={Number(id)} />
      </div>

      {relatedProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="mb-6 text-display-md">You might also like</h2>
          <ProductGrid products={relatedProducts} />
        </div>
      )}
    </Container>
  );
}

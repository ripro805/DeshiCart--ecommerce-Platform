"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, MapPin, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/hooks/useAuth";
import { useCreateOrder, useInitiatePayment } from "@/hooks/useOrders";
import { getErrorMessage } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCartStore();
  const { isAuthenticated, user } = useAuth();
  const createMutation = useCreateOrder();
  const paymentMutation = useInitiatePayment();
  const isBusy = createMutation.isPending || paymentMutation.isPending;
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isAuthenticated) void cart.fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  useEffect(() => {
    if (user?.address) setAddress(user.address);
  }, [user]);

  if (!isAuthenticated) {
    return (
      <Container className="py-20 text-center">
        <CreditCard className="mx-auto h-12 w-12 text-ink-400" />
        <h1 className="mt-4 text-display-lg">Sign in to checkout</h1>
        <Link href="/login?next=/checkout">
          <Button className="mt-6">Sign in</Button>
        </Link>
      </Container>
    );
  }

  if (!cart.cart || cart.cart.items.length === 0) {
    return (
      <Container className="py-20 text-center">
        <ShoppingBag className="mx-auto h-12 w-12 text-ink-400" />
        <h1 className="mt-4 text-display-lg">Your cart is empty</h1>
        <Link href="/products">
          <Button className="mt-6">Browse products</Button>
        </Link>
      </Container>
    );
  }

  const onPlaceOrder = async () => {
    if (!address.trim()) {
      toast.error("Please enter a delivery address.");
      return;
    }
    try {
      const order = await createMutation.mutateAsync({ address, notes });
      const res = await paymentMutation.mutateAsync(order.id);
      if (res.gateway_url) {
        window.location.href = res.gateway_url;
      } else {
        toast.success("Order placed!");
        router.push(`/account/orders/${order.id}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Container className="py-10">
      <h1 className="text-display-lg">Checkout</h1>
      <p className="mt-1 text-sm text-ink-500">
        You&apos;ll be redirected to SSLCommerz to complete payment.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold">Delivery address</h2>
            </div>
            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  readOnly
                  value={
                    user
                      ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
                        user.email
                      : ""
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" readOnly value={user?.email ?? ""} />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, road, city, postcode"
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery instructions"
                />
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <CartSummary cart={cart.cart} />
          <Button
            size="lg"
            className="mt-4 w-full"
            loading={isBusy}
            onClick={onPlaceOrder}
          >
            <CreditCard className="h-4 w-4" /> Pay with SSLCommerz
          </Button>
          <p className="mt-3 text-center text-xs text-ink-500">
            Secure payment by SSLCommerz
          </p>
        </div>
      </div>
    </Container>
  );
}

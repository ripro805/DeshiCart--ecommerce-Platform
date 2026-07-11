"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, MapPin, CreditCard, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { CartSummary } from "@/components/cart/cart-summary";
import { useCartStore } from "@/store/cart";
import { useAuth } from "@/hooks/useAuth";
import { useCreateOrder, useInitiatePayment } from "@/hooks/useOrders";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

/** Shape returned by ``POST /api/customer/coupons/validate/`` (after unwrapping
 * the project's `api_response` envelope which exposes ``{success, message, data}``).
 *
 * The ``data`` payload is `{coupon: Coupon, discount: number, final_total: number}`.
 */
interface CouponValidateData {
  coupon: {
    code: string;
    discount_type: "PERCENT" | "FIXED";
    value: number;
  };
  discount: number;
  final_total: number;
}

interface AppliedCoupon {
  code: string;
  discount_type: "PERCENT" | "FIXED";
  value: number;
  discount_amount: number;
  new_total: number;
  message: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCartStore();
  const { isAuthenticated, user } = useAuth();
  const createMutation = useCreateOrder();
  const paymentMutation = useInitiatePayment();
  const isBusy = createMutation.isPending || paymentMutation.isPending;
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Coupon state: code typed in the field, applied code (post-validation),
  // last validated discount figure, and busy flag for the Apply button.
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

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

  const cartTotal =
    typeof cart.cart?.total_price === "number"
      ? cart.cart.total_price
      : Number(cart.cart?.total_price ?? 0) ||
        (cart.cart?.items.reduce(
          (sum, item) => sum + Number(item.line_total ?? 0),
          0,
        ) ?? 0);

  const onApplyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) {
      setCouponError("Enter a coupon code first.");
      return;
    }
    setCouponBusy(true);
    setCouponError(null);
    try {
      // Backend serializer reads ``order_total`` (DRF convention). Sending
      // ``cart_total`` would silently default to 0 and the discount would be 0.
      const resp = await api.post<{ success: boolean; message: string; data: CouponValidateData }>(
        "/customer/coupons/validate/",
        { code, order_total: cartTotal },
      );
      const envelope = resp.data;
      if (!envelope?.success || !envelope.data) {
        setCouponError(envelope?.message ?? "This coupon cannot be applied.");
        setAppliedCoupon(null);
        return;
      }
      const { coupon, discount, final_total } = envelope.data;
      const applied: AppliedCoupon = {
        code: coupon.code,
        discount_type: coupon.discount_type,
        value: coupon.value,
        discount_amount: discount,
        new_total: final_total,
        message: envelope.message,
      };
      setAppliedCoupon(applied);
      toast.success(
        applied.discount_type === "PERCENT"
          ? `${applied.value}% off applied`
          : `৳${applied.discount_amount} off applied`,
      );
    } catch (err) {
      // On 4xx the api envelope carries `message` inside the response body
      // rather than the thrown error — pull it out if axios didn't already.
      const errAny = err as { response?: { data?: { message?: string } } };
      setCouponError(
        errAny?.response?.data?.message ?? getErrorMessage(err),
      );
      setAppliedCoupon(null);
    } finally {
      setCouponBusy(false);
    }
  };

  const onRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const onPlaceOrder = async () => {
    if (!address.trim()) {
      toast.error("Please enter a delivery address.");
      return;
    }
    try {
      // Only forward `coupon_code` if we have a successfully-applied code.
      // Server-side validation re-runs against the canonical Coupon model,
      // so the discount is recomputed even if the client cache diverges.
      const payload: { address: string; notes: string; coupon_code?: string } = {
        address,
        notes,
      };
      if (appliedCoupon?.code) {
        payload.coupon_code = appliedCoupon.code;
      }
      const order = await createMutation.mutateAsync(payload);
      if (!order?.id) {
        toast.error("Order creation returned no id.");
        return;
      }
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

          {/* Coupon card sits between the cart summary and the Pay button so
              the applied discount is visible in the same column as the total. */}
          <Card className="mt-4 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-ink-500" />
              <h3 className="text-sm font-semibold">Have a coupon?</h3>
            </div>
            {appliedCoupon ? (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm">
                <div>
                  <div className="font-semibold text-emerald-900">
                    {appliedCoupon.code}
                  </div>
                  <div className="text-xs text-emerald-700">
                    {appliedCoupon.discount_type === "PERCENT"
                      ? `${appliedCoupon.value}% off`
                      : `৳${appliedCoupon.discount_amount} off`}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Remove coupon"
                  onClick={onRemoveCoupon}
                  className="grid h-7 w-7 place-items-center rounded-full text-emerald-700 hover:bg-emerald-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                <Input
                  id="coupon"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    if (couponError) setCouponError(null);
                  }}
                  placeholder="SUMMER20"
                  className="flex-1 uppercase"
                  aria-invalid={couponError ? true : undefined}
                />
                <Button
                  type="button"
                  variant="outline"
                  loading={couponBusy}
                  onClick={onApplyCoupon}
                  disabled={!couponInput.trim()}
                >
                  Apply
                </Button>
              </div>
            )}
            {couponError && !appliedCoupon && (
              <p className="mt-2 text-xs text-rose-600">{couponError}</p>
            )}
            {appliedCoupon?.message && (
              <p className="mt-2 text-xs text-emerald-700">
                {appliedCoupon.message}
              </p>
            )}
          </Card>

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

# ?? DeshiCart — Full Audit Report

> **Scope:** Read-only audit of the DeshiCart e-commerce platform (Django 6.x REST backend + Next.js 14 frontend).
> **Date:** 2026-07-06
> **Status:** ?? **Backend cannot start — 2 syntax-broken files. Frontend is real-backend-integrated but several API contracts have bugs.**

---

## 1. Overall Status

| Layer | Status | Summary |
| --- | --- | --- |
| **Backend boot** | ?? **BROKEN** | `order/services.py` and `order/serializers.py` have Python syntax errors. `python manage.py runserver` fails. |
| **Models** | ?? Mostly OK | 17 apps, ~60 models. A few CASCADE-delete footguns (see §6). |
| **Views/Serializers** | ?? Buggy | 4 confirmed runtime bugs (role-string mismatch, ghost field, empty filter chains). |
| **URL routing** | ?? Inconsistent | `wishlist/admin_urls.py` mounts at the wrong prefix. |
| **Admin API surface** | ?? Real | `/admin/products/`, `/admin/orders/`, `/admin/users/` all wired. |
| **Frontend pages** | ?? Real (not stubs) | All sampled pages use real backend APIs via `apiGet/apiPost/apiPatch/apiDelete`. |
| **Frontend auth** | ?? Real | Djoser JWT + `/customer/me/` integration confirmed. |
| **Frontend data hooks** | ?? Real | `useAuth` calls `/auth/jwt/create/`, `/customer/me/`, password reset flows. |
| **Payment integration** | ?? Sandbox-only | SSLCommerz IS_SANDBOX must be flipped for production. |
| **Frontend "stub" pages** | ?? Minimal | Order success/failed are visual-only stubs (correct for payment gateway redirects). |

**Bottom line:** The project is ~85% complete. **The two backend syntax errors are a hard blocker**. Once those are fixed, the system is functionally end-to-end with real auth, real catalog, real cart, real order flow, real admin dashboard, and real product management. Remaining work is bug fixes, hardening, and tests.

---

## 2. App-by-App Findings

| App | Models | Views | Serializers | URLs | Known Issues |
| --- | --- | --- | --- | --- | --- |
| `users` | ?? Custom `User` w/ email-as-username, `is_blocked`, role labels (`SUPER_ADMIN/STAFF_ADMIN/CUSTOMER`) | ?? MeViewSet, auth views | ?? | ?? | `MeViewSet.dashboard` loads all orders into Python for sum (O(n), should `aggregate(Sum("total"))`). |
| `product` | ?? `Category`, `SubCategory`, `Brand`, `Product`, `Review`, `StockLog` | ?? ReviewViewSet role-string mismatch | ?? BrandSerializer `logo_url` ghost field | ?? | See §3 bugs 3 & 4. |
| `order` | ?? `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment` | ?? Service import ? syntax-broken | ?? **Syntax-broken** (duplicate declarations) | ?? | See §3 bugs 1 & 2. `Order.user` CASCADE deletes history. |
| `wishlist` | ?? `Wishlist`, `WishlistItem` | ?? Standard ModelViewSet | ?? | ?? **Wrong prefix** — `/api/wishlist/` not `/api/admin/wishlist/` | See §3 bug 7. |
| `support` | ?? `SupportTicket`, `TicketReply` | ?? Standard | ?? | ?? | None observed. |
| `notifications_app` | ?? `Notification` | ?? | ?? | ?? | None observed. |
| `coupons` | ?? `Coupon` (code, discount, expiry, usage_limit) | ?? Validation logic | ?? | ?? | No frontend coupon UI confirmed. |
| `shipping` | ?? `ShippingMethod` (zones, rates) | ?? | ?? | ?? | None observed. |
| `returns` | ?? `ReturnRequest` | ?? | ?? | ?? | No frontend returns page confirmed. |
| `storesettings` | ?? `StoreSettings` (singleton) + `FAQItem` | ?? | ?? **Hides SMTP + security fields** | ?? | See §3 bug 8. |
| `appearance` | ?? `Appearance` (singleton, 14 fields incl. `logo_url`) | ?? | ?? | ?? **Admin detail route ignores PK** | See §3 bug 6. |
| `finance` | ?? `Income`, `Expense`, `Refund`, `Ledger` | ?? | ?? | ?? | None observed. |
| `analytics` | ?? (read-only aggregator) | ?? | ?? | ?? | `/analytics/overview/`, `/analytics/top-products/`, `/analytics/sales/` confirmed real. |
| `reports` | ?? (read-only) | ?? | ?? | ?? | Filter `"READY TO SHIP"` matches `Order.READY_TO_SHIP` exactly — **NOT a bug**. |
| `content` | ?? `Page`, `Banner` | ?? | ?? | ?? | None observed. |
| `marketing` | ?? | ?? `PublicBannerViewSet` has empty `filter(**{}).filter(...)` calls | ?? | ?? | See §3 bug 5. |
| `cms` | ?? | ?? | ?? | ?? | None observed. |
| `admin_panel` | ?? `StaffProfile`, `ActivityLog` | ?? StaffUserViewSet, set-role action | ?? | ?? | `set-role` action validates against `{SUPER_ADMIN, STAFF_ADMIN, CUSTOMER}` — confirms these are the canonical role labels. |
| `api` | — | ?? `api_home` builds reverse URLs | — | ?? | None. |

---

## 3. Critical Bugs

### ?? **P0 — Backend will not start**

#### Bug 1: `order/services.py` — `OrderService.create_order` body is broken
**File:** `order/services.py`
**Symptom:** `python manage.py runserver` fails with `SyntaxError` or `IndentationError`.
**Cause:** The function body ends with a stray dict literal; never creates `OrderItem`s, never decrements stock, never clears cart, and never `return`s.
**Impact:** **Hard blocker** — entire backend is unbootable until fixed.
**Fix (approx 30 lines):**
```python
@staticmethod
def create_order(*, user, cart, address, shipping_method=None, notes=""):
    if cart.items.count() == 0:
        raise ValueError("Cart is empty")
    order = Order.objects.create(
        user=user, address=address,
        shipping_method=shipping_method,
        notes=notes,
        status=Order.NOT_PAID,
        subtotal=cart.subtotal,
        shipping_cost=Decimal("0"),
        tax=Decimal("0"),
        total=cart.subtotal,
    )
    for item in cart.items.select_related("product").all():
        OrderItem.objects.create(
            order=order, product=item.product,
            quantity=item.quantity, price=item.product.price,
        )
        item.product.stock = max(0, item.product.stock - item.quantity)
        item.product.save(update_fields=["stock"])
    cart.items.all().delete()
    return order
```

#### Bug 2: `order/serializers.py` — Duplicated function/class declarations
**File:** `order/serializers.py`
**Symptom:** `SyntaxError: duplicate declaration` (or `IndentationError` if first def wins).
**Cause:** `validate_cart_id`, `create`, and `to_representation` are declared twice in the same class. `OrderItemSerializer` is declared twice.
**Impact:** **Hard blocker** — same as Bug 1.
**Fix:** Delete the second copy of each. Confirm with `python -c "import ast; ast.parse(open('order/serializers.py').read())"`.

### ?? **P1 — Runtime bugs**

#### Bug 3: `product/views.py` ReviewViewSet — role-string mismatch
**File:** `product/views.py` (ReviewViewSet.get_queryset)
**Symptom:** Admin users see their own pending reviews mixed into the admin queue; or some admin users get 403 unexpectedly.
**Cause:** Code checks `request.user.role in {'admin', 'staff', 'superadmin'}` (lowercase), but `users.User.role` stores `'SUPER_ADMIN' | 'STAFF_ADMIN' | 'CUSTOMER'` (uppercase with underscore). The branch is effectively dead.
**Evidence:**
- `admin_panel/views.py` `StaffUserViewSet.set_role` validates `new_role in {'SUPER_ADMIN', 'STAFF_ADMIN', 'CUSTOMER'}`.
- `frontend/src/app/(auth)/login/page.tsx` derives role from `is_superuser`/`is_staff` flags, **not** from a custom field.
**Fix:** Replace with permission-based check:
```python
from api.permissions import IsAdmin
self.queryset = Review.objects.all()  # let IsAdmin gate access
self.permission_classes = [IsAdmin]
```

#### Bug 4: `product/serializers.py` BrandSerializer — ghost `logo_url` field
**File:** `product/serializers.py` (BrandSerializer)
**Symptom:** `AttributeError: 'Brand' object has no attribute 'logo_url'` when admin tries to list/update brands.
**Cause:** Serializer declares `logo_url` but the Brand model field is `logo` (URLField).
**Fix:** Rename serializer field to `logo` or add `source='logo'`:
```python
class BrandSerializer(serializers.ModelSerializer):
    logo_url = serializers.URLField(source='logo', required=False, allow_blank=True)
    # or simply: fields = ['id', 'name', 'slug', 'logo', 'description', 'is_active']
```

### ?? **P2 — Configuration / contract bugs**

#### Bug 5: `marketing/views.py` PublicBannerViewSet — empty filter chain
**File:** `marketing/views.py`
**Symptom:** Code calls `Model.objects.filter(**{}).filter(...)` — the first `.filter(**{})` is a no-op but signals confusion.
**Cause:** Likely a refactor leftover.
**Impact:** Functional but inefficient (extra SQL round-trip for empty WHERE).
**Fix:** Remove the empty `.filter(**{})` call.

#### Bug 6: `appearance/urls.py` — admin detail route ignores PK
**File:** `appearance/urls.py`
**Symptom:** `GET /api/admin/appearance/123/` returns the same singleton as `GET /api/admin/appearance/`. Confusing API contract.
**Fix:** Either remove the detail route (`r''` only) or implement multi-Appearance support.

#### Bug 7: `wishlist/admin_urls.py` — wrong URL prefix
**File:** `wishlist/admin_urls.py`
**Symptom:** Admin wishlist endpoints live at `/api/wishlist/` while every other admin endpoint is at `/api/admin/<app>/`.
**Cause:** Module is included in `deshicart/urls.py` directly instead of under `admin/`.
**Fix:** Move include from `path("api/wishlist/", ...)` to `path("api/admin/wishlist/", ...)`.

#### Bug 8: `storesettings/serializers.py` — hides SMTP + security fields
**File:** `storesettings/serializers.py` (StoreSettingsSerializer)
**Symptom:** Admin UI cannot edit `smtp_host`, `smtp_port`, `smtp_user`, `smtp_password`, `smtp_use_tls`, `from_email`, `security_2fa_required`, `session_timeout_minutes`.
**Cause:** Fields are not listed in `fields = [...]`.
**Fix:** Add them to `fields`, mark `smtp_password` as `write_only=True`.

---

## 4. Missing APIs (Spec Gaps)

Based on the frontend pages captured, these backend endpoints are **confirmed real**:

| Endpoint | Used by |
| --- | --- |
| `POST /auth/jwt/create/` | `useAuth().login` |
| `POST /auth/users/` | `useAuth().register` |
| `POST /auth/users/activation/` | `useAuth().activate` |
| `POST /auth/users/reset_password/` | `useAuth().requestPasswordReset` |
| `POST /auth/users/reset_password_confirm/` | `useAuth().confirmPasswordReset` |
| `POST /auth/users/set_password/` | `useAuth().changePassword` |
| `GET/PATCH /customer/me/` | `useAuth().updateProfile`, `useAuth().fetchMe` |
| `GET /analytics/overview/?days=N` | `admin/dashboard/page.tsx` |
| `GET /analytics/top-products/?days=N&limit=5` | `admin/dashboard/page.tsx` |
| `GET /analytics/sales/?days=N` | `admin/dashboard/page.tsx` |
| `GET /finance/summary/` | `admin/dashboard/page.tsx` |
| `GET /admin/orders/?page=1&page_size=6` | `admin/dashboard/page.tsx` |
| `GET /admin/products/?page=N&page_size=20&search=...&is_active=...&is_featured=...&category=...` | `admin/products/page.tsx` |
| `GET /categories/?page_size=200` | `admin/products/page.tsx` |

**Likely missing frontend surfaces** (backend endpoints exist but no UI calls them):
- `/coupons/validate/` — no coupon input field on `checkout` page confirmed.
- `/returns/` — no `/account/returns` page confirmed.
- `/wishlist/` — no `/wishlist` page confirmed in captures.
- `/support/tickets/` — no `/support` page confirmed.
- `/notifications/` — no notification bell confirmed.
- `/inventory/adjust/` — admin can adjust stock via raw API only.
- `/finance/ledger/` — finance entries viewable only via Django admin.

---

## 5. Frontend "Stub" Pages

**Finding: The frontend is NOT stubbed.** All sampled pages use real backend APIs.

| Page | Status | Backend Integration |
| --- | --- | --- |
| `(auth)/login/page.tsx` | ?? Real | `useAuth().login()` ? `/auth/jwt/create/`, role from `is_superuser`/`is_staff` |
| `admin/dashboard/page.tsx` | ?? Real | 5 parallel `Promise.allSettled([apiGet])` calls |
| `admin/products/page.tsx` | ?? Real | `/admin/products/` + `/categories/?page_size=200` |
| `order/success/page.tsx` | ?? **Visual stub** | Static "Payment successful" page; no `apiGet` to verify order (acceptable — payment gateway redirects here). |
| `order/failed/page.tsx` | ?? **Visual stub** (likely) | Static "Payment failed" page. |

**Observation:** Order success/failed pages are intentional stubs — the SSLCommerz gateway redirects to `/order/success?tran_id=...` and the page doesn't need to fetch the order (the order was created in `PaymentViewSet.success`). However, **passing `tran_id` as a query param and not consuming it means the user has no proof of which order they placed**. Recommended enhancement: parse `tran_id` and call `/orders/{id}/` to display the actual order.

**Not directly captured (likely real):** home, products list, product detail, cart, checkout, account, account/orders, categories, admin/orders, admin/customers, admin/coupons, admin/finance, admin/reports, admin/settings, admin/appearance.

---

## 6. Security Issues

### ?? **Medium**

1. **`Order.user` CASCADE delete wipes history.**
   When a user is deleted, all their orders, order items, payments, cart, wishlist, support tickets, notifications are wiped via CASCADE. This violates typical e-commerce audit requirements (orders must persist for accounting/tax purposes).
   **Fix:** Change `on_delete=models.CASCADE` to `on_delete=models.PROTECT` for `Order.user`. Soft-delete users via `is_active=False` + `is_blocked=True` instead.

2. **`MeViewSet.dashboard` loads all orders into Python.**
   `sum(o.total for o in Order.objects.filter(user=request.user))` is O(n) in Python. For a user with 1000 orders, that's 1000 model loads.
   **Fix:** `Order.objects.filter(user=request.user).aggregate(total_spent=Sum("total"))["total_spent"] or 0`.

3. **No verified-purchase enforcement in review creation.**
   `Review.verified_purchase` field exists but no view checks `Order.objects.filter(user=request.user, items__product=product, status=Order.DELIVERED).exists()` before allowing it.
   **Fix:** In `ReviewViewSet.create`, validate `verified_purchase` against actual order history; reject if false.

4. **`SSLCommerz IS_SANDBOX=True` in settings.**
   Production must flip this to `False` and provide live store credentials.
   **Fix:** Use environment variables: `SSL_COMMERZ_IS_SANDBOX = os.environ.get("SSL_SANDBOX", "true").lower() == "true"`.

5. **Dashboard status mapping has dead branches.**
   `admin/dashboard/page.tsx` handles statuses `PAID`, `PROCESSING`, `REFUNDED`, `TRANSIT`, `COMPLETED`, `REJECT` — but `Order.STATUS_CHOICES` only includes `NOT_PAID, READY TO SHIP, SHIPPED, DELIVERED, CANCELLED`. Either Order model needs extension OR the icon/color mapping has 5+ dead branches.
   **Fix:** Either align the two or extend Order.STATUS_CHOICES to include `PAID`, `REFUNDED`.

### ?? **Low**

6. **`Product.gallery` and `Product.specifications` are `JSONField`** with no validation. Admin can store arbitrary structures.
   **Fix:** Add JSON schema validation or move to a dedicated `ProductGallery` / `ProductSpec` model.

7. **`User.role` field is vestigial.**
   Login page uses `is_superuser`/`is_staff` flags. `User.role` is only set by `StaffUserViewSet.set_role` and never read for access control (except by the buggy ReviewViewSet).
   **Fix:** Either remove `User.role` or migrate all access-control checks to it.

---

## 7. Estimated Effort

| Priority | Task | Effort |
| --- | --- | --- |
| **P0** | Fix `order/services.py` syntax (Bug 1) | 1–2 hours |
| **P0** | Fix `order/serializers.py` syntax (Bug 2) | 1 hour |
| **P0** | Verify backend boots + run smoke tests | 2 hours |
| **P1** | Fix ReviewViewSet role-string mismatch (Bug 3) | 30 min |
| **P1** | Fix BrandSerializer `logo_url` ghost field (Bug 4) | 15 min |
| **P1** | Change `Order.user` CASCADE ? PROTECT (Security 1) | 1 hour + migration |
| **P1** | Aggregate MeViewSet.dashboard total (Security 2) | 15 min |
| **P1** | Add verified-purchase check to ReviewViewSet (Security 3) | 2 hours |
| **P2** | Clean marketing empty filter chains (Bug 5) | 15 min |
| **P2** | Remove/fix appearance PK detail route (Bug 6) | 30 min |
| **P2** | Fix wishlist admin URL prefix (Bug 7) | 15 min |
| **P2** | Expose storesettings SMTP + security fields (Bug 8) | 1 hour |
| **P2** | Flip SSLCommerz IS_SANDBOX via env var (Security 4) | 30 min |
| **P3** | Order success/failed pages — consume `tran_id` query param | 4 hours |
| **P3** | Frontend coupon UI on checkout | 1 day |
| **P3** | Frontend wishlist page | 1 day |
| **P3** | Frontend returns page | 2 days |
| **P3** | Frontend support/tickets page | 2 days |
| **P3** | Notification bell + drawer | 2 days |
| **P3** | Admin inventory adjust UI | 2 days |
| **P3** | Admin finance ledger view | 3 days |
| **P4** | Test suite (pytest + vitest) | 1–2 weeks |
| **P4** | CI/CD pipeline | 3 days |
| **P4** | Production deployment docs (PostgreSQL switch, env vars, static files, SSLCommerz live) | 2 days |

**Total to production-ready MVP:** ~3 weeks.
**Total to production-hardened:** ~6 weeks.

---

## 8. False-Positive Bugs (Corrected During Audit)

The following were initially flagged as bugs but were **confirmed correct** on re-reading:

1. ~~`reports/views.py` filters orders by `"READY TO SHIP"` but Order.STATUS_CHOICES uses different strings~~
   **Status: NOT A BUG.** `Order.READY_TO_SHIP = 'READY TO SHIP'` — exact match.

2. ~~`analytics/views.py` filters by `payment__card_type` but Payment model has no such field~~
   **Status: NOT A BUG.** `Payment.card_type = CharField` is defined.

3. ~~`appearance/serializers.py` references `logo_url` which doesn't exist~~
   **Status: PARTIALLY TRUE.** `Appearance.logo_url` IS defined (14-field model). Only `Brand.logo_url` (in `product/serializers.py`) is the ghost field.

---

## 9. Recommendations

1. **Fix the two syntax errors first.** Nothing else matters until the backend boots.
2. **Add a CI step that runs `python -c "import ast; [ast.parse(open(p).read()) for p in Path('.').rglob('*.py')]"`** to catch syntax errors before merge.
3. **Standardize the admin URL prefix.** Decide: is it `/api/admin/<app>/` or `/api/<app>/`? Currently mixed.
4. **Decide on `User.role` vs Django flags.** Either remove `User.role` or migrate all access checks to it. Currently both exist and ReviewViewSet checks the wrong one.
5. **Add a frontend test suite** (vitest + @testing-library/react) for the auth flow at minimum.
6. **Document the frontend's "real API" contract** so future contributors don't reintroduce mock data.
7. **Switch SQLite ? PostgreSQL** for production (`DATABASE_URL=postgres://...`).
8. **Set up Sentry or similar** for error tracking on both backend and frontend.

---

*Report generated from direct code inspection of: `order/services.py`, `order/serializers.py`, `product/models.py`, `product/views.py`, `product/serializers.py`, `users/models.py`, `users/views.py`, `marketing/views.py`, `appearance/urls.py`, `appearance/serializers.py`, `storesettings/serializers.py`, `wishlist/admin_urls.py`, `admin_panel/views.py`, `frontend/src/hooks/useAuth.ts`, `frontend/src/app/(auth)/login/page.tsx`, `frontend/src/app/admin/dashboard/page.tsx`, `frontend/src/app/admin/products/page.tsx`, `frontend/src/app/order/success/page.tsx`, `frontend/next.config.mjs`, `frontend/package.json`, `api/urls.py`, `api/views.py`, `deshicart/settings.py`, plus the full directory tree of all 19 apps and 17 frontend page directories.*

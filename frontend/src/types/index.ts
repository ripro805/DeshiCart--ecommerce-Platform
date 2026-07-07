// Centralized TypeScript types matching Django backend serializers.
// Keep these aligned with backend responses.

export type UserRole = "CUSTOMER" | "STAFF_ADMIN" | "SUPER_ADMIN";

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_active?: boolean;
  is_blocked?: boolean;
  avatar?: string | null;
  date_joined?: string;
  last_login?: string | null;
  // Computed from is_staff/is_superuser on backend (read-only property).
  role?: UserRole;
}

export function roleOf(u: User | null | undefined): UserRole {
  if (!u) return "CUSTOMER";
  if (u.is_superuser) return "SUPER_ADMIN";
  if (u.is_staff) return "STAFF_ADMIN";
  return "CUSTOMER";
}

export function isAdmin(u: User | null | undefined): boolean {
  if (!u) return false;
  return Boolean(u.is_staff) || Boolean(u.is_superuser);
}

export function isSuperAdmin(u: User | null | undefined): boolean {
  if (!u) return false;
  return Boolean(u.is_superuser);
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Review {
  id: number;
  user: Pick<User, "id" | "email" | "first_name" | "last_name">;
  product: number;
  ratings: number;       // 1..5
  comment: string;
  status?: ReviewStatus;
  verified_purchase?: boolean;
  helpful_count?: number;
  created_at: string;
  updated_at?: string;
}

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" | "SPAM";

export const REVIEW_STATUSES: ReviewStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "HIDDEN",
  "SPAM",
];

/** Flat row shape returned by `/api/admin/reviews/`. Mirrors `AdminReviewSerializer`. */
export interface AdminReview extends Review {
  user_email: string;
  user_first_name?: string;
  user_last_name?: string;
  user_avatar?: string | null;
  product_name: string;
  product_sku?: string;
  product_image_url?: string | null;
  // Some admin responses include a denormalized reviewer display name.
  name?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;        // backend returns Decimal as string
  stock: number;
  category: Category;
  image?: string | null;
  image_url?: string | null;
  // Optional / model-specific fields commonly returned by DRF serializers
  // or admin views. Backend may include them for richer UI affordances.
  compare_price?: string | number | null;
  stock_quantity?: number;
  in_stock?: boolean;
  low_stock_threshold?: number;
  image_external_url?: string | null;
  sku?: string;
  slug?: string;
  status?: string;
  reviews?: Review[];
  average_rating?: number;
  review_count?: number;
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
  total_price?: string | number;
}

export interface Cart {
  id: number;
  user?: number;
  items: CartItem[];
  total_price?: string | number;
  total_items?: number;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItem {
  id: number;
  product: Product;
  quantity: number;
  price: string | number;
}

export interface Order {
  id: number;
  user: number | User;
  status: OrderStatus;
  total_price: string | number;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
  payment?: Payment | null;
  address?: string;
  notes?: string;
}

export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface Payment {
  id: number;
  order: number;
  user?: number;
  amount: string | number;
  status: PaymentStatus;
  transaction_id: string;
  gateway_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CheckoutResponse {
  // Always present on the unified `/api/payment/checkout/` response.
  // `id` / `order_id` mirror the created Order so the frontend can
  // chain into a second `useInitiatePayment({ order_id })` call.
  id?: number;
  order_id?: number;
  payment_id?: number;
  status?: "PENDING" | "SUCCESS" | "FAILED" | string;
  gateway_url?: string;
  transaction_id?: string;
  amount?: string | number;
  currency?: string;
  payment?: Payment;
  message?: string;
}

export interface ApiError {
  detail?: string;
  [field: string]: unknown;
}

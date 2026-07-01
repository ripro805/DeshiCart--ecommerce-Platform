// Centralized TypeScript types matching Django backend serializers.
// Keep these aligned with backend responses.

export interface User {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  address?: string;
  is_staff?: boolean;
  avatar?: string | null;
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
  created_at: string;
  updated_at?: string;
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
  status: "SUCCESS" | "FAILED";
  gateway_url?: string;
  payment?: Payment;
  message?: string;
}

export interface ApiError {
  detail?: string;
  [field: string]: unknown;
}

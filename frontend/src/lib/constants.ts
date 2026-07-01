export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  CONFIRMED: "bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200",
  PROCESSING: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  SHIPPED: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  CANCELLED: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  SUCCESS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  FAILED:  "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  CANCELLED: "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
};

export const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest first" },
  { value: "created_at",  label: "Oldest first" },
  { value: "price",       label: "Price: Low to High" },
  { value: "-price",      label: "Price: High to Low" },
  { value: "name",        label: "Name: A → Z" },
  { value: "-name",       label: "Name: Z → A" },
] as const;

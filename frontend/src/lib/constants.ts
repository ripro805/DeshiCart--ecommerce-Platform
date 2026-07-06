// Order.STATUS_CHOICES — must stay in sync with order/models.py
export const ORDER_STATUS_LABELS: Record<string, string> = {
  "NOT PAID":       "Not Paid",
  "READY TO SHIP":  "Ready to Ship",
  SHIPPED:          "Shipped",
  DELIVERED:        "Delivered",
  CANCELLED:        "Cancelled",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  "NOT PAID":      "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  "READY TO SHIP": "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  SHIPPED:         "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
  DELIVERED:       "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  CANCELLED:       "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
};

// Payment.STATUS_CHOICES — kept in sync with order/models.py
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING:        "Pending",
  SUCCESS:        "Paid",
  VALIDATED:      "Validated",
  FAILED:         "Failed",
  CANCELLED:      "Cancelled",
  REFUND_PENDING: "Refund Pending",
  REFUNDED:       "Refunded",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING:        "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  SUCCESS:        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  VALIDATED:      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  FAILED:         "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  CANCELLED:      "bg-zinc-200 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  REFUND_PENDING: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200",
  REFUNDED:       "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200",
};

// Order is only cancellable while not yet shipped
export const CANCELLABLE_ORDER_STATUSES = new Set<string>(["NOT PAID", "READY TO SHIP"]);

export const SORT_OPTIONS = [
  { value: "-created_at", label: "Newest first" },
  { value: "created_at",  label: "Oldest first" },
  { value: "price",       label: "Price: Low to High" },
  { value: "-price",      label: "Price: High to Low" },
  { value: "name",        label: "Name: A → Z" },
  { value: "-name",       label: "Name: Z → A" },
] as const;

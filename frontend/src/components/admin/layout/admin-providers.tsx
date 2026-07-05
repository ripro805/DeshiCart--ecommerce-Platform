"use client";

import { ToastHost } from "../feedback/toast-host";

/**
 * Mount once at the admin layout. Renders the toast viewport globally.
 * (Future: drawer/modal portals can be added here too.)
 */
export function AdminProviders() {
  return <ToastHost />;
}
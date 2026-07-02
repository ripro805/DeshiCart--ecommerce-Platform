"use client";

import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { getInitials } from "@/lib/utils";

export default function AccountPage() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-display-md">Profile</h1>
      <Card className="p-8">
        <div className="flex items-center gap-5">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-2xl font-bold text-white shadow-glow">
            {getInitials(user.first_name, user.last_name)}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user.first_name || user.email}</h2>
            <p className="text-sm text-ink-500">{user.email}</p>
          </div>
        </div>
        <dl className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-500">First name</dt>
            <dd className="mt-1 font-medium">{user.first_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-500">Last name</dt>
            <dd className="mt-1 font-medium">{user.last_name || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-500">Address</dt>
            <dd className="mt-1 font-medium">{user.address || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-500">Phone</dt>
            <dd className="mt-1 font-medium">{user.phone || "—"}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}

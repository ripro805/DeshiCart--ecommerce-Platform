"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Star,
  Truck,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
  type Address,
  type AddressPayload,
} from "@/hooks/useAddresses";
import { getErrorMessage } from "@/lib/utils";

const EMPTY_FORM: AddressPayload = {
  label: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "Bangladesh",
  phone: "",
  is_default_billing: false,
  is_default_shipping: false,
};

export default function AddressesPage() {
  const { data: addresses = [], isLoading } = useAddresses();
  const createMut = useCreateAddress();
  const updateMut = useUpdateAddress();
  const deleteMut = useDeleteAddress();

  const [editing, setEditing] = useState<Address | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressPayload>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (a: Address) => {
    setEditing(a);
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = a;
    setForm(rest);
    setShowForm(true);
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.line1.trim() || !form.city.trim()) {
      toast.error("Line 1 and city are required.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing.id, ...form });
        toast.success("Address updated");
      } else {
        await createMut.mutateAsync(form);
        toast.success("Address added");
      }
      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteMut.mutateAsync(id);
      toast.success("Address removed");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const toggleDefault = async (a: Address, field: "is_default_billing" | "is_default_shipping") => {
    try {
      await updateMut.mutateAsync({ id: a.id, [field]: !a[field] } as Partial<AddressPayload> & { id: number });
      toast.success("Default updated");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-md">Addresses</h1>
          <p className="mt-1 text-sm text-ink-500">Manage your shipping and billing addresses.</p>
        </div>
        {!showForm && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add address
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="p-6 sm:p-8">
              <h2 className="text-lg font-semibold">{editing ? "Edit address" : "New address"}</h2>
              <form onSubmit={onSave} className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="label">Label (optional)</Label>
                  <Input
                    id="label"
                    placeholder='e.g. "Home", "Office"'
                    value={form.label ?? ""}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="line1">Street address</Label>
                  <Input
                    id="line1"
                    required
                    placeholder="House, road, area"
                    value={form.line1}
                    onChange={(e) => setForm({ ...form, line1: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="line2">Apartment / suite (optional)</Label>
                  <Textarea
                    id="line2"
                    rows={2}
                    value={form.line2 ?? ""}
                    onChange={(e) => setForm({ ...form, line2: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State / division</Label>
                  <Input
                    id="state"
                    value={form.state ?? ""}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal code</Label>
                  <Input
                    id="postal_code"
                    value={form.postal_code ?? ""}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    required
                    value={form.country}
                    onChange={(e) => setForm({ ...form, country: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="01XXXXXXXXX"
                    value={form.phone ?? ""}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2 flex flex-wrap items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-ink-300 text-primary focus:ring-primary"
                      checked={form.is_default_shipping}
                      onChange={(e) => setForm({ ...form, is_default_shipping: e.target.checked })}
                    />
                    Default shipping
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-ink-300 text-primary focus:ring-primary"
                      checked={form.is_default_billing}
                      onChange={(e) => setForm({ ...form, is_default_billing: e.target.checked })}
                    />
                    Default billing
                  </label>
                </div>
                <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                  <Button type="submit" loading={saving}>
                    {editing ? "Save changes" : "Add address"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowForm(false);
                      setEditing(null);
                      setForm(EMPTY_FORM);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-3xl bg-ink-200/60 dark:bg-ink-800/60" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <Card className="p-12 text-center">
          <MapPin className="mx-auto h-10 w-10 text-ink-400" />
          <h2 className="mt-4 text-lg font-semibold">No addresses saved</h2>
          <p className="mt-1 text-sm text-ink-500">Add your first address to speed up checkout.</p>
          <Button onClick={openCreate} className="mt-6">
            <Plus className="h-4 w-4" /> Add your first address
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {a.label && <p className="text-sm font-semibold">{a.label}</p>}
                    <p className="mt-1 text-sm">{a.line1}</p>
                    {a.line2 && <p className="text-sm text-ink-500">{a.line2}</p>}
                    <p className="text-sm text-ink-500">
                      {a.city}
                      {a.state ? `, ${a.state}` : ""} {a.postal_code ?? ""}
                    </p>
                    <p className="text-sm text-ink-500">{a.country}</p>
                    {a.phone && <p className="mt-1 text-sm text-ink-500">{a.phone}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(a)} aria-label="Edit address">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onDelete(a.id)}
                      loading={deletingId === a.id}
                      className="text-rose-600"
                      aria-label="Delete address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-200/60 pt-4 dark:border-ink-800/60">
                  <button
                    type="button"
                    onClick={() => toggleDefault(a, "is_default_shipping")}
                    disabled={a.is_default_shipping}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                      a.is_default_shipping
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                        : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-900/60 dark:text-ink-300 dark:hover:bg-ink-900"
                    }`}
                  >
                    {a.is_default_shipping ? <Star className="h-3 w-3" /> : <Truck className="h-3 w-3" />}
                    Shipping
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleDefault(a, "is_default_billing")}
                    disabled={a.is_default_billing}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ${
                      a.is_default_billing
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                        : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-900/60 dark:text-ink-300 dark:hover:bg-ink-900"
                    }`}
                  >
                    {a.is_default_billing ? <Star className="h-3 w-3" /> : <CreditCard className="h-3 w-3" />}
                    Billing
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

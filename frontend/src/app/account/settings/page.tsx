"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { getErrorMessage } from "@/lib/utils";

export default function SettingsPage() {
  const { user, changePassword, updateProfile } = useAuth();
  const [profile, setProfile] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [pw, setPw] = useState({ current: "", new: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const onSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await updateProfile(profile);
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.new !== pw.confirm) return toast.error("Passwords don't match.");
    setSavingPw(true);
    try {
      await changePassword(pw.current, pw.new, pw.confirm);
      toast.success("Password changed.");
      setPw({ current: "", new: "", confirm: "" });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-display-md">Settings</h1>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Profile</h2>
          <form onSubmit={onSaveProfile} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>First name</Label>
                <Input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
              </div>
              <div>
                <Label>Last name</Label>
                <Input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
            </div>
            <Button loading={savingProfile}>Save profile</Button>
          </form>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <Card className="p-6 sm:p-8">
          <h2 className="text-lg font-semibold">Change password</h2>
          <form onSubmit={onChangePw} className="mt-6 space-y-4">
            <div>
              <Label>Current password</Label>
              <Input type="password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
            </div>
            <div>
              <Label>New password</Label>
              <Input type="password" required minLength={8} value={pw.new} onChange={(e) => setPw({ ...pw, new: e.target.value })} />
            </div>
            <div>
              <Label>Confirm new password</Label>
              <Input type="password" required minLength={8} value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
            </div>
            <Button loading={savingPw}>Change password</Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

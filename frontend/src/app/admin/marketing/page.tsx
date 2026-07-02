"use client";

import { useState } from "react";
import Link from "next/link";
import { Megaphone, Image as ImageIcon, Mail, BarChart3, ArrowRight } from "lucide-react";

const TILES = [
  {
    href: "/admin/marketing/campaigns",
    title: "Campaigns",
    desc: "Time-bound promotional campaigns and discounts",
    icon: Megaphone,
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    href: "/admin/marketing/banners",
    title: "Banners",
    desc: "Homepage hero and category banners",
    icon: ImageIcon,
    color: "bg-fuchsia-50 text-fuchsia-600",
  },
  {
    href: "/admin/marketing/newsletter",
    title: "Newsletter",
    desc: "Send email newsletters to subscribers",
    icon: Mail,
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/admin/marketing/analytics",
    title: "Marketing Analytics",
    desc: "Campaign performance and conversion rates",
    icon: BarChart3,
    color: "bg-amber-50 text-amber-600",
  },
];

export default function MarketingHub() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Marketing</h1>
        <p className="text-sm text-slate-500">Campaigns, banners, newsletters and analytics</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="bg-white border border-slate-200 rounded-lg p-6 hover:border-indigo-300 hover:shadow-sm transition group">
            <div className="flex items-start justify-between">
              <div className={`h-10 w-10 rounded-lg ${t.color} inline-flex items-center justify-center`}>
                <t.icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{t.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{t.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
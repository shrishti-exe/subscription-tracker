"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { SubscriptionCategory } from "@/types";
import { getDaysUntilRenewal, computeNextRenewal } from "@/lib/mockData";

const CATEGORIES: SubscriptionCategory[] = [
  "Entertainment",
  "Productivity",
  "Design",
  "Shopping",
  "Health",
  "Gaming",
  "News",
  "Other",
];

const CATEGORY_ICONS: Record<string, string> = {
  Entertainment: "movie",
  Productivity: "work",
  Design: "palette",
  Shopping: "shopping_bag",
  Health: "fitness_center",
  Gaming: "sports_esports",
  News: "newspaper",
  Other: "category",
};

export default function SubscriptionsPage() {
  const { subscriptions } = useStore();
  const [filter, setFilter] = useState<"all" | "active" | "cancelled">("all");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"name" | "amount" | "renewal">("renewal");

  const filtered = subscriptions
    .filter((s) => {
      if (filter !== "all" && s.status !== filter) return false;
      if (category !== "all" && s.category !== category) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "amount") return b.amount - a.amount;
      const aRenewal = computeNextRenewal(a.startDate, a.billingCycle);
      const bRenewal = computeNextRenewal(b.startDate, b.billingCycle);
      return new Date(aRenewal).getTime() - new Date(bRenewal).getTime();
    });

  const totalActive = subscriptions.filter((s) => s.status === "active").length;
  const totalMonthly = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.billingCycle === "Monthly" ? s.amount : s.amount / 12), 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold font-headline">All Subscriptions</h2>
          <p className="text-on-surface-variant mt-1">
            {totalActive} active · ${totalMonthly.toFixed(2)}/mo
          </p>
        </div>
        <Link
          href="/subscriptions/add"
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add Subscription
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex bg-surface-container-low p-1 rounded-xl gap-1">
          {(["all", "active", "cancelled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                filter === f
                  ? "bg-white text-primary shadow-sm font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-on-surface-variant">Sort:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "name" | "amount" | "renewal")}
            className="bg-surface-container-low border-none rounded-xl px-3 py-2 text-sm font-medium outline-none cursor-pointer"
          >
            <option value="renewal">Renewal Date</option>
            <option value="amount">Amount</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setCategory("all")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            category === "all"
              ? "bg-primary text-white"
              : "bg-surface-container text-on-surface hover:bg-surface-container-high"
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              category === cat
                ? "bg-primary text-white"
                : "bg-surface-container text-on-surface hover:bg-surface-container-high"
            }`}
          >
            <span className="material-symbols-outlined text-sm">{CATEGORY_ICONS[cat]}</span>
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">
            subscriptions
          </span>
          <p className="text-on-surface-variant mt-4">No subscriptions found.</p>
          <Link href="/subscriptions/add" className="mt-4 inline-block text-primary font-bold">
            Add one now →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((sub) => {
            const daysLeft = getDaysUntilRenewal(sub.startDate, sub.billingCycle);
            const nextRenewal = computeNextRenewal(sub.startDate, sub.billingCycle);
            return (
              <Link
                key={sub.id}
                href={`/subscriptions/${sub.id}`}
                className={`bg-surface-container-lowest p-6 rounded-2xl flex flex-col gap-4 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-200/50 ${
                  sub.status === "cancelled" ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">
                        {CATEGORY_ICONS[sub.category] || "subscriptions"}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold">{sub.name}</p>
                      <p className="text-xs text-on-surface-variant">{sub.category}</p>
                    </div>
                  </div>
                  {sub.status === "active" && daysLeft <= 3 && (
                    <span className="bg-tertiary-fixed text-on-tertiary-fixed px-2 py-1 rounded-full text-[10px] font-bold">
                      {daysLeft === 0 ? "Today" : `${daysLeft}d`}
                    </span>
                  )}
                  {sub.status === "cancelled" && (
                    <span className="bg-error-container text-on-error-container px-2 py-1 rounded-full text-[10px] font-bold">
                      Cancelled
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold font-headline text-primary">
                      ${sub.amount.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                      {sub.billingCycle}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-on-surface-variant">Next renewal</p>
                    <p className="text-sm font-bold">
                      {new Date(nextRenewal).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {sub.linkedAccount && (
                  <div className="flex items-center gap-2 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/20">
                    <span className="material-symbols-outlined text-sm">credit_card</span>
                    {sub.linkedAccount}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

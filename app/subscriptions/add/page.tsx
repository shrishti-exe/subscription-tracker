"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { BillingCycle, SubscriptionCategory } from "@/types";

const CATEGORIES: { label: SubscriptionCategory; icon: string }[] = [
  { label: "Entertainment", icon: "movie" },
  { label: "Productivity", icon: "work" },
  { label: "Shopping", icon: "shopping_bag" },
  { label: "Health", icon: "fitness_center" },
  { label: "Design", icon: "palette" },
  { label: "Gaming", icon: "sports_esports" },
  { label: "News", icon: "newspaper" },
  { label: "Other", icon: "category" },
];

export default function AddSubscriptionPage() {
  const router = useRouter();
  const { addSubscription } = useStore();

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("Monthly");
  const [nextRenewal, setNextRenewal] = useState("");
  const [linkedAccount, setLinkedAccount] = useState("");
  const [category, setCategory] = useState<SubscriptionCategory>("Entertainment");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Subscription name is required.");
    if (!amount || parseFloat(amount) <= 0) return setError("Please enter a valid amount.");
    if (!nextRenewal) return setError("Please select a renewal date.");

    addSubscription({
      name: name.trim(),
      amount: parseFloat(amount),
      billingCycle,
      nextRenewal,
      category,
      linkedAccount: linkedAccount.trim() || undefined,
      status: "active",
      subscribedSince: new Date().toISOString().split("T")[0],
      autoRenew: true,
      source: "manual",
    });

    router.push("/subscriptions");
  };

  return (
    <div className="flex-1 p-4 md:p-10 lg:p-16 flex flex-col items-center justify-center min-h-full">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left: Context */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div className="space-y-2">
            <span className="text-primary font-bold tracking-widest uppercase text-xs">
              New Intel
            </span>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-on-background font-headline leading-tight tracking-tight">
              Add a <br />Subscription.
            </h2>
          </div>
          <p className="text-on-surface-variant text-lg leading-relaxed max-w-sm">
            Keep your digital portfolio pristine. Log your recurring costs to unlock
            predictive intelligence and spend optimization.
          </p>
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
                <span className="material-symbols-outlined">security</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Bank-Level Privacy</p>
                <p className="text-xs text-on-surface-variant">Your financial data stays yours.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <div>
                <p className="font-semibold text-sm">Auto-Detection Available</p>
                <p className="text-xs text-on-surface-variant">
                  Link your bank to find subscriptions automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:col-span-7 w-full">
          <div className="bg-surface-container-lowest p-8 md:p-10 rounded-[2rem] shadow-[0px_20px_40px_rgba(25,28,29,0.06)] space-y-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-error-container/30 text-error rounded-xl">
                  <span className="material-symbols-outlined">error</span>
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface-variant px-1">
                  Subscription Name
                </label>
                <input
                  className="w-full h-14 px-6 bg-surface-container-low border-none rounded-xl text-lg font-medium focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline-none"
                  placeholder="e.g. Netflix, Adobe Creative Cloud"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {/* Amount + Billing Cycle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant px-1">
                    Monthly/Yearly Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant font-bold text-lg">
                      $
                    </span>
                    <input
                      className="w-full h-14 pl-12 pr-6 bg-surface-container-low border-none rounded-xl text-lg font-medium focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline-none"
                      placeholder="0.00"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant px-1">
                    Billing Cycle
                  </label>
                  <div className="relative">
                    <select
                      className="w-full h-14 px-6 bg-surface-container-low border-none rounded-xl text-lg font-medium appearance-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all cursor-pointer outline-none"
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
                    >
                      <option>Monthly</option>
                      <option>Yearly</option>
                      <option>Quarterly</option>
                      <option>Weekly</option>
                    </select>
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">
                      expand_more
                    </span>
                  </div>
                </div>
              </div>

              {/* Renewal Date + Linked Account */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant px-1">
                    Next Renewal Date
                  </label>
                  <div className="relative">
                    <input
                      className="w-full h-14 px-6 bg-surface-container-low border-none rounded-xl text-lg font-medium focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all outline-none"
                      type="date"
                      value={nextRenewal}
                      onChange={(e) => setNextRenewal(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-on-surface-variant px-1">
                    Linked Account/Ref
                  </label>
                  <input
                    className="w-full h-14 px-6 bg-surface-container-low border-none rounded-xl text-lg font-medium focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-all placeholder:text-outline-variant outline-none"
                    placeholder="e.g. Visa 4242 or Phone"
                    type="text"
                    value={linkedAccount}
                    onChange={(e) => setLinkedAccount(e.target.value)}
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-4 pt-4">
                <label className="block text-sm font-bold text-on-surface-variant px-1">
                  Category
                </label>
                <div className="flex flex-wrap gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => setCategory(cat.label)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all active:scale-95 ${
                        category === cat.label
                          ? "bg-primary text-on-primary"
                          : "bg-surface-container-high text-on-surface hover:bg-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{cat.icon}</span>
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="pt-6 flex flex-col md:flex-row gap-4 items-center">
                <button
                  type="submit"
                  className="w-full md:flex-1 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold text-lg shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <span className="material-symbols-outlined">add</span>
                  Add Subscription
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="w-full md:w-auto h-16 px-10 rounded-2xl bg-surface-container-low text-on-surface-variant font-bold hover:bg-surface-container-high transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-on-surface-variant/60 text-sm">
            <span className="material-symbols-outlined text-base">lightbulb</span>
            <span>Pro-tip: Most users save $45/mo by finding unused trials.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/currency";
import { computeNextRenewal, getDaysUntilRenewal, generatePaymentHistory } from "@/lib/mockData";
import { createClient } from "@/lib/supabase/client";

const CATEGORY_ICONS: Record<string, string> = {
  Entertainment: "movie", Productivity: "work", Design: "palette",
  Shopping: "shopping_bag", Health: "fitness_center", Gaming: "sports_esports",
  News: "newspaper", Other: "category",
};

function SpendingChart({ payments }: { payments: { date: string; amount: number; status: string }[] }) {
  if (payments.length === 0) return null;
  const successful = payments.filter((p) => p.status !== "failed").slice(0, 6).reverse();
  const maxAmount = Math.max(...successful.map((p) => p.amount), 1);

  return (
    <div className="relative h-64 w-full mt-4 flex items-end gap-2">
      <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="border-t border-slate-100 w-full h-px" />
        ))}
      </div>
      {successful.map((p, i) => {
        const heightPct = (p.amount / maxAmount) * 90 + 10;
        const isLast = i === successful.length - 1;
        const month = new Date(p.date).toLocaleDateString("en-US", { month: "short" }).toUpperCase();
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group">
            <div
              className={`w-full rounded-t-lg transition-all ${
                isLast ? "bg-primary shadow-lg shadow-primary/30" : "bg-primary/20 group-hover:bg-primary"
              }`}
              style={{ height: `${heightPct}%` }}
            />
            <span className={`text-[10px] font-label ${isLast ? "font-bold text-primary" : "text-on-surface-variant"}`}>
              {month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { subscriptions, cancelSubscription, updateSubscription, deleteSubscription, currency } = useStore();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));
  }, []);

  const sub = subscriptions.find((s) => s.id === params.id);

  if (!sub) {
    return (
      <div className="p-10 text-center">
        <p className="text-on-surface-variant">Subscription not found.</p>
        <Link href="/subscriptions" className="text-primary font-bold mt-4 inline-block">
          ← Back to subscriptions
        </Link>
      </div>
    );
  }

  const nextRenewal = computeNextRenewal(sub.startDate, sub.billingCycle);
  const daysLeft = getDaysUntilRenewal(sub.startDate, sub.billingCycle);

  const payments =
    sub.paymentHistory.length > 0
      ? sub.paymentHistory
      : generatePaymentHistory(sub.id, sub.name, sub.startDate, sub.billingCycle, sub.amount);

  const yearToDate = payments
    .filter((p) => p.status === "success" && new Date(p.date).getFullYear() === new Date().getFullYear())
    .reduce((sum, p) => sum + p.amount, 0);

  const startMs = new Date(sub.startDate).getTime();
  const monthsSubscribed = Math.floor((Date.now() - startMs) / (1000 * 60 * 60 * 24 * 30.44));

  const handleCancel = () => {
    if (confirm(`Cancel ${sub.name}? This action will mark it as cancelled.`)) {
      cancelSubscription(sub.id);
      router.push("/subscriptions");
    }
  };

  const handleDelete = () => {
    if (confirm(`Permanently delete ${sub.name}? This cannot be undone.`)) {
      deleteSubscription(sub.id);
      router.push("/subscriptions");
    }
  };

  const handleToggleAutoRenew = () => {
    updateSubscription(sub.id, { autoRenew: !sub.autoRenew });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:pb-24">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 text-on-surface-variant text-sm">
          <Link href="/subscriptions" className="hover:text-primary">Subscriptions</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-on-surface font-semibold">{sub.name}</span>
        </div>

        {isLoggedIn ? (
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-on-surface bg-surface-container hover:bg-surface-container-high transition-all active:scale-95 font-medium text-sm">
              <span className="material-symbols-outlined text-[20px]">edit</span>
              Edit
            </button>
            {sub.status === "active" && (
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-error bg-error-container/30 hover:bg-error-container/50 transition-all active:scale-95 font-medium text-sm"
              >
                <span className="material-symbols-outlined text-[20px]">cancel</span>
                Cancel
              </button>
            )}
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-error bg-error-container/30 hover:bg-error-container/60 transition-all active:scale-95 font-medium text-sm"
            >
              <span className="material-symbols-outlined text-[20px]">delete</span>
              Delete
            </button>
          </div>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-on-surface-variant bg-surface-container hover:bg-surface-container-high transition-all font-medium text-sm"
          >
            <span className="material-symbols-outlined text-[20px]">lock</span>
            Sign in to edit or delete
          </button>
        )}
      </div>

      {/* Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-3xl p-8 flex flex-col md:flex-row items-start md:items-center gap-8 shadow-sm">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 to-primary-container/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: "40px" }}>
              {CATEGORY_ICONS[sub.category] || "subscriptions"}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">{sub.name}</h1>
              <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest rounded-full">
                {sub.category}
              </span>
            </div>
            <p className="text-on-surface-variant font-body mb-4">
              {sub.billingCycle} billing
              {monthsSubscribed > 0 ? ` · ${monthsSubscribed} month${monthsSubscribed !== 1 ? "s" : ""} active` : ""}
            </p>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">
                  {sub.billingCycle} Amount
                </p>
                <p className="text-2xl font-bold font-headline text-primary">
                  {formatCurrency(sub.amount, currency)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant mb-1">
                  Next Renewal
                </p>
                <p className="text-2xl font-bold font-headline text-on-surface">
                  {new Date(nextRenewal).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div
          className={`bg-surface-container-lowest rounded-3xl p-8 shadow-sm flex flex-col justify-between border-l-4 ${
            sub.status === "active" ? "border-primary" : "border-error"
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-label font-semibold text-on-surface">Subscription Status</span>
              <div className={`flex items-center gap-1.5 ${sub.status === "active" ? "text-teal-600" : "text-error"}`}>
                <span className={`w-2 h-2 rounded-full ${sub.status === "active" ? "bg-teal-600" : "bg-error"}`} />
                <span className="text-xs font-bold uppercase">{sub.status}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-sm text-on-surface-variant">Year to date spend</span>
                <span className="font-headline font-bold">{formatCurrency(yearToDate, currency)}</span>
              </div>
              <div className="w-full bg-surface-container rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${Math.min(100, Math.max(5, ((30 - daysLeft) / 30) * 100))}%` }}
                />
              </div>
              <p className="text-[11px] text-on-surface-variant italic">
                {daysLeft === 0 ? "Renews today" : `Next bill due in ${daysLeft} day${daysLeft !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          {sub.status === "active" && (
            <button className="mt-6 w-full py-3 bg-gradient-to-br from-primary to-primary-container text-white font-label font-bold rounded-xl active:scale-95 transition-all shadow-lg shadow-primary/20">
              Manage Payment Method
            </button>
          )}
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold font-headline text-on-surface mb-8">Spending Trend</h3>
          <SpendingChart payments={payments} />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-6 shadow-sm">
            <h4 className="text-sm font-bold font-headline text-on-surface mb-4">Subscription Details</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container">category</span>
                <div>
                  <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-tighter">Category</p>
                  <p className="text-sm font-semibold">{sub.category}</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container">calendar_today</span>
                <div>
                  <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-tighter">Started</p>
                  <p className="text-sm font-semibold">
                    {new Date(sub.startDate).toLocaleDateString("en-US", {
                      month: "long", day: "numeric", year: "numeric",
                    })}
                  </p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container">repeat</span>
                <div>
                  <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-tighter">Billing Cycle</p>
                  <p className="text-sm font-semibold">{sub.billingCycle}</p>
                </div>
              </li>
              {sub.linkedAccount && (
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-container">credit_card</span>
                  <div>
                    <p className="text-[10px] font-label text-on-surface-variant uppercase tracking-tighter">Payment Method</p>
                    <p className="text-sm font-semibold">{sub.linkedAccount}</p>
                  </div>
                </li>
              )}
            </ul>
          </div>

          {sub.status === "active" && daysLeft <= 7 && (
            <div className="bg-tertiary-container/10 rounded-3xl p-6 shadow-sm border-l-4 border-tertiary">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-tertiary">event_upcoming</span>
                <div>
                  <h4 className="text-sm font-bold text-tertiary font-headline mb-1">Upcoming Renewal</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Renews on{" "}
                    {new Date(nextRenewal).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                    for <span className="font-bold">{formatCurrency(sub.amount, currency)}</span>.
                  </p>
                  {isLoggedIn && (
                    <button
                      onClick={handleToggleAutoRenew}
                      className="mt-3 text-xs font-bold text-tertiary underline decoration-2 underline-offset-4"
                    >
                      {sub.autoRenew ? "Turn off auto-renew" : "Turn on auto-renew"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-12 bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold font-headline text-on-surface mb-6">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-surface-container">
                  <th className="pb-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Date</th>
                  <th className="pb-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Description</th>
                  <th className="pb-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="pb-4 text-[10px] font-label uppercase tracking-widest text-on-surface-variant text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container/50">
                {payments.slice(0, 6).map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-5 font-medium text-sm">
                      {new Date(payment.date).toLocaleDateString("en-US", {
                        month: "short", day: "numeric", year: "numeric",
                      })}
                    </td>
                    <td className="py-5 text-sm">{payment.description}</td>
                    <td className="py-5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        payment.status === "success" ? "bg-teal-50 text-teal-700"
                          : payment.status === "pending" ? "bg-surface-container-high text-on-surface-variant"
                          : "bg-error-container/30 text-error"
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-5 text-right font-headline font-bold">
                      {formatCurrency(payment.amount, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { getTotalMonthly, getCategoryBreakdown } from "@/lib/mockData";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  Entertainment: { bg: "bg-primary/10", text: "text-primary", bar: "bg-primary" },
  Productivity: { bg: "bg-secondary/10", text: "text-secondary", bar: "bg-secondary" },
  Design: { bg: "bg-tertiary/10", text: "text-tertiary", bar: "bg-tertiary" },
  Gaming: { bg: "bg-tertiary-fixed-dim/30", text: "text-tertiary", bar: "bg-tertiary-fixed-dim" },
  Health: { bg: "bg-secondary-container/30", text: "text-secondary", bar: "bg-secondary-container" },
  Shopping: { bg: "bg-outline-variant/30", text: "text-on-surface-variant", bar: "bg-outline-variant" },
  Other: { bg: "bg-surface-container-high", text: "text-on-surface-variant", bar: "bg-surface-container-high" },
};

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

export default function InsightsPage() {
  const { subscriptions } = useStore();

  const active = subscriptions.filter((s) => s.status === "active");
  const totalMonthly = getTotalMonthly(active);
  const totalYearly = totalMonthly * 12;
  const categoryBreakdown = getCategoryBreakdown(active);

  const categoryAmounts: Record<string, number> = {};
  for (const sub of active) {
    const monthly =
      sub.billingCycle === "Monthly" ? sub.amount :
      sub.billingCycle === "Yearly" ? sub.amount / 12 :
      sub.billingCycle === "Quarterly" ? sub.amount / 3 :
      sub.amount * 4.33;
    categoryAmounts[sub.category] = (categoryAmounts[sub.category] || 0) + monthly;
  }

  const sortedCategories = Object.entries(categoryAmounts)
    .sort(([, a], [, b]) => b - a);

  const mostExpensive = [...active].sort((a, b) => b.amount - a.amount)[0];
  const mostRecent = [...active].sort(
    (a, b) => new Date(b.subscribedSince).getTime() - new Date(a.subscribedSince).getTime()
  )[0];

  // Monthly breakdown simulation (last 6 months)
  const monthlyHistory = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      label: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      amount: totalMonthly * (0.85 + Math.random() * 0.3),
    };
  });
  const maxBar = Math.max(...monthlyHistory.map((m) => m.amount));

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold font-headline">Spend Insights</h2>
        <p className="text-on-surface-variant mt-1">
          Analytics across all your {active.length} active subscriptions.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          {
            label: "Monthly Total",
            value: `$${totalMonthly.toFixed(2)}`,
            icon: "calendar_today",
            color: "text-primary",
          },
          {
            label: "Annual Total",
            value: `$${totalYearly.toFixed(0)}`,
            icon: "trending_up",
            color: "text-secondary",
          },
          {
            label: "Active Subs",
            value: active.length.toString(),
            icon: "subscriptions",
            color: "text-tertiary",
          },
          {
            label: "Avg Cost",
            value: active.length > 0 ? `$${(totalMonthly / active.length).toFixed(2)}` : "$0",
            icon: "analytics",
            color: "text-primary-container",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm">
            <span className={`material-symbols-outlined ${kpi.color} mb-2`}>{kpi.icon}</span>
            <p className={`text-2xl font-bold font-headline ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Spend Over Time */}
        <div className="lg:col-span-8 bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold font-headline mb-8">Monthly Spend Trend</h3>
          <div className="relative h-64 w-full flex items-end gap-3">
            <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="border-t border-slate-100 w-full h-px" />
              ))}
            </div>
            {monthlyHistory.map((month, i) => {
              const heightPct = (month.amount / maxBar) * 85 + 5;
              const isLast = i === monthlyHistory.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 group">
                  <div className="text-xs font-bold opacity-0 group-hover:opacity-100 text-on-surface transition-opacity">
                    ${month.amount.toFixed(0)}
                  </div>
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isLast
                        ? "bg-primary shadow-lg shadow-primary/30"
                        : "bg-primary/20 group-hover:bg-primary"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span
                    className={`text-[10px] font-label ${
                      isLast ? "font-bold text-primary" : "text-on-surface-variant"
                    }`}
                  >
                    {month.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
          <h3 className="text-xl font-bold font-headline mb-8">By Category</h3>
          <div className="space-y-4">
            {sortedCategories.map(([cat, amount]) => {
              const pct = Math.round((amount / totalMonthly) * 100);
              const colors = CATEGORY_COLORS[cat] || CATEGORY_COLORS.Other;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`material-symbols-outlined text-sm ${colors.text}`}>
                        {CATEGORY_ICONS[cat] || "category"}
                      </span>
                      <span className="text-sm font-medium">{cat}</span>
                    </div>
                    <span className="text-sm font-bold">${amount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-on-surface-variant w-8 text-right">
                      {pct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Spotlight Cards */}
        {mostExpensive && (
          <div className="lg:col-span-6 bg-surface-container-lowest rounded-3xl p-8 shadow-sm">
            <h3 className="text-sm font-bold font-headline text-on-surface-variant uppercase tracking-widest mb-4">
              Most Expensive
            </h3>
            <Link
              href={`/subscriptions/${mostExpensive.id}`}
              className="flex items-center gap-4 group"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-3xl">
                  {CATEGORY_ICONS[mostExpensive.category] || "subscriptions"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-xl">{mostExpensive.name}</p>
                <p className="text-sm text-on-surface-variant">{mostExpensive.category}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold font-headline text-primary">
                  ${mostExpensive.amount.toFixed(2)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-on-surface-variant">
                  {mostExpensive.billingCycle}
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* Potential Savings */}
        <div className="lg:col-span-6 bg-gradient-to-br from-primary to-primary-container rounded-3xl p-8 text-white shadow-xl shadow-primary/20 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-primary-fixed text-sm font-medium mb-1">Potential Savings</p>
            <h3 className="text-4xl font-headline font-extrabold mb-3">
              ${(totalMonthly * 0.12).toFixed(2)}/mo
            </h3>
            <p className="text-primary-fixed/80 text-sm leading-relaxed">
              Based on usage patterns, you could save by reviewing your{" "}
              {sortedCategories[0]?.[0] || "Entertainment"} subscriptions.
            </p>
            <Link
              href="/subscriptions"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold bg-white/20 hover:bg-white/30 transition-all px-4 py-2 rounded-xl"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              Review subscriptions
            </Link>
          </div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-3xl" />
        </div>
      </div>
    </div>
  );
}

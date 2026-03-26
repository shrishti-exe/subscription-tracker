"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { formatCurrency } from "@/lib/currency";
import {
  getTotalMonthly,
  getUpcomingRenewals,
  getDaysUntilRenewal,
  getCategoryBreakdown,
  computeNextRenewal,
} from "@/lib/mockData";

function SubIcon({ category }: { category: string }) {
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
  return (
    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary-container/20 rounded-xl flex items-center justify-center">
      <span className="material-symbols-outlined text-primary">
        {CATEGORY_ICONS[category] || "subscriptions"}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { subscriptions, currency } = useStore();

  const active = subscriptions.filter((s) => s.status === "active");
  const totalMonthly = getTotalMonthly(active);
  const upcoming = getUpcomingRenewals(active, 7);
  const nextRenewalSub = upcoming[0];
  const categoryBreakdown = getCategoryBreakdown(active);

  const saasSubscriptions = active.filter(
    (s) => s.category === "Productivity" || s.category === "Design"
  );
  const streamingSubscriptions = active.filter(
    (s) => s.category === "Entertainment"
  );

  const categoryColors: Record<string, string> = {
    Entertainment: "bg-primary",
    Productivity: "bg-secondary",
    Design: "bg-tertiary-fixed-dim",
    Gaming: "bg-tertiary",
    Health: "bg-secondary-container",
    Shopping: "bg-outline-variant",
    Other: "bg-surface-container-high",
  };

  const topCategories = Object.entries(categoryBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  const formattedTotal = formatCurrency(totalMonthly, currency);

  return (
    <div className="p-6 md:p-10 space-y-10 max-w-7xl mx-auto w-full">
      {/* Hero: Total Spend */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-end">
        <div className="lg:col-span-2">
          <p className="text-on-surface-variant font-medium mb-2 opacity-70">
            Total Monthly Investment
          </p>
          <div className="flex items-baseline gap-4">
            <h2 className="text-6xl md:text-7xl font-extrabold font-headline text-on-surface tracking-tighter">
              {formattedTotal}
            </h2>
            <span className="bg-primary-container/10 text-primary-container px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              {active.length} active
            </span>
          </div>
        </div>

        {/* Next Renewal Focus Card */}
        {nextRenewalSub && (() => {
          const days = getDaysUntilRenewal(nextRenewalSub.startDate, nextRenewalSub.billingCycle);
          return (
            <div className="glass-card p-6 rounded-3xl border border-white/40 shadow-[0px_20px_40px_rgba(25,28,29,0.06)] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  {days <= 2 ? "Critical" : "Upcoming"}
                </span>
              </div>
              <p className="text-xs font-semibold text-on-surface-variant mb-4 opacity-60">
                Next Renewal
              </p>
              <div className="flex items-center gap-4 mb-4">
                <SubIcon category={nextRenewalSub.category} />
                <div>
                  <p className="font-bold text-lg">{nextRenewalSub.name}</p>
                  <p className="text-sm text-tertiary font-medium">
                    {days === 0 ? "Renews today" : days === 1 ? "Renews tomorrow" : `Renews in ${days} days`}
                  </p>
                </div>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-tertiary h-full rounded-full"
                  style={{ width: `${Math.min(100, Math.max(10, ((7 - days) / 7) * 100))}%` }}
                />
              </div>
            </div>
          );
        })()}
      </section>

      {/* Grid Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Subscription Catalog */}
        <div className="xl:col-span-8 space-y-8">
          {saasSubscriptions.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-headline">Software &amp; SaaS</h3>
                <Link href="/subscriptions" className="text-sm text-primary font-bold hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {saasSubscriptions.map((sub) => {
                  const nextRenewal = computeNextRenewal(sub.startDate, sub.billingCycle);
                  return (
                    <Link
                      key={sub.id}
                      href={`/subscriptions/${sub.id}`}
                      className="bg-surface-container-lowest p-5 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-200/50"
                    >
                      <div className="flex items-center gap-4">
                        <SubIcon category={sub.category} />
                        <div>
                          <p className="font-bold">{sub.name}</p>
                          <p className="text-xs text-on-surface-variant opacity-60">
                            Next:{" "}
                            {new Date(nextRenewal).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatCurrency(sub.amount, currency)}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                          {sub.billingCycle}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {streamingSubscriptions.length > 0 && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-headline">Streaming Services</h3>
                <Link href="/subscriptions" className="text-sm text-primary font-bold hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {streamingSubscriptions.map((sub) => {
                  const daysLeft = getDaysUntilRenewal(sub.startDate, sub.billingCycle);
                  const nextRenewal = computeNextRenewal(sub.startDate, sub.billingCycle);
                  return (
                    <Link
                      key={sub.id}
                      href={`/subscriptions/${sub.id}`}
                      className={`bg-surface-container-lowest p-5 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-200/50 ${
                        daysLeft <= 1 ? "border-l-4 border-tertiary-fixed" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <SubIcon category={sub.category} />
                        <div>
                          <p className="font-bold">{sub.name}</p>
                          {daysLeft <= 1 ? (
                            <p className="text-xs text-tertiary font-bold">
                              Renewal {daysLeft === 0 ? "Today" : "Tomorrow"}
                            </p>
                          ) : (
                            <p className="text-xs text-on-surface-variant opacity-60">
                              Next:{" "}
                              {new Date(nextRenewal).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatCurrency(sub.amount, currency)}</p>
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                          {sub.billingCycle}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {active.length === 0 && (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">subscriptions</span>
              <p className="text-on-surface-variant mt-4">No subscriptions yet.</p>
              <Link href="/subscriptions/add" className="mt-4 inline-block text-primary font-bold">
                Add your first subscription →
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar: Upcoming & Insights */}
        <div className="xl:col-span-4 space-y-8">
          <div className="bg-surface-container-low p-8 rounded-[2rem] space-y-6">
            <h3 className="text-lg font-bold font-headline flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary">notification_important</span>
              7-Day Forecast
            </h3>

            <div className="space-y-4">
              {upcoming.length === 0 ? (
                <p className="text-sm text-on-surface-variant opacity-60">
                  No renewals in the next 7 days.
                </p>
              ) : (
                upcoming.map((sub) => {
                  const nextRenewal = computeNextRenewal(sub.startDate, sub.billingCycle);
                  return (
                    <Link key={sub.id} href={`/subscriptions/${sub.id}`} className="flex items-center gap-4 group">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs font-bold text-on-surface-variant shadow-sm shrink-0">
                        {new Date(nextRenewal).getDate()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{sub.name}</p>
                        <p className="text-[10px] text-on-surface-variant/60">
                          {new Date(nextRenewal).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          · {formatCurrency(sub.amount, currency)}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                        chevron_right
                      </span>
                    </Link>
                  );
                })
              )}
            </div>

            {topCategories.length > 0 && (
              <div className="pt-6 border-t border-outline-variant/10">
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm font-bold">Spending by Category</p>
                  <span className="material-symbols-outlined text-slate-400">pie_chart</span>
                </div>
                <div className="space-y-3">
                  {topCategories.map(([cat, pct]) => (
                    <div key={cat} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${categoryColors[cat] || "bg-primary"}`} />
                      <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${categoryColors[cat] || "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

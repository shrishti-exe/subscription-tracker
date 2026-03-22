"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  getTotalMonthly,
  getUpcomingRenewals,
  getDaysUntilRenewal,
  getCategoryBreakdown,
} from "@/lib/mockData";

const SUB_LOGOS: Record<string, string> = {
  "1": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Adobe_logo_and_wordmark_%282020%29.svg/320px-Adobe_logo_and_wordmark_%282020%29.svg.png",
  "2": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Netflix_2015_logo.svg/320px-Netflix_2015_logo.svg.png",
  "3": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/168px-Spotify_logo_without_text.svg.png",
  "4": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Notion-logo.svg/180px-Notion-logo.svg.png",
  "5": "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
};

function SubLogo({ id, name }: { id: string; name: string }) {
  const logo = SUB_LOGOS[id];
  if (logo) {
    return (
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} alt={name} className="w-7 h-7 object-contain" />
      </div>
    );
  }
  return (
    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary-container/20 rounded-xl flex items-center justify-center">
      <span className="text-primary font-bold text-lg">{name[0]}</span>
    </div>
  );
}

export default function DashboardPage() {
  const { subscriptions } = useStore();

  const active = subscriptions.filter((s) => s.status === "active");
  const totalMonthly = getTotalMonthly(active);
  const upcoming = getUpcomingRenewals(active, 7);
  const nextRenewal = upcoming[0];
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

  const dollars = Math.floor(totalMonthly);
  const cents = String(Math.round((totalMonthly % 1) * 100)).padStart(2, "0");

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
              ${dollars}
              <span className="text-primary font-bold">.{cents}</span>
            </h2>
            <span className="bg-primary-container/10 text-primary-container px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              {active.length} active
            </span>
          </div>
        </div>

        {/* Next Renewal Focus Card */}
        {nextRenewal && (
          <div className="glass-card p-6 rounded-3xl border border-white/40 shadow-[0px_20px_40px_rgba(25,28,29,0.06)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase">
                {getDaysUntilRenewal(nextRenewal.nextRenewal) <= 2 ? "Critical" : "Upcoming"}
              </span>
            </div>
            <p className="text-xs font-semibold text-on-surface-variant mb-4 opacity-60">
              Next Renewal
            </p>
            <div className="flex items-center gap-4 mb-4">
              <SubLogo id={nextRenewal.id} name={nextRenewal.name} />
              <div>
                <p className="font-bold text-lg">{nextRenewal.name}</p>
                <p className="text-sm text-tertiary font-medium">
                  {(() => {
                    const d = getDaysUntilRenewal(nextRenewal.nextRenewal);
                    if (d === 0) return "Renews today";
                    if (d === 1) return "Renews tomorrow";
                    return `Renews in ${d} days`;
                  })()}
                </p>
              </div>
            </div>
            <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-tertiary h-full rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      10,
                      ((7 - getDaysUntilRenewal(nextRenewal.nextRenewal)) / 7) * 100
                    )
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
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
                {saasSubscriptions.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/subscriptions/${sub.id}`}
                    className="bg-surface-container-lowest p-5 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-200/50"
                  >
                    <div className="flex items-center gap-4">
                      <SubLogo id={sub.id} name={sub.name} />
                      <div>
                        <p className="font-bold">{sub.name}</p>
                        <p className="text-xs text-on-surface-variant opacity-60">
                          Next:{" "}
                          {new Date(sub.nextRenewal).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">${sub.amount.toFixed(2)}</p>
                      <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
                        {sub.billingCycle}
                      </p>
                    </div>
                  </Link>
                ))}
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
                  const daysLeft = getDaysUntilRenewal(sub.nextRenewal);
                  return (
                    <Link
                      key={sub.id}
                      href={`/subscriptions/${sub.id}`}
                      className={`bg-surface-container-lowest p-5 rounded-2xl flex items-center justify-between transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-200/50 ${
                        daysLeft <= 1 ? "border-l-4 border-tertiary-fixed" : ""
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <SubLogo id={sub.id} name={sub.name} />
                        <div>
                          <p className="font-bold">{sub.name}</p>
                          {daysLeft <= 1 ? (
                            <p className="text-xs text-tertiary font-bold">
                              Renewal {daysLeft === 0 ? "Today" : "Tomorrow"}
                            </p>
                          ) : (
                            <p className="text-xs text-on-surface-variant opacity-60">
                              Next:{" "}
                              {new Date(sub.nextRenewal).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">${sub.amount.toFixed(2)}</p>
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
                upcoming.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/subscriptions/${sub.id}`}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs font-bold text-on-surface-variant shadow-sm shrink-0">
                      {new Date(sub.nextRenewal).getDate()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{sub.name}</p>
                      <p className="text-[10px] text-on-surface-variant/60">
                        {new Date(sub.nextRenewal).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        • ${sub.amount.toFixed(2)}
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                      chevron_right
                    </span>
                  </Link>
                ))
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
                      <div
                        className={`w-2 h-2 rounded-full ${
                          categoryColors[cat] || "bg-primary"
                        }`}
                      />
                      <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            categoryColors[cat] || "bg-primary"
                          }`}
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

"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { getUpcomingRenewals, getDaysUntilRenewal, computeNextRenewal } from "@/lib/mockData";

export default function RemindersPage() {
  const { subscriptions, alertPreferences, updateAlertPreferences } = useStore();
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSendReminder = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/send-reminders", { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        setSendResult({ ok: true, msg: json.renewals > 0 ? `Email sent — ${json.renewals} upcoming renewal${json.renewals !== 1 ? "s" : ""}` : "No renewals in the next 3 days." });
      } else {
        setSendResult({ ok: false, msg: json.error || "Failed to send." });
      }
    } catch {
      setSendResult({ ok: false, msg: "Network error." });
    } finally {
      setSending(false);
    }
  };

  const active = subscriptions.filter((s) => s.status === "active");
  const upcoming7 = getUpcomingRenewals(active, 7);
  const upcomingWeeklyTotal = upcoming7.reduce((sum, s) => sum + s.amount, 0);

  const getRenewalLabel = (startDate: string, billingCycle: import("@/types").BillingCycle) => {
    const days = getDaysUntilRenewal(startDate, billingCycle);
    if (days === 0) return { text: "Today", cls: "text-error font-bold" };
    if (days === 1) return { text: "Tomorrow", cls: "text-tertiary font-bold" };
    if (days <= 3) return { text: "Urgent Alert", cls: "text-tertiary font-bold tracking-widest uppercase text-[10px]" };
    if (days <= 5) return { text: "Nudge Sent", cls: "text-tertiary font-bold tracking-widest uppercase text-[10px]" };
    return { text: "Scheduled", cls: "text-on-surface-variant font-bold tracking-widest uppercase text-[10px]" };
  };

  return (
    <div className="max-w-6xl mx-auto px-6 pt-8 pb-24 md:pb-12">
      <div className="mb-10">
        <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">
          Renewal Intelligence
        </h2>
        <p className="text-on-surface-variant mt-1">Smart reminders for your subscriptions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Upcoming Renewals */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_20px_40px_rgba(25,28,29,0.04)]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-tertiary">history_toggle_off</span>
                <h3 className="font-headline text-xl font-bold">Upcoming: Next 7 Days</h3>
              </div>
              <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
                {upcoming7.length} Pending
              </span>
            </div>

            <div className="space-y-4">
              {upcoming7.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">
                    event_available
                  </span>
                  <p className="text-on-surface-variant mt-3">No renewals in the next 7 days.</p>
                </div>
              ) : (
                upcoming7.map((sub) => {
                  const label = getRenewalLabel(sub.startDate, sub.billingCycle);
                  const days = getDaysUntilRenewal(sub.startDate, sub.billingCycle);
                  return (
                    <Link
                      key={sub.id}
                      href={`/subscriptions/${sub.id}`}
                      className="group relative flex items-center justify-between p-4 bg-surface rounded-2xl transition-all hover:bg-surface-container-low"
                    >
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-tertiary-container rounded-full" />
                      <div className="flex items-center space-x-4 pl-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary-container/10 flex items-center justify-center">
                          <span className="text-primary font-bold text-lg">{sub.name[0]}</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface">{sub.name}</h4>
                          <p className="text-xs text-on-surface-variant">
                            {days === 0 ? "Renews today" : `Renews in ${days} day${days !== 1 ? "s" : ""}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-headline font-bold text-lg">${sub.amount.toFixed(2)}</p>
                        <p className={label.cls}>{label.text}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>

          {/* Weekly Summary */}
          <div className="bg-gradient-to-br from-primary to-primary-container rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20">
            <div className="relative z-10">
              <p className="text-primary-fixed text-sm font-medium mb-1">Weekly Commitment</p>
              <h3 className="text-4xl font-headline font-extrabold mb-4">
                ${upcomingWeeklyTotal.toFixed(2)}
              </h3>
              <p className="text-primary-fixed/80 text-xs max-w-[200px]">
                Total for upcoming renewals this week.
              </p>
            </div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-3xl" />
            <div className="absolute bottom-4 right-8">
              <span className="material-symbols-outlined text-6xl opacity-20">verified_user</span>
            </div>
          </div>
        </div>

        {/* Right: Alert Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_20px_40px_rgba(25,28,29,0.04)]">
            <div className="flex items-center space-x-3 mb-8">
              <span className="material-symbols-outlined text-primary">notifications_active</span>
              <h3 className="font-headline text-xl font-bold">Alert Preferences</h3>
            </div>

            <div className="space-y-8">
              {/* Push Toggle */}
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <p className="font-bold text-on-surface">Push Notifications</p>
                  <p className="text-xs text-on-surface-variant">Immediate alerts on your devices</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={alertPreferences.pushNotifications}
                    onChange={(e) => updateAlertPreferences({ pushNotifications: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>

              {/* Email Toggle */}
              <div className="flex items-center justify-between">
                <div className="pr-4">
                  <p className="font-bold text-on-surface">Email Alerts</p>
                  <p className="text-xs text-on-surface-variant">Weekly summaries and billing reminders</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={alertPreferences.emailAlerts}
                    onChange={(e) => updateAlertPreferences({ emailAlerts: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                </label>
              </div>

              {/* Advance Days */}
              <div className="pt-4 border-t border-surface-container-high bg-surface-container-low/30 rounded-2xl p-4">
                <p className="font-bold text-on-surface mb-4">Advance Notice</p>
                <div className="flex items-center justify-between bg-white p-2 rounded-xl mb-3">
                  <button
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
                    onClick={() => updateAlertPreferences({ advanceDays: Math.max(1, alertPreferences.advanceDays - 1) })}
                  >
                    <span className="material-symbols-outlined text-sm">remove</span>
                  </button>
                  <div className="text-center">
                    <span className="text-2xl font-extrabold font-headline text-primary">
                      {alertPreferences.advanceDays}
                    </span>
                    <span className="text-xs font-bold text-on-surface-variant ml-1">Days Before</span>
                  </div>
                  <button
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors"
                    onClick={() => updateAlertPreferences({ advanceDays: Math.min(30, alertPreferences.advanceDays + 1) })}
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                  </button>
                </div>
                <p className="text-[10px] text-on-surface-variant italic">
                  Alert sent this many days before each renewal.
                </p>
              </div>

              <button
                onClick={handleSendReminder}
                disabled={sending}
                className="w-full bg-primary text-on-primary font-bold py-3 rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {sending ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-sm">send</span>
                )}
                {sending ? "Sending..." : "Send Reminder Email Now"}
              </button>
              {sendResult && (
                <p className={`text-xs text-center mt-2 font-medium ${sendResult.ok ? "text-teal-600" : "text-error"}`}>
                  {sendResult.ok ? "✓ " : "✗ "}{sendResult.msg}
                </p>
              )}
            </div>
          </div>

          {/* Quiet Mode */}
          <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-[0px_20px_40px_rgba(25,28,29,0.04)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-on-surface-variant">bedtime</span>
                <p className="font-bold">Quiet Mode</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={alertPreferences.quietMode}
                  onChange={(e) => updateAlertPreferences({ quietMode: e.target.checked })}
                />
                <div className="w-11 h-6 bg-surface-container-high rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mute non-urgent billing reminders between 10:00 PM and 7:00 AM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

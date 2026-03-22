"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { SubscriptionCategory } from "@/types";

type Step = "phone" | "linking" | "review" | "done";

interface DetectedSub {
  name: string;
  amount: number;
  billingCycle: string;
  nextRenewal: string;
  confidence: string;
  occurrences: number;
  selected: boolean;
}

export default function ConnectBankPage() {
  const router = useRouter();
  const { addSubscription } = useStore();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [detected, setDetected] = useState<DetectedSub[]>([]);
  const [error, setError] = useState("");

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setLoading(true);
    setStep("linking");

    try {
      // Get link token
      const res = await fetch("/api/plaid/create-link-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();

      // In production: open Plaid Link with data.link_token
      // For demo: simulate the exchange
      await new Promise((r) => setTimeout(r, 2000)); // Simulate Plaid Link opening

      // Exchange token (demo)
      const exchangeRes = await fetch("/api/plaid/exchange-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_token: "demo_public_token", phone }),
      });
      const exchangeData = await exchangeRes.json();

      setDetected(
        exchangeData.subscriptions.map((s: DetectedSub) => ({
          ...s,
          selected: true,
        }))
      );
      setStep("review");
    } catch (err) {
      setError("Failed to connect bank. Please try again.");
      setStep("phone");
    } finally {
      setLoading(false);
    }
  };

  const toggleSub = (i: number) => {
    setDetected((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, selected: !s.selected } : s))
    );
  };

  const handleImport = () => {
    for (const sub of detected.filter((s) => s.selected)) {
      addSubscription({
        name: sub.name,
        amount: sub.amount,
        billingCycle: sub.billingCycle as "Monthly" | "Yearly" | "Quarterly" | "Weekly",
        nextRenewal: sub.nextRenewal,
        category: "Entertainment" as SubscriptionCategory,
        status: "active",
        subscribedSince: new Date().toISOString().split("T")[0],
        autoRenew: true,
        source: "bank",
      });
    }
    setStep("done");
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-10 min-h-full">
      <div className="w-full max-w-lg">
        {/* Phone Step */}
        {step === "phone" && (
          <div className="bg-surface-container-lowest p-10 rounded-[2rem] shadow-[0px_20px_40px_rgba(25,28,29,0.06)]">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">account_balance</span>
              </div>
              <h2 className="text-3xl font-extrabold font-headline">Connect Your Bank</h2>
              <p className="text-on-surface-variant mt-2 text-sm">
                Enter your phone number to find all bank accounts linked to your identity,
                then we&apos;ll automatically detect your subscriptions.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-error-container/30 text-error rounded-xl mb-6">
                <span className="material-symbols-outlined">error</span>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
                    phone
                  </span>
                  <input
                    type="tel"
                    className="w-full h-14 pl-12 pr-6 bg-surface-container-low border-none rounded-xl text-lg font-medium focus:ring-2 focus:ring-primary outline-none placeholder:text-outline-variant"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-surface-container-low rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                  What happens next
                </p>
                {[
                  "We verify your identity via phone",
                  "You securely connect your bank accounts via Plaid",
                  "We scan 90 days of transactions",
                  "Recurring charges are detected automatically",
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">link</span>
                Connect Bank Accounts
              </button>

              <p className="text-center text-xs text-on-surface-variant/60">
                Bank-grade encryption · Read-only access · Powered by Plaid
              </p>
            </form>
          </div>
        )}

        {/* Linking Step */}
        {step === "linking" && (
          <div className="bg-surface-container-lowest p-10 rounded-[2rem] shadow-[0px_20px_40px_rgba(25,28,29,0.06)] text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <span className="material-symbols-outlined text-primary text-3xl">sync</span>
            </div>
            <h3 className="text-2xl font-bold font-headline mb-2">Scanning Transactions</h3>
            <p className="text-on-surface-variant text-sm">
              Connecting to your bank and analyzing 90 days of transaction history...
            </p>
            <div className="mt-8 w-full bg-surface-container-low rounded-full h-2">
              <div className="bg-primary h-2 rounded-full w-2/3 transition-all animate-pulse" />
            </div>
          </div>
        )}

        {/* Review Step */}
        {step === "review" && (
          <div className="bg-surface-container-lowest p-8 rounded-[2rem] shadow-[0px_20px_40px_rgba(25,28,29,0.06)]">
            <div className="mb-6">
              <h3 className="text-2xl font-bold font-headline">Detected Subscriptions</h3>
              <p className="text-sm text-on-surface-variant mt-1">
                Select which ones to add to your tracker.
              </p>
            </div>

            <div className="space-y-3 mb-8">
              {detected.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => toggleSub(i)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    sub.selected
                      ? "border-primary bg-primary/5"
                      : "border-transparent bg-surface-container-low"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                      sub.selected
                        ? "border-primary bg-primary"
                        : "border-outline-variant"
                    }`}
                  >
                    {sub.selected && (
                      <span className="material-symbols-outlined text-white text-sm">check</span>
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold">{sub.name}</p>
                    <p className="text-xs text-on-surface-variant">
                      {sub.billingCycle} · {sub.occurrences} payments detected
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">${sub.amount.toFixed(2)}</p>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        sub.confidence === "high"
                          ? "text-teal-600"
                          : "text-tertiary"
                      }`}
                    >
                      {sub.confidence} confidence
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleImport}
                className="flex-1 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
              >
                Import {detected.filter((s) => s.selected).length} Subscriptions
              </button>
              <button
                onClick={() => setStep("phone")}
                className="px-6 h-14 rounded-2xl bg-surface-container-low text-on-surface-variant font-bold hover:bg-surface-container-high transition-all"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Done Step */}
        {step === "done" && (
          <div className="bg-surface-container-lowest p-10 rounded-[2rem] shadow-[0px_20px_40px_rgba(25,28,29,0.06)] text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-teal-600 text-3xl">check_circle</span>
            </div>
            <h3 className="text-2xl font-bold font-headline mb-2">All Set!</h3>
            <p className="text-on-surface-variant text-sm mb-8">
              Your subscriptions have been imported successfully.
            </p>
            <button
              onClick={() => router.push("/")}
              className="w-full h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container text-white font-bold shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
            >
              View Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

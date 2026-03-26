"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";

export default function TopBar() {
  const [query, setQuery] = useState("");
  const { subscriptions, currency, setCurrency } = useStore();
  const router = useRouter();

  const filtered = query.length > 1
    ? subscriptions.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl flex justify-between items-center px-6 py-4 shadow-[0px_20px_40px_rgba(25,28,29,0.06)]">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            placeholder="Search subscriptions..."
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {filtered.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-outline-variant/20 overflow-hidden z-50">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  className="w-full text-left px-4 py-3 hover:bg-surface-container-low flex items-center gap-3 transition-colors"
                  onClick={() => {
                    setQuery("");
                    router.push(`/subscriptions/${s.id}`);
                  }}
                >
                  <span className="material-symbols-outlined text-primary text-sm">subscriptions</span>
                  <span className="text-sm font-medium">{s.name}</span>
                  <span className="ml-auto text-xs text-on-surface-variant">${s.amount}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Currency toggle */}
        <div className="flex items-center bg-surface-container-low rounded-xl p-1 gap-0.5">
          <button
            onClick={() => setCurrency("INR")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currency === "INR"
                ? "bg-primary text-white shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            ₹ INR
          </button>
          <button
            onClick={() => setCurrency("USD")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              currency === "USD"
                ? "bg-primary text-white shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            $ USD
          </button>
        </div>
        <button className="p-2 text-slate-500 hover:bg-teal-50/50 rounded-full transition-all active:scale-95">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="p-2 text-slate-500 hover:bg-teal-50/50 rounded-full transition-all active:scale-95">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}

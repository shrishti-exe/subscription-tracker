"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/subscriptions", icon: "credit_card", label: "Subs" },
  { href: "/reminders", icon: "notifications_active", label: "Alerts" },
  { href: "/insights", icon: "bar_chart", label: "Trends" },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-3 bg-white/80 backdrop-blur-lg shadow-[0_-10px_30px_rgba(0,0,0,0.05)] md:hidden">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex flex-col items-center justify-center px-4 py-2 transition-all rounded-2xl ${
            isActive(tab.href)
              ? "bg-teal-50 text-teal-700"
              : "text-slate-400 hover:bg-slate-50"
          }`}
        >
          <span
            className="material-symbols-outlined"
            style={
              isActive(tab.href)
                ? { fontVariationSettings: "'FILL' 1" }
                : undefined
            }
          >
            {tab.icon}
          </span>
          <span className="text-[10px] uppercase tracking-widest mt-1 font-label">
            {tab.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}

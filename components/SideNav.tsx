"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", icon: "dashboard", label: "Overview" },
  { href: "/subscriptions", icon: "subscriptions", label: "Subscriptions" },
  { href: "/reminders", icon: "event_upcoming", label: "Reminders" },
  { href: "/insights", icon: "query_stats", label: "Insights" },
  { href: "/team", icon: "group", label: "Team" },
];

export default function SideNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 flex flex-col py-8 px-4 z-40 hidden md:flex">
      <div className="mb-10 px-4">
        <h1 className="text-xl font-black text-teal-800 font-headline">The Curator</h1>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">Premium Intelligence</p>
      </div>

      <nav className="flex-1 space-y-2">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 text-sm transition-all duration-300 ${
              isActive(link.href)
                ? "text-teal-700 font-bold border-r-4 border-teal-600 bg-white rounded-l-xl"
                : "text-slate-500 hover:text-teal-600 hover:bg-white rounded-xl"
            }`}
          >
            <span className="material-symbols-outlined">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 space-y-2">
        <Link
          href="/subscriptions/add"
          className="w-full bg-gradient-to-br from-primary to-primary-container text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 mb-6 active:scale-95 transition-transform shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Add New
        </Link>
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-2 text-sm transition-all duration-300 ${
            isActive("/settings")
              ? "text-teal-700 font-bold border-r-4 border-teal-600 bg-white rounded-l-xl"
              : "text-slate-500 hover:text-teal-600 hover:bg-white rounded-xl"
          }`}
        >
          <span className="material-symbols-outlined">settings</span>
          Settings
        </Link>
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-4 py-2 text-sm transition-all duration-300 ${
            isActive("/profile")
              ? "text-teal-700 font-bold border-r-4 border-teal-600 bg-white rounded-l-xl"
              : "text-slate-500 hover:text-teal-600 hover:bg-white rounded-xl"
          }`}
        >
          <span className="material-symbols-outlined">account_circle</span>
          Profile
        </Link>
      </div>
    </aside>
  );
}

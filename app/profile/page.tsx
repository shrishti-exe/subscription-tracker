"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useStore } from "@/lib/store";
import { getTotalMonthly } from "@/lib/mockData";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { subscriptions } = useStore();

  const supabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, [supabaseConfigured]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const active = subscriptions.filter((s) => s.status === "active");
  const totalMonthly = getTotalMonthly(active);
  const totalYearly = totalMonthly * 12;

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || "Demo User";
  const email = user?.email || "demo@example.com";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full p-10">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full">
      <h2 className="text-3xl font-extrabold font-headline mb-8">Profile</h2>

      {/* Identity Card */}
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm mb-6">
        <div className="flex items-center gap-6">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-20 h-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white text-2xl font-bold font-headline">
              {initials}
            </div>
          )}
          <div>
            <h3 className="text-2xl font-bold font-headline">{displayName}</h3>
            <p className="text-on-surface-variant">{email}</p>
            {user ? (
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                Signed in with Google
              </span>
            ) : (
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
                Demo mode
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active Subs", value: active.length.toString(), icon: "subscriptions" },
          { label: "Monthly Cost", value: `$${totalMonthly.toFixed(2)}`, icon: "calendar_today" },
          { label: "Annual Cost", value: `$${totalYearly.toFixed(0)}`, icon: "trending_up" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm text-center"
          >
            <span className="material-symbols-outlined text-primary mb-2">{stat.icon}</span>
            <p className="text-2xl font-bold font-headline text-primary">{stat.value}</p>
            <p className="text-xs text-on-surface-variant mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Account Settings */}
      <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm mb-6">
        <h4 className="font-bold font-headline mb-6">Account</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-outline-variant/20">
            <div>
              <p className="font-medium text-sm">Display Name</p>
              <p className="text-xs text-on-surface-variant">{displayName}</p>
            </div>
            <button className="text-xs text-primary font-bold">Edit</button>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-outline-variant/20">
            <div>
              <p className="font-medium text-sm">Email</p>
              <p className="text-xs text-on-surface-variant">{email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-sm">Authentication</p>
              <p className="text-xs text-on-surface-variant">
                {user ? "Google OAuth" : "Demo mode — sign in to save data"}
              </p>
            </div>
            {!user && supabaseConfigured && (
              <button
                onClick={() => router.push("/login")}
                className="text-xs text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-full"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sign out */}
      {user && (
        <button
          onClick={handleSignOut}
          className="w-full h-14 rounded-2xl bg-error-container/30 text-error font-bold hover:bg-error-container/50 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined">logout</span>
          Sign Out
        </button>
      )}
    </div>
  );
}

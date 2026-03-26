"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Subscription, AlertPreferences } from "@/types";
import { MOCK_SUBSCRIPTIONS, MOCK_USER } from "./mockData";
import { Currency } from "./currency";

// NEXT_PUBLIC_ vars are inlined at build time — safe to use without window check
const SUPABASE_CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

interface StoreContextType {
  subscriptions: Subscription[];
  alertPreferences: AlertPreferences;
  teamId: string | null;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  addSubscription: (s: Omit<Subscription, "id" | "paymentHistory">) => Promise<void>;
  updateSubscription: (id: string, updates: Partial<Subscription>) => Promise<void>;
  cancelSubscription: (id: string) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
  updateAlertPreferences: (prefs: Partial<AlertPreferences>) => void;
  refreshSubscriptions: (teamId?: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = "curator_subscriptions";
const PREFS_KEY = "curator_alert_prefs";
const CURRENCY_KEY = "curator_currency";

export function StoreProvider({
  children,
  initialTeamId,
}: {
  children: React.ReactNode;
  initialTeamId?: string | null;
}) {
  // Always start with [] to avoid SSR/client hydration mismatch.
  // Demo mode (no Supabase) loads from localStorage in the effect below.
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [alertPreferences, setAlertPreferences] = useState<AlertPreferences>(
    MOCK_USER.alertPreferences
  );
  const [teamId, setTeamId] = useState<string | null>(initialTeamId ?? null);
  const [currency, setCurrencyState] = useState<Currency>("INR");

  // Load currency preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CURRENCY_KEY);
      if (stored === "USD" || stored === "INR") setCurrencyState(stored);
    } catch {}
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    try { localStorage.setItem(CURRENCY_KEY, c); } catch {}
  };

  // If teamId wasn't provided server-side, fetch it client-side
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;
    if (teamId) {
      refreshSubscriptions(teamId);
      return;
    }
    // Fallback: resolve teamId on the client
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: membership } = await supabase
          .from("team_members")
          .select("team_id")
          .eq("user_id", user.id)
          .single();
        if (membership?.team_id) {
          setTeamId(membership.team_id);
          // teamId state update will re-trigger this effect
        }
      } catch {}
    })();
  }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load from localStorage on mount (fallback / demo mode)
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setSubscriptions(stored ? JSON.parse(stored) : MOCK_SUBSCRIPTIONS);
        const prefs = localStorage.getItem(PREFS_KEY);
        if (prefs) setAlertPreferences(JSON.parse(prefs));
      } catch {}
    }
  }, []);

  // Persist to localStorage (demo mode)
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
      } catch {}
    }
  }, [subscriptions]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(alertPreferences));
    } catch {}
  }, [alertPreferences]);

  const refreshSubscriptions = useCallback(async (tid?: string) => {
    const activeTeamId = tid ?? teamId;
    if (!SUPABASE_CONFIGURED || !activeTeamId) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error } = await supabase
        .rpc("get_subscriptions_with_creator", { p_team_id: activeTeamId });

      if (!error && data) {
        // Map snake_case DB fields to camelCase
        const mapped: Subscription[] = (data as any[]).map((row) => ({
          id: row.id,
          name: row.name,
          amount: row.amount,
          billingCycle: row.billing_cycle,
          startDate: row.start_date,
          category: row.category,
          linkedAccount: row.linked_account,
          status: row.status,
          autoRenew: row.auto_renew,
          notes: row.notes,
          createdBy: row.created_by_email ?? undefined,
          paymentHistory: [],
        }));
        setSubscriptions(mapped);
      }
    } catch {}
  }, [teamId]);

  const addSubscription = useCallback(async (s: Omit<Subscription, "id" | "paymentHistory">) => {
    if (SUPABASE_CONFIGURED) {
      try {
        const { createSubscription } = await import("@/app/actions/subscriptions");
        const result = await createSubscription({
          name: s.name,
          amount: s.amount,
          billingCycle: s.billingCycle,
          startDate: s.startDate,
          category: s.category,
          linkedAccount: s.linkedAccount,
          status: s.status,
          autoRenew: s.autoRenew,
          notes: s.notes,
        });
        if (result.teamId && !teamId) setTeamId(result.teamId);
        await refreshSubscriptions(result.teamId);
        return;
      } catch (e) {
        console.error("addSubscription error:", e);
      }
    }

    // localStorage fallback (demo mode)
    const newSub: Subscription = { ...s, id: `sub_${Date.now()}`, paymentHistory: [] };
    setSubscriptions((prev) => [newSub, ...prev]);
  }, [teamId, refreshSubscriptions]);

  const updateSubscription = useCallback(async (id: string, updates: Partial<Subscription>) => {
    // Optimistic local update
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));

    if (SUPABASE_CONFIGURED && teamId) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase
          .from("subscriptions")
          .update({
            ...(updates.name && { name: updates.name }),
            ...(updates.amount !== undefined && { amount: updates.amount }),
            ...(updates.billingCycle && { billing_cycle: updates.billingCycle }),
            ...(updates.startDate && { start_date: updates.startDate }),
            ...(updates.category && { category: updates.category }),
            ...(updates.linkedAccount !== undefined && { linked_account: updates.linkedAccount }),
            ...(updates.status && { status: updates.status }),
            ...(updates.autoRenew !== undefined && { auto_renew: updates.autoRenew }),
          })
          .eq("id", id);
      } catch {}
    }
  }, [teamId]);

  const cancelSubscription = useCallback(async (id: string) => {
    await updateSubscription(id, { status: "cancelled" });
  }, [updateSubscription]);

  const deleteSubscription = useCallback(async (id: string) => {
    // Optimistic local delete
    setSubscriptions((prev) => prev.filter((s) => s.id !== id));

    if (SUPABASE_CONFIGURED && teamId) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.from("subscriptions").delete().eq("id", id);
      } catch {}
    } else {
      // localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const subs: Subscription[] = JSON.parse(stored);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(subs.filter((s) => s.id !== id)));
        }
      } catch {}
    }
  }, [teamId]);

  const updateAlertPreferences = (prefs: Partial<AlertPreferences>) => {
    setAlertPreferences((prev) => ({ ...prev, ...prefs }));
  };

  return (
    <StoreContext.Provider
      value={{
        subscriptions,
        alertPreferences,
        teamId,
        currency,
        setCurrency,
        addSubscription,
        updateSubscription,
        cancelSubscription,
        deleteSubscription,
        updateAlertPreferences,
        refreshSubscriptions,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

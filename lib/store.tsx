"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Subscription, AlertPreferences } from "@/types";
import { MOCK_SUBSCRIPTIONS, MOCK_USER } from "./mockData";

interface StoreContextType {
  subscriptions: Subscription[];
  alertPreferences: AlertPreferences;
  addSubscription: (s: Omit<Subscription, "id" | "paymentHistory">) => void;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  cancelSubscription: (id: string) => void;
  updateAlertPreferences: (prefs: Partial<AlertPreferences>) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

const STORAGE_KEY = "curator_subscriptions";
const PREFS_KEY = "curator_alert_prefs";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);
  const [alertPreferences, setAlertPreferences] = useState<AlertPreferences>(
    MOCK_USER.alertPreferences
  );

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setSubscriptions(JSON.parse(stored));
      const prefs = localStorage.getItem(PREFS_KEY);
      if (prefs) setAlertPreferences(JSON.parse(prefs));
    } catch {}
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
    } catch {}
  }, [subscriptions]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(alertPreferences));
    } catch {}
  }, [alertPreferences]);

  const addSubscription = (s: Omit<Subscription, "id" | "paymentHistory">) => {
    const newSub: Subscription = {
      ...s,
      id: `sub_${Date.now()}`,
      paymentHistory: [],
    };
    setSubscriptions((prev) => [newSub, ...prev]);
  };

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const cancelSubscription = (id: string) => {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s))
    );
  };

  const updateAlertPreferences = (prefs: Partial<AlertPreferences>) => {
    setAlertPreferences((prev) => ({ ...prev, ...prefs }));
  };

  return (
    <StoreContext.Provider
      value={{
        subscriptions,
        alertPreferences,
        addSubscription,
        updateSubscription,
        cancelSubscription,
        updateAlertPreferences,
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

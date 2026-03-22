import { BillingCycle, Subscription, UserProfile } from "@/types";

/**
 * Computes the next upcoming renewal date from a subscription's start date
 * and billing cycle. Steps forward in cycle increments until the date is
 * today or in the future — so it's always accurate, never goes stale.
 */
export function computeNextRenewal(startDate: string, billingCycle: BillingCycle): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next = new Date(startDate);
  next.setHours(0, 0, 0, 0);

  while (next < today) {
    if (billingCycle === "Monthly") next.setMonth(next.getMonth() + 1);
    else if (billingCycle === "Yearly") next.setFullYear(next.getFullYear() + 1);
    else if (billingCycle === "Quarterly") next.setMonth(next.getMonth() + 3);
    else next.setDate(next.getDate() + 7); // Weekly
  }

  return next.toISOString().split("T")[0];
}

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "1",
    name: "Adobe Creative Cloud",
    amount: 54.99,
    billingCycle: "Monthly",
    startDate: "2021-01-12",
    category: "Design",
    linkedAccount: "Visa ••4242",
    status: "active",
    autoRenew: true,
    paymentHistory: [
      { id: "p1", date: "2026-02-12", amount: 54.99, status: "success", description: "Monthly Subscription - Adobe Creative Cloud" },
      { id: "p2", date: "2026-01-12", amount: 54.99, status: "success", description: "Monthly Subscription - Adobe Creative Cloud" },
      { id: "p3", date: "2025-12-12", amount: 54.99, status: "success", description: "Monthly Subscription - Adobe Creative Cloud" },
      { id: "p4", date: "2025-11-12", amount: 54.99, status: "success", description: "Monthly Subscription - Adobe Creative Cloud" },
    ],
  },
  {
    id: "2",
    name: "Netflix 4K",
    amount: 22.99,
    billingCycle: "Monthly",
    startDate: "2020-03-08",
    category: "Entertainment",
    linkedAccount: "Mastercard ••8881",
    status: "active",
    autoRenew: true,
    paymentHistory: [
      { id: "p5", date: "2026-02-08", amount: 22.99, status: "success", description: "Monthly Subscription - Netflix" },
      { id: "p6", date: "2026-01-08", amount: 22.99, status: "success", description: "Monthly Subscription - Netflix" },
    ],
  },
  {
    id: "3",
    name: "Spotify Duo",
    amount: 14.99,
    billingCycle: "Monthly",
    startDate: "2022-05-20",
    category: "Entertainment",
    linkedAccount: "Visa ••4242",
    status: "active",
    autoRenew: true,
    paymentHistory: [
      { id: "p7", date: "2026-02-20", amount: 14.99, status: "success", description: "Monthly Subscription - Spotify" },
    ],
  },
  {
    id: "4",
    name: "Notion Pro",
    amount: 10.0,
    billingCycle: "Monthly",
    startDate: "2023-01-01",
    category: "Productivity",
    status: "active",
    autoRenew: true,
    paymentHistory: [
      { id: "p8", date: "2026-02-01", amount: 10.0, status: "success", description: "Monthly Subscription - Notion" },
    ],
  },
  {
    id: "5",
    name: "GitHub Copilot",
    amount: 19.0,
    billingCycle: "Monthly",
    startDate: "2023-06-15",
    category: "Productivity",
    linkedAccount: "Visa ••4242",
    status: "active",
    autoRenew: true,
    paymentHistory: [
      { id: "p9", date: "2026-02-15", amount: 19.0, status: "success", description: "Monthly Subscription - GitHub Copilot" },
    ],
  },
  {
    id: "6",
    name: "Hulu + Live TV",
    amount: 75.0,
    billingCycle: "Monthly",
    startDate: "2022-11-05",
    category: "Entertainment",
    linkedAccount: "Mastercard ••8881",
    status: "active",
    autoRenew: true,
    paymentHistory: [
      { id: "p10", date: "2026-02-05", amount: 75.0, status: "success", description: "Monthly Subscription - Hulu" },
    ],
  },
  {
    id: "7",
    name: "PlayStation Plus",
    amount: 12.0,
    billingCycle: "Monthly",
    startDate: "2021-09-30",
    category: "Gaming",
    linkedAccount: "Visa ••4242",
    status: "active",
    autoRenew: true,
    paymentHistory: [
      { id: "p11", date: "2026-02-28", amount: 12.0, status: "success", description: "Monthly Subscription - PlayStation Plus" },
    ],
  },
];

export const MOCK_USER: UserProfile = {
  id: "user_1",
  email: "user@example.com",
  alertPreferences: {
    pushNotifications: true,
    emailAlerts: true,
    advanceDays: 3,
    quietMode: false,
    quietStart: "22:00",
    quietEnd: "07:00",
  },
};

export function getTotalMonthly(subscriptions: Subscription[]): number {
  return subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      if (s.billingCycle === "Monthly") return sum + s.amount;
      if (s.billingCycle === "Yearly") return sum + s.amount / 12;
      if (s.billingCycle === "Quarterly") return sum + s.amount / 3;
      if (s.billingCycle === "Weekly") return sum + s.amount * 4.33;
      return sum;
    }, 0);
}

export function getUpcomingRenewals(subscriptions: Subscription[], days = 7): Subscription[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return subscriptions
    .filter((s) => {
      if (s.status !== "active") return false;
      const renewal = new Date(computeNextRenewal(s.startDate, s.billingCycle));
      return renewal >= now && renewal <= future;
    })
    .sort((a, b) => {
      const aDate = new Date(computeNextRenewal(a.startDate, a.billingCycle)).getTime();
      const bDate = new Date(computeNextRenewal(b.startDate, b.billingCycle)).getTime();
      return aDate - bDate;
    });
}

export function getDaysUntilRenewal(startDate: string, billingCycle: BillingCycle): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const renewal = new Date(computeNextRenewal(startDate, billingCycle));
  renewal.setHours(0, 0, 0, 0);
  return Math.round((renewal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCategoryBreakdown(subscriptions: Subscription[]): Record<string, number> {
  const total = getTotalMonthly(subscriptions);
  if (total === 0) return {};
  const breakdown: Record<string, number> = {};
  for (const s of subscriptions) {
    if (s.status !== "active") continue;
    const monthly =
      s.billingCycle === "Monthly" ? s.amount :
      s.billingCycle === "Yearly" ? s.amount / 12 :
      s.billingCycle === "Quarterly" ? s.amount / 3 :
      s.amount * 4.33;
    breakdown[s.category] = (breakdown[s.category] || 0) + monthly;
  }
  for (const key in breakdown) {
    breakdown[key] = Math.round((breakdown[key] / total) * 100);
  }
  return breakdown;
}

/**
 * Generates a payment history timeline from a start date and billing cycle.
 * Used to show history for subscriptions that don't have recorded payments.
 */
export function generatePaymentHistory(
  subId: string,
  name: string,
  startDate: string,
  billingCycle: BillingCycle,
  amount: number,
  limit = 6
) {
  const payments = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(startDate);

  while (date <= today && payments.length < limit) {
    payments.push({
      id: `${subId}_gen_${payments.length}`,
      date: date.toISOString().split("T")[0],
      amount,
      status: "success" as const,
      description: `${billingCycle} Subscription - ${name}`,
    });
    if (billingCycle === "Monthly") date.setMonth(date.getMonth() + 1);
    else if (billingCycle === "Yearly") date.setFullYear(date.getFullYear() + 1);
    else if (billingCycle === "Quarterly") date.setMonth(date.getMonth() + 3);
    else date.setDate(date.getDate() + 7);
  }

  return payments.reverse();
}

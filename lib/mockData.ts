import { Subscription, UserProfile } from "@/types";

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "1",
    name: "Adobe Creative Cloud",
    amount: 54.99,
    billingCycle: "Monthly",
    nextRenewal: "2026-03-24",
    category: "Design",
    linkedAccount: "Visa 4242",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Adobe_Systems_logo_and_wordmark.svg/320px-Adobe_Systems_logo_and_wordmark.svg.png",
    status: "active",
    subscribedSince: "2021-01-12",
    autoRenew: true,
    source: "bank",
    paymentHistory: [
      { id: "p1", date: "2026-03-24", amount: 54.99, status: "pending", description: "Monthly Subscription - Adobe Creative Cloud" },
      { id: "p2", date: "2026-02-24", amount: 54.99, status: "success", description: "Monthly Subscription - Adobe Creative Cloud" },
      { id: "p3", date: "2026-01-24", amount: 54.99, status: "success", description: "Monthly Subscription - Adobe Creative Cloud" },
      { id: "p4", date: "2025-12-24", amount: 54.99, status: "success", description: "Monthly Subscription - Adobe Creative Cloud" },
    ],
  },
  {
    id: "2",
    name: "Netflix 4K",
    amount: 22.99,
    billingCycle: "Monthly",
    nextRenewal: "2026-03-24",
    category: "Entertainment",
    linkedAccount: "Mastercard 8881",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/GoldenGateBridge-001.jpg/320px-GoldenGateBridge-001.jpg",
    status: "active",
    subscribedSince: "2020-03-15",
    autoRenew: true,
    source: "bank",
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
    nextRenewal: "2026-03-23",
    category: "Entertainment",
    linkedAccount: "Visa 4242",
    status: "active",
    subscribedSince: "2022-05-20",
    autoRenew: true,
    source: "bank",
    paymentHistory: [
      { id: "p7", date: "2026-02-23", amount: 14.99, status: "success", description: "Monthly Subscription - Spotify" },
    ],
  },
  {
    id: "4",
    name: "Notion Pro",
    amount: 10.0,
    billingCycle: "Monthly",
    nextRenewal: "2026-04-12",
    category: "Productivity",
    linkedAccount: "Visa 4242",
    status: "active",
    subscribedSince: "2023-01-01",
    autoRenew: true,
    source: "manual",
    paymentHistory: [
      { id: "p8", date: "2026-03-12", amount: 10.0, status: "success", description: "Monthly Subscription - Notion" },
    ],
  },
  {
    id: "5",
    name: "GitHub Copilot",
    amount: 19.0,
    billingCycle: "Monthly",
    nextRenewal: "2026-04-15",
    category: "Productivity",
    linkedAccount: "Visa 4242",
    status: "active",
    subscribedSince: "2023-06-01",
    autoRenew: true,
    source: "bank",
    paymentHistory: [
      { id: "p9", date: "2026-03-15", amount: 19.0, status: "success", description: "Monthly Subscription - GitHub Copilot" },
    ],
  },
  {
    id: "6",
    name: "Hulu + Live TV",
    amount: 75.0,
    billingCycle: "Monthly",
    nextRenewal: "2026-03-27",
    category: "Entertainment",
    linkedAccount: "Mastercard 8881",
    status: "active",
    subscribedSince: "2022-11-01",
    autoRenew: true,
    source: "bank",
    paymentHistory: [
      { id: "p10", date: "2026-02-27", amount: 75.0, status: "success", description: "Monthly Subscription - Hulu" },
    ],
  },
  {
    id: "7",
    name: "PlayStation Plus",
    amount: 12.0,
    billingCycle: "Monthly",
    nextRenewal: "2026-03-30",
    category: "Gaming",
    linkedAccount: "Visa 4242",
    status: "active",
    subscribedSince: "2021-09-01",
    autoRenew: true,
    source: "bank",
    paymentHistory: [
      { id: "p11", date: "2026-02-30", amount: 12.0, status: "success", description: "Monthly Subscription - PlayStation Plus" },
    ],
  },
];

export const MOCK_USER: UserProfile = {
  id: "user_1",
  phone: "+1 (555) 000-0000",
  email: "user@example.com",
  bankAccounts: [
    {
      id: "ba_1",
      institutionName: "Chase",
      accountName: "Chase Checking",
      accountType: "checking",
      mask: "4242",
    },
    {
      id: "ba_2",
      institutionName: "Bank of America",
      accountName: "BoA Rewards Card",
      accountType: "credit",
      mask: "8881",
    },
  ],
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
  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return subscriptions
    .filter((s) => {
      const renewal = new Date(s.nextRenewal);
      return renewal >= now && renewal <= future && s.status === "active";
    })
    .sort((a, b) => new Date(a.nextRenewal).getTime() - new Date(b.nextRenewal).getTime());
}

export function getDaysUntilRenewal(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const renewal = new Date(dateStr);
  renewal.setHours(0, 0, 0, 0);
  return Math.round((renewal.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getCategoryBreakdown(subscriptions: Subscription[]): Record<string, number> {
  const total = getTotalMonthly(subscriptions);
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

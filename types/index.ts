export type BillingCycle = "Monthly" | "Yearly" | "Quarterly" | "Weekly";

export type SubscriptionCategory =
  | "Entertainment"
  | "Productivity"
  | "Shopping"
  | "Health"
  | "Design"
  | "Gaming"
  | "News"
  | "Other";

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: BillingCycle;
  nextRenewal: string; // ISO date string
  category: SubscriptionCategory;
  linkedAccount?: string;
  logo?: string;
  status: "active" | "cancelled" | "paused";
  subscribedSince: string; // ISO date string
  paymentHistory: Payment[];
  autoRenew: boolean;
  notes?: string;
  source: "manual" | "bank"; // manually added or auto-detected from bank
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  status: "success" | "failed" | "pending";
  description: string;
}

export interface BankAccount {
  id: string;
  institutionName: string;
  accountName: string;
  accountType: string;
  mask: string; // last 4 digits
  accessToken?: string; // Plaid access token
}

export interface AlertPreferences {
  pushNotifications: boolean;
  emailAlerts: boolean;
  advanceDays: number;
  quietMode: boolean;
  quietStart: string; // "22:00"
  quietEnd: string;   // "07:00"
}

export interface UserProfile {
  id: string;
  phone: string;
  email?: string;
  bankAccounts: BankAccount[];
  alertPreferences: AlertPreferences;
}

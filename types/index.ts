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
  /** When the subscription started — next renewal is computed from this */
  startDate: string; // ISO date string
  category: SubscriptionCategory;
  /** Payment method reference for future card integration, e.g. "Visa ••4242" */
  linkedAccount?: string;
  logo?: string;
  status: "active" | "cancelled" | "paused";
  paymentHistory: Payment[];
  autoRenew: boolean;
  notes?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  status: "success" | "failed" | "pending";
  description: string;
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
  email?: string;
  alertPreferences: AlertPreferences;
}

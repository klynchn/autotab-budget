export const CATEGORIES = [
  "Tuition",
  "Rent",
  "Utilities",
  "Transport",
  "Social / Nights Out",
  "Food & Groceries",
  "Subscriptions",
  "Shopping",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Transaction {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  date: string; // ISO date string
  category: Category;
  source: "receipt" | "e-receipt" | "manual";
}

export interface BudgetSettings {
  monthlyIncome: number;
  monthlyBudget: number;
}

export interface DetectedSubscription {
  merchant: string;
  amount: number;
  category: Category;
  lastDate: string;
  nextExpectedDate: string;
  cancelReminder: boolean;
}

// Soft pastel palette for friendly fintech feel
export const CATEGORY_COLORS: Record<Category, string> = {
  Tuition: "hsl(262, 60%, 64%)",
  Rent: "hsl(220, 55%, 58%)",
  Utilities: "hsl(38, 75%, 58%)",
  Transport: "hsl(174, 55%, 44%)",
  "Social / Nights Out": "hsl(330, 60%, 62%)",
  "Food & Groceries": "hsl(152, 52%, 48%)",
  Subscriptions: "hsl(0, 58%, 58%)",
  Shopping: "hsl(28, 65%, 56%)",
  Other: "hsl(215, 16%, 56%)",
};

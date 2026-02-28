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

export const CATEGORY_COLORS: Record<Category, string> = {
  Tuition: "hsl(262, 80%, 50%)",
  Rent: "hsl(220, 70%, 50%)",
  Utilities: "hsl(38, 92%, 50%)",
  Transport: "hsl(190, 80%, 42%)",
  "Social / Nights Out": "hsl(330, 80%, 55%)",
  "Food & Groceries": "hsl(142, 70%, 40%)",
  Subscriptions: "hsl(0, 72%, 51%)",
  Shopping: "hsl(28, 80%, 52%)",
  Other: "hsl(215, 16%, 47%)",
};

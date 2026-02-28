import { useLocalStorage } from "./useLocalStorage";
import { Transaction, BudgetSettings, DetectedSubscription } from "@/types/transaction";
import { useMemo, useCallback } from "react";
import { addMonths, differenceInDays, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "1", merchant: "Tesco", amount: 42.50, currency: "GBP", date: "2026-02-25", category: "Food & Groceries", source: "receipt" },
  { id: "2", merchant: "TfL", amount: 6.80, currency: "GBP", date: "2026-02-24", category: "Transport", source: "manual" },
  { id: "3", merchant: "Netflix", amount: 10.99, currency: "GBP", date: "2026-02-20", category: "Subscriptions", source: "manual" },
  { id: "4", merchant: "Netflix", amount: 10.99, currency: "GBP", date: "2026-01-20", category: "Subscriptions", source: "manual" },
  { id: "5", merchant: "Wetherspoons", amount: 28.40, currency: "GBP", date: "2026-02-22", category: "Social / Nights Out", source: "receipt" },
  { id: "6", merchant: "Amazon", amount: 19.99, currency: "GBP", date: "2026-02-18", category: "Shopping", source: "e-receipt" },
  { id: "7", merchant: "EE Mobile", amount: 15.00, currency: "GBP", date: "2026-02-15", category: "Utilities", source: "manual" },
  { id: "8", merchant: "EE Mobile", amount: 15.00, currency: "GBP", date: "2026-01-15", category: "Utilities", source: "manual" },
  { id: "9", merchant: "Spotify", amount: 10.99, currency: "GBP", date: "2026-02-10", category: "Subscriptions", source: "manual" },
  { id: "10", merchant: "Spotify", amount: 10.99, currency: "GBP", date: "2026-01-10", category: "Subscriptions", source: "manual" },
  { id: "11", merchant: "Sainsbury's", amount: 35.60, currency: "GBP", date: "2026-02-12", category: "Food & Groceries", source: "receipt" },
  { id: "12", merchant: "TfL", amount: 6.80, currency: "GBP", date: "2026-02-08", category: "Transport", source: "manual" },
];

export function useTransactions() {
  const [transactions, setTransactions] = useLocalStorage<Transaction[]>("autotab-transactions", DEMO_TRANSACTIONS);
  const [budget, setBudget] = useLocalStorage<BudgetSettings>("autotab-budget", { monthlyIncome: 1200, monthlyBudget: 900 });
  const [cancelReminders, setCancelReminders] = useLocalStorage<Record<string, boolean>>("autotab-cancel-reminders", {});

  const addTransaction = useCallback((tx: Omit<Transaction, "id">) => {
    setTransactions((prev) => [{ ...tx, id: crypto.randomUUID() }, ...prev]);
  }, [setTransactions]);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, [setTransactions]);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const monthlyTransactions = useMemo(
    () => transactions.filter((t) => {
      const d = parseISO(t.date);
      return d >= monthStart && d <= monthEnd;
    }),
    [transactions, monthStart.toISOString(), monthEnd.toISOString()]
  );

  const weeklyTransactions = useMemo(
    () => transactions.filter((t) => {
      const d = parseISO(t.date);
      return d >= weekStart && d <= weekEnd;
    }),
    [transactions, weekStart.toISOString(), weekEnd.toISOString()]
  );

  const monthlyTotal = useMemo(
    () => monthlyTransactions.reduce((sum, t) => sum + t.amount, 0),
    [monthlyTransactions]
  );

  const remaining = budget.monthlyBudget - monthlyTotal;

  const subscriptions = useMemo<DetectedSubscription[]>(() => {
    const merchantGroups: Record<string, Transaction[]> = {};
    transactions.forEach((t) => {
      const key = t.merchant.toLowerCase();
      if (!merchantGroups[key]) merchantGroups[key] = [];
      merchantGroups[key].push(t);
    });

    const detected: DetectedSubscription[] = [];
    Object.entries(merchantGroups).forEach(([, txs]) => {
      if (txs.length < 2) return;
      const sorted = [...txs].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
      const latest = sorted[0];
      const prev = sorted[1];
      const daysDiff = differenceInDays(parseISO(latest.date), parseISO(prev.date));
      const amountDiff = Math.abs(latest.amount - prev.amount);
      if (daysDiff >= 25 && daysDiff <= 35 && amountDiff < 2) {
        detected.push({
          merchant: latest.merchant,
          amount: latest.amount,
          category: latest.category,
          lastDate: latest.date,
          nextExpectedDate: addMonths(parseISO(latest.date), 1).toISOString().split("T")[0],
          cancelReminder: cancelReminders[latest.merchant.toLowerCase()] ?? false,
        });
      }
    });
    return detected;
  }, [transactions, cancelReminders]);

  const toggleCancelReminder = useCallback((merchant: string) => {
    setCancelReminders((prev) => ({
      ...prev,
      [merchant.toLowerCase()]: !prev[merchant.toLowerCase()],
    }));
  }, [setCancelReminders]);

  return {
    transactions,
    monthlyTransactions,
    weeklyTransactions,
    monthlyTotal,
    remaining,
    budget,
    setBudget,
    addTransaction,
    deleteTransaction,
    subscriptions,
    toggleCancelReminder,
  };
}

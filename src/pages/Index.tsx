import { useMemo, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useReceiptVault } from "@/hooks/useReceiptVault";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import CircularProgress from "@/components/CircularProgress";
import { CATEGORIES, CATEGORY_COLORS, Category } from "@/types/transaction";
import { format, parseISO } from "date-fns";
import { ArrowDown, ArrowUp, Bell, BellOff, FileText, TrendingUp, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const {
    monthlyTransactions,
    weeklyTransactions,
    monthlyTotal,
    remaining,
    budget,
    subscriptions,
    toggleCancelReminder,
    deleteTransaction,
  } = useTransactions();

  const [period, setPeriod] = useState<"monthly" | "weekly">("monthly");
  const [sortBy, setSortBy] = useState<"date" | "category">("date");

  const activeTxs = period === "monthly" ? monthlyTransactions : weeklyTransactions;

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    activeTxs.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    const total = Object.values(map).reduce((a, b) => a + b, 0);
    return CATEGORIES.filter((c) => map[c]).map((c) => ({
      name: c,
      value: parseFloat((map[c] || 0).toFixed(2)),
      percent: total > 0 ? ((map[c] || 0) / total) * 100 : 0,
      color: CATEGORY_COLORS[c],
    }));
  }, [activeTxs]);

  const sortedTransactions = useMemo(() => {
    const txs = [...monthlyTransactions];
    if (sortBy === "date") txs.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    else txs.sort((a, b) => a.category.localeCompare(b.category));
    return txs;
  }, [monthlyTransactions, sortBy]);

  const budgetPercent = budget.monthlyBudget > 0 ? (monthlyTotal / budget.monthlyBudget) * 100 : 0;
  const isOverBudget = remaining < 0;

  const subMonthly = subscriptions.reduce((s, sub) => s + sub.amount, 0);
  const subYearly = subMonthly * 12;

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Hey there 👋</h1>
        <p className="text-muted-foreground mt-1">Here's how your money's looking.</p>
      </div>

      {/* Spend overview */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="card-soft p-6">
          <p className="text-sm font-medium text-muted-foreground">This month</p>
          <p className="font-mono text-4xl font-bold mt-1 tracking-tight">£{monthlyTotal.toFixed(2)}</p>
          <div className="mt-4 flex items-center gap-5">
            <CircularProgress value={budgetPercent} size={88} strokeWidth={8} />
            <div className="text-sm text-muted-foreground space-y-1">
              <p>{budgetPercent.toFixed(0)}% of your £{budget.monthlyBudget.toFixed(0)} budget used</p>
              {isOverBudget ? (
                <p className="text-warning font-medium">Time to ease up a bit 😅</p>
              ) : (
                <p className="text-success font-medium">You're doing well 👏</p>
              )}
            </div>
          </div>
        </div>

        <div className="card-soft p-6">
          <p className="text-sm font-medium text-muted-foreground">Left to spend</p>
          <p className={`font-mono text-4xl font-bold mt-1 tracking-tight ${isOverBudget ? "text-warning" : "text-success"}`}>
            {isOverBudget ? "-" : ""}£{Math.abs(remaining).toFixed(2)}
          </p>
          <div className="mt-4 flex items-center gap-2 text-sm">
            {isOverBudget ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1 text-warning font-medium">
                <ArrowUp className="h-3.5 w-3.5" /> Over budget
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-success font-medium">
                <ArrowDown className="h-3.5 w-3.5" /> Under budget
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="card-soft p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold">Where it's going</h2>
          <div className="flex gap-1 rounded-full bg-muted p-0.5">
            <button
              onClick={() => setPeriod("weekly")}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-200 ${
                period === "weekly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setPeriod("monthly")}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-200 ${
                period === "monthly" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {categoryData.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            Nothing here yet — add your first purchase! 🛒
          </p>
        ) : (
          <div className="space-y-3">
            {categoryData.map((d) => (
              <div key={d.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="font-medium">{d.name}</span>
                  </div>
                  <span className="font-mono font-semibold">£{d.value.toFixed(2)}</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${d.percent}%`, backgroundColor: d.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="card-soft p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Recurring payments</h2>
          </div>
          <div className="flex gap-4 text-sm mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <span className="text-muted-foreground">Monthly</span>
              <span className="font-mono font-semibold">£{subMonthly.toFixed(2)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <span className="text-muted-foreground">Yearly</span>
              <span className="font-mono font-semibold">£{subYearly.toFixed(2)}</span>
            </span>
          </div>
          <div className="space-y-2.5">
            {subscriptions.map((sub) => (
              <div key={sub.merchant} className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                    {sub.merchant.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{sub.merchant}</p>
                    <p className="text-xs text-muted-foreground">
                      Next: {format(parseISO(sub.nextExpectedDate), "d MMM")}
                      {sub.cancelReminder && " · Cancel soon?"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">£{sub.amount.toFixed(2)}/mo</p>
                    <p className="font-mono text-xs text-muted-foreground">£{(sub.amount * 12).toFixed(0)}/yr</p>
                  </div>
                  <button
                    onClick={() => toggleCancelReminder(sub.merchant)}
                    className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title={sub.cancelReminder ? "Reminder on" : "Set cancel reminder"}
                  >
                    {sub.cancelReminder ? <Bell className="h-4 w-4 text-warning" /> : <BellOff className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction list */}
      <div className="card-soft p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Recent activity</h2>
          <div className="flex gap-1 rounded-full bg-muted p-0.5">
            <button
              onClick={() => setSortBy("date")}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-200 ${
                sortBy === "date" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Date
            </button>
            <button
              onClick={() => setSortBy("category")}
              className={`rounded-full px-3.5 py-1 text-xs font-medium transition-all duration-200 ${
                sortBy === "category" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Category
            </button>
          </div>
        </div>
        {sortedTransactions.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">No transactions this month yet 📭</p>
        ) : (
          <div className="space-y-1">
            {sortedTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between rounded-2xl px-3 py-3 hover:bg-muted/50 transition-all duration-200 group">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-card"
                    style={{ backgroundColor: CATEGORY_COLORS[tx.category] }}
                  >
                    {tx.merchant.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{tx.merchant}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(tx.date), "d MMM")} · {tx.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-semibold">-£{tx.amount.toFixed(2)}</span>
                  <button
                    onClick={() => deleteTransaction(tx.id)}
                    className="rounded-full p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

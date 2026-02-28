import { useMemo, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { CATEGORIES, CATEGORY_COLORS, Category } from "@/types/transaction";
import { format, parseISO } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, Bell, BellOff, TrendingUp, Trash2 } from "lucide-react";

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
    return CATEGORIES.filter((c) => map[c]).map((c) => ({
      name: c,
      value: parseFloat((map[c] || 0).toFixed(2)),
      color: CATEGORY_COLORS[c],
    }));
  }, [activeTxs]);

  const sortedTransactions = useMemo(() => {
    const txs = [...monthlyTransactions];
    if (sortBy === "date") txs.sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    else txs.sort((a, b) => a.category.localeCompare(b.category));
    return txs;
  }, [monthlyTransactions, sortBy]);

  const budgetPercent = budget.monthlyBudget > 0 ? Math.min((monthlyTotal / budget.monthlyBudget) * 100, 100) : 0;
  const isOverBudget = remaining < 0;

  const subMonthly = subscriptions.reduce((s, sub) => s + sub.amount, 0);
  const subYearly = subMonthly * 12;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Spend overview */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Monthly Spend</p>
            <p className="font-mono text-3xl font-bold">£{monthlyTotal.toFixed(2)}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">of £{budget.monthlyBudget.toFixed(0)} budget</span>
                <span className={isOverBudget ? "text-destructive font-medium" : "text-muted-foreground"}>
                  {budgetPercent.toFixed(0)}%
                </span>
              </div>
              <Progress value={budgetPercent} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className={`font-mono text-3xl font-bold ${isOverBudget ? "text-destructive" : "text-success"}`}>
              {isOverBudget ? "-" : ""}£{Math.abs(remaining).toFixed(2)}
            </p>
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              {isOverBudget ? (
                <>
                  <ArrowUp className="h-4 w-4 text-destructive" />
                  <span className="text-destructive">Over budget</span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-4 w-4 text-success" />
                  <span>Under budget — keep it up!</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Spending by Category</CardTitle>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={period === "weekly" ? "secondary" : "ghost"}
              onClick={() => setPeriod("weekly")}
              className="text-xs h-7"
            >
              Week
            </Button>
            <Button
              size="sm"
              variant={period === "monthly" ? "secondary" : "ghost"}
              onClick={() => setPeriod("monthly")}
              className="text-xs h-7"
            >
              Month
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No transactions this {period === "monthly" ? "month" : "week"}.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={45}>
                      {categoryData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `£${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-1.5">
                {categoryData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span>{d.name}</span>
                    </div>
                    <span className="font-mono font-medium">£{d.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Detected Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Monthly: </span>
                <span className="font-mono font-semibold">£{subMonthly.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Yearly: </span>
                <span className="font-mono font-semibold">£{subYearly.toFixed(2)}</span>
              </div>
            </div>
            <div className="space-y-2">
              {subscriptions.map((sub) => (
                <div key={sub.merchant} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{sub.merchant}</p>
                    <p className="text-xs text-muted-foreground">
                      Next: {format(parseISO(sub.nextExpectedDate), "d MMM yyyy")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-semibold">£{sub.amount.toFixed(2)}/mo</span>
                    <button
                      onClick={() => toggleCancelReminder(sub.merchant)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title={sub.cancelReminder ? "Reminder on" : "Set cancel reminder"}
                    >
                      {sub.cancelReminder ? <Bell className="h-4 w-4 text-warning" /> : <BellOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Transactions</CardTitle>
          <div className="flex gap-1">
            <Button size="sm" variant={sortBy === "date" ? "secondary" : "ghost"} onClick={() => setSortBy("date")} className="text-xs h-7">
              Date
            </Button>
            <Button size="sm" variant={sortBy === "category" ? "secondary" : "ghost"} onClick={() => setSortBy("category")} className="text-xs h-7">
              Category
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sortedTransactions.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No transactions this month.</p>
          ) : (
            <div className="space-y-1">
              {sortedTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-muted/50 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[tx.category] }} />
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
                      className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useMemo, useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CATEGORY_COLORS, Category } from "@/types/transaction";
import {
  IncomeBand,
  INCOME_BAND_LABELS,
  detectIncomeBand,
  compareToCohort,
  generateSuggestions,
  optimiseSubscriptions,
  CohortComparison,
} from "@/lib/insights";
import { Lightbulb, Users, BarChart3, Scissors, TrendingDown, TrendingUp } from "lucide-react";

export default function Insights() {
  const { monthlyTransactions, budget, subscriptions } = useTransactions();

  const autoBand = detectIncomeBand(budget.monthlyBudget);
  const [band, setBand] = useState<IncomeBand>(autoBand);
  const [useDemoData, setUseDemoData] = useState(true);

  // Category spend map
  const spendByCategory = useMemo(() => {
    const map: Partial<Record<Category, number>> = {};
    monthlyTransactions.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return map;
  }, [monthlyTransactions]);

  const comparisons = useMemo(() => compareToCohort(spendByCategory, band), [spendByCategory, band]);
  const suggestions = useMemo(
    () => generateSuggestions(comparisons, subscriptions.map((s) => s.merchant)),
    [comparisons, subscriptions]
  );

  const subOptimisations = useMemo(
    () => optimiseSubscriptions(subscriptions.map((s) => ({ merchant: s.merchant, amount: s.amount }))),
    [subscriptions]
  );

  const maxSpend = Math.max(
    ...comparisons.map((c) => Math.max(c.yourSpend, c.cohortMedian)),
    1
  );

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold">Insights 🔍</h1>
        <p className="text-sm text-muted-foreground mt-1">
          See how you compare and where you can save.
        </p>
      </div>

      {/* A) Your Cohort */}
      <div className="card-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Your cohort</h2>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="space-y-2 flex-1">
            <Label>Monthly budget band</Label>
            <Select value={band} onValueChange={(v) => setBand(v as IncomeBand)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INCOME_BAND_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="demo-toggle" checked={useDemoData} onCheckedChange={setUseDemoData} />
            <Label htmlFor="demo-toggle" className="text-sm text-muted-foreground">
              Use demo cohort data
            </Label>
          </div>
        </div>

        <p className="mt-3 text-sm text-muted-foreground rounded-xl bg-muted/50 px-4 py-2.5">
          Comparing you to students in the <span className="font-semibold text-foreground">{INCOME_BAND_LABELS[band]}</span> band.
        </p>
      </div>

      {/* B) You vs Cohort */}
      <div className="card-soft p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">You vs cohort</h2>
        </div>

        <div className="space-y-4">
          {comparisons.map((c) => (
            <CategoryBar key={c.category} comparison={c} maxSpend={maxSpend} />
          ))}
        </div>
      </div>

      {/* C) Smart Suggestions */}
      {suggestions.length > 0 && (
        <div className="card-soft p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lightbulb className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Smart suggestions</h2>
          </div>

          <div className="space-y-3">
            {suggestions.map((s, i) => (
              <div key={i} className="rounded-2xl bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{s.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{s.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                    {s.savingsEstimate && (
                      <span className="inline-flex items-center gap-1 mt-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                        <TrendingDown className="h-3 w-3" />
                        Save ~£{s.savingsEstimate}/mo
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D) Subscription Optimiser */}
      {subOptimisations.length > 0 && (
        <div className="card-soft p-6">
          <div className="flex items-center gap-2 mb-5">
            <Scissors className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Subscription optimiser</h2>
          </div>

          <div className="space-y-3">
            {subOptimisations.map((opt, i) => (
              <div key={i} className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-sm">{opt.group}</h3>
                  <span className="font-mono text-sm font-semibold">£{opt.monthlyTotal.toFixed(2)}/mo</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {opt.services.map((s) => (
                    <span key={s} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{opt.recommendation}</p>
                <span className="inline-flex items-center gap-1 mt-2 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  <TrendingDown className="h-3 w-3" />
                  Save ~£{opt.potentialSaving.toFixed(2)}/mo
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subOptimisations.length === 0 && (
        <div className="card-soft p-6">
          <div className="flex items-center gap-2 mb-3">
            <Scissors className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Subscription optimiser</h2>
          </div>
          <p className="text-sm text-muted-foreground py-4 text-center">
            No overlapping subscriptions detected — you're all good! ✅
          </p>
        </div>
      )}
    </div>
  );
}

function CategoryBar({ comparison, maxSpend }: { comparison: CohortComparison; maxSpend: number }) {
  const { category, yourSpend, cohortMedian, diffPercent } = comparison;
  const yourWidth = maxSpend > 0 ? (yourSpend / maxSpend) * 100 : 0;
  const cohortWidth = maxSpend > 0 ? (cohortMedian / maxSpend) * 100 : 0;
  const isOver = diffPercent > 0;
  const color = CATEGORY_COLORS[category] || "hsl(var(--primary))";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-medium">{category}</span>
        </div>
        <span
          className={`text-xs font-medium rounded-full px-2 py-0.5 ${
            Math.abs(diffPercent) < 10
              ? "bg-muted text-muted-foreground"
              : isOver
              ? "bg-warning/10 text-warning"
              : "bg-success/10 text-success"
          }`}
        >
          {isOver ? "+" : ""}
          {diffPercent.toFixed(0)}%
        </span>
      </div>

      {/* Your spend bar */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 shrink-0">You</span>
          <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${yourWidth}%`, backgroundColor: color }}
            />
          </div>
          <span className="font-mono text-xs font-medium w-14 text-right">£{yourSpend.toFixed(0)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-10 shrink-0">Avg</span>
          <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-muted-foreground/30 transition-all duration-500"
              style={{ width: `${cohortWidth}%` }}
            />
          </div>
          <span className="font-mono text-xs text-muted-foreground w-14 text-right">£{cohortMedian.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
}

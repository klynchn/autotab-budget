import { useTransactions } from "@/hooks/useTransactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CATEGORIES, CATEGORY_COLORS } from "@/types/transaction";

export default function BudgetSetup() {
  const { budget, setBudget } = useTransactions();
  const { toast } = useToast();
  const [income, setIncome] = useState(budget.monthlyIncome.toString());
  const [budgetVal, setBudgetVal] = useState(budget.monthlyBudget.toString());

  const onSave = () => {
    setBudget({
      monthlyIncome: parseFloat(income) || 0,
      monthlyBudget: parseFloat(budgetVal) || 0,
    });
    toast({ title: "Saved! ✅", description: "Your budget's been updated." });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold">Budget setup 🎯</h1>
        <p className="text-sm text-muted-foreground mt-1">Tell us what you're working with each month.</p>
      </div>

      <div className="card-soft p-6">
        <h3 className="text-base font-semibold mb-4">Your finances</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income">Monthly income (£)</Label>
            <Input id="income" type="number" step="1" value={income} onChange={(e) => setIncome(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Monthly budget (£)</Label>
            <Input id="budget" type="number" step="1" value={budgetVal} onChange={(e) => setBudgetVal(e.target.value)} className="rounded-xl" />
          </div>
          <Button onClick={onSave} className="w-full gap-2 rounded-xl h-11">
            <Save className="h-4 w-4" />
            Save budget
          </Button>
        </div>
      </div>

      <div className="card-soft p-6">
        <h3 className="text-base font-semibold mb-4">Categories</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {CATEGORIES.map((c) => (
            <div key={c} className="flex items-center gap-2.5 rounded-xl bg-muted/50 p-3 text-sm">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} />
              <span className="font-medium">{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

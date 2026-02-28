import { useTransactions } from "@/hooks/useTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Save } from "lucide-react";
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
    toast({ title: "Budget updated", description: "Your budget settings have been saved." });
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Budget Setup</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your monthly income and budget.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Financial Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="income">Monthly Income (£)</Label>
            <Input id="income" type="number" step="1" value={income} onChange={(e) => setIncome(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="budget">Monthly Budget (£)</Label>
            <Input id="budget" type="number" step="1" value={budgetVal} onChange={(e) => setBudgetVal(e.target.value)} />
          </div>
          <Button onClick={onSave} className="w-full gap-2">
            <Save className="h-4 w-4" />
            Save Budget
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Spending Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map((c) => (
              <div key={c} className="flex items-center gap-2 rounded-md border p-2.5 text-sm">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[c] }} />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

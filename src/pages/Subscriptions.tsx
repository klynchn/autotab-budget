import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_COLORS, Category } from "@/types/transaction";
import { format, parseISO } from "date-fns";
import { Bell, BellOff, Plus, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function Subscriptions() {
  const {
    subscriptions,
    toggleCancelReminder,
    addTransaction,
    transactions,
    deleteTransaction,
  } = useTransactions();

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Subscriptions");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!merchant.trim() || isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid merchant and amount.");
      return;
    }

    // Add two transactions a month apart so auto-detection picks it up
    const d1 = new Date(startDate);
    const d0 = new Date(d1);
    d0.setMonth(d0.getMonth() - 1);

    addTransaction({
      merchant: merchant.trim(),
      amount: amt,
      currency: "GBP",
      date: d0.toISOString().split("T")[0],
      category,
      source: "manual",
    });
    addTransaction({
      merchant: merchant.trim(),
      amount: amt,
      currency: "GBP",
      date: d1.toISOString().split("T")[0],
      category,
      source: "manual",
    });

    toast.success(`${merchant.trim()} subscription added!`);
    setMerchant("");
    setAmount("");
  };

  const subMonthly = subscriptions.reduce((s, sub) => s + sub.amount, 0);
  const subYearly = subMonthly * 12;

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground mt-1">Track and manage your recurring payments.</p>
      </div>

      {/* Add subscription form */}
      <div className="card-soft p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          Add subscription
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Merchant (e.g. Netflix)"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Monthly amount (£)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="0"
            step="0.01"
          />
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <Button onClick={handleAdd} className="mt-4 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Subscription
        </Button>
      </div>

      {/* Summary */}
      {subscriptions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="card-soft p-5 text-center">
            <p className="text-sm text-muted-foreground">Monthly total</p>
            <p className="font-mono text-3xl font-bold mt-1">£{subMonthly.toFixed(2)}</p>
          </div>
          <div className="card-soft p-5 text-center">
            <p className="text-sm text-muted-foreground">Yearly total</p>
            <p className="font-mono text-3xl font-bold mt-1">£{subYearly.toFixed(2)}</p>
          </div>
        </div>
      )}

      {/* Subscriptions table */}
      <div className="card-soft p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-primary" />
          Active subscriptions
        </h2>
        {subscriptions.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">
            No subscriptions detected yet. Add one above! 📺
          </p>
        ) : (
          <div className="space-y-2.5">
            {subscriptions.map((sub) => (
              <div
                key={sub.merchant}
                className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-card"
                    style={{ backgroundColor: CATEGORY_COLORS[sub.category] }}
                  >
                    {sub.merchant.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{sub.merchant}</p>
                    <p className="text-xs text-muted-foreground">
                      {sub.category} · Next: {format(parseISO(sub.nextExpectedDate), "d MMM yyyy")}
                      {sub.cancelReminder && " · ⚠️ Cancel soon"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">£{sub.amount.toFixed(2)}/mo</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      £{(sub.amount * 12).toFixed(0)}/yr
                    </p>
                  </div>
                  <button
                    onClick={() => toggleCancelReminder(sub.merchant)}
                    className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                    title={sub.cancelReminder ? "Reminder on" : "Set cancel reminder"}
                  >
                    {sub.cancelReminder ? (
                      <Bell className="h-4 w-4 text-warning" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
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

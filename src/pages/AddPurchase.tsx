import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { guessCategory } from "@/lib/parseEReceipt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, Category } from "@/types/transaction";
import { Check, PlusCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QUICK_MERCHANTS = [
  { name: "Tesco", category: "Food & Groceries" as Category },
  { name: "TfL", category: "Transport" as Category },
  { name: "Amazon", category: "Shopping" as Category },
  { name: "Uber", category: "Transport" as Category },
  { name: "Nando's", category: "Social / Nights Out" as Category },
  { name: "Sainsbury's", category: "Food & Groceries" as Category },
];

export default function AddPurchase() {
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<Category>("Other");

  const fillQuick = (name: string, cat: Category) => {
    setMerchant(name);
    setCategory(cat);
  };

  const onSubmit = () => {
    if (!merchant || !amount) {
      toast({ title: "Missing fields", description: "Please enter merchant and amount.", variant: "destructive" });
      return;
    }
    addTransaction({
      merchant,
      amount: parseFloat(amount),
      currency: "GBP",
      date,
      category,
      source: "manual",
    });
    toast({ title: "Transaction added", description: `£${parseFloat(amount).toFixed(2)} at ${merchant}` });
    setMerchant("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("Other");
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Add Purchase</h1>
        <p className="text-sm text-muted-foreground mt-1">Manually add an online or in-store purchase.</p>
      </div>

      {/* Quick add */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quick Add
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {QUICK_MERCHANTS.map((m) => (
              <Button
                key={m.name}
                variant={merchant === m.name ? "secondary" : "outline"}
                size="sm"
                onClick={() => fillQuick(m.name, m.category)}
              >
                {m.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Purchase Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant</Label>
            <Input
              id="merchant"
              placeholder="e.g. Amazon"
              value={merchant}
              onChange={(e) => {
                setMerchant(e.target.value);
                setCategory(guessCategory(e.target.value));
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (£)</Label>
              <Input id="amount" type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onSubmit} className="w-full gap-2">
            <Check className="h-4 w-4" />
            Add Transaction
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

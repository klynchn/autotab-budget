import { useState } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { parseEReceiptText, guessCategory } from "@/lib/parseEReceipt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, Category } from "@/types/transaction";
import { Check, Mail, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function EReceipt() {
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const [rawText, setRawText] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<Category>("Other");
  const [parsed, setParsed] = useState(false);

  const handleParse = () => {
    const result = parseEReceiptText(rawText);
    if (result.merchant) setMerchant(result.merchant);
    if (result.amount) setAmount(result.amount.toString());
    if (result.date) setDate(result.date);
    if (result.category) setCategory(result.category);
    else if (result.merchant) setCategory(guessCategory(result.merchant));
    setParsed(true);
    toast({ title: "Parsed!", description: "Review the extracted details and confirm." });
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
      source: "e-receipt",
    });
    toast({ title: "Transaction added", description: `£${parseFloat(amount).toFixed(2)} at ${merchant}` });
    setRawText("");
    setMerchant("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("Other");
    setParsed(false);
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">E-Receipt Parser</h1>
        <p className="text-sm text-muted-foreground mt-1">Paste an email receipt to extract transaction details.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Paste Receipt Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={"Paste your email receipt text here...\n\nExample:\nFrom: Tesco\nDate: 25/02/2026\nTotal: £42.50"}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={6}
          />
          <Button onClick={handleParse} disabled={!rawText.trim()} variant="secondary" className="w-full gap-2">
            <Sparkles className="h-4 w-4" />
            Extract Details
          </Button>
        </CardContent>
      </Card>

      {parsed && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Confirm Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merchant">Merchant</Label>
              <Input id="merchant" value={merchant} onChange={(e) => { setMerchant(e.target.value); setCategory(guessCategory(e.target.value)); }} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (£)</Label>
                <Input id="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
      )}
    </div>
  );
}

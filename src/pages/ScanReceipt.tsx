import { useState, useCallback } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { guessCategory } from "@/lib/parseEReceipt";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, Category } from "@/types/transaction";
import { Upload, FileImage, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ScanReceipt() {
  const { addTransaction } = useTransactions();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<Category>("Other");
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    if (f.type.startsWith("image/")) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

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
      source: "receipt",
    });
    toast({ title: "Transaction added", description: `£${parseFloat(amount).toFixed(2)} at ${merchant}` });
    setFile(null);
    setPreview(null);
    setMerchant("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("Other");
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="text-2xl font-bold">Scan Receipt</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a receipt image and fill in the details.</p>
      </div>

      {/* Upload area */}
      <Card>
        <CardContent className="pt-6">
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
              isDragOver ? "border-primary bg-accent" : "border-border hover:border-primary/50"
            }`}
            onClick={() => document.getElementById("receipt-input")?.click()}
          >
            {preview ? (
              <img src={preview} alt="Receipt preview" className="max-h-48 rounded-md object-contain" />
            ) : file ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <FileImage className="h-10 w-10" />
                <span className="text-sm">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-10 w-10" />
                <span className="text-sm">Drop receipt here or click to upload</span>
                <span className="text-xs">Supports JPG, PNG, PDF</span>
              </div>
            )}
            <input
              id="receipt-input"
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Manual entry form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Receipt Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merchant">Merchant</Label>
            <Input
              id="merchant"
              placeholder="e.g. Tesco"
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
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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

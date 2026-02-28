import { useState, useCallback } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { guessCategory } from "@/lib/parseEReceipt";
import { ocrReceipt } from "@/lib/ocrReceipt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, Category } from "@/types/transaction";
import { Upload, FileImage, Check, Camera, Loader2 } from "lucide-react";
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
  const [scanning, setScanning] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    let imageUrl: string | null = null;
    if (f.type.startsWith("image/")) {
      imageUrl = URL.createObjectURL(f);
      setPreview(imageUrl);
    } else {
      setPreview(null);
    }

    // Run OCR
    if (f.type.startsWith("image/")) {
      setScanning(true);
      try {
        const result = await ocrReceipt(f);
        if (result.merchant) setMerchant(result.merchant);
        if (result.amount !== null) setAmount(result.amount.toFixed(2));
        if (result.date) setDate(result.date);
        if (result.category) setCategory(result.category);
        toast({
          title: "Receipt scanned! 🎉",
          description: result.merchant
            ? `Found: ${result.merchant}${result.amount !== null ? ` — £${result.amount.toFixed(2)}` : ""}`
            : "Couldn't detect details — please fill in manually.",
        });
      } catch {
        toast({
          title: "Scan failed 😕",
          description: "Couldn't read the receipt. Please fill in the details manually.",
          variant: "destructive",
        });
      } finally {
        setScanning(false);
      }
    }
  }, [toast]);

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
      toast({ title: "Oops!", description: "Please fill in the merchant and amount.", variant: "destructive" });
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
    toast({ title: "Added! ✅", description: `£${parseFloat(amount).toFixed(2)} at ${merchant}` });
    setFile(null);
    setPreview(null);
    setMerchant("");
    setAmount("");
    setDate(new Date().toISOString().split("T")[0]);
    setCategory("Other");
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold">Scan a receipt 🧾</h1>
        <p className="text-sm text-muted-foreground mt-1">Snap or upload — we'll do the rest.</p>
      </div>

      {/* Upload area */}
      <div className="card-soft overflow-hidden">
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          className={`relative flex flex-col items-center justify-center p-10 transition-all duration-200 cursor-pointer ${
            isDragOver ? "bg-accent" : "hover:bg-muted/30"
          }`}
          onClick={() => !scanning && document.getElementById("receipt-input")?.click()}
        >
          {scanning ? (
            <div className="flex flex-col items-center gap-3 text-primary">
              <Loader2 className="h-12 w-12 animate-spin" />
              <span className="text-sm font-medium">Scanning receipt…</span>
              <span className="text-xs text-muted-foreground">This may take a few seconds</span>
            </div>
          ) : preview ? (
            <img src={preview} alt="Receipt preview" className="max-h-48 rounded-2xl object-contain" />
          ) : file ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <FileImage className="h-12 w-12" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-7 w-7 text-primary" />
              </div>
              <span className="text-sm font-medium">Drop receipt here or tap to upload</span>
              <span className="text-xs">JPG or PNG</span>
            </div>
          )}
          <input
            id="receipt-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      </div>

      {/* Manual entry form */}
      <div className="card-soft p-6">
        <h3 className="text-base font-semibold mb-4">Receipt details</h3>
        <div className="space-y-4">
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
              className="rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (£)</Label>
              <Input id="amount" type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={onSubmit} disabled={scanning} className="w-full gap-2 rounded-xl h-11">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {scanning ? "Scanning…" : "Add transaction"}
          </Button>
        </div>
      </div>
    </div>
  );
}

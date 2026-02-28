import { useState, useCallback } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { ocrReceipt } from "@/lib/ocrReceipt";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_COLORS, Category } from "@/types/transaction";
import { format, parseISO } from "date-fns";
import { Bell, BellOff, Plus, RefreshCw, Camera, Loader2, FileImage } from "lucide-react";
import { toast } from "sonner";

export default function Subscriptions() {
  const {
    subscriptions,
    toggleCancelReminder,
    addTransaction,
  } = useTransactions();

  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Category>("Subscriptions");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  // Scan state
  const [isDragOver, setIsDragOver] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFile = useCallback(async (f: File) => {
    setFile(f);
    if (f.type.startsWith("image/")) {
      setPreview(URL.createObjectURL(f));
      setScanning(true);
      try {
        const result = await ocrReceipt(f);
        if (result.merchant) setMerchant(result.merchant);
        if (result.amount !== null) setAmount(result.amount.toFixed(2));
        if (result.date) setStartDate(result.date);
        if (result.category) setCategory(result.category);
        toast.success(
          result.merchant
            ? `Found: ${result.merchant}${result.amount !== null ? ` — £${result.amount.toFixed(2)}` : ""}`
            : "Couldn't detect details — fill in manually."
        );
      } catch {
        toast.error("Couldn't read the image. Please fill in the details manually.");
      } finally {
        setScanning(false);
      }
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

  const handleAdd = () => {
    const amt = parseFloat(amount);
    if (!merchant.trim() || isNaN(amt) || amt <= 0) {
      toast.error("Please enter a valid merchant and amount.");
      return;
    }

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
    setPreview(null);
    setFile(null);
  };

  const subMonthly = subscriptions.reduce((s, sub) => s + sub.amount, 0);
  const subYearly = subMonthly * 12;

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground mt-1">Track and manage your recurring payments.</p>
      </div>

      {/* Drag & drop scan area */}
      <div className="card-soft overflow-hidden">
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          className={`relative flex flex-col items-center justify-center p-8 transition-all duration-200 cursor-pointer ${
            isDragOver ? "bg-accent" : "hover:bg-muted/30"
          }`}
          onClick={() => !scanning && document.getElementById("sub-scan-input")?.click()}
        >
          {scanning ? (
            <div className="flex flex-col items-center gap-3 text-primary">
              <Loader2 className="h-10 w-10 animate-spin" />
              <span className="text-sm font-medium">Scanning subscription…</span>
              <span className="text-xs text-muted-foreground">This may take a few seconds</span>
            </div>
          ) : preview ? (
            <img src={preview} alt="Subscription screenshot" className="max-h-40 rounded-2xl object-contain" />
          ) : file ? (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <FileImage className="h-10 w-10" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium">Drop a subscription screenshot or tap to upload</span>
              <span className="text-xs">We'll extract the merchant, amount & date</span>
            </div>
          )}
          <input
            id="sub-scan-input"
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

      {/* Add subscription form */}
      <div className="card-soft p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          {preview ? "Confirm & add" : "Add subscription"}
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
        <Button onClick={handleAdd} disabled={scanning} className="mt-4 w-full sm:w-auto">
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

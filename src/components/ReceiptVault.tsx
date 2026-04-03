import { useState, useMemo } from "react";
import { StoredReceipt, Warranty, SplitParticipant } from "@/types/warranty";
import { CATEGORIES, Category, CATEGORY_COLORS } from "@/types/transaction";
import { useReceiptVault } from "@/hooks/useReceiptVault";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, differenceInDays } from "date-fns";
import {
  ArrowLeft, Calendar, Clock, FileText, Plus, Search, Shield, ShieldAlert, ShieldCheck,
  Split, Tag, Trash2, Upload, Users, X
} from "lucide-react";

interface ReceiptDetailProps {
  receipt: StoredReceipt;
  onBack: () => void;
}

function WarrantyStatus({ expiryDate }: { expiryDate: string }) {
  const daysLeft = differenceInDays(parseISO(expiryDate), new Date());
  if (daysLeft < 0) return <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" />Expired</Badge>;
  if (daysLeft <= 30) return <Badge className="gap-1 bg-warning text-warning-foreground"><Clock className="h-3 w-3" />Expiring in {daysLeft}d</Badge>;
  return <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" />Active · {daysLeft}d left</Badge>;
}

function SplitBillPanel({ receipt, onClose }: { receipt: StoredReceipt; onClose: () => void }) {
  const { addSplit, getSplitForReceipt } = useReceiptVault();
  const existing = getSplitForReceipt(receipt.id);
  const [method, setMethod] = useState<"equal" | "custom">(existing?.method === "custom" ? "custom" : "equal");
  const [participants, setParticipants] = useState<SplitParticipant[]>(
    existing?.participants || [{ name: "", amount: 0 }]
  );
  const [newName, setNewName] = useState("");

  const addParticipant = () => {
    if (!newName.trim()) return;
    const count = participants.length + 1;
    const equalShare = parseFloat((receipt.amount / (count + 1)).toFixed(2));
    if (method === "equal") {
      const updated = [...participants.map(p => ({ ...p, amount: equalShare })), { name: newName.trim(), amount: equalShare }];
      setParticipants(updated);
    } else {
      setParticipants([...participants, { name: newName.trim(), amount: 0 }]);
    }
    setNewName("");
  };

  const removeParticipant = (idx: number) => {
    const updated = participants.filter((_, i) => i !== idx);
    if (method === "equal" && updated.length > 0) {
      const share = parseFloat((receipt.amount / (updated.length + 1)).toFixed(2));
      setParticipants(updated.map(p => ({ ...p, amount: share })));
    } else {
      setParticipants(updated);
    }
  };

  const updateAmount = (idx: number, val: string) => {
    setParticipants(prev => prev.map((p, i) => i === idx ? { ...p, amount: parseFloat(val) || 0 } : p));
  };

  const yourShare = method === "equal" && participants.length > 0
    ? parseFloat((receipt.amount / (participants.length + 1)).toFixed(2))
    : receipt.amount - participants.reduce((s, p) => s + p.amount, 0);

  const handleSave = () => {
    addSplit({
      receiptId: receipt.id,
      method,
      participants: method === "equal"
        ? participants.map(p => ({ ...p, amount: parseFloat((receipt.amount / (participants.length + 1)).toFixed(2)) }))
        : participants,
      totalAmount: receipt.amount,
    });
    onClose();
  };

  return (
    <div className="card-soft p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2"><Split className="h-4 w-4 text-primary" />Split Bill</h3>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
      </div>

      <div className="flex gap-1 rounded-full bg-muted p-0.5 w-fit">
        <button onClick={() => setMethod("equal")} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${method === "equal" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Equal</button>
        <button onClick={() => setMethod("custom")} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${method === "custom" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Custom</button>
      </div>

      <div className="flex gap-2">
        <Input placeholder="Add person…" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addParticipant()} className="rounded-xl" />
        <Button onClick={addParticipant} size="icon" variant="secondary" className="rounded-xl shrink-0"><Plus className="h-4 w-4" /></Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium">You</span>
          <span className="font-mono text-sm font-semibold">£{yourShare.toFixed(2)}</span>
        </div>
        {participants.map((p, i) => (
          <div key={i} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
            <span className="text-sm font-medium">{p.name}</span>
            <div className="flex items-center gap-2">
              {method === "custom" ? (
                <Input type="number" step="0.01" value={p.amount || ""} onChange={(e) => updateAmount(i, e.target.value)} className="rounded-xl w-24 h-8 text-right font-mono text-sm" />
              ) : (
                <span className="font-mono text-sm font-semibold">£{(receipt.amount / (participants.length + 1)).toFixed(2)}</span>
              )}
              <button onClick={() => removeParticipant(i)} className="rounded-full p-1 text-muted-foreground hover:text-destructive"><X className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {participants.length > 0 && (
        <Button onClick={handleSave} className="w-full rounded-xl">Save Split</Button>
      )}
    </div>
  );
}

function WarrantyPanel({ receipt, onClose }: { receipt: StoredReceipt; onClose: () => void }) {
  const { addWarranty, getWarrantiesForReceipt, deleteWarranty } = useReceiptVault();
  const existing = getWarrantiesForReceipt(receipt.id);
  const [productName, setProductName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const handleAdd = () => {
    if (!productName || !expiryDate) return;
    addWarranty({ receiptId: receipt.id, productName, expiryDate });
    setProductName("");
    setExpiryDate("");
  };

  return (
    <div className="card-soft p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" />Warranties</h3>
        <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
      </div>

      {existing.length > 0 && (
        <div className="space-y-2">
          {existing.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{w.productName}</p>
                <p className="text-xs text-muted-foreground">Expires: {format(parseISO(w.expiryDate), "d MMM yyyy")}</p>
              </div>
              <div className="flex items-center gap-2">
                <WarrantyStatus expiryDate={w.expiryDate} />
                <button onClick={() => deleteWarranty(w.id)} className="rounded-full p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <Input placeholder="Product name" value={productName} onChange={(e) => setProductName(e.target.value)} className="rounded-xl" />
        <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="rounded-xl" />
        <Button onClick={handleAdd} disabled={!productName || !expiryDate} variant="secondary" className="w-full rounded-xl gap-2">
          <Plus className="h-4 w-4" />Add Warranty
        </Button>
      </div>
    </div>
  );
}

function ReceiptDetail({ receipt, onBack }: ReceiptDetailProps) {
  const [showSplit, setShowSplit] = useState(false);
  const [showWarranty, setShowWarranty] = useState(false);
  const { getSplitForReceipt, getWarrantiesForReceipt } = useReceiptVault();
  const split = getSplitForReceipt(receipt.id);
  const warranties = getWarrantiesForReceipt(receipt.id);

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />Back to receipts
      </button>

      <div className="card-soft p-6">
        {receipt.imageUrl && (
          <img src={receipt.imageUrl} alt="Receipt" className="w-full max-h-60 object-contain rounded-xl mb-4 bg-muted" />
        )}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">{receipt.merchant}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Calendar className="h-3.5 w-3.5" />{format(parseISO(receipt.date), "d MMMM yyyy")}
            </p>
          </div>
          <span className="font-mono text-2xl font-bold">£{receipt.amount.toFixed(2)}</span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Badge variant="secondary" className="gap-1"><Tag className="h-3 w-3" />{receipt.category}</Badge>
          <Badge variant="outline" className="gap-1"><FileText className="h-3 w-3" />{receipt.source}</Badge>
          {split && <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" />Split</Badge>}
          {warranties.length > 0 && <Badge variant="secondary" className="gap-1"><Shield className="h-3 w-3" />{warranties.length} warranty</Badge>}
        </div>

        <div className="flex gap-2">
          <Button onClick={() => { setShowSplit(true); setShowWarranty(false); }} variant="secondary" className="flex-1 rounded-xl gap-2">
            <Split className="h-4 w-4" />Split Bill
          </Button>
          <Button onClick={() => { setShowWarranty(true); setShowSplit(false); }} variant="secondary" className="flex-1 rounded-xl gap-2">
            <Shield className="h-4 w-4" />Add Warranty
          </Button>
        </div>
      </div>

      {showSplit && <SplitBillPanel receipt={receipt} onClose={() => setShowSplit(false)} />}
      {showWarranty && <WarrantyPanel receipt={receipt} onClose={() => setShowWarranty(false)} />}

      {split && !showSplit && (
        <div className="card-soft p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Split Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm rounded-xl bg-primary/5 px-4 py-2">
              <span className="font-medium">You</span>
              <span className="font-mono font-semibold">£{(split.totalAmount - split.participants.reduce((s, p) => s + p.amount, 0)).toFixed(2)}</span>
            </div>
            {split.participants.map((p, i) => (
              <div key={i} className="flex justify-between text-sm rounded-xl bg-muted/50 px-4 py-2">
                <span>{p.name}</span>
                <span className="font-mono font-semibold">£{p.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface ReceiptVaultProps {
  onNavigateToAdd: () => void;
}

export default function ReceiptVault({ onNavigateToAdd }: ReceiptVaultProps) {
  const { receipts, warranties, deleteReceipt } = useReceiptVault();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedReceipt, setSelectedReceipt] = useState<StoredReceipt | null>(null);
  const [vaultView, setVaultView] = useState<"receipts" | "warranties">("receipts");

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchSearch = !search || r.merchant.toLowerCase().includes(search.toLowerCase());
      const matchCategory = filterCategory === "all" || r.category === filterCategory;
      return matchSearch && matchCategory;
    });
  }, [receipts, search, filterCategory]);

  if (selectedReceipt) {
    return (
      <ReceiptDetail
        receipt={selectedReceipt}
        onBack={() => setSelectedReceipt(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Toggle: Receipts | Warranties */}
      <div className="flex gap-1 rounded-full bg-muted p-0.5 w-fit">
        <button onClick={() => setVaultView("receipts")} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${vaultView === "receipts" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          Receipts
        </button>
        <button onClick={() => setVaultView("warranties")} className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${vaultView === "warranties" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
          Warranties
        </button>
      </div>

      {vaultView === "receipts" ? (
        <>
          {/* Search & filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search receipts…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px] rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Receipt cards */}
          {filteredReceipts.length === 0 ? (
            <div className="card-soft p-10 text-center">
              <p className="text-muted-foreground mb-4">No receipts yet 📭</p>
              <Button onClick={onNavigateToAdd} variant="secondary" className="rounded-xl gap-2"><Plus className="h-4 w-4" />Add your first receipt</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredReceipts.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReceipt(r)}
                  className="flex items-center justify-between rounded-2xl px-4 py-3.5 bg-muted/30 hover:bg-muted/60 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-card"
                      style={{ backgroundColor: CATEGORY_COLORS[r.category as Category] || CATEGORY_COLORS.Other }}
                    >
                      {r.merchant.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{r.merchant}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(r.date), "d MMM yyyy")} · {r.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">£{r.amount.toFixed(2)}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteReceipt(r.id); }}
                      className="rounded-full p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Warranties view */
        <div className="space-y-2">
          {warranties.length === 0 ? (
            <div className="card-soft p-10 text-center">
              <p className="text-muted-foreground">No warranties yet 🛡️</p>
              <p className="text-xs text-muted-foreground mt-1">Add warranties from the receipt detail view</p>
            </div>
          ) : (
            warranties.map((w) => {
              const receipt = receipts.find((r) => r.id === w.receiptId);
              return (
                <div key={w.id} className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3.5">
                  <div>
                    <p className="text-sm font-medium">{w.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {receipt?.merchant || "Unknown"} · Expires {format(parseISO(w.expiryDate), "d MMM yyyy")}
                    </p>
                  </div>
                  <WarrantyStatus expiryDate={w.expiryDate} />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

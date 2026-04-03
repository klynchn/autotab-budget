import { useState } from "react";
import { useFamily } from "@/hooks/useFamily";
import { useTransactions } from "@/hooks/useTransactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORY_COLORS, Category } from "@/types/transaction";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft, Eye, EyeOff, Plus, PoundSterling, ShieldCheck, Trash2, UserPlus, Users, Wallet, X
} from "lucide-react";

export default function Family() {
  const { members, addMember, deleteMember, topUp, togglePrivacy, updateAllowance } = useFamily();
  const { transactions } = useTransactions();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [topUpAmount, setTopUpAmount] = useState("");

  // Add form state
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"parent" | "child">("child");
  const [newAllowance, setNewAllowance] = useState("");
  const [newFrequency, setNewFrequency] = useState<"weekly" | "monthly">("weekly");

  const handleAdd = () => {
    if (!newName) return;
    addMember({
      name: newName,
      role: newRole,
      allowance: parseFloat(newAllowance) || 0,
      allowanceFrequency: newFrequency,
      balance: 0,
      privacyMode: false,
    });
    setNewName("");
    setNewAllowance("");
    setShowAddForm(false);
  };

  const handleTopUp = (id: string) => {
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) return;
    topUp(id, amt);
    setTopUpAmount("");
  };

  const selected = members.find((m) => m.id === selectedMember);

  if (selected) {
    // Simple spending simulation: last 10 transactions attributed to this member
    const memberSpending = transactions.slice(0, 5);

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedMember(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />Back to family
        </button>

        <div className="card-soft p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                {selected.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selected.name}</h2>
                <Badge variant="secondary">{selected.role === "parent" ? "👨‍👩‍👧 Parent" : "🧒 Child"}</Badge>
              </div>
            </div>
            <button onClick={() => togglePrivacy(selected.id)} className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-all" title={selected.privacyMode ? "Privacy on" : "Privacy off"}>
              {selected.privacyMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="font-mono text-2xl font-bold mt-1">£{selected.balance.toFixed(2)}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-4 text-center">
              <p className="text-xs text-muted-foreground">Allowance</p>
              <p className="font-mono text-2xl font-bold mt-1">£{selected.allowance.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">/{selected.allowanceFrequency === "weekly" ? "wk" : "mo"}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Input type="number" step="0.01" placeholder="Top-up amount" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} className="rounded-xl" />
            <Button onClick={() => handleTopUp(selected.id)} disabled={!topUpAmount} className="rounded-xl gap-2 shrink-0">
              <Plus className="h-4 w-4" />Top Up
            </Button>
          </div>
        </div>

        {/* Spending (simplified view) */}
        <div className="card-soft p-6">
          <h3 className="text-base font-semibold mb-4">
            {selected.privacyMode ? "Spending Categories" : "Recent Spending"}
          </h3>
          {selected.privacyMode ? (
            <div className="space-y-3">
              {["Food & Groceries", "Transport", "Shopping"].map((cat) => (
                <div key={cat} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat as Category] }} />
                    <span className="text-sm font-medium">{cat}</span>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
              <p className="text-xs text-muted-foreground text-center mt-2">Privacy mode: detailed transactions hidden</p>
            </div>
          ) : (
            <div className="space-y-1">
              {memberSpending.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-card" style={{ backgroundColor: CATEGORY_COLORS[tx.category] }}>
                      {tx.merchant.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.merchant}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(tx.date), "d MMM")} · {tx.category}</p>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold">£{tx.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5" />Family</h2>
          <p className="text-sm text-muted-foreground">Manage allowances and track family spending.</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant="secondary" className="rounded-xl gap-2">
          <UserPlus className="h-4 w-4" />{showAddForm ? "Cancel" : "Add Member"}
        </Button>
      </div>

      {showAddForm && (
        <div className="card-soft p-5 space-y-4">
          <h3 className="text-base font-semibold">New family member</h3>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Sophie" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newRole} onValueChange={(v) => setNewRole(v as "parent" | "child")}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="child">Child</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Allowance (£)</Label>
                <Input type="number" step="0.01" value={newAllowance} onChange={(e) => setNewAllowance(e.target.value)} placeholder="20.00" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select value={newFrequency} onValueChange={(v) => setNewFrequency(v as "weekly" | "monthly")}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={!newName} className="w-full rounded-xl">Add Member</Button>
          </div>
        </div>
      )}

      {members.length === 0 ? (
        <div className="card-soft p-10 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No family members yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add members to start managing allowances</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMember(m.id)}
              className="flex items-center justify-between rounded-2xl bg-muted/30 px-4 py-3.5 hover:bg-muted/60 cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.role === "parent" ? "Parent" : "Child"} · £{m.allowance}/{m.allowanceFrequency === "weekly" ? "wk" : "mo"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono text-sm font-semibold">£{m.balance.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">balance</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteMember(m.id); }}
                  className="rounded-full p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

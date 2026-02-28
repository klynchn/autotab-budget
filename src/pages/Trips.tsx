import { useState } from "react";
import { useTrips } from "@/hooks/useTrips";
import { COUNTRIES, CountryInfo, TRIP_CATEGORIES, TRIP_CATEGORY_COLORS, TRIP_CATEGORY_ICONS, TripCategory } from "@/types/trip";
import type { Trip } from "@/types/trip";
import { format, parseISO, differenceInDays } from "date-fns";
import { Plane, Plus, Trash2, Wallet, ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function CostBadge({ level }: { level: string }) {
  const cls =
    level === "Low"
      ? "bg-success/10 text-success"
      : level === "Moderate"
      ? "bg-warning/10 text-warning"
      : "bg-destructive/10 text-destructive";
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{level} cost</span>;
}

function CurrencyBadge({ symbol, currency }: { symbol: string; currency: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
      {symbol} {currency}
    </span>
  );
}

export default function Trips() {
  const {
    trips, wallet, activeTrip,
    createTrip, deleteTrip, toggleActiveTrip,
    addExpense, deleteExpense,
    updateWallet, getTripSpent, getTripRemaining,
  } = useTrips();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");

  // Expense form
  const [expMerchant, setExpMerchant] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expCategory, setExpCategory] = useState<TripCategory>("Food");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);

  const selectedCountry: CountryInfo | undefined = COUNTRIES.find((c) => c.name === country);

  const resetForm = () => {
    setName(""); setCountry(""); setRegion(""); setStartDate(""); setEndDate(""); setBudget("");
    setShowForm(false);
  };

  const handleCreate = () => {
    if (!name || !country || !startDate || !endDate || !budget) return;
    createTrip({ name, country, region, startDate, endDate, budget: parseFloat(budget) });
    resetForm();
  };

  const handleAddExpense = (tripId: string) => {
    if (!expMerchant || !expAmount) return;
    const rate = selectedCountry?.exchangeRate || COUNTRIES.find(c => {
      const trip = trips.find(t => t.id === tripId);
      return c.name === trip?.country;
    })?.exchangeRate || 1;
    const localAmount = parseFloat(expAmount);
    addExpense(tripId, {
      merchant: expMerchant,
      amount: localAmount,
      amountHome: parseFloat((localAmount / rate).toFixed(2)),
      category: expCategory,
      date: expDate,
    });
    setExpMerchant(""); setExpAmount("");
  };

  const walletProgress = activeTrip
    ? Math.min(100, (wallet.totalSaved / activeTrip.budget) * 100)
    : 0;

  return (
    <div className="space-y-8 pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plane className="h-6 w-6 text-primary" /> Trip Spending
          </h1>
          <p className="text-muted-foreground mt-1">Plan and track travel budgets separately.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" /> New Trip
        </Button>
      </div>

      {/* Create Trip Form */}
      {showForm && (
        <div className="card-soft p-6 space-y-4">
          <h2 className="text-base font-semibold">Create a Trip</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Trip name (e.g. Malaysia March 2026)" value={name} onChange={(e) => setName(e.target.value)} />
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger><SelectValue placeholder="Destination country" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.name} value={c.name}>
                    {c.flag} {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Region / City" value={region} onChange={(e) => setRegion(e.target.value)} />
            <Input type="number" placeholder="Trip budget (£)" value={budget} onChange={(e) => setBudget(e.target.value)} />
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          {selectedCountry && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-2xl">{selectedCountry.flag}</span>
              <CurrencyBadge symbol={selectedCountry.currencySymbol} currency={selectedCountry.currency} />
              <span className="text-xs text-muted-foreground">
                £1 = {selectedCountry.currencySymbol}{selectedCountry.exchangeRate.toLocaleString()}
              </span>
              <CostBadge level={selectedCountry.costLevel} />
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button onClick={handleCreate} size="sm" className="rounded-full">Create Trip</Button>
            <Button onClick={resetForm} variant="ghost" size="sm" className="rounded-full">Cancel</Button>
          </div>
        </div>
      )}

      {/* Travel Wallet */}
      <div className="card-soft p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold">Travel Wallet</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Monthly allocation</p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">£</span>
              <Input
                type="number"
                className="font-mono"
                value={wallet.monthlyAllocation || ""}
                onChange={(e) => updateWallet({ monthlyAllocation: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Total saved</p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">£</span>
              <Input
                type="number"
                className="font-mono"
                value={wallet.totalSaved || ""}
                onChange={(e) => updateWallet({ totalSaved: parseFloat(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            {activeTrip ? (
              <>
                <p className="text-xs text-muted-foreground mb-1">
                  Progress to {activeTrip.name} (£{activeTrip.budget})
                </p>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${walletProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  £{wallet.totalSaved.toFixed(0)} / £{activeTrip.budget.toFixed(0)} ({walletProgress.toFixed(0)}%)
                </p>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Activate a trip to see savings progress</p>
            )}
          </div>
        </div>

        {/* Flow visualization */}
        <div className="flex items-center justify-center gap-3 py-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-muted px-3 py-1.5 font-medium">Main Budget</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span className="rounded-full bg-primary/10 px-3 py-1.5 font-medium text-primary">
            Travel Fund £{wallet.totalSaved.toFixed(0)}
          </span>
          {activeTrip && (
            <>
              <ArrowRight className="h-3.5 w-3.5" />
              <span className="rounded-full bg-accent px-3 py-1.5 font-medium text-accent-foreground">
                {activeTrip.name}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Trip list */}
      {trips.length === 0 ? (
        <div className="card-soft p-10 text-center">
          <Plane className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No trips yet — create one to start planning! ✈️</p>
        </div>
      ) : (
        <div className="space-y-6">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onDelete={() => deleteTrip(trip.id)}
              onToggleActive={() => toggleActiveTrip(trip.id)}
              getTripSpent={getTripSpent}
              getTripRemaining={getTripRemaining}
              onAddExpense={() => handleAddExpense(trip.id)}
              onDeleteExpense={(eid) => deleteExpense(trip.id, eid)}
              expMerchant={expMerchant}
              setExpMerchant={setExpMerchant}
              expAmount={expAmount}
              setExpAmount={setExpAmount}
              expCategory={expCategory}
              setExpCategory={setExpCategory}
              expDate={expDate}
              setExpDate={setExpDate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TripCardProps {
  trip: Trip;
  onDelete: () => void;
  onToggleActive: () => void;
  getTripSpent: (t: Trip) => number;
  getTripRemaining: (t: Trip) => number;
  onAddExpense: () => void;
  onDeleteExpense: (id: string) => void;
  expMerchant: string;
  setExpMerchant: (v: string) => void;
  expAmount: string;
  setExpAmount: (v: string) => void;
  expCategory: TripCategory;
  setExpCategory: (v: TripCategory) => void;
  expDate: string;
  setExpDate: (v: string) => void;
}

function TripCard({
  trip, onDelete, onToggleActive, getTripSpent, getTripRemaining,
  onAddExpense, onDeleteExpense,
  expMerchant, setExpMerchant, expAmount, setExpAmount, expCategory, setExpCategory, expDate, setExpDate,
}: TripCardProps) {
  const [expanded, setExpanded] = useState(false);
  const countryInfo = COUNTRIES.find((c) => c.name === trip.country);
  const spent = getTripSpent(trip);
  const remaining = getTripRemaining(trip);
  const spentPercent = trip.budget > 0 ? Math.min(100, (spent / trip.budget) * 100) : 0;
  const daysUntil = differenceInDays(parseISO(trip.startDate), new Date());
  const tripDays = differenceInDays(parseISO(trip.endDate), parseISO(trip.startDate));
  const isUpcoming = daysUntil > 0;

  // Category breakdown
  const categorySpend: Record<string, number> = {};
  trip.expenses.forEach((e) => {
    categorySpend[e.category] = (categorySpend[e.category] || 0) + e.amountHome;
  });

  return (
    <div className="card-soft overflow-hidden">
      {/* Header */}
      <div
        className="p-6 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{countryInfo?.flag || "🌍"}</span>
            <div>
              <h3 className="font-semibold text-base">{trip.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {trip.region ? `${trip.region}, ` : ""}{trip.country}
                {" · "}
                {format(parseISO(trip.startDate), "d MMM")} – {format(parseISO(trip.endDate), "d MMM yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {countryInfo && <CurrencyBadge symbol={countryInfo.currencySymbol} currency={countryInfo.currency} />}
            {isUpcoming && (
              <span className="text-xs text-muted-foreground">{daysUntil}d away</span>
            )}
          </div>
        </div>

        {/* Budget bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">£{spent.toFixed(2)} spent</span>
            <span className={`font-mono font-semibold ${remaining < 0 ? "text-destructive" : "text-success"}`}>
              £{Math.abs(remaining).toFixed(2)} {remaining < 0 ? "over" : "left"}
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${spentPercent > 90 ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${spentPercent}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">Budget: £{trip.budget.toFixed(0)} · {tripDays} days</p>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t px-6 py-5 space-y-5">
          {/* Trip actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={trip.isActive ? "default" : "outline"}
              className="rounded-full text-xs"
              onClick={(e) => { e.stopPropagation(); onToggleActive(); }}
            >
              {trip.isActive ? "✅ Active Trip" : "Activate Trip"}
            </Button>
            {countryInfo && <CostBadge level={countryInfo.costLevel} />}
            {countryInfo && (
              <span className="text-xs text-muted-foreground self-center">
                £1 = {countryInfo.currencySymbol}{countryInfo.exchangeRate.toLocaleString()}
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-xs text-destructive hover:text-destructive ml-auto"
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </div>

          {/* Category breakdown */}
          {trip.expenses.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Spending by category</p>
              <div className="space-y-2">
                {TRIP_CATEGORIES.filter((c) => categorySpend[c]).map((cat) => {
                  const val = categorySpend[cat];
                  const pct = spent > 0 ? (val / spent) * 100 : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5">
                          <span>{TRIP_CATEGORY_ICONS[cat]}</span>
                          <span className="font-medium">{cat}</span>
                        </span>
                        <span className="font-mono font-semibold">£{val.toFixed(2)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: TRIP_CATEGORY_COLORS[cat] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add expense */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Add expense</p>
            <div className="grid gap-2 sm:grid-cols-4">
              <Input placeholder="Merchant" value={expMerchant} onChange={(e) => setExpMerchant(e.target.value)} className="text-sm" />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {countryInfo?.currencySymbol || "£"}
                </span>
                <Input
                  type="number"
                  placeholder="Amount"
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  className="pl-8 text-sm font-mono"
                />
              </div>
              <Select value={expCategory} onValueChange={(v) => setExpCategory(v as TripCategory)}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRIP_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{TRIP_CATEGORY_ICONS[c]} {c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={onAddExpense} size="sm" className="rounded-full">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Expense list */}
          {trip.expenses.length > 0 && (
            <div className="space-y-1">
              {[...trip.expenses].reverse().map((exp) => (
                <div key={exp.id} className="flex items-center justify-between rounded-2xl px-3 py-2.5 hover:bg-muted/50 transition-all group">
                  <div className="flex items-center gap-2.5">
                    <span>{TRIP_CATEGORY_ICONS[exp.category]}</span>
                    <div>
                      <p className="text-sm font-medium">{exp.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(exp.date), "d MMM")} · {exp.category}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold">
                        {countryInfo?.currencySymbol}{exp.amount.toFixed(2)}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">≈ £{exp.amountHome.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
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
      )}
    </div>
  );
}

import { Category } from "@/types/transaction";

export type IncomeBand = "0-500" | "500-800" | "800-1000" | "1000-1500" | "1500+";

export const INCOME_BAND_LABELS: Record<IncomeBand, string> = {
  "0-500": "£0 – £500",
  "500-800": "£500 – £800",
  "800-1000": "£800 – £1,000",
  "1000-1500": "£1,000 – £1,500",
  "1500+": "£1,500+",
};

// Median monthly spend per category for each income band (mock benchmark data)
const COHORT_DATA: Record<IncomeBand, Partial<Record<Category, number>>> = {
  "0-500": {
    "Food & Groceries": 80,
    Transport: 25,
    "Social / Nights Out": 30,
    Subscriptions: 15,
    Shopping: 20,
    Utilities: 40,
    Rent: 200,
  },
  "500-800": {
    "Food & Groceries": 120,
    Transport: 45,
    "Social / Nights Out": 55,
    Subscriptions: 22,
    Shopping: 35,
    Utilities: 60,
    Rent: 350,
  },
  "800-1000": {
    "Food & Groceries": 150,
    Transport: 60,
    "Social / Nights Out": 75,
    Subscriptions: 28,
    Shopping: 45,
    Utilities: 70,
    Rent: 450,
  },
  "1000-1500": {
    "Food & Groceries": 180,
    Transport: 75,
    "Social / Nights Out": 100,
    Subscriptions: 35,
    Shopping: 60,
    Utilities: 85,
    Rent: 550,
  },
  "1500+": {
    "Food & Groceries": 220,
    Transport: 90,
    "Social / Nights Out": 130,
    Subscriptions: 42,
    Shopping: 80,
    Utilities: 100,
    Rent: 650,
  },
};

export function getCohortMedians(band: IncomeBand): Partial<Record<Category, number>> {
  return COHORT_DATA[band];
}

export function detectIncomeBand(budget: number): IncomeBand {
  if (budget <= 500) return "0-500";
  if (budget <= 800) return "500-800";
  if (budget <= 1000) return "800-1000";
  if (budget <= 1500) return "1000-1500";
  return "1500+";
}

export interface CohortComparison {
  category: Category;
  yourSpend: number;
  cohortMedian: number;
  diffPercent: number; // positive = you spend more
}

export function compareToCohort(
  spendByCategory: Partial<Record<Category, number>>,
  band: IncomeBand
): CohortComparison[] {
  const medians = getCohortMedians(band);
  const categories = Object.keys(medians) as Category[];

  return categories.map((cat) => {
    const yours = spendByCategory[cat] || 0;
    const median = medians[cat] || 1;
    const diffPercent = median > 0 ? ((yours - median) / median) * 100 : 0;
    return { category: cat, yourSpend: yours, cohortMedian: median, diffPercent };
  });
}

export interface SmartSuggestion {
  emoji: string;
  title: string;
  description: string;
  savingsEstimate?: number;
}

export function generateSuggestions(
  comparisons: CohortComparison[],
  subscriptionMerchants: string[]
): SmartSuggestion[] {
  const suggestions: SmartSuggestion[] = [];

  // Sort by biggest overspend
  const overspends = [...comparisons]
    .filter((c) => c.diffPercent > 10 && c.yourSpend > 0)
    .sort((a, b) => b.diffPercent - a.diffPercent);

  for (const item of overspends.slice(0, 3)) {
    const overAmount = item.yourSpend - item.cohortMedian;

    if (item.category === "Social / Nights Out") {
      const weekSave = Math.round(overAmount / 4);
      suggestions.push({
        emoji: "🍻",
        title: `Social spend is ${Math.round(item.diffPercent)}% above your cohort`,
        description: `Cutting ~£${weekSave}/week could save you £${Math.round(overAmount)}/month.`,
        savingsEstimate: Math.round(overAmount),
      });
    } else if (item.category === "Food & Groceries") {
      suggestions.push({
        emoji: "🥗",
        title: `Food spend is ${Math.round(item.diffPercent)}% higher than typical`,
        description: `Try meal prepping 2 days a week — could save ~£${Math.round(overAmount * 0.6)}/month.`,
        savingsEstimate: Math.round(overAmount * 0.6),
      });
    } else if (item.category === "Subscriptions") {
      suggestions.push({
        emoji: "📺",
        title: `Subscriptions are above typical for your band`,
        description: `Consider cancelling one or rotating monthly to save £${Math.round(overAmount)}/month.`,
        savingsEstimate: Math.round(overAmount),
      });
    } else if (item.category === "Transport") {
      suggestions.push({
        emoji: "🚌",
        title: `Transport spend is ${Math.round(item.diffPercent)}% higher`,
        description: `Look into weekly caps or student railcards to save ~£${Math.round(overAmount)}/month.`,
        savingsEstimate: Math.round(overAmount),
      });
    } else if (item.category === "Shopping") {
      suggestions.push({
        emoji: "🛍️",
        title: `Shopping is ${Math.round(item.diffPercent)}% above your cohort`,
        description: `Try a 24-hour rule before buying non-essentials. Could save ~£${Math.round(overAmount)}/month.`,
        savingsEstimate: Math.round(overAmount),
      });
    } else {
      suggestions.push({
        emoji: "💡",
        title: `${item.category} is ${Math.round(item.diffPercent)}% above average`,
        description: `You're spending £${Math.round(overAmount)} more than similar students.`,
        savingsEstimate: Math.round(overAmount),
      });
    }
  }

  // If underspending in key areas
  const underspends = comparisons.filter((c) => c.diffPercent < -20 && c.yourSpend > 0);
  if (underspends.length > 0 && suggestions.length < 5) {
    const best = underspends.sort((a, b) => a.diffPercent - b.diffPercent)[0];
    suggestions.push({
      emoji: "👏",
      title: `Great job on ${best.category}!`,
      description: `You're spending ${Math.abs(Math.round(best.diffPercent))}% less than your cohort here.`,
    });
  }

  return suggestions.slice(0, 5);
}

// Entertainment subscriptions for optimiser
const ENTERTAINMENT_SUBS: Record<string, string[]> = {
  streaming: ["netflix", "disney+", "disney", "prime video", "amazon prime", "apple tv", "now tv", "paramount+"],
  music: ["spotify", "apple music", "youtube music", "amazon music", "tidal", "deezer"],
};

export interface SubOptimisation {
  group: string;
  services: string[];
  monthlyTotal: number;
  recommendation: string;
  potentialSaving: number;
}

export function optimiseSubscriptions(
  merchantAmounts: { merchant: string; amount: number }[]
): SubOptimisation[] {
  const results: SubOptimisation[] = [];

  for (const [group, keywords] of Object.entries(ENTERTAINMENT_SUBS)) {
    const matches = merchantAmounts.filter((m) =>
      keywords.some((k) => m.merchant.toLowerCase().includes(k))
    );

    if (matches.length >= 2) {
      const total = matches.reduce((s, m) => s + m.amount, 0);
      const cheapest = matches.reduce((a, b) => (a.amount < b.amount ? a : b));
      const saving = total - cheapest.amount;

      const label = group === "streaming" ? "Video streaming" : "Music streaming";
      results.push({
        group: label,
        services: matches.map((m) => m.merchant),
        monthlyTotal: total,
        recommendation:
          matches.length > 2
            ? `Keep ${cheapest.merchant} and rotate the others month-by-month.`
            : `Pick one and cancel the other — keep ${cheapest.merchant} (best value).`,
        potentialSaving: parseFloat(saving.toFixed(2)),
      });
    }
  }

  return results;
}

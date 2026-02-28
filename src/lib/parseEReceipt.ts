import { CATEGORIES, Category } from "@/types/transaction";

interface ParsedReceipt {
  merchant: string;
  amount: number;
  date: string;
  category: Category;
}

const MERCHANT_CATEGORY_MAP: Record<string, Category> = {
  tesco: "Food & Groceries",
  sainsburys: "Food & Groceries",
  "sainsbury's": "Food & Groceries",
  asda: "Food & Groceries",
  lidl: "Food & Groceries",
  aldi: "Food & Groceries",
  morrisons: "Food & Groceries",
  waitrose: "Food & Groceries",
  "marks & spencer": "Food & Groceries",
  netflix: "Subscriptions",
  spotify: "Subscriptions",
  "apple music": "Subscriptions",
  "disney+": "Subscriptions",
  amazon: "Shopping",
  ebay: "Shopping",
  asos: "Shopping",
  tfl: "Transport",
  uber: "Transport",
  bolt: "Transport",
  "national rail": "Transport",
  "trip.com": "Transport",
  trainline: "Transport",
  wetherspoons: "Social / Nights Out",
  "five guys": "Social / Nights Out",
  nandos: "Social / Nights Out",
  "nando's": "Social / Nights Out",
  deliveroo: "Food & Groceries",
  "just eat": "Food & Groceries",
  ee: "Utilities",
  vodafone: "Utilities",
  giffgaff: "Utilities",
  three: "Utilities",
  o2: "Utilities",
  sky: "Utilities",
  bt: "Utilities",
  "virgin media": "Utilities",
  "british gas": "Utilities",
  thameswater: "Utilities",
  puregym: "Subscriptions",
  "the gym": "Subscriptions",
  youtube: "Subscriptions",
  "now tv": "Subscriptions",
};

export function guessCategory(merchant: string): Category {
  const lower = merchant.toLowerCase();
  for (const [key, cat] of Object.entries(MERCHANT_CATEGORY_MAP)) {
    if (lower.includes(key)) return cat;
  }
  return "Other";
}

export function parseEReceiptText(text: string): Partial<ParsedReceipt> {
  const result: Partial<ParsedReceipt> = {};

  // Try to extract amount (£XX.XX or GBP XX.XX)
  const amountMatch = text.match(/[£](\d+[.,]\d{2})/i) || text.match(/GBP\s*(\d+[.,]\d{2})/i) || text.match(/total[:\s]*[£]?(\d+[.,]\d{2})/i);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1].replace(",", "."));
  }

  // Try to extract date
  const dateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/) || text.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/i);
  if (dateMatch) {
    try {
      if (dateMatch[2].length > 2) {
        // Named month format
        const d = new Date(`${dateMatch[2]} ${dateMatch[1]}, ${dateMatch[3]}`);
        if (!isNaN(d.getTime())) result.date = d.toISOString().split("T")[0];
      } else {
        // DD/MM/YYYY
        const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
        const d = new Date(`${year}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}`);
        if (!isNaN(d.getTime())) result.date = d.toISOString().split("T")[0];
      }
    } catch {
      // ignore
    }
  }

  // Try first line or "from" line as merchant
  const fromMatch = text.match(/from[:\s]+(.+)/i);
  if (fromMatch) {
    result.merchant = fromMatch[1].trim().split(/\s{2,}/)[0];
  } else {
    const firstLine = text.trim().split("\n")[0].trim();
    if (firstLine.length < 60) result.merchant = firstLine;
  }

  if (result.merchant) {
    result.category = guessCategory(result.merchant);
  }

  return result;
}

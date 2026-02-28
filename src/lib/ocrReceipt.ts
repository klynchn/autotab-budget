import Tesseract from "tesseract.js";
import { guessCategory } from "./parseEReceipt";
import { Category } from "@/types/transaction";

export interface ParsedReceipt {
  merchant: string;
  amount: number | null;
  date: string;
  category: Category;
}

// Common UK supermarket / store names to match against
const KNOWN_MERCHANTS = [
  "lidl", "aldi", "tesco", "sainsbury", "asda", "morrisons", "waitrose",
  "co-op", "coop", "iceland", "spar", "m&s", "marks & spencer", "marks and spencer",
  "boots", "superdrug", "primark", "poundland", "home bargains", "b&m",
  "wetherspoons", "greggs", "costa", "starbucks", "mcdonald", "kfc",
  "nando", "subway", "domino", "pizza hut", "burger king",
  "amazon", "argos", "wilko", "tk maxx", "next", "h&m",
];

/**
 * Run OCR on a receipt image and extract merchant + total.
 */
export async function ocrReceipt(imageSource: string | File): Promise<ParsedReceipt> {
  const { data } = await Tesseract.recognize(imageSource, "eng", {
    logger: () => {}, // silence logs
  });

  const text = data.text;
  return parseReceiptText(text);
}

/**
 * Parse raw OCR text to extract merchant, total, and date.
 */
export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const lowerText = text.toLowerCase();

  // 1. Detect merchant — check known names first, then fall back to first non-empty line
  let merchant = "";
  for (const known of KNOWN_MERCHANTS) {
    if (lowerText.includes(known)) {
      // Capitalise properly
      merchant = known.charAt(0).toUpperCase() + known.slice(1);
      // Special cases
      if (known === "m&s" || known === "marks & spencer" || known === "marks and spencer") merchant = "M&S";
      if (known === "co-op" || known === "coop") merchant = "Co-op";
      if (known === "mcdonald") merchant = "McDonald's";
      if (known === "b&m") merchant = "B&M";
      if (known === "tk maxx") merchant = "TK Maxx";
      if (known === "h&m") merchant = "H&M";
      break;
    }
  }
  if (!merchant && lines.length > 0) {
    // Use the first line that looks like a name (not a number)
    for (const line of lines.slice(0, 5)) {
      if (!/^\d/.test(line) && line.length > 2 && line.length < 40) {
        merchant = line;
        break;
      }
    }
  }

  // 2. Find total amount — look for "total" line with a number
  let amount: number | null = null;
  const totalPatterns = [
    /total\s*:?\s*[£$]?\s*(\d+[.,]\d{2})/i,
    /balance\s*(?:due)?\s*:?\s*[£$]?\s*(\d+[.,]\d{2})/i,
    /amount\s*(?:due)?\s*:?\s*[£$]?\s*(\d+[.,]\d{2})/i,
    /to\s*pay\s*:?\s*[£$]?\s*(\d+[.,]\d{2})/i,
    /grand\s*total\s*:?\s*[£$]?\s*(\d+[.,]\d{2})/i,
  ];

  for (const pattern of totalPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      amount = parseFloat(match[1].replace(",", "."));
      break;
    }
  }

  // Fallback: find the largest £X.XX value on the receipt
  if (amount === null) {
    const allAmounts = [...text.matchAll(/[£$]?\s?(\d+[.,]\d{2})/g)];
    if (allAmounts.length > 0) {
      const values = allAmounts.map((m) => parseFloat(m[1].replace(",", ".")));
      amount = Math.max(...values);
    }
  }

  // 3. Find date
  let date = new Date().toISOString().split("T")[0];
  const datePatterns = [
    /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/,  // DD/MM/YYYY or DD-MM-YYYY
  ];
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      let [, day, month, year] = match;
      if (year.length === 2) year = "20" + year;
      const d = parseInt(day), m = parseInt(month);
      // Basic validation
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        date = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        break;
      }
    }
  }

  const category = guessCategory(merchant);

  return { merchant, amount, date, category };
}

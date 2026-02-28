import Tesseract from "tesseract.js";
import { guessCategory } from "./parseEReceipt";
import { Category } from "@/types/transaction";

export interface ParsedReceipt {
  merchant: string;
  amount: number | null;
  date: string;
  category: Category;
}

// Common UK store / service names to match against
const KNOWN_MERCHANTS = [
  "lidl", "aldi", "tesco", "sainsbury", "asda", "morrisons", "waitrose",
  "co-op", "coop", "iceland", "spar", "m&s", "marks & spencer", "marks and spencer",
  "boots", "superdrug", "primark", "poundland", "home bargains", "b&m",
  "wetherspoons", "greggs", "costa", "starbucks", "mcdonald", "kfc",
  "nando", "subway", "domino", "pizza hut", "burger king",
  "amazon", "argos", "wilko", "tk maxx", "next", "h&m",
  "trip.com", "trainline", "national rail", "tfl", "uber", "bolt",
  "netflix", "spotify", "apple", "disney", "deliveroo", "just eat",
  "giffgaff", "ee", "vodafone", "three", "o2", "sky", "bt",
  "virgin media", "now tv", "puregym", "the gym", "youtube",
];

const MERCHANT_DISPLAY: Record<string, string> = {
  "lidl": "Lidl", "aldi": "Aldi", "tesco": "Tesco", "sainsbury": "Sainsbury's",
  "asda": "Asda", "morrisons": "Morrisons", "waitrose": "Waitrose",
  "co-op": "Co-op", "coop": "Co-op", "m&s": "M&S",
  "marks & spencer": "M&S", "marks and spencer": "M&S",
  "mcdonald": "McDonald's", "b&m": "B&M", "tk maxx": "TK Maxx", "h&m": "H&M",
  "trip.com": "Trip.com", "trainline": "Trainline", "national rail": "National Rail",
  "tfl": "TfL", "nando": "Nando's", "domino": "Domino's",
  "deliveroo": "Deliveroo", "just eat": "Just Eat",
  "giffgaff": "giffgaff", "ee": "EE", "vodafone": "Vodafone", "three": "Three",
  "o2": "O2", "sky": "Sky", "bt": "BT", "virgin media": "Virgin Media",
  "now tv": "Now TV", "puregym": "PureGym", "the gym": "The Gym", "youtube": "YouTube",
};

/**
 * Extract text from a PDF file using pdfjs-dist.
 */
async function extractTextFromPdf(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  // Use the bundled worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];
  for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    textParts.push(pageText);
  }

  return textParts.join("\n");
}

/**
 * Process a receipt file — handles both images (OCR) and PDFs (text extraction).
 */
export async function ocrReceipt(file: File): Promise<ParsedReceipt> {
  let text: string;

  if (file.type === "application/pdf") {
    text = await extractTextFromPdf(file);
  } else {
    const { data } = await Tesseract.recognize(file, "eng", {
      logger: () => {},
    });
    text = data.text;
  }

  return parseReceiptText(text);
}

/**
 * Parse raw text to extract merchant, total, and date.
 */
export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const lowerText = text.toLowerCase();

  // 1. Detect merchant
  let merchant = "";
  for (const known of KNOWN_MERCHANTS) {
    if (lowerText.includes(known)) {
      merchant = MERCHANT_DISPLAY[known] || known.charAt(0).toUpperCase() + known.slice(1);
      break;
    }
  }
  if (!merchant && lines.length > 0) {
    for (const line of lines.slice(0, 5)) {
      if (!/^\d/.test(line) && line.length > 2 && line.length < 40) {
        merchant = line;
        break;
      }
    }
  }

  // 2. Find total amount
  let amount: number | null = null;
  const totalPatterns = [
    /total\s*:?\s*[£$]?\s*(\d+[.,]\d{2})/gi,
    /balance\s*(?:due)?\s*:?\s*[£$]?\s*(\d+[.,]\d{2})/gi,
    /amount\s*(?:due)?\s*:?\s*[£$]?\s*(\d+[.,]\d{2})/gi,
    /to\s*pay\s*:?\s*[£$]?\s*(\d+[.,]\d{2})/gi,
    /grand\s*total\s*:?\s*[£$]?\s*(\d+[.,]\d{2})/gi,
  ];

  for (const pattern of totalPatterns) {
    const matches = [...lowerText.matchAll(pattern)];
    if (matches.length > 0) {
      // Use the last "total" match (often the final total on receipts)
      amount = parseFloat(matches[matches.length - 1][1].replace(",", "."));
      break;
    }
  }

  // Fallback: find the largest £X.XX value
  if (amount === null) {
    const allAmounts = [...text.matchAll(/[£$]\s?(\d+[.,]\d{2})/g)];
    if (allAmounts.length > 0) {
      const values = allAmounts.map((m) => parseFloat(m[1].replace(",", ".")));
      amount = Math.max(...values);
    }
  }

  // 3. Find date — support multiple formats
  let date = new Date().toISOString().split("T")[0];

  // Try named month format first: "Feb 10, 2026" or "10 Feb 2026"
  const namedDatePatterns = [
    /(\w{3,9})\s+(\d{1,2}),?\s+(\d{4})/i,  // "Feb 10, 2026"
    /(\d{1,2})\s+(\w{3,9})\s+(\d{4})/i,      // "10 Feb 2026"
  ];

  let dateFound = false;
  for (const pattern of namedDatePatterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const d = new Date(match[0].replace(",", ""));
        if (!isNaN(d.getTime())) {
          date = d.toISOString().split("T")[0];
          dateFound = true;
          break;
        }
      } catch { /* continue */ }
    }
  }

  if (!dateFound) {
    const numericDatePattern = /(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/;
    const match = text.match(numericDatePattern);
    if (match) {
      let [, day, month, year] = match;
      if (year.length === 2) year = "20" + year;
      const d = parseInt(day), m = parseInt(month);
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        date = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      }
    }
  }

  const category = guessCategory(merchant);

  return { merchant, amount, date, category };
}

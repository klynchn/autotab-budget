export const TRIP_CATEGORIES = [
  "Flights",
  "Accommodation",
  "Local Transport",
  "Food",
  "Activities",
  "Shopping",
  "Emergency Buffer",
] as const;

export type TripCategory = (typeof TRIP_CATEGORIES)[number];

export const TRIP_CATEGORY_ICONS: Record<TripCategory, string> = {
  Flights: "✈️",
  Accommodation: "🏨",
  "Local Transport": "🚌",
  Food: "🍜",
  Activities: "🎭",
  Shopping: "🛍️",
  "Emergency Buffer": "🛟",
};

export const TRIP_CATEGORY_COLORS: Record<TripCategory, string> = {
  Flights: "hsl(210, 60%, 55%)",
  Accommodation: "hsl(262, 50%, 58%)",
  "Local Transport": "hsl(174, 55%, 44%)",
  Food: "hsl(38, 75%, 55%)",
  Activities: "hsl(330, 55%, 58%)",
  Shopping: "hsl(28, 65%, 56%)",
  "Emergency Buffer": "hsl(0, 55%, 55%)",
};

export interface TripExpense {
  id: string;
  tripId: string;
  merchant: string;
  amount: number; // in destination currency
  amountHome: number; // converted to GBP
  category: TripCategory;
  date: string;
  note?: string;
}

export interface Trip {
  id: string;
  name: string;
  country: string;
  region: string;
  startDate: string;
  endDate: string;
  budget: number; // total trip budget in GBP
  expenses: TripExpense[];
  isActive: boolean;
}

export interface TravelWallet {
  monthlyAllocation: number; // £ per month toward travel
  totalSaved: number;
}

export interface CountryInfo {
  name: string;
  currency: string;
  currencySymbol: string;
  exchangeRate: number; // 1 GBP = X local currency
  costLevel: "Low" | "Moderate" | "High";
  flag: string;
}

// Hardcoded country data (exchange rates approximate as of early 2026)
export const COUNTRIES: CountryInfo[] = [
  { name: "Malaysia", currency: "MYR", currencySymbol: "RM", exchangeRate: 5.95, costLevel: "Low", flag: "🇲🇾" },
  { name: "Japan", currency: "JPY", currencySymbol: "¥", exchangeRate: 192.5, costLevel: "Moderate", flag: "🇯🇵" },
  { name: "Thailand", currency: "THB", currencySymbol: "฿", exchangeRate: 44.8, costLevel: "Low", flag: "🇹🇭" },
  { name: "United States", currency: "USD", currencySymbol: "$", exchangeRate: 1.27, costLevel: "High", flag: "🇺🇸" },
  { name: "France", currency: "EUR", currencySymbol: "€", exchangeRate: 1.17, costLevel: "High", flag: "🇫🇷" },
  { name: "Spain", currency: "EUR", currencySymbol: "€", exchangeRate: 1.17, costLevel: "Moderate", flag: "🇪🇸" },
  { name: "Italy", currency: "EUR", currencySymbol: "€", exchangeRate: 1.17, costLevel: "Moderate", flag: "🇮🇹" },
  { name: "Germany", currency: "EUR", currencySymbol: "€", exchangeRate: 1.17, costLevel: "High", flag: "🇩🇪" },
  { name: "Portugal", currency: "EUR", currencySymbol: "€", exchangeRate: 1.17, costLevel: "Moderate", flag: "🇵🇹" },
  { name: "Greece", currency: "EUR", currencySymbol: "€", exchangeRate: 1.17, costLevel: "Moderate", flag: "🇬🇷" },
  { name: "Turkey", currency: "TRY", currencySymbol: "₺", exchangeRate: 41.2, costLevel: "Low", flag: "🇹🇷" },
  { name: "Indonesia", currency: "IDR", currencySymbol: "Rp", exchangeRate: 20150, costLevel: "Low", flag: "🇮🇩" },
  { name: "Vietnam", currency: "VND", currencySymbol: "₫", exchangeRate: 31800, costLevel: "Low", flag: "🇻🇳" },
  { name: "South Korea", currency: "KRW", currencySymbol: "₩", exchangeRate: 1720, costLevel: "Moderate", flag: "🇰🇷" },
  { name: "Australia", currency: "AUD", currencySymbol: "A$", exchangeRate: 1.98, costLevel: "High", flag: "🇦🇺" },
  { name: "Canada", currency: "CAD", currencySymbol: "C$", exchangeRate: 1.73, costLevel: "High", flag: "🇨🇦" },
  { name: "Mexico", currency: "MXN", currencySymbol: "MX$", exchangeRate: 21.8, costLevel: "Low", flag: "🇲🇽" },
  { name: "India", currency: "INR", currencySymbol: "₹", exchangeRate: 106.5, costLevel: "Low", flag: "🇮🇳" },
  { name: "United Kingdom", currency: "GBP", currencySymbol: "£", exchangeRate: 1, costLevel: "High", flag: "🇬🇧" },
];

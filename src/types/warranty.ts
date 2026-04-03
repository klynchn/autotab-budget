export interface Warranty {
  id: string;
  receiptId: string;
  productName: string;
  expiryDate: string; // ISO date
  documentUrl?: string; // base64 data URL for uploaded doc
  createdAt: string;
}

export interface SplitParticipant {
  name: string;
  amount: number;
}

export interface SplitBill {
  receiptId: string;
  method: "equal" | "by-item" | "custom";
  participants: SplitParticipant[];
  totalAmount: number;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: "parent" | "child";
  allowance: number;
  allowanceFrequency: "weekly" | "monthly";
  balance: number;
  privacyMode: boolean;
  createdAt: string;
}

export interface StoredReceipt {
  id: string;
  transactionId: string;
  merchant: string;
  amount: number;
  date: string;
  category: string;
  imageUrl?: string; // base64 data URL
  source: "receipt" | "e-receipt" | "manual";
}

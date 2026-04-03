import { useLocalStorage } from "./useLocalStorage";
import { StoredReceipt, Warranty, SplitBill } from "@/types/warranty";
import { useCallback } from "react";

export function useReceiptVault() {
  const [receipts, setReceipts] = useLocalStorage<StoredReceipt[]>("autotab-receipt-vault", []);
  const [warranties, setWarranties] = useLocalStorage<Warranty[]>("autotab-warranties", []);
  const [splits, setSplits] = useLocalStorage<SplitBill[]>("autotab-splits", []);

  const addReceipt = useCallback((receipt: Omit<StoredReceipt, "id">) => {
    setReceipts((prev) => [{ ...receipt, id: crypto.randomUUID() }, ...prev]);
  }, [setReceipts]);

  const deleteReceipt = useCallback((id: string) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
    setWarranties((prev) => prev.filter((w) => w.receiptId !== id));
    setSplits((prev) => prev.filter((s) => s.receiptId !== id));
  }, [setReceipts, setWarranties, setSplits]);

  const addWarranty = useCallback((warranty: Omit<Warranty, "id" | "createdAt">) => {
    setWarranties((prev) => [
      { ...warranty, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, [setWarranties]);

  const deleteWarranty = useCallback((id: string) => {
    setWarranties((prev) => prev.filter((w) => w.id !== id));
  }, [setWarranties]);

  const addSplit = useCallback((split: SplitBill) => {
    setSplits((prev) => {
      const filtered = prev.filter((s) => s.receiptId !== split.receiptId);
      return [split, ...filtered];
    });
  }, [setSplits]);

  const getSplitForReceipt = useCallback((receiptId: string) => {
    return splits.find((s) => s.receiptId === receiptId) || null;
  }, [splits]);

  const getWarrantiesForReceipt = useCallback((receiptId: string) => {
    return warranties.filter((w) => w.receiptId === receiptId);
  }, [warranties]);

  return {
    receipts,
    warranties,
    splits,
    addReceipt,
    deleteReceipt,
    addWarranty,
    deleteWarranty,
    addSplit,
    getSplitForReceipt,
    getWarrantiesForReceipt,
  };
}

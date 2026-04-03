import { useLocalStorage } from "./useLocalStorage";
import { FamilyMember } from "@/types/warranty";
import { useCallback } from "react";

export function useFamily() {
  const [members, setMembers] = useLocalStorage<FamilyMember[]>("autotab-family", []);

  const addMember = useCallback((member: Omit<FamilyMember, "id" | "createdAt">) => {
    setMembers((prev) => [
      { ...member, id: crypto.randomUUID(), createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }, [setMembers]);

  const deleteMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, [setMembers]);

  const updateBalance = useCallback((id: string, amount: number) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, balance: m.balance + amount } : m))
    );
  }, [setMembers]);

  const topUp = useCallback((id: string, amount: number) => {
    updateBalance(id, amount);
  }, [updateBalance]);

  const deductSpending = useCallback((id: string, amount: number) => {
    updateBalance(id, -amount);
  }, [updateBalance]);

  const togglePrivacy = useCallback((id: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, privacyMode: !m.privacyMode } : m))
    );
  }, [setMembers]);

  const updateAllowance = useCallback((id: string, allowance: number, frequency: "weekly" | "monthly") => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, allowance, allowanceFrequency: frequency } : m))
    );
  }, [setMembers]);

  return {
    members,
    addMember,
    deleteMember,
    topUp,
    deductSpending,
    togglePrivacy,
    updateAllowance,
  };
}

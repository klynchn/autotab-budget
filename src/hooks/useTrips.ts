import { useLocalStorage } from "./useLocalStorage";
import { Trip, TravelWallet, TripExpense, TripCategory } from "@/types/trip";
import { useCallback, useMemo } from "react";

export function useTrips() {
  const [trips, setTrips] = useLocalStorage<Trip[]>("autotab-trips", []);
  const [wallet, setWallet] = useLocalStorage<TravelWallet>("autotab-travel-wallet", {
    monthlyAllocation: 0,
    totalSaved: 0,
  });

  const createTrip = useCallback((trip: Omit<Trip, "id" | "expenses" | "isActive">) => {
    setTrips((prev) => [
      ...prev,
      { ...trip, id: crypto.randomUUID(), expenses: [], isActive: false },
    ]);
  }, [setTrips]);

  const deleteTrip = useCallback((id: string) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  }, [setTrips]);

  const toggleActiveTrip = useCallback((id: string) => {
    setTrips((prev) =>
      prev.map((t) => ({ ...t, isActive: t.id === id ? !t.isActive : false }))
    );
  }, [setTrips]);

  const addExpense = useCallback((tripId: string, expense: Omit<TripExpense, "id" | "tripId">) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? { ...t, expenses: [...t.expenses, { ...expense, id: crypto.randomUUID(), tripId }] }
          : t
      )
    );
  }, [setTrips]);

  const deleteExpense = useCallback((tripId: string, expenseId: string) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? { ...t, expenses: t.expenses.filter((e) => e.id !== expenseId) }
          : t
      )
    );
  }, [setTrips]);

  const updateWallet = useCallback((updates: Partial<TravelWallet>) => {
    setWallet((prev) => ({ ...prev, ...updates }));
  }, [setWallet]);

  const activeTrip = useMemo(() => trips.find((t) => t.isActive) || null, [trips]);

  const getTripSpent = useCallback((trip: Trip) => {
    return trip.expenses.reduce((sum, e) => sum + e.amountHome, 0);
  }, []);

  const getTripRemaining = useCallback((trip: Trip) => {
    return trip.budget - getTripSpent(trip);
  }, [getTripSpent]);

  return {
    trips,
    wallet,
    activeTrip,
    createTrip,
    deleteTrip,
    toggleActiveTrip,
    addExpense,
    deleteExpense,
    updateWallet,
    getTripSpent,
    getTripRemaining,
  };
}

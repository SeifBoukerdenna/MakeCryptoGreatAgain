// src/stores/useBalanceStore.ts

import { create } from "zustand";

interface BalanceState {
  balance: number | null;
  setBalance: (balance: number | null) => void;
}

const useBalanceStore = create<BalanceState>((set) => ({
  balance: null,
  setBalance: (balance) => set({ balance }),
}));

export default useBalanceStore;

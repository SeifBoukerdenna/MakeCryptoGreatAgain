// src/stores/useBalanceStore.ts

import { create } from "zustand";

interface BalanceState {
  solBalance: number | null;
  mcgaBalance: number | null;
  setSolBalance: (balance: number | null) => void;
  setMcgaBalance: (balance: number | null) => void;
}

const useBalanceStore = create<BalanceState>((set) => ({
  solBalance: null,
  mcgaBalance: null,
  setSolBalance: (balance) => set({ solBalance: balance }),
  setMcgaBalance: (balance) => set({ mcgaBalance: balance }),
}));

export default useBalanceStore;

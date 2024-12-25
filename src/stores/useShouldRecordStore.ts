import { create } from "zustand";

interface ShouldRecordState {
  shouldRecord: boolean;
  toggleShouldRecord: () => void;
  setShouldRecord: (value: boolean) => void;
}

// Create the Zustand store with typed state
const useShouldRecordStore = create<ShouldRecordState>((set) => ({
  shouldRecord: false,
  toggleShouldRecord: () =>
    set((state) => ({ shouldRecord: !state.shouldRecord })),
  setShouldRecord: (value) => set({ shouldRecord: value }),
}));

export default useShouldRecordStore;

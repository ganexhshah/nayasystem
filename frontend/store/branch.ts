import { create } from "zustand"
import { persist } from "zustand/middleware"

interface BranchStore {
  selectedBranchId: number | null
  setSelectedBranchId: (id: number | null) => void
}

export const useBranchStore = create<BranchStore>()(
  persist(
    (set) => ({
      selectedBranchId: null,
      setSelectedBranchId: (id) => set({ selectedBranchId: id }),
    }),
    { name: "naya-selected-branch" }
  )
)


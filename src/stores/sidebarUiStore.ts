import { create } from 'zustand';

interface SidebarUiState {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

export const useSidebarUiStore = create<SidebarUiState>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  close: () => set({ isOpen: false }),
}));
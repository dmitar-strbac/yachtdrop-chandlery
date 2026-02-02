import { create } from "zustand";

export type CartItem = {
  sourceUrl: string;
  title: string;
  price: string | null;
  imageUrl: string | null;
  qty: number;
};

type CartState = {
  open: boolean;
  setOpen: (v: boolean) => void;
  items: Record<string, CartItem>;
  add: (item: Omit<CartItem, "qty">) => void;
  dec: (sourceUrl: string) => void;
  remove: (sourceUrl: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: {},
  
  open: false,
  setOpen: (v) => set({ open: v }),

  add: (item) =>
    set((s) => {
      const existing = s.items[item.sourceUrl];
      const qty = existing ? existing.qty + 1 : 1;
      return {
        items: {
          ...s.items,
          [item.sourceUrl]: { ...item, qty },
        },
      };
    }),
  dec: (sourceUrl) =>
    set((s) => {
      const existing = s.items[sourceUrl];
      if (!existing) return s;
      if (existing.qty <= 1) {
        const copy = { ...s.items };
        delete copy[sourceUrl];
        return { items: copy };
      }
      return {
        items: {
          ...s.items,
          [sourceUrl]: { ...existing, qty: existing.qty - 1 },
        },
      };
    }),
  remove: (sourceUrl) =>
    set((s) => {
      const copy = { ...s.items };
      delete copy[sourceUrl];
      return { items: copy };
    }),
  clear: () => set({ items: {} }),
}));

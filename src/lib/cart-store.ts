import { create } from "zustand";

export type CartItem = {
  sourceUrl: string;
  title: string;
  price: string | null;
  imageUrl: string | null;
  qty: number;
};

export type Fulfillment = "delivery" | "pickup";

export type FulfillmentDetails = {
  phone: string;
  note: string;

  // delivery
  marina: string;
  boatName: string;
  slip: string;

  // pickup (samo lokacija + termin)
  pickupLocation: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string; // HH:MM
};

type CartState = {
  open: boolean;
  setOpen: (v: boolean) => void;

  items: Record<string, CartItem>;
  add: (item: Omit<CartItem, "qty">) => void;
  dec: (sourceUrl: string) => void;
  remove: (sourceUrl: string) => void;
  clear: () => void;

  fulfillment: Fulfillment;
  setFulfillment: (v: Fulfillment) => void;

  details: FulfillmentDetails;
  updateDetails: (patch: Partial<FulfillmentDetails>) => void;

  // ✅ reset svega nakon "place request"
  clearAll: () => void;
};

const DEFAULT_DETAILS: FulfillmentDetails = {
  phone: "",
  note: "",

  marina: "",
  boatName: "",
  slip: "",

  pickupLocation: "",
  pickupDate: "",
  pickupTime: "",
};

export const useCartStore = create<CartState>((set) => ({
  open: false,
  setOpen: (v) => set({ open: v }),

  items: {},

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

  fulfillment: "delivery",
  setFulfillment: (v) => set({ fulfillment: v }),

  details: DEFAULT_DETAILS,
  updateDetails: (patch) =>
    set((s) => ({
      details: { ...s.details, ...patch },
    })),

  clearAll: () =>
    set({
      items: {},
      fulfillment: "delivery",
      details: DEFAULT_DETAILS,
      open: false,
    }),
}));

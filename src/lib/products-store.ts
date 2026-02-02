import { create } from "zustand";

type State = {
  oldPriceByUrl: Record<string, string>;
  setOldPrice: (url: string, oldPrice: string) => void;
};

export const useProductsStore = create<State>((set) => ({
  oldPriceByUrl: {},
  setOldPrice: (url, oldPrice) =>
    set((s) => ({ oldPriceByUrl: { ...s.oldPriceByUrl, [url]: oldPrice } })),
}));

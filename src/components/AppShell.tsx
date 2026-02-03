"use client";

import { useCartStore } from "@/lib/cart-store";
import { CartBar } from "@/components/CartBar";
import { CartSheet } from "@/components/CartSheet";
import { BottomNav } from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const cartOpen = useCartStore((s) => s.open);
  const setOpen = useCartStore((s) => s.setOpen);

  return (
    <>
      {children}
      <CartBar onOpen={() => setOpen(true)} />
      <CartSheet open={cartOpen} onOpenChange={setOpen} />
      <BottomNav />
    </>
  );
}

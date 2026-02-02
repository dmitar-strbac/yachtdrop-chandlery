"use client";

import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";

export function CartBar({ onOpen }: { onOpen: () => void }) {
  const total = useCartStore((s) =>
    Object.values(s.items).reduce((sum, i) => sum + i.qty, 0)
  );

  if (total <= 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="mx-auto max-w-md px-4 pb-4">
        <div className="rounded-2xl border bg-background/95 backdrop-blur shadow-lg">
          <div className="flex items-center justify-between p-3">
            <div className="text-sm">
              <div className="font-semibold">
                {total} item{total === 1 ? "" : "s"} in cart
              </div>
              <div className="text-xs text-muted-foreground">
                Tap to review & checkout
              </div>
            </div>
            <Button onClick={onOpen} className="rounded-xl">
              View cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

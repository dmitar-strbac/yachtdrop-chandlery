"use client";

import { useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";

export function CartSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const itemsMap = useCartStore((s) => s.items);
  const dec = useCartStore((s) => s.dec);
  const add = useCartStore((s) => s.add);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);

  const items = useMemo(() => Object.values(itemsMap), [itemsMap]);
  const count = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader>
          <SheetTitle>Cart ({count})</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">Your cart is empty.</div>
          ) : (
            items.map((it) => (
              <div
                key={it.sourceUrl}
                className="flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium line-clamp-1">{it.title}</div>
                  <div className="text-xs text-muted-foreground">{it.price ?? "—"}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => dec(it.sourceUrl)}>
                    -
                  </Button>
                  <div className="w-6 text-center text-sm">{it.qty}</div>
                  <Button
                    size="sm"
                    onClick={() =>
                      add({
                        sourceUrl: it.sourceUrl,
                        title: it.title,
                        price: it.price,
                        imageUrl: it.imageUrl,
                      })
                    }
                  >
                    +
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(it.sourceUrl)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length ? (
          <div className="mt-6 flex gap-2">
            <Button variant="secondary" className="w-full" onClick={clear}>
              Clear
            </Button>
            <Button className="w-full">Checkout</Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

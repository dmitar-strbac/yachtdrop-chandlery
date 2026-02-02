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
      <SheetContent
        side="bottom"
        className={[
          "rounded-t-3xl px-0 pb-0",
          "left-1/2 -translate-x-1/2 w-full max-w-md",
          "max-h-[85vh] overflow-hidden",
        ].join(" ")}
      >
        <div className="px-5 pt-4">
          <SheetHeader>
            <SheetTitle className="text-xl font-extrabold tracking-tight">
              Cart ({count})
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-5 pb-28 pt-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">Your cart is empty.</div>
          ) : (
            <div className="space-y-4">
              {items.map((it) => (
                <div key={it.sourceUrl} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold line-clamp-1">{it.title}</div>
                    <div className="text-xs text-muted-foreground">{it.price ?? "—"}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => dec(it.sourceUrl)}
                    >
                      -
                    </Button>

                    <div className="w-6 text-center text-sm font-medium">{it.qty}</div>

                    <Button
                      size="sm"
                      className="rounded-xl bg-black text-white"
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

                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl"
                      onClick={() => remove(it.sourceUrl)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length ? (
          <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-5 py-4">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1 rounded-2xl"
                onClick={clear}
                >
                  Clear
              </Button>

              <Button className="flex-1 rounded-2xl bg-black text-white font-semibold">
                Checkout
              </Button>
            </div>
          </div>

        ) : null}
      </SheetContent>
    </Sheet>
  );
}

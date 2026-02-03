"use client";

import { useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";

const LOCATIONS = [
  "Porto Montenegro (Tivat)",
  "Kotor Marina (Kotor)",
  "Dukley Marina (Budva)",
  "Budva Marina (Budva)",
  "Bar Marina (Bar)",
  "Herceg Novi Marina (Herceg Novi)",
];

function countItems(itemsMap: Record<string, any>) {
  return Object.values(itemsMap).reduce((sum: number, i: any) => sum + (i.qty ?? 0), 0);
}

function priceToNumber(price: string | null) {
  if (!price) return NaN;

  const s = price
    .replace(/EUR|€|\s/gi, "")
    .replace(/[^\d.,]/g, "");

  if (!s) return NaN;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");

  const digitsOnly = (x: string) => x.replace(/[^\d]/g, "");

  if (lastDot !== -1 && lastComma !== -1) {
    const decSep = lastDot > lastComma ? "." : ",";
    const thouSep = decSep === "." ? "," : ".";

    const parts = s.split(decSep);
    const intPart = parts[0].split(thouSep).join("");
    const decPart = parts[1] ? digitsOnly(parts[1]).slice(0, 2) : "00";

    const num = Number(`${digitsOnly(intPart)}.${decPart}`);
    return isFinite(num) ? num : NaN;
  }

  const sep = lastDot !== -1 ? "." : lastComma !== -1 ? "," : null;
  if (!sep) {
    const num = Number(digitsOnly(s));
    return isFinite(num) ? num : NaN;
  }

  const idx = s.lastIndexOf(sep);
  const after = digitsOnly(s.slice(idx + 1));
  const before = digitsOnly(s.slice(0, idx));

  if (after.length === 2) {
    const num = Number(`${before}.${after}`);
    return isFinite(num) ? num : NaN;
  }

  const num = Number(digitsOnly(s));
  return isFinite(num) ? num : NaN;
}

function formatEUR(n: number) {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}


function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function CartSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [step, setStep] = useState<"cart" | "checkout">("cart");

  const itemsMap = useCartStore((s) => s.items);
  const dec = useCartStore((s) => s.dec);
  const add = useCartStore((s) => s.add);
  const remove = useCartStore((s) => s.remove);
  const clear = useCartStore((s) => s.clear);
  const clearAll = useCartStore((s) => s.clearAll);

  const fulfillment = useCartStore((s) => s.fulfillment);
  const setFulfillment = useCartStore((s) => s.setFulfillment);

  const details = useCartStore((s) => s.details);
  const updateDetails = useCartStore((s) => s.updateDetails);

  const items = useMemo(() => Object.values(itemsMap), [itemsMap]);
  const count = useMemo(() => countItems(itemsMap), [itemsMap]);
  const hasItems = items.length > 0;

  const total = useMemo(() => {
    return items.reduce((sum, it) => {
      const p = priceToNumber(it.price);
      if (!isFinite(p)) return sum;
      return sum + p * (it.qty ?? 1);
    }, 0);
  }, [items]);

  const minDate = todayISO();

  const handleOpenChange = (v: boolean) => {
    onOpenChange(v);
    if (!v) setStep("cart");
  };

  const phoneOk = details.phone.trim().length >= 6;

  const deliveryOk =
    phoneOk && LOCATIONS.includes(details.marina);

  const pickupOk =
    phoneOk &&
    LOCATIONS.includes(details.pickupLocation) &&
    !!details.pickupDate &&
    !!details.pickupTime &&
    details.pickupDate >= minDate; 

  const canProceed = hasItems && (fulfillment === "delivery" ? deliveryOk : pickupOk);

  const onPickupDateChange = (val: string) => {
    if (val && val < minDate) {
      updateDetails({ pickupDate: minDate });
      return;
    }
    updateDetails({ pickupDate: val });
  };

  const [showCleared, setShowCleared] = useState(false);

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
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
              {step === "cart" ? `Cart (${count})` : "Checkout"}
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-5 pb-28 pt-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          {!hasItems ? (
            <div className="text-sm text-muted-foreground">Your cart is empty.</div>
          ) : step === "cart" ? (
            <>
              <div className="mb-4">
                <div className="text-xs font-semibold text-muted-foreground mb-2">
                  Delivery method
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={fulfillment === "delivery" ? "default" : "secondary"}
                    className={[
                      "rounded-2xl font-semibold",
                      fulfillment === "delivery" ? "bg-black text-white" : "",
                    ].join(" ")}
                    onClick={() => setFulfillment("delivery")}
                  >
                    Delivery
                  </Button>
                  <Button
                    type="button"
                    variant={fulfillment === "pickup" ? "default" : "secondary"}
                    className={[
                      "rounded-2xl font-semibold",
                      fulfillment === "pickup" ? "bg-black text-white" : "",
                    ].join(" ")}
                    onClick={() => setFulfillment("pickup")}
                  >
                    Pickup
                  </Button>
                </div>
              </div>

              <div className="mb-5 rounded-2xl border p-3 space-y-3">
                {fulfillment === "delivery" ? (
                  <>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Marina location *
                      </label>
                      <select
                        className="h-11 rounded-2xl border bg-background px-3 text-sm outline-none"
                        value={details.marina}
                        onChange={(e) => updateDetails({ marina: e.target.value })}
                      >
                        <option value="">Select marina location…</option>
                        {LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Boat name (optional)
                      </label>
                      <input
                        className="h-11 rounded-2xl border bg-background px-3 text-sm outline-none"
                        placeholder="e.g. MY Aurora"
                        value={details.boatName}
                        onChange={(e) => updateDetails({ boatName: e.target.value })}
                      />
                    </div>

                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Slip / Berth (optional)
                      </label>
                      <input
                        className="h-11 rounded-2xl border bg-background px-3 text-sm outline-none"
                        placeholder="e.g. A12"
                        value={details.slip}
                        onChange={(e) => updateDetails({ slip: e.target.value })}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <label className="text-xs font-semibold text-muted-foreground">
                        Pickup location *
                      </label>
                      <select
                        className="h-11 rounded-2xl border bg-background px-3 text-sm outline-none"
                        value={details.pickupLocation}
                        onChange={(e) => updateDetails({ pickupLocation: e.target.value })}
                      >
                        <option value="">Select pickup location…</option>
                        {LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Date *
                        </label>
                        <input
                          type="date"
                          min={minDate}
                          className="h-11 rounded-2xl border bg-background px-3 text-sm outline-none"
                          value={details.pickupDate}
                          onChange={(e) => onPickupDateChange(e.target.value)}
                        />
                      </div>

                      <div className="grid gap-2">
                        <label className="text-xs font-semibold text-muted-foreground">
                          Time *
                        </label>
                        <input
                          type="time"
                          step={900} 
                          className="h-11 rounded-2xl border bg-background px-3 text-sm outline-none"
                          value={details.pickupTime}
                          onChange={(e) => updateDetails({ pickupTime: e.target.value })}
                        />
                      </div>
                    </div>

                    {!pickupOk && details.pickupDate && details.pickupDate < minDate ? (
                      <div className="text-xs text-destructive">
                        Pickup date can’t be in the past.
                      </div>
                    ) : null}
                  </>
                )}

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Contact phone *
                  </label>
                  <input
                    className="h-11 rounded-2xl border bg-background px-3 text-sm outline-none"
                    placeholder="+382 ..."
                    value={details.phone}
                    onChange={(e) => updateDetails({ phone: e.target.value })}
                  />
                  {!phoneOk && details.phone.length > 0 ? (
                    <div className="text-xs text-muted-foreground">
                      Please enter a valid phone number.
                    </div>
                  ) : null}
                </div>

                <div className="grid gap-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Note (optional)
                  </label>
                  <textarea
                    className="min-h-[88px] rounded-2xl border bg-background px-3 py-2 text-sm outline-none resize-none"
                    placeholder="Gate code, deliver to dock, call on arrival…"
                    value={details.note}
                    onChange={(e) => updateDetails({ note: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {items.map((it) => {
                  const unit = priceToNumber(it.price);
                  const lineTotal = isFinite(unit) ? unit * it.qty : NaN;

                  return (
                    <div key={it.sourceUrl} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold line-clamp-1">{it.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {it.price ?? "—"}{" "}
                          {isFinite(lineTotal) ? `• ${formatEUR(lineTotal)}` : ""}
                        </div>
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
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border p-4 space-y-3">
                <div className="text-sm font-semibold">Delivery method</div>
                <div className="text-sm text-muted-foreground">
                  {fulfillment === "delivery" ? "Delivery to boat / marina" : "Pickup"}
                </div>

                {fulfillment === "delivery" ? (
                  <div className="text-sm">
                    <div className="font-semibold">{details.marina || "—"}</div>
                    <div className="text-muted-foreground">
                      {details.boatName ? `Boat: ${details.boatName}` : null}
                      {details.boatName && details.slip ? " • " : null}
                      {details.slip ? `Slip: ${details.slip}` : null}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm">
                    <div className="font-semibold">{details.pickupLocation || "—"}</div>
                    <div className="text-muted-foreground">
                      {details.pickupDate && details.pickupTime
                        ? `${details.pickupDate} at ${details.pickupTime}`
                        : "—"}
                    </div>
                  </div>
                )}

                <div className="text-sm">
                  <div className="font-semibold">Phone</div>
                  <div className="text-muted-foreground">{details.phone || "—"}</div>
                </div>

                {details.note ? (
                  <div className="text-sm">
                    <div className="font-semibold">Note</div>
                    <div className="text-muted-foreground whitespace-pre-wrap">{details.note}</div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border p-4">
                <div className="text-sm font-semibold mb-2">Items</div>
                <div className="space-y-2">
                  {items.map((it) => {
                    const unit = priceToNumber(it.price);
                    const lineTotal = isFinite(unit) ? unit * it.qty : NaN;

                    return (
                      <div key={it.sourceUrl} className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm line-clamp-1">{it.title}</div>
                          <div className="text-xs text-muted-foreground">x {it.qty}</div>
                        </div>
                        <div className="text-sm font-semibold">
                          {isFinite(lineTotal) ? formatEUR(lineTotal) : (it.price ?? "—")}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <div className="text-sm font-semibold">Total</div>
                  <div className="text-sm font-extrabold">{formatEUR(total)}</div>
                </div>
              </div>
            </>
          )}
        </div>

        {hasItems ? (
          <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-5 py-4">
            {step === "cart" ? (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-2xl"
                  onClick={() => {
                    clear();
                    setShowCleared(true);

                    setTimeout(() => {
                      setShowCleared(false);
                    }, 1800);
                  }}
                >
                  Clear
                </Button>

                <Button
                  className="flex-1 rounded-2xl bg-black text-white font-semibold"
                  disabled={!canProceed}
                  onClick={() => setStep("checkout")}
                >
                  Checkout • {formatEUR(total)}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-2xl"
                  onClick={() => setStep("cart")}
                >
                  Back
                </Button>

                <Button
                  className="flex-1 rounded-2xl bg-black text-white font-semibold"
                  onClick={() => {
                    try {
                      const id =
                        typeof crypto !== "undefined" && "randomUUID" in crypto
                          ? crypto.randomUUID()
                          : String(Date.now());

                      const newOrder = {
                        id,
                        createdAt: new Date().toISOString(),
                        fulfillment,
                        totalEUR: total,
                        status: "requested",
                        details,
                        items: items.map((it: any) => ({
                          title: it.title,
                          price: it.price ?? null,
                          qty: it.qty ?? 1,
                        })),
                      };

                      const key = "yachtdrop:orders";
                      const raw = localStorage.getItem(key);
                      const existing = raw ? JSON.parse(raw) : [];
                      const next = [newOrder, ...(Array.isArray(existing) ? existing : [])]; // newest first
                      localStorage.setItem(key, JSON.stringify(next));

                      localStorage.setItem("yachtdrop:lastOrder", JSON.stringify(newOrder));
                    } catch {
                    }

                    alert("Order request sent! We will contact you soon.");
                    clearAll();
                    handleOpenChange(false);
                    setStep("cart");
                  }}
                >
                  Place request • {formatEUR(total)}
                </Button>
              </div>
            )}
          </div>
        ) : null}
        {showCleared && (
          <div className="absolute inset-x-0 bottom-6 flex justify-center z-50">
            <div
              className="
                rounded-3xl border bg-background/95 backdrop-blur shadow-lg
                px-5 py-3 text-sm font-semibold
                animate-in fade-in slide-in-from-bottom-3
              "
            >
              Cart cleared
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

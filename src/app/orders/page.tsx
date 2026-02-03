"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

type StoredOrder = {
  id: string;
  createdAt: string;
  fulfillment: "delivery" | "pickup";
  totalEUR: number;
  items: Array<{ title: string; price: string | null; qty: number }>;
  details: any;
  status: "requested" | "processing" | "ready" | "completed" | "cancelled";
};

function formatEUR(n: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

const STEPS: Array<{ key: StoredOrder["status"]; label: string }> = [
  { key: "requested", label: "Requested" },
  { key: "processing", label: "Processing" },
  { key: "ready", label: "Ready" },
  { key: "completed", label: "Completed" },
];

const ORDERS_KEY = "yachtdrop:orders";

export default function OrdersPage() {
  const [orders, setOrders] = useState<StoredOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ORDERS_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      const list: StoredOrder[] = Array.isArray(parsed) ? parsed : [];
      setOrders(list);
      setSelectedId(list[0]?.id ?? null); 
    } catch {
      setOrders([]);
      setSelectedId(null);
    }
  }, []);

  const selected = useMemo(
    () => orders.find((o) => o.id === selectedId) ?? null,
    [orders, selectedId]
  );

  const stepIndex = useMemo(() => {
    if (!selected) return -1;
    return Math.max(0, STEPS.findIndex((s) => s.key === selected.status));
  }, [selected]);

  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  const canCancelSelected =
    selected && (selected.status === "requested" || selected.status === "processing");

  const cancelSelected = () => {
    if (!selected) return;

  const next = orders.map((o) =>
      o.id === selected.id ? { ...o, status: "cancelled" as const } : o
  );

  setOrders(next);
    try {
      localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
    } catch {}
    setConfirmCancelOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto max-w-md px-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-2xl font-extrabold tracking-tight">Orders</div>
            <div className="text-sm text-muted-foreground mt-1">
              Track your orders
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-44 pt-5">
        {orders.length === 0 ? (
          <div className="rounded-3xl border bg-muted/20 p-5">
            <div className="font-semibold">No orders yet</div>
            <div className="text-sm text-muted-foreground mt-1">
              Complete checkout to see the status here.
            </div>

            <div className="mt-4">
              <Button asChild className="rounded-2xl bg-black text-white font-semibold">
                <Link href="/">Go to Home</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {orders.map((o) => {
                const active = o.id === selectedId;
                return (
                  <button
                    key={o.id}
                    onClick={() => setSelectedId(o.id)}
                    className={clsx(
                      "w-full text-left rounded-3xl border p-4 transition",
                      active ? "border-black bg-muted/20" : "bg-background"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Order</div>
                        <div className="font-extrabold tracking-tight">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(o.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="font-extrabold">{formatEUR(o.totalEUR)}</div>
                        <div className="mt-1 text-xs font-semibold">
                          {o.fulfillment === "delivery" ? "Delivery" : "Pickup"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      Status: <span className="font-semibold text-foreground">{o.status}</span>
                      <span className="mx-2">•</span>
                      Items: <span className="font-semibold text-foreground">{o.items.length}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selected ? (
              <div className="mt-4 rounded-3xl border bg-background p-5 shadow-sm">
                <div className="text-sm font-semibold">
                  Selected: #{selected.id.slice(0, 8).toUpperCase()}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button asChild variant="secondary" className="rounded-2xl flex-1">
                    <Link href="/">Back to shopping</Link>
                  </Button>

                  <Button
                    className="rounded-2xl flex-1"
                    variant="destructive"
                    disabled={!canCancelSelected}
                    onClick={() => setConfirmCancelOpen(true)}
                  >
                    Cancel order
                  </Button>
                </div>

                {!canCancelSelected && selected?.status !== "cancelled" ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Cancellation is only available before the order is ready.
                  </div>
                ) : null}

                <div className="mt-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    Status
                  </div>

                  {selected.status === "cancelled" ? (
                    <div className="rounded-2xl border bg-muted/20 px-4 py-3">
                      <div className="text-sm font-extrabold">Cancelled</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        This order was cancelled and will not be fulfilled.
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {STEPS.map((s, idx) => {
                        const done = idx <= stepIndex;
                        return (
                          <div key={s.key} className="flex-1">
                            <div
                              className={clsx(
                                "h-2 rounded-full",
                                done ? "bg-black" : "bg-muted"
                              )}
                            />
                            <div
                              className={clsx(
                                "mt-2 text-[11px] font-semibold",
                                done ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {s.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="mt-5 border-t pt-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    Items
                  </div>

                  <div className="space-y-2">
                    {selected.items.map((it, i) => (
                      <div key={i} className="flex items-start justify-between gap-3">
                        <div className="text-sm font-semibold leading-snug">
                          {it.title}
                          <div className="text-xs text-muted-foreground font-normal">
                            x {it.qty}
                          </div>
                        </div>
                        <div className="text-sm font-extrabold">{it.price ?? "—"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        {confirmCancelOpen ? (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 px-4 pb-24">
            <div className="w-full max-w-md rounded-3xl bg-background p-5 shadow-xl">
              <div className="text-lg font-extrabold">Cancel this order?</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Are you sure you want to cancel this order? This action can’t be undone.
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-2xl"
                  onClick={() => setConfirmCancelOpen(false)}
                >
                  Keep order
                </Button>

                <Button
                  className="flex-1 rounded-2xl"
                  variant="destructive"
                  onClick={cancelSelected}
                >
                  Yes, cancel
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import { getSavedLocale, t, type Locale } from "@/lib/i18n";

type StoredOrder = {
  id: string;
  createdAt: string;
  fulfillment: "delivery" | "pickup";
  totalEUR: number;
  items: Array<{ title: string; price: string | null; qty: number }>;
  details: any;
  status: "requested" | "processing" | "ready" | "completed" | "cancelled";
};

function formatEUR(n: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "es" ? "es-ES" : "en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(n);
}

const STEPS: Array<{ key: StoredOrder["status"]; labelKey: string }> = [
  { key: "requested", labelKey: "ordersStepRequested" },
  { key: "processing", labelKey: "ordersStepProcessing" },
  { key: "ready", labelKey: "ordersStepReady" },
  { key: "completed", labelKey: "ordersStepCompleted" },
];

const ORDERS_KEY = "yachtdrop:orders";

function statusLabel(locale: Locale, s: StoredOrder["status"]) {
  switch (s) {
    case "requested":
      return t(locale, "ordersStatusRequested");
    case "processing":
      return t(locale, "ordersStatusProcessing");
    case "ready":
      return t(locale, "ordersStatusReady");
    case "completed":
      return t(locale, "ordersStatusCompleted");
    case "cancelled":
      return t(locale, "ordersStatusCancelled");
    default:
      return s;
  }
}

export default function OrdersPage() {
  const locale = getSavedLocale("en");

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
            <div className="text-2xl font-extrabold tracking-tight">
              {t(locale, "ordersTitle")}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {t(locale, "ordersSubtitle")}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-44 pt-5">
        {orders.length === 0 ? (
          <div className="rounded-3xl border bg-muted/20 p-5">
            <div className="font-semibold">{t(locale, "ordersEmptyTitle")}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {t(locale, "ordersEmptyBody")}
            </div>

            <div className="mt-4">
              <Button asChild className="rounded-2xl bg-black text-white font-semibold">
                <Link href="/">{t(locale, "ordersGoHome")}</Link>
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
                        <div className="text-xs text-muted-foreground">
                          {t(locale, "ordersOrderLabel")}
                        </div>
                        <div className="font-extrabold tracking-tight">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(o.createdAt).toLocaleString(
                            locale === "es" ? "es-ES" : undefined
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {t(locale, "ordersTotalLabel")}
                        </div>
                        <div className="font-extrabold">
                          {formatEUR(o.totalEUR, locale)}
                        </div>
                        <div className="mt-1 text-xs font-semibold">
                          {o.fulfillment === "delivery"
                            ? t(locale, "delivery")
                            : t(locale, "pickup")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-muted-foreground">
                      {t(locale, "ordersStatusPrefix")}{" "}
                      <span className="font-semibold text-foreground">
                        {statusLabel(locale, o.status)}
                      </span>
                      <span className="mx-2">•</span>
                      {t(locale, "ordersItemsPrefix")}{" "}
                      <span className="font-semibold text-foreground">{o.items.length}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {selected ? (
              <div className="mt-4 rounded-3xl border bg-background p-5 shadow-sm">
                <div className="text-sm font-semibold">
                  {t(locale, "ordersSelectedPrefix")} #{selected.id.slice(0, 8).toUpperCase()}
                </div>

                <div className="mt-3 flex gap-2">
                  <Button asChild variant="secondary" className="rounded-2xl flex-1">
                    <Link href="/">{t(locale, "ordersBackToShopping")}</Link>
                  </Button>

                  <Button
                    className="rounded-2xl flex-1"
                    variant="destructive"
                    disabled={!canCancelSelected}
                    onClick={() => setConfirmCancelOpen(true)}
                  >
                    {t(locale, "ordersCancel")}
                  </Button>
                </div>

                {!canCancelSelected && selected?.status !== "cancelled" ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {t(locale, "ordersCancelHint")}
                  </div>
                ) : null}

                <div className="mt-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    {t(locale, "ordersStatusHeader")}
                  </div>

                  {selected.status === "cancelled" ? (
                    <div className="rounded-2xl border bg-muted/20 px-4 py-3">
                      <div className="text-sm font-extrabold">
                        {t(locale, "ordersCancelledTitle")}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t(locale, "ordersCancelledBody")}
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
                              {t(locale, s.labelKey as any)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-5 border-t pt-4">
                  <div className="text-xs font-semibold text-muted-foreground mb-2">
                    {t(locale, "items")}
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
              <div className="text-lg font-extrabold">
                {t(locale, "ordersCancelConfirmTitle")}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                {t(locale, "ordersCancelConfirmBody")}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1 rounded-2xl"
                  onClick={() => setConfirmCancelOpen(false)}
                >
                  {t(locale, "ordersKeep")}
                </Button>

                <Button
                  className="flex-1 rounded-2xl"
                  variant="destructive"
                  onClick={cancelSelected}
                >
                  {t(locale, "ordersYesCancel")}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

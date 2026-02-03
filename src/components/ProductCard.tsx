"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/api";
import Link from "next/link";
import { useMemo } from "react";
import { getSavedLocale, t, type Locale } from "@/lib/i18n";

function stockLabel(stock: string | null, locale: Locale) {
  if (!stock) return null;
  const s = stock.toLowerCase();

  if (s.includes("in stock") || s.includes("en stock")) return t(locale, "inStock");
  if (s.includes("last") || s.includes("últim") || s.includes("ultim")) return t(locale, "lastItems");
  if (s.includes("demand") || s.includes("pedido") || s.includes("bajo")) return t(locale, "onDemand");

  return stock;
}

export default function ProductCard({
  product,
  onQuickAdd,
  dockVersion,
}: {
  product: Product;
  onQuickAdd: () => void;
  backTo?: string;
  dockVersion: number;
}) {
  const locale = getSavedLocale("en");
  const label = stockLabel(product.stock, locale);

  type DockProfile = { marina: string; berth: string; departureISO: string };
  const DOCK_KEY = "yachtdrop:dockProfile";

  function getDock(): DockProfile | null {
    try {
      const raw = localStorage.getItem(DOCK_KEY);
      return raw ? (JSON.parse(raw) as DockProfile) : null;
    } catch {
      return null;
    }
  }

  function dockSignal(stock: string | null, dock: DockProfile | null) {
    if (!dock) return null;

    const s = (stock ?? "").toLowerCase();
    if (s.includes("demand") || s.includes("pedido") || s.includes("bajo")) {
      return { tone: "warn", text: t(locale, "pickupOnly") };
    }

    const etaHours = s.includes("in stock") || s.includes("en stock") ? 2 : s.includes("last") ? 6 : 4;
    const eta = new Date(Date.now() + etaHours * 60 * 60 * 1000);
    const dep = new Date(dock.departureISO);

    if (eta <= dep) return { tone: "good", text: t(locale, "canDeliver") };
    return { tone: "late", text: t(locale, "mayArriveLate") };
  }

  const dock = useMemo(() => getDock(), [dockVersion]);
  const signal = useMemo(() => dockSignal(product.stock, dock), [product.stock, dock]);

  return (
    <Link href={`/product?url=${encodeURIComponent(product.sourceUrl)}`} className="block">
      <Card className="relative p-4 flex gap-3 rounded-3xl border shadow-sm">
        <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 border">
          {product.imageUrl ? (
            <img
              src={`/api/img?url=${encodeURIComponent(product.imageUrl)}`}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

        {signal ? (
          <Badge
            className={[
              "absolute right-3 top-3 rounded-full",
              signal.tone === "good" ? "bg-emerald-600 text-white" : "",
              signal.tone === "late" ? "bg-orange-500 text-white" : "",
              signal.tone === "warn" ? "bg-amber-500 text-white" : "",
            ].join(" ")}
          >
            {signal.text}
          </Badge>
        ) : null}

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[15px] leading-snug line-clamp-2">{product.title}</div>

          <div className="mt-1 flex items-center gap-2">
            <div className="text-sm font-semibold">{product.price ?? "—"}</div>
            {product.oldPrice ? (
              <div className="text-xs text-muted-foreground line-through">{product.oldPrice}</div>
            ) : null}
          </div>

          <div className="mt-2 flex items-center justify-between">
            {label ? <Badge variant="secondary">{label}</Badge> : <span />}
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-black text-white font-semibold tracking-tight"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickAdd();
              }}
            >
              {t(locale, "add")}
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}

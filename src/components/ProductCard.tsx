"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/api";
import Link from "next/link";
import clsx from "clsx";
import { useMemo } from "react";

function stockLabel(stock: string | null) {
  if (!stock) return null;
  if (stock.toLowerCase().includes("in stock")) return "In stock";
  if (stock.toLowerCase().includes("last")) return "Last items";
  if (stock.toLowerCase().includes("demand")) return "On demand";
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
  const label = stockLabel(product.stock);

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
    if (s.includes("demand")) {
      return { tone: "warn", text: "Pickup only" as const };
    }

    const etaHours = s.includes("in stock") ? 2 : s.includes("last") ? 6 : 4;
    const eta = new Date(Date.now() + etaHours * 60 * 60 * 1000);
    const dep = new Date(dock.departureISO);

    if (eta <= dep) return { tone: "good", text: "Can be delivered before departure" as const };
    return { tone: "late", text: "May arrive late" as const };
  }

  const dock = useMemo(() => getDock(), [dockVersion]);
  const signal = useMemo(() => dockSignal(product.stock, dock), [product.stock, dock]);

  return (
    <Link
      href={`/product?url=${encodeURIComponent(product.sourceUrl)}`}
      className="block"
    >
      <Card className="relative p-4 flex gap-3 rounded-3xl border shadow-sm">
        <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 border">
          {product.imageUrl ? (
            <img
              src={product.imageUrl ? `/api/img?url=${encodeURIComponent(product.imageUrl)}` : ""}
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
              <div className="text-xs text-muted-foreground line-through">
                {product.oldPrice}
              </div>
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
              + Add
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}

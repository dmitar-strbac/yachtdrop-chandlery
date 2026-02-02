"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/api";
import Link from "next/link";

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
}: {
  product: Product;
  onQuickAdd: () => void;
}) {
  const label = stockLabel(product.stock);

  return (
    <Link
      href={`/product?url=${encodeURIComponent(product.sourceUrl)}`}
      className="block"
    >
      <Card className="p-4 flex gap-3 rounded-3xl border shadow-sm">
        <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden flex-shrink-0 border">
          {product.imageUrl ? (
            <img
              src={product.imageUrl ? `/api/img?url=${encodeURIComponent(product.imageUrl)}` : ""}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>

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

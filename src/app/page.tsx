"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api";
import type { Product } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { HomeHeader } from "@/components/HomeHeader";
import { CategoryChips, type Category } from "@/components/CategoryChips";
import { CartBar } from "@/components/CartBar";
import { CartSheet } from "@/components/CartSheet";
import { useCartStore } from "@/lib/cart-store";

const CATEGORIES: Category[] = [
  { label: "Anchoring", url: "https://nautichandler.com/en/100799-anchoring-docking" },
  { label: "Clothing", url: "https://nautichandler.com/en/43-personal-equipment" },
  { label: "Electrics", url: "https://nautichandler.com/en/100392-electricslighting" },
  { label: "Electronics", url: "https://nautichandler.com/en/190-electronics" },
  { label: "Fitting", url: "https://nautichandler.com/en/100396-fitting" },
  { label: "Inflatables", url: "https://nautichandler.com/en/100911-inflatable-water-toys" },
  { label: "Life on board", url: "https://nautichandler.com/en/197-life-on-board" },
  { label: "Maintenance", url: "https://nautichandler.com/en/100669-maintenance-cleaning-products" },
  { label: "Motor", url: "https://nautichandler.com/en/100393-motor" },
  { label: "Navigation", url: "https://nautichandler.com/en/100329-navigation" },
  { label: "Painting", url: "https://nautichandler.com/en/100390-painting" },
  { label: "Plumbing", url: "https://nautichandler.com/en/100713-plumbing" },
  { label: "Ropes", url: "https://nautichandler.com/en/100395-ropes" },
  { label: "Safety", url: "https://nautichandler.com/en/100389-safety" },
  { label: "Screws", url: "https://nautichandler.com/en/100394-screws" },
  { label: "Tools", url: "https://nautichandler.com/en/100391-tools-machines" },
];

function filterProducts(products: Product[], q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return products;
  return products.filter((p) => p.title.toLowerCase().includes(query));
}

export default function Home() {
  const [categoryUrl, setCategoryUrl] = useState(CATEGORIES[0].url);
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  const add = useCartStore((s) => s.add);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["products", categoryUrl],
    queryFn: () => fetchProducts(categoryUrl),
    staleTime: 1000 * 60,
  });

  const products = useMemo(() => {
    return filterProducts(data?.products ?? [], query);
  }, [data?.products, query]);

  return (
    <div className="min-h-screen bg-background">
      <HomeHeader query={query} setQuery={setQuery} />

      <CategoryChips categories={CATEGORIES} activeUrl={categoryUrl} onPick={setCategoryUrl} />

      <main className="mx-auto max-w-md px-4 pb-28 pt-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {isLoading ? "Loading…" : `${products.length} items`}
          </div>
          {isFetching && !isLoading ? (
            <div className="text-xs text-muted-foreground">Refreshing…</div>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl border bg-muted/40 animate-pulse" />
            ))
          ) : (
            products.map((p) => (
              <ProductCard key={p.sourceUrl} product={p} onQuickAdd={() => add(p)} />
            ))
          )}
        </div>
      </main>

      <CartBar onOpen={() => setCartOpen(true)} />
      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}

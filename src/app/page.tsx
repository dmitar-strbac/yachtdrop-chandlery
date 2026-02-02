"use client";

import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/lib/hooks";

const CATEGORIES = [
  { label: "Painting", url: "https://nautichandler.com/en/100390-painting" },
  { label: "Safety", url: "https://nautichandler.com/en/100404-safety" },
  { label: "Tools", url: "https://nautichandler.com/en/100391-tools-machines" },
  { label: "Cleaning", url: "https://nautichandler.com/en/100399-maintenance-cleaning-products" },
];

export default function Home() {
  const active = CATEGORIES[0]; 
  const { data, isLoading, error } = useProducts(active.url);

  return (
    <main className="p-4 max-w-md mx-auto">
      <header className="sticky top-0 bg-background pt-2 pb-3 z-10">
        <div className="text-xl font-semibold">Yachtdrop</div>
        <div className="text-sm text-muted-foreground">Quick marine supplies — app-style</div>
      </header>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading products…</div>
        ) : error ? (
          <div className="text-sm text-red-600">Failed to load products.</div>
        ) : (
          data?.products.map((p) => (
            <ProductCard key={p.sourceUrl} product={p} onQuickAdd={() => alert("Add to cart next!")} />
          ))
        )}
      </div>
    </main>
  );
}

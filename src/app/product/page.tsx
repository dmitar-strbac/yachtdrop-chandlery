"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchProductDetails } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { useProductsStore } from "@/lib/products-store";
import { getSavedLocale, localeFromUrl, t } from "@/lib/i18n";

function parseDiscountPercent(price: string | null, oldPrice: string | null) {
  if (!price || !oldPrice) return null;

  const toNumber = (s: string) => {
    const normalized = s.replace(/\s/g, "").replace(",", ".");
    const m = normalized.match(/(\d+(\.\d+)?)/);
    return m ? Number(m[1]) : NaN;
  };

  const p = toNumber(price);
  const o = toNumber(oldPrice);

  if (!isFinite(p) || !isFinite(o) || o <= 0 || p >= o) return null;
  return Math.round(((o - p) / o) * 100);
}

export default function ProductPage() {
  const sp = useSearchParams();
  const router = useRouter();

  const url = sp.get("url") ?? "";
  const back = sp.get("back");

  const locale = url ? localeFromUrl(url) : getSavedLocale("en");

  const add = useCartStore((s) => s.add);

  const oldPriceByUrl = useProductsStore((s) => s.oldPriceByUrl);
  const fallbackOldPrice = url ? oldPriceByUrl[url] : null;

  const handleBack = () => {
    if (back) router.push(decodeURIComponent(back));
    else router.back();
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["product", url],
    queryFn: () => fetchProductDetails(url),
    enabled: !!url,
    staleTime: 1000 * 60,
  });

  if (!url) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <div className="text-sm text-muted-foreground">{t(locale, "missingProductUrl")}</div>
        <Button className="mt-4 rounded-2xl" variant="secondary" onClick={handleBack}>
          {t(locale, "goBack")}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-md px-4 py-3">
          <div className="relative flex items-center h-12">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="absolute left-0 rounded-full h-10 w-10 bg-muted/40 hover:bg-muted"
              aria-label={t(locale, "goBack")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="mx-auto text-sm font-medium text-foreground/80">
              {t(locale, "productDetails")}
            </div>
          </div>
        </div>
      </div>

      {/* bottom bar safe padding */}
      <div className="mx-auto max-w-md px-4 py-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))]">
        {isLoading ? (
          <div className="mt-4 space-y-3">
            <div className="h-64 rounded-3xl bg-muted/40 animate-pulse" />
            <div className="h-6 w-3/4 rounded bg-muted/40 animate-pulse" />
            <div className="h-4 w-1/2 rounded bg-muted/40 animate-pulse" />
            <div className="h-24 rounded bg-muted/40 animate-pulse" />
          </div>
        ) : error || !data ? (
          <div className="mt-4 text-sm text-destructive">{t(locale, "failedProduct")}</div>
        ) : (
          (() => {
            const effectiveOldPrice = data.oldPrice ?? fallbackOldPrice ?? null;
            const discount = parseDiscountPercent(data.price, effectiveOldPrice);

            return (
              <div className="mt-4 rounded-3xl border overflow-hidden bg-card">
                <div className="h-64 bg-muted">
                  {data.imageUrl ? (
                    <img
                      src={`/api/img?url=${encodeURIComponent(data.imageUrl)}`}
                      alt={data.title}
                      className="h-full w-full object-contain bg-white"
                    />
                  ) : null}
                </div>

                <div className="p-4">
                  <div className="text-xl font-extrabold tracking-tight">{data.title}</div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-lg font-semibold">{data.price ?? "—"}</div>

                        {effectiveOldPrice ? (
                          <div className="text-sm text-muted-foreground line-through">
                            {effectiveOldPrice}
                          </div>
                        ) : null}

                        {discount ? (
                          <Badge variant="secondary" className="rounded-full">
                            -{discount}%
                          </Badge>
                        ) : null}
                      </div>

                      {data.stock ? (
                        <div className="mt-1 text-xs text-muted-foreground">{data.stock}</div>
                      ) : null}
                    </div>

                    <Button
                      className="rounded-2xl bg-black text-white font-semibold shrink-0"
                      onClick={() =>
                        add({
                          sourceUrl: data.sourceUrl,
                          title: data.title,
                          price: data.price,
                          imageUrl: data.imageUrl,
                        })
                      }
                    >
                      {t(locale, "add")}
                    </Button>
                  </div>

                  <div className="mt-5">
                    <div className="text-sm font-semibold tracking-tight">{t(locale, "description")}</div>
                    <div className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
                      {data.description ?? t(locale, "noDescription")}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api";
import type { Product } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { HomeHeader } from "@/components/HomeHeader";
import { CategoryChips, type Category } from "@/components/CategoryChips";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import DockSheet, { loadDockProfile, type DockProfile } from "@/components/DockSheet";
import DockFab from "@/components/DockFab";
import { useProductsStore } from "@/lib/products-store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { getSavedLocale, saveLocale, localeFromUrl, type Locale, t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

function normalizeLocaleInUrl(url: string, locale: Locale) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("nautichandler.com")) return url;

    if (u.pathname.startsWith("/en/") || u.pathname.startsWith("/es/")) {
      u.pathname = u.pathname.replace(/^\/(en|es)\//, `/${locale}/`);
      return u.toString();
    }

    u.pathname = `/${locale}${u.pathname.startsWith("/") ? "" : "/"}${u.pathname}`;
    return u.toString();
  } catch {
    return url;
  }
}

const CATEGORY_DEFS: Array<{
  key:
    | "anchoring"
    | "clothing"
    | "electrics"
    | "electronics"
    | "fitting"
    | "inflatables"
    | "lifeOnBoard"
    | "maintenance"
    | "motor"
    | "navigation"
    | "painting"
    | "plumbing"
    | "ropes"
    | "safety"
    | "screws"
    | "tools";
  path: Record<Locale, string>;
}> = [
  { key: "anchoring", path: { en: "/100799-anchoring-docking", es: "/100799-anclaje-acoplamiento" } },
  { key: "clothing", path: { en: "/43-personal-equipment", es: "/43-equipamiento-personal" } },
  { key: "electrics", path: { en: "/100392-electricslighting", es: "/100392-electricidad-iluminacion" } },
  { key: "electronics", path: { en: "/190-electronics", es: "/190-electronica" } },
  { key: "fitting", path: { en: "/100396-fitting", es: "/100396-ajuste" } },
  { key: "inflatables", path: { en: "/100911-inflatable-water-toys", es: "/100911-juguetes-acuaticos-inflables" } },
  { key: "lifeOnBoard", path: { en: "/197-life-on-board", es: "/197-vida-a-bordo" } },
  { key: "maintenance", path: { en: "/100669-maintenance-cleaning-products", es: "/100669-productos-de-mantenimiento-limpieza" } },
  { key: "motor", path: { en: "/100393-motor", es: "/100393-motor" } },
  { key: "navigation", path: { en: "/100329-navigation", es: "/100329-navegacion" } },
  { key: "painting", path: { en: "/100390-painting", es: "/100390-pintura" } },
  { key: "plumbing", path: { en: "/100713-plumbing", es: "/100713-plomeria" } },
  { key: "ropes", path: { en: "/100395-ropes", es: "/100395-cuerdas" } },
  { key: "safety", path: { en: "/100389-safety", es: "/100389-seguridad" } },
  { key: "screws", path: { en: "/100394-screws", es: "/100394-tornillos" } },
  { key: "tools", path: { en: "/100391-tools-machines", es: "/100391-herramientas-maquinas" } },
];

function buildCategories(locale: Locale): Category[] {
  return CATEGORY_DEFS.map((c) => ({
    label: t(locale, `category.${c.key}`),
    url: `https://nautichandler.com/${locale}${c.path[locale]}`,
  }));
}

function findCategoryByUrl(url: string) {
  return CATEGORY_DEFS.find((c) => {
    const en = `https://nautichandler.com/en${c.path.en}`;
    const es = `https://nautichandler.com/es${c.path.es}`;
    return url === en || url === es;
  });
}

function categoryUrlFor(cat: (typeof CATEGORY_DEFS)[number], locale: Locale) {
  return `https://nautichandler.com/${locale}${cat.path[locale]}`;
}

function filterProducts(products: Product[], q: string) {
  const query = q.trim().toLowerCase();
  if (!query) return products;
  return products.filter((p) => p.title.toLowerCase().includes(query));
}

export default function Home() {
  const router = useRouter();
  const sp = useSearchParams();

  const categoryFromUrl = sp.get("cat");

  const [locale, setLocale] = useState<Locale>(() => {
    if (categoryFromUrl) return localeFromUrl(categoryFromUrl);
    return getSavedLocale("en");
  });

  const CATEGORIES: Category[] = useMemo(() => buildCategories(locale), [locale]);

  const [categoryUrl, setCategoryUrl] = useState(() => {
    const initial = categoryFromUrl ?? CATEGORIES[0].url;
    return normalizeLocaleInUrl(initial, locale);
  });

  const [query, setQuery] = useState("");

  const [visiblePages, setVisiblePages] = useState(1);

  const add = useCartStore((s) => s.add);

  const PAGE_SIZE = 24;

  const {
    data,
    isLoading,
    isFetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["products", categoryUrl],
    queryFn: ({ pageParam = 1 }) => fetchProducts(categoryUrl, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (typeof lastPage.hasNext === "boolean") {
        return lastPage.hasNext ? allPages.length + 1 : undefined;
      }
      if ((lastPage.products?.length ?? 0) < PAGE_SIZE) return undefined;
      return allPages.length + 1;
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 60,
  });

  const qc = useQueryClient();

  const onPickCategory = (url: string) => {
    // url iz chips-a je već sa trenutnim locale
    setCategoryUrl(url);
    setVisiblePages(1);

    const params = new URLSearchParams(sp.toString());
    params.set("cat", url);

    qc.prefetchInfiniteQuery({
      queryKey: ["products", url],
      queryFn: ({ pageParam = 1 }) => fetchProducts(url, pageParam),
      initialPageParam: 1,
    });

    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const loadedPages = data?.pages ?? [];
  const loadedPagesCount = loadedPages.length;

  const shownProducts = useMemo(() => {
    const pagesToShow = loadedPages.slice(0, Math.max(1, visiblePages));
    const flat = pagesToShow.flatMap((p) => p.products);
    return filterProducts(flat, query);
  }, [loadedPages, visiblePages, query]);

  const searching = query.trim().length > 0;

  const canLoadLess = visiblePages > 1;
  const canLoadMore = !searching && (hasNextPage || visiblePages < loadedPagesCount);

  const handleLoadMore = async () => {
    if (searching) return;

    if (visiblePages < loadedPagesCount) {
      setVisiblePages((v) => v + 1);
      return;
    }

    if (hasNextPage) {
      await fetchNextPage();
      setVisiblePages((v) => v + 1);
    }
  };

  const handleLoadLess = () => {
    setVisiblePages((v) => Math.max(1, v - 1));
  };

  const handleCollapseToFirst = () => {
    setVisiblePages(1);
  };

  const setOldPrice = useProductsStore((s) => s.setOldPrice);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [dockVersion, setDockVersion] = useState(0);

  useEffect(() => {
    if (!categoryFromUrl) return;

    const nextLocale = localeFromUrl(categoryFromUrl);
    if (nextLocale !== locale) {
      setLocale(nextLocale);
      saveLocale(nextLocale);
    }

    if (categoryFromUrl !== categoryUrl) {
      setCategoryUrl(categoryFromUrl);
      setVisiblePages(1);
    }
  }, [categoryFromUrl]);

  useEffect(() => {
    shownProducts.forEach((p) => {
      if (p.oldPrice) setOldPrice(p.sourceUrl, p.oldPrice);
    });
  }, [shownProducts, setOldPrice]);

  useEffect(() => {
    const preload = CATEGORIES.slice(0, 3).map((c) => c.url);

    preload.forEach((u) => {
      qc.prefetchInfiniteQuery({
        queryKey: ["products", u],
        queryFn: ({ pageParam = 1 }) => fetchProducts(u, pageParam),
        initialPageParam: 1,
      });
    });
  }, [qc, CATEGORIES]);

  const [dockOpen, setDockOpen] = useState(false);
  const [dock, setDock] = useState<DockProfile | null>(null);

  useEffect(() => {
    setDock(loadDockProfile());
  }, []);

  const handleSetLocale = (next: Locale) => {
  if (next === locale) return;

  const currentCat = findCategoryByUrl(categoryUrl);

  const nextCategoryUrl = currentCat
    ? categoryUrlFor(currentCat, next)
    : `https://nautichandler.com/${next}${CATEGORY_DEFS[0].path[next]}`;

  setLocale(next);
  setCategoryUrl(nextCategoryUrl);
  setVisiblePages(1);

  const params = new URLSearchParams(sp.toString());
  params.set("cat", nextCategoryUrl);
  router.replace(`/?${params.toString()}`, { scroll: false });
};

  return (
    <div className="min-h-screen bg-background">
      <HomeHeader
        query={query}
        setQuery={setQuery}
        locale={locale}
        setLocale={handleSetLocale}
      />

      <CategoryChips categories={CATEGORIES} activeUrl={categoryUrl} onPick={onPickCategory} />

      <DockFab dock={dock} onOpen={() => setDockOpen(true)} />

      <DockSheet
        open={dockOpen}
        onClose={() => setDockOpen(false)}
        onSaved={(p) => {
          setDock(p);
          setDockVersion((v) => v + 1);
        }}
      />

      <main className="mx-auto max-w-md px-4 pb-44 pt-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">
            {!mounted ? "Loading…" : isLoading ? "Loading…" : `${shownProducts.length} items`}
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
            shownProducts.map((p) => (
              <ProductCard
                key={p.sourceUrl}
                product={p}
                onQuickAdd={() => add(p)}
                backTo={`/?cat=${encodeURIComponent(categoryUrl)}`}
                dockVersion={dockVersion}
              />
            ))
          )}
        </div>

        {!isLoading ? (
          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1 rounded-2xl"
              variant="secondary"
              onClick={handleLoadLess}
              disabled={!canLoadLess}
            >
              Load less
            </Button>

            <Button
              className="flex-1 rounded-2xl"
              variant="secondary"
              onClick={handleLoadMore}
              disabled={isFetchingNextPage || !canLoadMore}
            >
              {isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        ) : null}

        {!isLoading && canLoadLess ? (
          <div className="mt-2">
            <Button className="w-full rounded-2xl" variant="ghost" onClick={handleCollapseToFirst}>
              Collapse to first page
            </Button>
          </div>
        ) : null}

        {searching ? (
          <div className="text-center text-xs text-muted-foreground py-3">
            Search is filtering loaded items (Load more is paused).
          </div>
        ) : null}

        {!isLoading && !hasNextPage && visiblePages >= loadedPagesCount ? (
          <div className="text-center text-xs text-muted-foreground py-3">You’ve reached the end.</div>
        ) : null}
      </main>
    </div>
  );
}

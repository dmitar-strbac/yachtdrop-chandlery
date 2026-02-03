import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CacheEntry = { exp: number; val: any };
const CACHE_KEY = "__yachtdrop_products_cache__";

function getStore(): Map<string, CacheEntry> {
  const g = globalThis as any;
  if (!g[CACHE_KEY]) g[CACHE_KEY] = new Map<string, CacheEntry>();
  return g[CACHE_KEY];
}
function getCache(key: string) {
  const hit = getStore().get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) return null;
  return hit.val;
}
function setCache(key: string, val: any, ttlMs: number) {
  getStore().set(key, { val, exp: Date.now() + ttlMs });
}

function withPage(url: string, page: number) {
  try {
    const u = new URL(url);
    u.searchParams.set("page", String(page));
    return u.toString();
  } catch {
    return url;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const rawUrl =
    searchParams.get("url") || "https://nautichandler.com/en/100390-painting";

  const pageParam = searchParams.get("page");
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  const url = withPage(rawUrl, page);

  const cacheKey = `products:${url}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, page, _cache: "HIT" });
  }

  const worker = process.env.SCRAPER_WORKER_URL;
  if (!worker) {
    return NextResponse.json(
      { error: "SCRAPER_WORKER_URL not set" },
      { status: 500 }
    );
  }

  const res = await fetch(`${worker}/products?url=${encodeURIComponent(url)}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    return NextResponse.json(
      { error: "Worker failed", details: txt },
      { status: 502 }
    );
  }

  const json = await res.json();

  setCache(cacheKey, json, 1000 * 60 * 5);

  return NextResponse.json({ ...json, page, _cache: "MISS" });
}

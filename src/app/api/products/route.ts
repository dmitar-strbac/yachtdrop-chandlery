import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

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

function absUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://nautichandler.com${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const url =
    searchParams.get("url") ||
    "https://nautichandler.com/en/100390-painting";

  const cacheKey = `products:${url}`;
  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, _cache: "HIT" });
  }

  if (!url.startsWith("https://nautichandler.com/")) {
    return NextResponse.json(
      { error: "Invalid url" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Fetch failed: ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const products: any[] = [];

    $('a[href$=".html"]').each((_, el) => {
      const a = $(el);
      const href = a.attr("href");
      if (!href) return;

      const card =
        a.closest("article, li, div");

      const title =
        card.find(".product-title").text().trim() ||
        card.find("h2").text().trim() ||
        card.find("h3").text().trim() ||
        a.attr("title");

      if (!title || title.length < 3) return;

      const price =
        card.find(".price").first().text().trim() ||
        null;

      const oldPrice =
        card.find(".regular-price").first().text().trim() ||
        null;

      const img =
        card.find("img").attr("data-src") ||
        card.find("img").attr("src");

      if (!price && !img) return;

      products.push({
        title,
        price,
        oldPrice,
        stock: null,
        imageUrl: absUrl(img),
        sourceUrl: absUrl(href),
      });
    });

    const payload = {
      source: url,
      count: products.length,
      products: products.slice(0, 40),
    };

    setCache(cacheKey, payload, 1000 * 60 * 5);

    return NextResponse.json({ ...payload, _cache: "MISS" });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Scrape failed", details: String(e) },
      { status: 502 }
    );
  }
}

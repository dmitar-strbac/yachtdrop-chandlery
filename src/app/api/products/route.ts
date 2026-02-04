import { NextResponse } from "next/server";
import { chromium } from "playwright";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CacheEntry = { exp: number; val: any };
type InflightEntry = Promise<any>;

const CACHE_KEY = "__yachtdrop_category_cache__";
const INFLIGHT_KEY = "__yachtdrop_category_inflight__";

function getCacheStore(): Map<string, CacheEntry> {
  const g = globalThis as any;
  if (!g[CACHE_KEY]) g[CACHE_KEY] = new Map<string, CacheEntry>();
  return g[CACHE_KEY];
}

function getInflightStore(): Map<string, InflightEntry> {
  const g = globalThis as any;
  if (!g[INFLIGHT_KEY]) g[INFLIGHT_KEY] = new Map<string, InflightEntry>();
  return g[INFLIGHT_KEY];
}

function getCache(key: string) {
  const hit = getCacheStore().get(key);
  if (!hit) return null;
  if (Date.now() > hit.exp) return null;
  return hit.val;
}

function setCache(key: string, val: any, ttlMs: number) {
  getCacheStore().set(key, { val, exp: Date.now() + ttlMs });
}

function absUrl(url: string | null) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://nautichandler.com${url.startsWith("/") ? "" : "/"}${url}`;
}

function isBadProductUrl(u: string) {
  const s = u.toLowerCase();
  return (
    s.includes("contact") ||
    s.includes("privacy") ||
    s.includes("terms") ||
    s.includes("/content/") ||
    s.includes("/login")
  );
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

function cleanCategoryUrl(raw: string) {
  try {
    const u = new URL(raw);

    const dropExact = new Set([
      "_gl",
      "srsltid",
      "gclid",
      "fbclid",
      "msclkid",
      "yclid",
      "mc_cid",
      "mc_eid",
      "igshid",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ]);

    for (const k of Array.from(u.searchParams.keys())) {
      const kl = k.toLowerCase();
      if (dropExact.has(kl) || kl.startsWith("utm_")) {
        u.searchParams.delete(k);
      }
    }

    return u.toString();
  } catch {
    return raw;
  }
}

type Scraped = {
  source: string;
  count: number;
  products: Array<{
    title: string;
    price: string | null;
    oldPrice: string | null;
    stock: any;
    imageUrl: string | null;
    sourceUrl: string;
  }>;
  hasNext?: boolean;
  _debug?: any;
};

async function scrapeCategory(page: any, url: string): Promise<Scraped> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });

  const cookieSelectors = [
    "button:has-text('Accept all')",
    "button:has-text('Accept')",
    "button:has-text('I agree')",
    "button:has-text('OK')",
    "button:has-text('Aceptar')",
  ];
  for (const sel of cookieSelectors) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.count()) {
        await btn.click({ timeout: 1500 });
        break;
      }
    } catch {}
  }

  await page.waitForTimeout(700);

  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});

  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(700);
    await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
  }

  const finalUrl = page.url();

  const rawProducts = await page.$$eval('a[href*=".html"]', (links: any[]) => {
    const results: any[] = [];
    const text = (node: any) => String(node?.textContent ?? "");

    const looksLikePrice = (s: string) => {
      const t = (s || "").replace(/\s+/g, " ").trim();
      return /(\d+[.,]\d{2})/.test(t) || /€/.test(t);
    };

    let inspected = 0;

    for (const a of links as any[]) {
      inspected++;

      const href = a.getAttribute?.("href");
      if (!href) continue;

      const hrefLower = String(href).toLowerCase();
      if (!hrefLower.includes(".html")) continue;

      if (
        hrefLower.includes("login") ||
        hrefLower.includes("contact") ||
        hrefLower.includes("privacy") ||
        hrefLower.includes("terms") ||
        hrefLower.includes("/content/")
      ) {
        continue;
      }

      const card =
        a.closest?.('[class*="product"]') ||
        a.closest?.("article") ||
        a.closest?.("li") ||
        a.closest?.("div");

      if (!card) continue;

      const titleEl =
        card.querySelector("h3 a") ||
        card.querySelector("h2 a") ||
        card.querySelector('[class*="title"] a') ||
        card.querySelector('[class*="name"] a');

      const title =
        String(titleEl?.textContent ?? "").trim() ||
        String(a.textContent ?? "").trim();

      const tl = title.toLowerCase();
      if (
        !title ||
        title.length < 6 ||
        tl === "quick view" ||
        tl.includes("quick view") ||
        tl.includes("subcategories") ||
        tl.includes("log in") ||
        tl.includes("english") ||
        tl.includes("español")
      ) {
        continue;
      }

      const price =
        String((card.querySelector(".price") as any)?.textContent ?? "").trim() ||
        (Array.from(card.querySelectorAll("*") as any) as any[])
          .map((el: any) => text(el))
          .find((t: string) => looksLikePrice(t)) ||
        null;

      const imgEl = card.querySelector("img") as any;
      let imageUrl =
        imgEl?.getAttribute?.("data-src") ||
        imgEl?.getAttribute?.("data-original") ||
        imgEl?.getAttribute?.("data-srcset") ||
        imgEl?.getAttribute?.("srcset") ||
        imgEl?.getAttribute?.("src") ||
        null;

      if (imageUrl && imageUrl.includes(" ")) {
        imageUrl = imageUrl.split(",")[0].trim().split(" ")[0].trim();
      }

      const okPrice = looksLikePrice(String(price ?? ""));
      const okFallback = !!imageUrl;
      if (!okPrice && !okFallback) continue;

      results.push({
        title,
        price: price ? String(price).trim() : null,
        oldPrice: null,
        stock: null,
        imageUrl,
        sourceUrl: href,
      });

      if (results.length >= 60) break;
    }

    return {
      results,
      inspected,
      anchors: links.length,
      titleSample: document.title,
      productishBlocks: document.querySelectorAll('[class*="product"], article').length,
    };
  });

  const seen = new Set<string>();
  const products: Scraped["products"] = [];

  for (const p of rawProducts.results as any[]) {
    const sourceUrl = absUrl(p.sourceUrl);
    if (!sourceUrl) continue;
    if (isBadProductUrl(sourceUrl)) continue;
    if (seen.has(sourceUrl)) continue;
    seen.add(sourceUrl);

    products.push({
      title: p.title,
      price: p.price,
      oldPrice: p.oldPrice,
      stock: p.stock,
      imageUrl: p.imageUrl ? absUrl(p.imageUrl) : null,
      sourceUrl,
    });
  }

  return {
    source: url,
    count: products.length,
    products: products.slice(0, 40),
    hasNext: products.length >= 40,
    _debug: {
      inspected: rawProducts.inspected,
      anchors: rawProducts.anchors,
      titleSample: rawProducts.titleSample,
      productishBlocks: rawProducts.productishBlocks,
      finalUrl,
    },
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const rawUrl =
    searchParams.get("url") || "https://nautichandler.com/en/100390-painting";

  if (!rawUrl.startsWith("https://nautichandler.com/")) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const cleanedUrl = cleanCategoryUrl(rawUrl);

  const pageParam = searchParams.get("page");
  const wantedPage = Math.max(1, Number(pageParam ?? "1") || 1);

  const cacheKey = `cat:${cleanedUrl}:page:${wantedPage}`;

  const cached = getCache(cacheKey);
  if (cached) {
    return NextResponse.json({ ...cached, _cache: "HIT" });
  }

  const inflightStore = getInflightStore();
  const existing = inflightStore.get(cacheKey);
  if (existing) {
    const val = await existing;
    return NextResponse.json({ ...val, _cache: "HIT_INFLIGHT" });
  }

  const work = (async () => {
    let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;

    try {
      browser = await chromium.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-dev-shm-usage"],
      });

      const page = await browser.newPage({
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
        viewport: { width: 1280, height: 800 },
      });

      const url1 = withPage(cleanedUrl, wantedPage);
      const first = await scrapeCategory(page, url1);

      if (first.count === 0 && wantedPage === 1) {
        const url2 = withPage(cleanedUrl, 2);
        const second = await scrapeCategory(page, url2);

        const payload = {
          ...second,
          _debug: {
            ...second._debug,
            cleanedFrom: rawUrl,
            cleanedTo: cleanedUrl,
            fallbackFrom: url1,
            fallbackTo: url2,
          },
        };

        setCache(cacheKey, payload, 1000 * 60 * 3);
        return payload;
      }

      const payload = {
        ...first,
        _debug: {
          ...first._debug,
          cleanedFrom: rawUrl,
          cleanedTo: cleanedUrl,
          used: url1,
        },
      };

      setCache(cacheKey, payload, 1000 * 60 * 3);
      return payload;
    } catch (e) {
      return {
        error: "Scrape failed",
        details: String(e),
        _debug: { cleanedFrom: rawUrl, cleanedTo: cleanedUrl, wantedPage },
      };
    } finally {
      try {
        await browser?.close();
      } catch {}
    }
  })();

  inflightStore.set(cacheKey, work);

  try {
    const result = await work;

    

    return NextResponse.json({ ...result, _cache: "MISS" });
  } finally {
    inflightStore.delete(cacheKey);
  }
}

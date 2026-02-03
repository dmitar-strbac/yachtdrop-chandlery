import { NextResponse } from "next/server";

export const runtime = "nodejs";

type CacheEntry = { exp: number; val: any };
const CACHE_KEY = "__yachtdrop_product_cache__";

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

type ProductDetail = {
  title: string;
  description: string | null;
  price: string | null;
  oldPrice: string | null;
  stock: string | null;
  imageUrl: string | null;
  sourceUrl: string;
};

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function firstMatch(re: RegExp, s: string) {
  const m = s.match(re);
  return m?.[1] ?? null;
}

function decodeEntities(s: string) {
  return s
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&nbsp;", " ");
}

function normalizeCurrency(s: string | null) {
  if (!s) return null;
  return s.replace(/^EUR\s*/i, "€").replace(/\s+/g, " ").trim();
}

function toNumber(priceText: string | null) {
  if (!priceText) return NaN;
  const normalized = priceText.replace(/\s/g, "").replace(",", ".");
  const m = normalized.match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : NaN;
}

function parsePricesFromHtml(html: string): { price: string | null; oldPrice: string | null } {
  const current =
    firstMatch(
      /class=["'][^"']*(?:current-price|product-price|price|our_price_display)[^"']*["'][^>]*>\s*([^<]+)\s*</i,
      html
    ) ||
    firstMatch(/itemprop=["']price["'][^>]*content=["']([^"']+)["']/i, html) ||
    firstMatch(/(€\s?\d+(?:[.,]\d{2})?)/i, html);

  const old =
    firstMatch(
      /class=["'][^"']*(?:regular-price|old-price|price-regular)[^"']*["'][^>]*>\s*([^<]+)\s*</i,
      html
    ) || null;

  const priceClean = normalizeCurrency(current);
  const oldClean = normalizeCurrency(old);

  const p = toNumber(priceClean);
  const o = toNumber(oldClean);

  if (!isFinite(p)) return { price: priceClean, oldPrice: null };
  if (!isFinite(o) || o <= p) return { price: priceClean, oldPrice: null };

  return { price: priceClean, oldPrice: oldClean };
}

function parseStockFromHtml(html: string): string | null {
  const stock =
    firstMatch(/id=["']product-availability["'][\s\S]*?>([\s\S]*?)</i, html) ||
    firstMatch(/(In stock|On demand|Last items?)/i, html);
  return stock ? stripHtml(stock).trim() : null;
}

function parseJsonLdProduct(html: string): Partial<ProductDetail> {
  const scripts = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi
  );
  if (!scripts) return {};

  for (const block of scripts) {
    const jsonText = firstMatch(/<script[^>]*>([\s\S]*?)<\/script>/i, block);
    if (!jsonText) continue;

    try {
      const data = JSON.parse(jsonText.trim());
      const nodes = Array.isArray(data) ? data : [data];

      for (const node of nodes) {
        const graph = node?.["@graph"];
        const candidates = Array.isArray(graph) ? graph : [node];

        for (const c of candidates) {
          if (!c) continue;

          const type = c["@type"];
          const isProduct =
            type === "Product" || (Array.isArray(type) && type.includes("Product"));
          if (!isProduct) continue;

          const title = c.name ?? null;
          const description = c.description ?? null;
          const img = Array.isArray(c.image) ? c.image[0] : c.image ?? null;

          const offers = Array.isArray(c.offers) ? c.offers[0] : c.offers;
          const price = offers?.price ?? null;
          const currency = offers?.priceCurrency ?? null;

          return {
            title: title ?? undefined,
            description: description ?? undefined,
            imageUrl: img ?? undefined,
            price: price && currency ? normalizeCurrency(`${currency} ${price}`) ?? undefined : undefined,
          };
        }
      }
    } catch {
    }
  }

  return {};
}

function extractByItempropDescription(html: string): string | null {
  const m =
    html.match(/<([a-z0-9]+)\b[^>]*\bitemprop=["']description["'][^>]*>([\s\S]*?)<\/\1>/i);
  return m?.[2] ?? null;
}

function extractElementInnerHtmlById(html: string, id: string): string | null {
  const startRe = new RegExp(
    `<([a-z0-9]+)\\b[^>]*\\bid=["']${id}["'][^>]*>`,
    "i"
  );
  const m = startRe.exec(html);
  if (!m || m.index == null) return null;

  const tag = m[1].toLowerCase();
  const startTagEnd = m.index + m[0].length;

  const tokenRe = new RegExp(`<\\/?${tag}\\b[^>]*>`, "gi");
  tokenRe.lastIndex = startTagEnd;

  let depth = 1;
  let t: RegExpExecArray | null;

  while ((t = tokenRe.exec(html))) {
    const tok = t[0];
    const isClose = tok.startsWith("</");
    depth += isClose ? -1 : 1;

    if (depth === 0) {
      return html.slice(startTagEnd, t.index);
    }
  }
  return null;
}

function extractDescription(html: string, ld: Partial<ProductDetail>): string | null {
  const collapseDesc = extractElementInnerHtmlById(html, "collapseDescription");
  if (collapseDesc) {
    const cleaned = stripHtml(collapseDesc).trim();
    if (cleaned && cleaned.length > 20) {
      return cleaned;
    }
  }

  const itempropDesc = extractByItempropDescription(html);
  if (itempropDesc) {
    const cleaned = stripHtml(itempropDesc).trim();
    if (cleaned && cleaned.length > 20) {
      return cleaned;
    }
  }

  const descById = extractElementInnerHtmlById(html, "description");
  if (descById) {
    const cleaned = stripHtml(descById).trim();
    if (cleaned && cleaned.length > 20) {
      return cleaned;
    }
  }

  const productDesc = extractElementInnerHtmlById(html, "product-description");
  if (productDesc) {
    const cleaned = stripHtml(productDesc).trim();
    if (cleaned && cleaned.length > 20) {
      return cleaned;
    }
  }

  if (typeof ld.description === "string" && ld.description.trim()) {
    return ld.description.trim();
  }

  const metaDesc =
    firstMatch(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i, html) ||
    firstMatch(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i, html);
  
  if (metaDesc && metaDesc.trim()) {
    return metaDesc.trim();
  }

  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  if (!url.includes("nautichandler.com/"))
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });

  const cacheKey = `product:${url}`;
  const cached = getCache(cacheKey);
  if (cached) return NextResponse.json({ ...cached, _cache: "HIT" });

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    return NextResponse.json(
      { error: "Failed to fetch product page", details: txt.slice(0, 500) },
      { status: 502 }
    );
  }

  const htmlRaw = await res.text();
  const html = decodeEntities(htmlRaw);

  const ld = parseJsonLdProduct(html);

  const description = extractDescription(html, ld);

  const title =
    (typeof ld.title === "string" && ld.title.trim()) ||
    firstMatch(/<h1[^>]*>([\s\S]*?)<\/h1>/i, html)?.replace(/<[^>]+>/g, "").trim() ||
    firstMatch(/<title[^>]*>([\s\S]*?)<\/title>/i, html)?.trim() ||
    "Product";

  const imageUrl =
    (typeof ld.imageUrl === "string" && ld.imageUrl) ||
    firstMatch(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i, html) ||
    null;

  const { price, oldPrice } = parsePricesFromHtml(html);

  const stock = parseStockFromHtml(html);

  const payload: ProductDetail = {
    title,
    description,
    price: normalizeCurrency((typeof ld.price === "string" && ld.price) ? ld.price : price),
    oldPrice,          
    stock,
    imageUrl,
    sourceUrl: url,
  };

  setCache(cacheKey, payload, 1000 * 60 * 10); 
  return NextResponse.json({ ...payload, _cache: "MISS" });
}
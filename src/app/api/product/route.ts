import { NextResponse } from "next/server";

export const runtime = "nodejs";

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
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  if (!url.includes("nautichandler.com/"))
    return NextResponse.json({ error: "Invalid domain" }, { status: 400 });

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

  const metaDesc =
    firstMatch(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i, html) ||
    firstMatch(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i, html);

  const descHtml =
    firstMatch(/<div[^>]*id=["']description["'][^>]*>([\s\S]*?)<\/div>/i, html) ||
    firstMatch(/<section[^>]*id=["']description["'][^>]*>([\s\S]*?)<\/section>/i, html) ||
    null;

  const description =
    (typeof ld.description === "string" && ld.description.trim()) ||
    (descHtml ? stripHtml(descHtml) : null) ||
    (metaDesc ? metaDesc.trim() : null);

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

  return NextResponse.json(payload);
}

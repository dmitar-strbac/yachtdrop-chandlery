import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export const runtime = "nodejs"; 

type Product = {
  title: string;
  price: string | null;
  oldPrice: string | null;
  stock: string | null;
  imageUrl: string | null;
  sourceUrl: string;
};

function absUrl(url: string) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `https://nautichandler.com${url.startsWith("/") ? "" : "/"}${url}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const url =
    searchParams.get("url") ||
    "https://nautichandler.com/en/100390-painting";

  if (!url.startsWith("https://nautichandler.com/")) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: `Upstream failed (${res.status})` },
      { status: 502 }
    );
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const products: Product[] = [];

  $('a[href$=".html"]').each((_, a) => {
    const href = $(a).attr("href");
    if (!href) return;

    const card = $(a).closest("article, .product-miniature, .product, li");
    const title =
      $(a).find("h2, h3, .product-title").text().trim() ||
      $(a).attr("title")?.trim() ||
      $(a).text().trim();

    const price =
      card.find(".price").first().text().trim() ||
      card.find("[class*=price]").first().text().trim() ||
      null;

    const oldPrice =
      card.find(".regular-price").first().text().trim() ||
      card.find("[class*=old]").first().text().trim() ||
      null;

    const stock =
      card.find(":contains('In Stock')").first().text().trim() ||
      card.find(":contains('Last items in stock')").first().text().trim() ||
      card.find(":contains('Available under demand')").first().text().trim() ||
      null;

    const img =
      card.find("img").first().attr("src") ||
      card.find("img").first().attr("data-src") ||
      null;

    if (!title || title.length < 3) return;

    products.push({
      title,
      price: price || null,
      oldPrice: oldPrice || null,
      stock: stock || null,
      imageUrl: img ? absUrl(img) : null,
      sourceUrl: absUrl(href)!,
    });
  });

  const uniq = new Map<string, Product>();
  for (const p of products) uniq.set(p.sourceUrl, p);

  return NextResponse.json({
    source: url,
    count: uniq.size,
    products: Array.from(uniq.values()).slice(0, 40),
  });
}

import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url =
    searchParams.get("url") ||
    "https://nautichandler.com/en/100390-painting";

  const worker = process.env.SCRAPER_WORKER_URL;
  if (!worker) {
    return NextResponse.json(
      { error: "SCRAPER_WORKER_URL not set" },
      { status: 500 }
    );
  }

  const res = await fetch(
    `${worker}/products?url=${encodeURIComponent(url)}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    const txt = await res.text();
    return NextResponse.json(
      { error: "Worker failed", details: txt },
      { status: 502 }
    );
  }

  return NextResponse.json(await res.json());
}

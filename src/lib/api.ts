export type Product = {
  title: string;
  price: string | null;
  oldPrice: string | null;
  stock: string | null;
  imageUrl: string | null;
  sourceUrl: string;
};

export type ProductDetail = Product & {
  description: string | null;
};

export type ProductsResponse = {
  products: Product[];
  count: number; 
  source: string;
  page?: number;
  hasNext?: boolean; 
};

export async function fetchProducts(
  categoryUrl: string,
  page = 1
): Promise<{ products: Product[]; hasNext: boolean }> {
  const res = await fetch(
    `/api/products?url=${encodeURIComponent(categoryUrl)}&page=${page}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    return { products: [], hasNext: false };
  }

  const data = await res.json();
  const raw = Array.isArray(data?.products) ? data.products : [];

  const products: Product[] = raw.flatMap((p: any): Product[] => {
    const sourceUrl = typeof p?.sourceUrl === "string" ? p.sourceUrl : "";
    if (!sourceUrl) return []; // 👈 nema null, nema filtera

    return [
      {
        title:
          typeof p?.title === "string" && p.title.trim()
            ? p.title.trim()
            : "Product",
        price: typeof p?.price === "string" ? p.price : null,
        oldPrice: typeof p?.oldPrice === "string" ? p.oldPrice : null,
        stock: typeof p?.stock === "string" ? p.stock : null,
        imageUrl: typeof p?.imageUrl === "string" ? p.imageUrl : null,
        sourceUrl,
      },
    ];
  });

  const hasNext =
    typeof data?.hasNext === "boolean"
      ? data.hasNext
      : products.length >= 24;

  return { products, hasNext };
}

export async function fetchProductDetails(productUrl: string) {
  const res = await fetch(`/api/product?url=${encodeURIComponent(productUrl)}`, { cache: "force-cache" });
  if (!res.ok) throw new Error("Failed to load product details");
  return (await res.json()) as ProductDetail;
}

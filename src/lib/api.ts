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

export async function fetchProducts(categoryUrl: string, page = 1) {
  const qs = new URLSearchParams({
    url: categoryUrl,
    page: String(page),
  });

  const res = await fetch(`/api/products?${qs.toString()}`, { cache: "force-cache" });
  if (!res.ok) throw new Error("Failed to load products");

  return (await res.json()) as ProductsResponse;
}

export async function fetchProductDetails(productUrl: string) {
  const res = await fetch(`/api/product?url=${encodeURIComponent(productUrl)}`, { cache: "force-cache" });
  if (!res.ok) throw new Error("Failed to load product details");
  return (await res.json()) as ProductDetail;
}
